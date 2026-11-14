import 'dart:async';
import '../interfaces/hardware_transport_adapter.dart';
import '../protocol/hardware_command.dart';
import '../protocol/hardware_response.dart';
import '../protocol/command_registry.dart';

/// Development Mock Adapter for Hardware Simulation.
/// Completely decoupled from UI and business logic.
class MockHardwareAdapter implements HardwareTransportAdapter {
  final _connectionStateController = StreamController<HardwareConnectionState>.broadcast();
  final _eventsController = StreamController<Map<String, dynamic>>.broadcast();

  HardwareConnectionState _state = HardwareConnectionState.disconnected;
  bool _isScanning = false;
  Timer? _clockDriftTimer;

  // In-memory simulated ESP32 & DS3231 state
  DateTime _simulatedRtcTime = DateTime.now().subtract(const Duration(seconds: 42)); // slight initial drift
  final List<Map<String, dynamic>> _simulatedHardwareAlarms = [
    {
      'alarm_id': 'mock-alm-001',
      'label': 'Morning Routine',
      'hour': 7,
      'minute': 0,
      'repeat_days': [1, 2, 3, 4, 5],
      'enabled': true,
      'snooze_enabled': true,
      'snooze_duration': 5,
    },
    {
      'alarm_id': 'mock-alm-002',
      'label': 'Evening Workout',
      'hour': 18,
      'minute': 30,
      'repeat_days': [1, 3, 5],
      'enabled': true,
      'snooze_enabled': true,
      'snooze_duration': 10,
    },
  ];

  @override
  TransportType get transportType => TransportType.mock;

  @override
  HardwareConnectionState get connectionState => _state;

  @override
  Stream<HardwareConnectionState> get connectionStateStream => _connectionStateController.stream;

  @override
  Stream<Map<String, dynamic>> get asynchronousEventsStream => _eventsController.stream;

  @override
  Future<void> initialize() async {
    _updateState(HardwareConnectionState.disconnected);
    _clockDriftTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      _simulatedRtcTime = _simulatedRtcTime.add(const Duration(seconds: 1));
    });
  }

  void _updateState(HardwareConnectionState newState) {
    _state = newState;
    _connectionStateController.add(newState);
  }

  @override
  Future<Stream<DiscoveredDevice>> startScan({Duration? timeout}) async {
    _isScanning = true;
    _updateState(HardwareConnectionState.scanning);

    final controller = StreamController<DiscoveredDevice>();

    // Emit simulated devices with realistic delay
    Future.delayed(const Duration(milliseconds: 600), () {
      if (!_isScanning) return;
      controller.add(const DiscoveredDevice(
        id: 'SIMULATED-ESP32-4A2F',
        name: 'Smart Clock (Simulated)',
        rssi: -54,
        transportType: TransportType.mock,
        metadata: {
          'firmware': '1.2.0-mock',
          'mac': '24:6F:28:4A:2F:10',
          'model': 'ESP32-WROOM-32',
        },
      ));
    });

    return controller.stream;
  }

  @override
  Future<void> stopScan() async {
    _isScanning = false;
    if (_state == HardwareConnectionState.scanning) {
      _updateState(HardwareConnectionState.disconnected);
    }
  }

  @override
  Future<bool> connect(String deviceIdentifier, {Map<String, dynamic>? parameters}) async {
    _updateState(HardwareConnectionState.connecting);
    await Future.delayed(const Duration(milliseconds: 800));

    // Transition to synchronizing
    _updateState(HardwareConnectionState.synchronizing);
    await Future.delayed(const Duration(milliseconds: 500));

    _updateState(HardwareConnectionState.connected);
    return true;
  }

  @override
  Future<void> disconnect() async {
    _updateState(HardwareConnectionState.disconnected);
  }

  @override
  Future<HardwareResponse> sendCommand(HardwareCommand command) async {
    if (_state != HardwareConnectionState.connected) {
      return HardwareResponse.failure(
        requestId: command.requestId,
        code: 'ERR_DEVICE_OFFLINE',
        message: 'Cannot execute command: Simulated hardware is disconnected.',
      );
    }

    // Add 120ms simulated round-trip latency
    await Future.delayed(const Duration(milliseconds: 120));

    switch (command.command) {
      case CommandRegistry.getDeviceInfo:
        return HardwareResponse.successResponse(
          requestId: command.requestId,
          data: {
            'device_id': 'SIMULATED-ESP32-4A2F',
            'device_name': 'Smart Clock (Mock)',
            'hardware_model': 'ESP32-WROOM-32',
            'firmware_version': '1.2.0',
            'protocol_version': 1,
            'mac_address': '24:6F:28:4A:2F:10',
            'rtc_available': true,
          },
        );

      case CommandRegistry.getDeviceStatus:
        return HardwareResponse.successResponse(
          requestId: command.requestId,
          data: {
            'rtc_available': true,
            'current_time': _simulatedRtcTime.toIso8601String(),
            'active_alarms_count': _simulatedHardwareAlarms.where((a) => a['enabled'] == true).length,
            'buzzer_active': false,
            'free_heap_bytes': 178420,
            'wifi_rssi': -52,
            'battery_ok': true,
          },
        );

      case CommandRegistry.getClockTime:
      case CommandRegistry.getRtcStatus:
        return HardwareResponse.successResponse(
          requestId: command.requestId,
          data: {
            'rtc_available': true,
            'time': _simulatedRtcTime.toIso8601String(),
            'battery_voltage': 3.12,
            'oscillator_ok': true,
          },
        );

      case CommandRegistry.setClockTime:
      case CommandRegistry.syncClock:
        final p = command.payload;
        if (p.containsKey('year') && p.containsKey('hour')) {
          _simulatedRtcTime = DateTime(
            p['year'] as int,
            p['month'] as int,
            p['day'] as int,
            p['hour'] as int,
            p['minute'] as int,
            p['second'] as int? ?? 0,
          );
        } else if (p.containsKey('iso_time')) {
          _simulatedRtcTime = DateTime.parse(p['iso_time'] as String);
        } else {
          _simulatedRtcTime = DateTime.now();
        }
        return HardwareResponse.successResponse(
          requestId: command.requestId,
          data: {
            'synced_time': _simulatedRtcTime.toIso8601String(),
            'ds3231_ack': true,
            'counters_reset': true,
          },
        );

      case CommandRegistry.getAlarms:
        return HardwareResponse.successResponse(
          requestId: command.requestId,
          data: {'alarms': _simulatedHardwareAlarms},
        );

      case CommandRegistry.createAlarm:
        final newAlarm = Map<String, dynamic>.from(command.payload);
        _simulatedHardwareAlarms.add(newAlarm);
        return HardwareResponse.successResponse(
          requestId: command.requestId,
          data: {'alarm': newAlarm, 'nvs_committed': true},
        );

      case CommandRegistry.updateAlarm:
        final alarmId = command.payload['alarm_id'] as String?;
        final idx = _simulatedHardwareAlarms.indexWhere((a) => a['alarm_id'] == alarmId);
        if (idx != -1) {
          _simulatedHardwareAlarms[idx] = Map<String, dynamic>.from(command.payload);
          return HardwareResponse.successResponse(
            requestId: command.requestId,
            data: {'alarm': _simulatedHardwareAlarms[idx], 'nvs_committed': true},
          );
        }
        return HardwareResponse.failure(
          requestId: command.requestId,
          code: 'ERR_ALARM_NOT_FOUND',
          message: 'Alarm ID not found in simulated NVS.',
        );

      case CommandRegistry.deleteAlarm:
        final alarmId = command.payload['alarm_id'] as String?;
        _simulatedHardwareAlarms.removeWhere((a) => a['alarm_id'] == alarmId);
        return HardwareResponse.successResponse(
          requestId: command.requestId,
          data: {'deleted': true},
        );

      case CommandRegistry.enableAlarm:
      case CommandRegistry.disableAlarm:
        final alarmId = command.payload['alarm_id'] as String?;
        final isEnable = command.command == CommandRegistry.enableAlarm;
        final idx = _simulatedHardwareAlarms.indexWhere((a) => a['alarm_id'] == alarmId);
        if (idx != -1) {
          _simulatedHardwareAlarms[idx]['enabled'] = isEnable;
          return HardwareResponse.successResponse(
            requestId: command.requestId,
            data: {'enabled': isEnable},
          );
        }
        return HardwareResponse.failure(
          requestId: command.requestId,
          code: 'ERR_ALARM_NOT_FOUND',
          message: 'Alarm ID not found in simulated NVS.',
        );

      case CommandRegistry.pingDevice:
        return HardwareResponse.successResponse(
          requestId: command.requestId,
          data: {'pong': true, 'timestamp': DateTime.now().toIso8601String()},
        );

      case CommandRegistry.stopAlarm:
      case CommandRegistry.snoozeAlarm:
        return HardwareResponse.successResponse(
          requestId: command.requestId,
          data: {'buzzer_stopped': true},
        );

      default:
        return HardwareResponse.failure(
          requestId: command.requestId,
          code: 'ERR_UNKNOWN_COMMAND',
          message: 'Command ${command.command} not supported by Mock adapter.',
        );
    }
  }

  @override
  Future<void> dispose() async {
    _clockDriftTimer?.cancel();
    await _connectionStateController.close();
    await _eventsController.close();
  }
}
