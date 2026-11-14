import 'dart:async';
import '../domain/reminder_model.dart';

abstract class ReminderRepository {
  Future<List<ReminderModel>> getReminders();
  Future<ReminderModel> createReminder(ReminderModel reminder);
  Future<ReminderModel> toggleReminder(String id);
  Future<void> deleteReminder(String id);
  Stream<List<ReminderModel>> watchReminders();
}

class LocalReminderRepository implements ReminderRepository {
  final _controller = StreamController<List<ReminderModel>>.broadcast();

  final List<ReminderModel> _reminders = [
    ReminderModel(
      id: 'rem-001',
      title: 'Replace DS3231 CR2032 Backup Battery',
      dueDate: DateTime.now().add(const Duration(days: 2)),
      notes: 'Check open-circuit voltage is > 3.0V',
    ),
    ReminderModel(
      id: 'rem-002',
      title: 'Calibrate CD4518 Sync Pulse Duration',
      dueDate: DateTime.now().add(const Duration(hours: 4)),
      notes: 'Verify 10us HIGH pulse on GPIO 26 via 74HCT245 buffer',
    ),
    ReminderModel(
      id: 'rem-003',
      title: 'Submit Lab Circuit Schematic',
      dueDate: DateTime.now().subtract(const Duration(days: 1)),
      isCompleted: true,
    ),
  ];

  void _notify() {
    _controller.add(List.unmodifiable(_reminders));
  }

  @override
  Future<List<ReminderModel>> getReminders() async {
    return List.unmodifiable(_reminders);
  }

  @override
  Future<ReminderModel> createReminder(ReminderModel reminder) async {
    _reminders.add(reminder);
    _notify();
    return reminder;
  }

  @override
  Future<ReminderModel> toggleReminder(String id) async {
    final idx = _reminders.indexWhere((r) => r.id == id);
    if (idx != -1) {
      final cur = _reminders[idx];
      final updated = cur.copyWith(isCompleted: !cur.isCompleted);
      _reminders[idx] = updated;
      _notify();
      return updated;
    }
    throw Exception('Reminder not found');
  }

  @override
  Future<void> deleteReminder(String id) async {
    _reminders.removeWhere((r) => r.id == id);
    _notify();
  }

  @override
  Stream<List<ReminderModel>> watchReminders() => _controller.stream;
}
