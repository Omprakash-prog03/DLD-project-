import 'package:intl/intl.dart';

enum AlarmSyncStatus {
  localOnly,
  pending,
  synchronizing,
  synchronized,
  failed,
  deviceOffline,
}

/// Domain Model for Hardware Alarms
class AlarmModel {
  final String id;
  final String label;
  final int hour;
  final int minute;
  final List<int> repeatDays; // 0=Sun, 1=Mon, ..., 6=Sat
  final bool isEnabled;
  final bool isOneTime;
  final bool snoozeEnabled;
  final int snoozeDuration; // minutes
  final AlarmSyncStatus syncStatus;
  final DateTime? lastSyncTimestamp;
  final DateTime createdAt;
  final DateTime updatedAt;

  AlarmModel({
    required this.id,
    required this.label,
    required this.hour,
    required this.minute,
    this.repeatDays = const [],
    this.isEnabled = true,
    this.isOneTime = false,
    this.snoozeEnabled = true,
    this.snoozeDuration = 5,
    this.syncStatus = AlarmSyncStatus.localOnly,
    this.lastSyncTimestamp,
    DateTime? createdAt,
    DateTime? updatedAt,
  })  : createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();

  String formattedTime({bool is24Hour = true}) {
    final dt = DateTime(2026, 1, 1, hour, minute);
    if (is24Hour) {
      return DateFormat('HH:mm').format(dt);
    } else {
      return DateFormat('h:mm a').format(dt);
    }
  }

  String formattedRepeatDays() {
    if (isOneTime || repeatDays.isEmpty) return 'Once';
    if (repeatDays.length == 7) return 'Every day';
    if (repeatDays.length == 5 &&
        repeatDays.contains(1) &&
        repeatDays.contains(2) &&
        repeatDays.contains(3) &&
        repeatDays.contains(4) &&
        repeatDays.contains(5)) {
      return 'Weekdays';
    }
    if (repeatDays.length == 2 && repeatDays.contains(0) && repeatDays.contains(6)) {
      return 'Weekends';
    }

    const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    return repeatDays.map((d) => dayLabels[d]).join(' ');
  }

  Map<String, dynamic> toHardwareJson() {
    return {
      'alarm_id': id,
      'label': label,
      'hour': hour,
      'minute': minute,
      'repeat_days': repeatDays,
      'enabled': isEnabled,
      'snooze_enabled': snoozeEnabled,
      'snooze_duration': snoozeDuration,
    };
  }

  AlarmModel copyWith({
    String? id,
    String? label,
    int? hour,
    int? minute,
    List<int>? repeatDays,
    bool? isEnabled,
    bool? isOneTime,
    bool? snoozeEnabled,
    int? snoozeDuration,
    AlarmSyncStatus? syncStatus,
    DateTime? lastSyncTimestamp,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return AlarmModel(
      id: id ?? this.id,
      label: label ?? this.label,
      hour: hour ?? this.hour,
      minute: minute ?? this.minute,
      repeatDays: repeatDays ?? this.repeatDays,
      isEnabled: isEnabled ?? this.isEnabled,
      isOneTime: isOneTime ?? this.isOneTime,
      snoozeEnabled: snoozeEnabled ?? this.snoozeEnabled,
      snoozeDuration: snoozeDuration ?? this.snoozeDuration,
      syncStatus: syncStatus ?? this.syncStatus,
      lastSyncTimestamp: lastSyncTimestamp ?? this.lastSyncTimestamp,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
