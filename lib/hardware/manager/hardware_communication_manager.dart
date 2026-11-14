import 'dart:async';
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
  final String type; // 'COMMAND', 'RESPONSE', 'ERROR', 'SYSTEM'
  final String summary;
  final String details;

  DiagnosticLogEntry({
    required this.timestamp,
    required this.type,
    required this.summary,
    required this.details,
  });
}

/// Central Hardware Communication Gateway
class HardwareCommunicationManager {
  HardwareTransportAdapter _activeAdapter;
  final DeviceStateManager _stateManager = DeviceStateManager();
  late final SynchronizationEngine _syncEngine;

  final List<DiagnosticLogEntry> _diagnosticLogs = [];
  final _logsController = StreamController<List<DiagnosticLogEntry>>.broadcast();

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
  bool get isMockMode => _activeAdapter.transportType == TransportType.mock;
  List<DiagnosticLogEntry> get diagnosticLogs => List.unmodifiable(_diagnosticLogs);
  Stream<List<DiagnosticLogEntry>> get diagnosticLogsStream => _logsController.stream;

  void _bindAdapter(HardwareTransportAdapter adapter) {
    _adapterStateSub?.cancel();
    _adapterStateSub = adapter.connectionStateStream.listen((state) {
      final isConn = state == HardwareConnectionState.connected;
      _stateManager.updateConnection(isConn);

      if (isConn) {
        _log('SYSTEM', 'Device Connected', 'Transport: ${adapter.transportType}');
        _startPeriodicPolling();
        _queryDeviceInfo();
      } else {
        _statusPoller?.cancel();
        _log('SYSTEM', 'Device Disconnected', 'State: $state');
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

  Future<HardwareResponse> sendCommand(HardwareCommand command) async {
    _log('COMMAND', command.command, 'Req ID: ${command.requestId}');
    final response = await _activeAdapter.sendCommand(command);

    if (response.success) {
      _log('RESPONSE', '${command.command} OK', 'Data: ${response.data}');
    } else {
      _log('ERROR', '${command.command} FAILED', 'Code: ${response.errorCode}, Msg: ${response.errorMessage}');
      _stateManager.recordError(response.errorMessage ?? 'Command failed');
    }

    return response;
  }

  void _startPeriodicPolling() {
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

  Future<void> _queryDeviceInfo() async {
    final resp = await sendCommand(HardwareCommand(command: CommandRegistry.getDeviceInfo));
    if (resp.success && resp.data != null) {
      _stateManager.updateDeviceInfo(resp.data!);
    }
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
