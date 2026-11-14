import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../hardware/manager/hardware_communication_manager.dart';
import '../../hardware/manager/device_state_manager.dart';
import '../../hardware/manager/synchronization_engine.dart';
import '../../features/alarms/data/alarm_repository.dart';
import '../../features/alarms/domain/alarm_model.dart';
import '../../features/calendar/data/calendar_repository.dart';
import '../../features/calendar/domain/calendar_event_model.dart';
import '../../features/reminders/data/reminder_repository.dart';
import '../../features/reminders/domain/reminder_model.dart';

// Hardware Communication Facade
final hardwareManagerProvider = Provider<HardwareCommunicationManager>((ref) {
  final manager = HardwareCommunicationManager();
  ref.onDispose(() => manager.dispose());
  return manager;
});

// Device Telemetry State
final deviceTelemetryProvider = StreamProvider<DeviceTelemetry>((ref) {
  final manager = ref.watch(hardwareManagerProvider);
  return manager.stateManager.telemetryStream;
});

// Synchronization Engine
final syncEngineProvider = Provider<SynchronizationEngine>((ref) {
  final manager = ref.watch(hardwareManagerProvider);
  return manager.syncEngine;
});

// Alarms Repository & Stream
final alarmRepositoryProvider = Provider<AlarmRepository>((ref) {
  final syncEngine = ref.watch(syncEngineProvider);
  return LocalAlarmRepository(syncEngine: syncEngine);
});

final alarmsListProvider = StreamProvider<List<AlarmModel>>((ref) {
  final repo = ref.watch(alarmRepositoryProvider);
  return repo.watchAlarms();
});

// Calendar Repository & Stream
final calendarRepositoryProvider = Provider<CalendarRepository>((ref) {
  return LocalCalendarRepository();
});

final calendarEventsForDateProvider = StreamProvider.family<List<CalendarEventModel>, DateTime>((ref, date) {
  final repo = ref.watch(calendarRepositoryProvider);
  return repo.watchEventsForDate(date);
});

// Reminders Repository & Stream
final reminderRepositoryProvider = Provider<ReminderRepository>((ref) {
  return LocalReminderRepository();
});

final remindersListProvider = StreamProvider<List<ReminderModel>>((ref) {
  final repo = ref.watch(reminderRepositoryProvider);
  return repo.watchReminders();
});

// Diagnostic Logs
final diagnosticLogsProvider = StreamProvider<List<DiagnosticLogEntry>>((ref) {
  final manager = ref.watch(hardwareManagerProvider);
  return manager.diagnosticLogsStream;
});

// User Preferences (24-Hour Format, Auto-Sync)
final is24HourFormatProvider = StateProvider<bool>((ref) => true);
final currentBottomNavIndexProvider = StateProvider<int>((ref) => 0);
