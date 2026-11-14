import 'dart:async';
import '../domain/alarm_model.dart';
import '../../hardware/manager/synchronization_engine.dart';

abstract class AlarmRepository {
  Future<List<AlarmModel>> getAlarms();
  Future<AlarmModel?> getAlarmById(String id);
  Future<AlarmModel> createAlarm(AlarmModel alarm);
  Future<AlarmModel> updateAlarm(AlarmModel alarm);
  Future<void> deleteAlarm(String id);
  Future<AlarmModel> toggleAlarm(String id);
  Future<void> syncAllPendingAlarms();
  Stream<List<AlarmModel>> watchAlarms();
}

class LocalAlarmRepository implements AlarmRepository {
  final SynchronizationEngine _syncEngine;
  final _alarmsController = StreamController<List<AlarmModel>>.broadcast();

  final List<AlarmModel> _alarms = [
    AlarmModel(
      id: 'alm-default-01',
      label: 'Morning Alarm',
      hour: 7,
      minute: 0,
      repeatDays: [1, 2, 3, 4, 5],
      isEnabled: true,
      syncStatus: AlarmSyncStatus.synchronized,
      lastSyncTimestamp: DateTime.now().subtract(const Duration(hours: 1)),
    ),
    AlarmModel(
      id: 'alm-default-02',
      label: 'Study Session',
      hour: 15,
      minute: 30,
      repeatDays: [1, 3, 5],
      isEnabled: true,
      syncStatus: AlarmSyncStatus.synchronized,
      lastSyncTimestamp: DateTime.now().subtract(const Duration(hours: 2)),
    ),
    AlarmModel(
      id: 'alm-default-03',
      label: 'Evening Workout',
      hour: 18,
      minute: 30,
      repeatDays: [1, 2, 3, 4, 5],
      isEnabled: false,
      syncStatus: AlarmSyncStatus.localOnly,
    ),
  ];

  LocalAlarmRepository({required SynchronizationEngine syncEngine})
      : _syncEngine = syncEngine;

  void _notify() {
    _alarmsController.add(List.unmodifiable(_alarms));
  }

  @override
  Future<List<AlarmModel>> getAlarms() async {
    return List.unmodifiable(_alarms);
  }

  @override
  Future<AlarmModel?> getAlarmById(String id) async {
    final idx = _alarms.indexWhere((a) => a.id == id);
    if (idx != -1) return _alarms[idx];
    return null;
  }

  @override
  Future<AlarmModel> createAlarm(AlarmModel alarm) async {
    // 1. Save locally as pending
    final pendingAlarm = alarm.copyWith(syncStatus: AlarmSyncStatus.pending);
    _alarms.add(pendingAlarm);
    _notify();

    // 2. Synchronize to hardware
    final status = await _syncEngine.synchronizeAlarm(pendingAlarm);
    final finalAlarm = pendingAlarm.copyWith(
      syncStatus: status,
      lastSyncTimestamp: status == AlarmSyncStatus.synchronized ? DateTime.now() : null,
    );

    final idx = _alarms.indexWhere((a) => a.id == alarm.id);
    if (idx != -1) {
      _alarms[idx] = finalAlarm;
      _notify();
    }

    return finalAlarm;
  }

  @override
  Future<AlarmModel> updateAlarm(AlarmModel alarm) async {
    final idx = _alarms.indexWhere((a) => a.id == alarm.id);
    if (idx == -1) throw Exception('Alarm not found');

    final updated = alarm.copyWith(
      syncStatus: AlarmSyncStatus.pending,
      updatedAt: DateTime.now(),
    );
    _alarms[idx] = updated;
    _notify();

    final status = await _syncEngine.synchronizeAlarm(updated);
    final confirmed = updated.copyWith(
      syncStatus: status,
      lastSyncTimestamp: status == AlarmSyncStatus.synchronized ? DateTime.now() : null,
    );
    _alarms[idx] = confirmed;
    _notify();

    return confirmed;
  }

  @override
  Future<void> deleteAlarm(String id) async {
    _alarms.removeWhere((a) => a.id == id);
    _notify();
    await _syncEngine.deleteHardwareAlarm(id);
  }

  @override
  Future<AlarmModel> toggleAlarm(String id) async {
    final idx = _alarms.indexWhere((a) => a.id == id);
    if (idx == -1) throw Exception('Alarm not found');

    final current = _alarms[idx];
    final toggled = current.copyWith(
      isEnabled: !current.isEnabled,
      syncStatus: AlarmSyncStatus.pending,
    );
    _alarms[idx] = toggled;
    _notify();

    final status = await _syncEngine.synchronizeAlarm(toggled);
    final confirmed = toggled.copyWith(syncStatus: status);
    _alarms[idx] = confirmed;
    _notify();

    return confirmed;
  }

  @override
  Future<void> syncAllPendingAlarms() async {
    for (int i = 0; i < _alarms.length; i++) {
      if (_alarms[i].syncStatus != AlarmSyncStatus.synchronized) {
        final st = await _syncEngine.synchronizeAlarm(_alarms[i]);
        _alarms[i] = _alarms[i].copyWith(
          syncStatus: st,
          lastSyncTimestamp: st == AlarmSyncStatus.synchronized ? DateTime.now() : null,
        );
      }
    }
    _notify();
  }

  @override
  Stream<List<AlarmModel>> watchAlarms() => _alarmsController.stream;

  void dispose() {
    _alarmsController.close();
  }
}
