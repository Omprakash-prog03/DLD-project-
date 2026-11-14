import 'package:flutter_test/flutter_test.dart';
import 'package:smart_clock_app/features/alarms/domain/alarm_model.dart';

void main() {
  group('Alarm Model & Validation Tests', () {
    test('Correctly formats 24-hour military time string', () {
      final alarm = AlarmModel(
        id: 'alm-1',
        label: 'Morning Alarm',
        hour: 7,
        minute: 5,
      );

      expect(alarm.formattedTime(is24Hour: true), equals('07:05'));
    });

    test('Correctly formats 12-hour AM/PM time string', () {
      final morningAlarm = AlarmModel(
        id: 'alm-1',
        label: 'Morning',
        hour: 7,
        minute: 30,
      );
      final eveningAlarm = AlarmModel(
        id: 'alm-2',
        label: 'Evening',
        hour: 21,
        minute: 15,
      );

      expect(morningAlarm.formattedTime(is24Hour: false), equals('7:30 AM'));
      expect(eveningAlarm.formattedTime(is24Hour: false), equals('9:15 PM'));
    });

    test('Formatted repeat days correctly identifies weekdays and weekends', () {
      final weekdaysAlarm = AlarmModel(
        id: 'alm-wd',
        label: 'Work',
        hour: 8,
        minute: 0,
        repeatDays: [1, 2, 3, 4, 5],
      );

      final weekendsAlarm = AlarmModel(
        id: 'alm-we',
        label: 'Rest',
        hour: 9,
        minute: 0,
        repeatDays: [0, 6],
      );

      final allDaysAlarm = AlarmModel(
        id: 'alm-all',
        label: 'Daily',
        hour: 6,
        minute: 0,
        repeatDays: [0, 1, 2, 3, 4, 5, 6],
      );

      final onceAlarm = AlarmModel(
        id: 'alm-once',
        label: 'Doctor',
        hour: 14,
        minute: 0,
        isOneTime: true,
      );

      expect(weekdaysAlarm.formattedRepeatDays(), equals('Weekdays'));
      expect(weekendsAlarm.formattedRepeatDays(), equals('Weekends'));
      expect(allDaysAlarm.formattedRepeatDays(), equals('Every day'));
      expect(onceAlarm.formattedRepeatDays(), equals('Once'));
    });

    test('Serialization to hardware JSON produces exact ESP32 protocol schema', () {
      final alarm = AlarmModel(
        id: 'alm-test-uuid',
        label: 'Study Session',
        hour: 16,
        minute: 45,
        repeatDays: [1, 3, 5],
        isEnabled: true,
        snoozeEnabled: true,
        snoozeDuration: 10,
      );

      final json = alarm.toHardwareJson();
      expect(json['alarm_id'], equals('alm-test-uuid'));
      expect(json['label'], equals('Study Session'));
      expect(json['hour'], equals(16));
      expect(json['minute'], equals(45));
      expect(json['repeat_days'], equals([1, 3, 5]));
      expect(json['enabled'], isTrue);
      expect(json['snooze_enabled'], isTrue);
      expect(json['snooze_duration'], equals(10));
    });
  });
}
