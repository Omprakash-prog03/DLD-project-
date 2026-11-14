import 'dart:async';
import '../interfaces/hardware_transport_adapter.dart';
import '../protocol/hardware_command.dart';
import '../protocol/hardware_response.dart';
import '../protocol/command_registry.dart';
import '../../features/alarms/domain/alarm_model.dart';

class SyncResult {
  final bool success;
  final String? errorMessage;
  final Duration? timeOffset;
  final DateTime? verifiedTime;

  const SyncResult({
    required this.success,
    this.errorMessage,
    this.timeOffset,
    this.verifiedTime,
  });
}

/// Synchronization Engine for DS3231 RTC & Autonomous Alarms
class SynchronizationEngine {
  final Future<HardwareResponse> Function(HardwareCommand command) sendCommandFn;
  final bool Function() isConnectedFn;

  SynchronizationEngine({
    required this.sendCommandFn,
    required this.isConnectedFn,
  });

  /// Synchronize Mobile System Time to DS3231 RTC
  Future<SyncResult> synchronizeClockTime() async {
    if (!isConnectedFn()) {
      return const SyncResult(
        success: false,
        errorMessage: 'Device is offline. Cannot synchronize clock.',
      );
    }

    final now = DateTime.now();
    final cmd = HardwareCommand(
      command: CommandRegistry.setClockTime,
      payload: {
        'year': now.year,
        'month': now.month,
        'day': now.day,
        'hour': now.hour,
        'minute': now.minute,
        'second': now.second,
        'iso_time': now.toIso8601String(),
        'timezone': 'Asia/Kolkata',
      },
      timeout: const Duration(seconds: 4),
    );

    try {
      final response = await sendCommandFn(cmd);
      if (response.success) {
        return SyncResult(
          success: true,
          verifiedTime: now,
          timeOffset: Duration.zero,
        );
      } else {
        return SyncResult(
          success: false,
          errorMessage: response.errorMessage ?? 'Clock synchronization rejected by firmware.',
        );
      }
    } catch (e) {
      return SyncResult(
        success: false,
        errorMessage: 'Time sync failed: $e',
      );
    }
  }

  /// Synchronize an Alarm to ESP32 Flash Memory
  Future<AlarmSyncStatus> synchronizeAlarm(AlarmModel alarm) async {
    if (!isConnectedFn()) {
      return AlarmSyncStatus.deviceOffline;
    }

    final cmd = HardwareCommand(
      command: CommandRegistry.createAlarm,
      payload: alarm.toHardwareJson(),
      timeout: const Duration(seconds: 4),
    );

    try {
      final response = await sendCommandFn(cmd);
      if (response.success) {
        return AlarmSyncStatus.synchronized;
      } else {
        return AlarmSyncStatus.failed;
      }
    } catch (_) {
      return AlarmSyncStatus.failed;
    }
  }

  /// Delete Alarm from Hardware
  Future<bool> deleteHardwareAlarm(String alarmId) async {
    if (!isConnectedFn()) return false;

    final cmd = HardwareCommand(
      command: CommandRegistry.deleteAlarm,
      payload: {'alarm_id': alarmId},
    );

    try {
      final resp = await sendCommandFn(cmd);
      return resp.success;
    } catch (_) {
      return false;
    }
  }
}
