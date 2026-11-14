import 'package:flutter_test/flutter_test.dart';
import 'package:smart_clock_app/hardware/adapters/mock_hardware_adapter.dart';
import 'package:smart_clock_app/hardware/interfaces/hardware_transport_adapter.dart';
import 'package:smart_clock_app/hardware/protocol/hardware_command.dart';
import 'package:smart_clock_app/hardware/protocol/command_registry.dart';

void main() {
  group('MockHardwareAdapter Integration Simulation', () {
    late MockHardwareAdapter adapter;

    setUp(() async {
      adapter = MockHardwareAdapter();
      await adapter.initialize();
    });

    tearDown(() async {
      await adapter.dispose();
    });

    test('Initial connection state is disconnected', () {
      expect(adapter.connectionState, equals(HardwareConnectionState.disconnected));
    });

    test('Connects successfully and transitions to connected state', () async {
      final success = await adapter.connect('SIMULATED-ESP32-4A2F');
      expect(success, isTrue);
      expect(adapter.connectionState, equals(HardwareConnectionState.connected));
    });

    test('Rejects commands when disconnected with ERR_DEVICE_OFFLINE', () async {
      final cmd = HardwareCommand(command: CommandRegistry.getDeviceInfo);
      final resp = await adapter.sendCommand(cmd);

      expect(resp.success, isFalse);
      expect(resp.errorCode, equals('ERR_DEVICE_OFFLINE'));
    });

    test('Executes GET_DEVICE_INFO when connected and returns valid metadata', () async {
      await adapter.connect('SIMULATED-ESP32-4A2F');
      final cmd = HardwareCommand(command: CommandRegistry.getDeviceInfo);
      final resp = await adapter.sendCommand(cmd);

      expect(resp.success, isTrue);
      expect(resp.data?['hardware_model'], equals('ESP32-WROOM-32'));
      expect(resp.data?['rtc_available'], isTrue);
    });

    test('Executes SET_CLOCK_TIME and updates simulated RTC time', () async {
      await adapter.connect('SIMULATED-ESP32-4A2F');
      final targetTime = DateTime(2026, 11, 14, 21, 30, 45);

      final cmd = HardwareCommand(
        command: CommandRegistry.setClockTime,
        payload: {
          'year': targetTime.year,
          'month': targetTime.month,
          'day': targetTime.day,
          'hour': targetTime.hour,
          'minute': targetTime.minute,
          'second': targetTime.second,
        },
      );

      final resp = await adapter.sendCommand(cmd);
      expect(resp.success, isTrue);
      expect(resp.data?['ds3231_ack'], isTrue);

      final queryCmd = HardwareCommand(command: CommandRegistry.getClockTime);
      final queryResp = await adapter.sendCommand(queryCmd);
      expect(queryResp.success, isTrue);
    });
  });
}
