import 'package:flutter_test/flutter_test.dart';
import 'package:smart_clock_app/hardware/manager/synchronization_engine.dart';
import 'package:smart_clock_app/hardware/protocol/hardware_command.dart';
import 'package:smart_clock_app/hardware/protocol/hardware_response.dart';
import 'package:smart_clock_app/features/alarms/domain/alarm_model.dart';

void main() {
  group('SynchronizationEngine Workflow Tests', () {
    test('Clock sync fails immediately if hardware is offline', () async {
      final engine = SynchronizationEngine(
        sendCommandFn: (cmd) async => HardwareResponse.failure(
          requestId: cmd.requestId,
          code: 'ERR_OFFLINE',
          message: 'Device offline',
        ),
        isConnectedFn: () => false,
      );

      final result = await engine.synchronizeClockTime();
      expect(result.success, isFalse);
      expect(result.errorMessage, contains('offline'));
    });

    test('Clock sync succeeds and verifies timestamp when hardware acknowledges', () async {
      final engine = SynchronizationEngine(
        sendCommandFn: (cmd) async => HardwareResponse.successResponse(
          requestId: cmd.requestId,
          data: {'ds3231_ack': true},
        ),
        isConnectedFn: () => true,
      );

      final result = await engine.synchronizeClockTime();
      expect(result.success, isTrue);
      expect(result.verifiedTime, isNotNull);
    });

    test('Alarm synchronization maps deviceOffline when disconnected', () async {
      final engine = SynchronizationEngine(
        sendCommandFn: (cmd) async => HardwareResponse.failure(
          requestId: cmd.requestId,
          code: 'ERR_OFFLINE',
          message: 'Offline',
        ),
        isConnectedFn: () => false,
      );

      final alarm = AlarmModel(
        id: 'alm-test',
        label: 'Test',
        hour: 8,
        minute: 0,
      );

      final status = await engine.synchronizeAlarm(alarm);
      expect(status, equals(AlarmSyncStatus.deviceOffline));
    });

    test('Alarm synchronization maps synchronized when ESP32 acknowledges', () async {
      final engine = SynchronizationEngine(
        sendCommandFn: (cmd) async => HardwareResponse.successResponse(
          requestId: cmd.requestId,
          data: {'nvs_committed': true},
        ),
        isConnectedFn: () => true,
      );

      final alarm = AlarmModel(
        id: 'alm-test',
        label: 'Test',
        hour: 8,
        minute: 0,
      );

      final status = await engine.synchronizeAlarm(alarm);
      expect(status, equals(AlarmSyncStatus.synchronized));
    });
  });
}
