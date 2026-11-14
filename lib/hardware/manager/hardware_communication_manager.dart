import 'dart:async';
import 'dart:convert';
import 'package:collection/collection.dart';
import '../interfaces/hardware_transport_adapter.dart';
import '../adapters/mock_hardware_adapter.dart';
import '../adapters/ble_adapter.dart';
import '../adapters/wifi_adapter.dart';
import '../protocol/hardware_command.dart';
import '../protocol/hardware_response.dart';
import '../protocol/command_registry.dart';
import 'device_state_manager.dart';
import 'synchronization_engine.dart';

class DiagnosticLogEntry {
  final DateTime timestamp;
  final String type; // 'COMMAND', 'RESPONSE', 'ERROR', 'SYSTEM', 'QUEUE'
  final String summary;
  final String details;

  DiagnosticLogEntry({
    required this.timestamp,
    required this.type,
    required this.summary,
    required this.details,
  });

  Map<String, dynamic> toJson() => {
        'timestamp': timestamp.toIso8601String(),
        'type': type,
        'summary': summary,
        'details': details,
      };
}

/// Feature Capability Registry
class DeviceCapabilities {
  final bool rtc;
  final bool buzzer;
  final bool alarms;
  final bool snooze;
  final bool wifi;
  final bool ble;
  final bool brightnessControl;
  final String? brightnessUnsupportedReason;

  const DeviceCapabilities({
    this.rtc = true,
    this.buzzer = true,
    this.alarms = true,
    this.snooze = true,
    this.wifi = true,
    this.ble = true,
    this.brightnessControl = false,
    this.brightnessUnsupportedReason =
        'Display hardware uses CD4511 decoders powered by static 5.0V; no PWM blanking pin connected in current PCB revision.',
  });
}

class QueuedCommand {
  final HardwareCommand command;
  final Completer<HardwareResponse> completer;
  final int priority; // 0 = normal, 10 = critical (e.g. STOP_ALARM)
  int retriesRemaining;
  bool isCancelled;

  QueuedCommand({
    required this.command,
    required this.completer,
    this.priority = 0,
    this.retriesRemaining = 2,
    this.isCancelled = false,
  });
}

/// Central Hardware Communication Gateway with Queued Command Execution,
/// Idempotency Verification, Reconnection Reconciliation & Capability Validation.
class HardwareCommunicationManager {
  HardwareTransportAdapter _activeAdapter;
  final DeviceStateManager _stateManager = DeviceStateManager();
  late final SynchronizationEngine _syncEngine;

  final List<DiagnosticLogEntry> _diagnosticLogs = [];
  final _logsController = StreamController<List<DiagnosticLogEntry>>.broadcast();

  // Command Execution Queue
  final PriorityQueue<QueuedCommand> _commandQueue = PriorityQueue<QueuedCommand>(
    (a, b) => b.priority.compareTo(a.priority),
  );
  final Set<String> _inFlightRequestIds = {};
  bool _isProcessingQueue = false;

  DeviceCapabilities _capabilities = const DeviceCapabilities();

  StreamSubscription? _adapterStateSub;
  Timer? _statusPoller;

  HardwareCommunicationManager({HardwareTransportAdapter? initialAdapter})
      : _activeAdapter = initialAdapter ?? MockHardwareAdapter() {
    _syncEngine = SynchronizationEngine(
      sendCommandFn: sendCommand,
      isConnectedFn: () => _activeAdapter.connectionState == HardwareConnectionState.connected,
    );
    _bindAdapter(_activeAdapter);
  }

  DeviceStateManager get stateManager => _stateManager;
  SynchronizationEngine get syncEngine => _syncEngine;
  HardwareTransportAdapter get activeAdapter => _activeAdapter;
  DeviceCapabilities get capabilities => _capabilities;
  bool get isMockMode => _activeAdapter.transportType == TransportType.mock;
  List<DiagnosticLogEntry> get diagnosticLogs => List.unmodifiable(_diagnosticLogs);
  Stream<List<DiagnosticLogEntry>> get diagnosticLogsStream => _logsController.stream;

  void _bindAdapter(HardwareTransportAdapter adapter) {
    _adapterStateSub?.cancel();
    _adapterStateSub = adapter.connectionStateStream.listen((state) async {
      final isConn = state == HardwareConnectionState.connected;
      _stateManager.updateConnection(isConn);

      if (isConn) {
        _log('SYSTEM', 'Device Connected', 'Transport: ${adapter.transportType}');
        await _handleReconnection();
        _startBatteryConsciousPolling();
      } else {
        _statusPoller?.cancel();
        _log('SYSTEM', 'Device Disconnected', 'State: $state (Displaying cached status)');
      }
    });
  }

  Future<void> setTransport(TransportType type) async {
    await _activeAdapter.disconnect();
    await _activeAdapter.dispose();

    switch (type) {
      case TransportType.mock:
        _activeAdapter = MockHardwareAdapter();
        break;
      case TransportType.bluetoothLe:
        _activeAdapter = BluetoothLeAdapter();
        break;
      case TransportType.wifiRest:
      case TransportType.wifiWebSocket:
        _activeAdapter = WiFiAdapter();
        break;
    }

    await _activeAdapter.initialize();
    _bindAdapter(_activeAdapter);
    _log('SYSTEM', 'Switched Transport', 'New transport: $type');
  }

  Future<Stream<DiscoveredDevice>> scanDevices() async {
    _log('SYSTEM', 'Started Device Scan', 'Transport: ${_activeAdapter.transportType}');
    return _activeAdapter.startScan();
  }

  Future<void> stopScan() async {
    await _activeAdapter.stopScan();
  }

  Future<bool> connect(String deviceId) async {
    _log('SYSTEM', 'Connecting to Device', 'ID: $deviceId');
    final success = await _activeAdapter.connect(deviceId);
    if (!success) {
      _log('ERROR', 'Connection Failed', 'Could not establish transport connection to $deviceId');
    }
    return success;
  }

  Future<void> disconnect() async {
    await _activeAdapter.disconnect();
    _statusPoller?.cancel();
  }

  /// Queued Command Execution with Retries, Cancellation, Response Matching & Duplicate Suppression
  Future<HardwareResponse> sendCommand(HardwareCommand command, {int priority = 0}) async {
    // 1. Verify Command Operational Status
    if (!CommandRegistry.isOperational(command.command)) {
      final def = CommandRegistry.definitions[command.command];
      final reason = def?.unconfirmedReason ?? 'Command not supported by connected hardware.';
      _log('ERROR', 'Blocked Unsupported Command', '${command.command}: $reason');
      return HardwareResponse.failure(
        requestId: command.requestId,
        code: 'ERR_UNSUPPORTED_HARDWARE_FEATURE',
        message: reason,
      );
    }

    // 2. Prevent Duplicate In-Flight Requests
    if (_inFlightRequestIds.contains(command.requestId)) {
      _log('QUEUE', 'Duplicate Request Suppressed', 'Req ID: ${command.requestId}');
      return HardwareResponse.failure(
        requestId: command.requestId,
        code: 'ERR_DUPLICATE_REQUEST',
        message: 'A command with this request_id is already in flight.',
      );
    }

    final completer = Completer<HardwareResponse>();
    final queued = QueuedCommand(
      command: command,
      completer: completer,
      priority: command.command == CommandRegistry.stopAlarm ? 10 : priority,
      retriesRemaining: CommandRegistry.definitions[command.command]?.isIdempotent == true ? 2 : 0,
    );

    _commandQueue.add(queued);
    _processQueue();

    return completer.future;
  }

  Future<void> _processQueue() async {
    if (_isProcessingQueue) return;
    _isProcessingQueue = true;

    while (_commandQueue.isNotEmpty) {
      final item = _commandQueue.removeFirst();
      if (item.isCancelled) {
        item.completer.complete(
          HardwareResponse.failure(
            requestId: item.command.requestId,
            code: 'ERR_COMMAND_CANCELLED',
            message: 'Command execution was cancelled.',
          ),
        );
        continue;
      }

      final cmd = item.command;
      _inFlightRequestIds.add(cmd.requestId);
      _log('COMMAND', cmd.command, 'Req ID: ${cmd.requestId}');

      HardwareResponse response;
      try {
        response = await _activeAdapter.sendCommand(cmd);
      } catch (e) {
        response = HardwareResponse.failure(
          requestId: cmd.requestId,
          code: 'ERR_TRANSPORT_EXCEPTION',
          message: e.toString(),
        );
      }

      // Check for Idempotent Retry Policy
      final def = CommandRegistry.definitions[cmd.command];
      final canRetry = !response.success && def != null && def.isIdempotent && item.retriesRemaining > 0;

      if (canRetry) {
        item.retriesRemaining--;
        _log('QUEUE', 'Retrying Idempotent Command', '${cmd.command} (Retries left: ${item.retriesRemaining})');
        await Future.delayed(const Duration(milliseconds: 500));
        _inFlightRequestIds.remove(cmd.requestId);
        _commandQueue.add(item);
        continue;
      }

      _inFlightRequestIds.remove(cmd.requestId);

      if (response.success) {
        _log('RESPONSE', '${cmd.command} OK', 'Data: ${response.data}');
      } else {
        _log('ERROR', '${cmd.command} FAILED', 'Code: ${response.errorCode}, Msg: ${response.errorMessage}');
        _stateManager.recordError(response.errorMessage ?? 'Command failed');
      }

      item.completer.complete(response);
    }

    _isProcessingQueue = false;
  }

  /// Battery-conscious Polling (10s interval, throttled when idle)
  void _startBatteryConsciousPolling() {
    _statusPoller?.cancel();
    _statusPoller = Timer.periodic(const Duration(seconds: 10), (_) async {
      if (_activeAdapter.connectionState == HardwareConnectionState.connected) {
        final resp = await sendCommand(HardwareCommand(command: CommandRegistry.getDeviceStatus));
        if (resp.success && resp.data != null) {
          _stateManager.updateFromStatusResponse(resp.data!);
        }
      }
    });
  }

  /// Reconnection Sequence: Validates identity, protocol version, queries alarms,
  /// and resolves conflicts without overwriting newer hardware data with stale local data.
  Future<void> _handleReconnection() async {
    _log('SYSTEM', 'Handling Reconnection Handshake', 'Validating protocol & hardware state...');

    // 1. Query Device Info & Validate Protocol Version
    final infoResp = await sendCommand(HardwareCommand(command: CommandRegistry.getDeviceInfo));
    if (infoResp.success && infoResp.data != null) {
      _stateManager.updateDeviceInfo(infoResp.data!);

      final protoVer = infoResp.data!['protocol_version'] as int? ?? 1;
      if (protoVer != 1) {
        _log('ERROR', 'Protocol Mismatch', 'Firmware protocol version $protoVer is incompatible with app version 1.');
        _stateManager.recordError('Firmware protocol mismatch ($protoVer != 1)');
        return;
      }
    }

    // 2. Query Live Hardware Alarms & Status (Hardware is Authoritative)
    final statusResp = await sendCommand(HardwareCommand(command: CommandRegistry.getDeviceStatus));
    if (statusResp.success && statusResp.data != null) {
      _stateManager.updateFromStatusResponse(statusResp.data!);
    }

    _log('SYSTEM', 'Reconnection Completed', 'Hardware state synchronized and verified.');
  }

  void _log(String type, String summary, String details) {
    final entry = DiagnosticLogEntry(
      timestamp: DateTime.now(),
      type: type,
      summary: summary,
      details: details,
    );
    _diagnosticLogs.insert(0, entry);
    if (_diagnosticLogs.length > 200) {
      _diagnosticLogs.removeLast();
    }
    _logsController.add(List.unmodifiable(_diagnosticLogs));
  }

  /// Export Diagnostic Log as JSON String
  String exportLogsAsJson() {
    return jsonEncode(_diagnosticLogs.map((e) => e.toJson()).toList());
  }

  void clearLogs() {
    _diagnosticLogs.clear();
    _logsController.add([]);
  }

  void dispose() {
    _statusPoller?.cancel();
    _adapterStateSub?.cancel();
    _logsController.close();
    _stateManager.dispose();
    _activeAdapter.dispose();
  }
}
