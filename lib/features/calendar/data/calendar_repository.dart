import 'dart:async';
import '../domain/calendar_event_model.dart';

abstract class CalendarRepository {
  Future<List<CalendarEventModel>> getEventsForMonth(DateTime month);
  Future<List<CalendarEventModel>> getEventsForDate(DateTime date);
  Future<CalendarEventModel> createEvent(CalendarEventModel event);
  Future<CalendarEventModel> updateEvent(CalendarEventModel event);
  Future<void> deleteEvent(String id);
  Stream<List<CalendarEventModel>> watchEventsForDate(DateTime date);
}

class LocalCalendarRepository implements CalendarRepository {
  final _eventsController = StreamController<List<CalendarEventModel>>.broadcast();

  final List<CalendarEventModel> _events = [
    CalendarEventModel(
      id: 'evt-001',
      title: 'Digital Systems Review',
      description: 'Review CD4518 cascade counter timing and propagation delays',
      startTime: DateTime.now().add(const Duration(hours: 2)),
      endTime: DateTime.now().add(const Duration(hours: 3, minutes: 30)),
      category: EventCategory.study,
    ),
    CalendarEventModel(
      id: 'evt-002',
      title: 'Firmware Bench Testing',
      description: 'Verify 3.3V logic thresholds and I2C pullup signals with oscilloscope',
      startTime: DateTime.now().add(const Duration(hours: 5)),
      endTime: DateTime.now().add(const Duration(hours: 6)),
      category: EventCategory.work,
    ),
    CalendarEventModel(
      id: 'evt-003',
      title: 'Evening Run',
      description: '5km outdoor run',
      startTime: DateTime.now().add(const Duration(hours: 8)),
      endTime: DateTime.now().add(const Duration(hours: 8, minutes: 45)),
      category: EventCategory.personal,
    ),
  ];

  void _notify() {
    _eventsController.add(List.unmodifiable(_events));
  }

  @override
  Future<List<CalendarEventModel>> getEventsForMonth(DateTime month) async {
    return _events.where((e) =>
      e.startTime.year == month.year && e.startTime.month == month.month
    ).toList();
  }

  @override
  Future<List<CalendarEventModel>> getEventsForDate(DateTime date) async {
    return _events.where((e) =>
      e.startTime.year == date.year &&
      e.startTime.month == date.month &&
      e.startTime.day == date.day
    ).toList();
  }

  @override
  Future<CalendarEventModel> createEvent(CalendarEventModel event) async {
    _events.add(event);
    _notify();
    return event;
  }

  @override
  Future<CalendarEventModel> updateEvent(CalendarEventModel event) async {
    final idx = _events.indexWhere((e) => e.id == event.id);
    if (idx != -1) {
      _events[idx] = event;
      _notify();
    }
    return event;
  }

  @override
  Future<void> deleteEvent(String id) async {
    _events.removeWhere((e) => e.id == id);
    _notify();
  }

  @override
  Stream<List<CalendarEventModel>> watchEventsForDate(DateTime date) {
    return _eventsController.stream.map((list) =>
      list.where((e) =>
        e.startTime.year == date.year &&
        e.startTime.month == date.month &&
        e.startTime.day == date.day
      ).toList()
    );
  }
}
