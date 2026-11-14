import 'package:drift/drift.dart';

part 'app_database.g.dart';

/// SQLite Table Definition for Alarms
class AlarmsTable extends Table {
  TextColumn get id => text()();
  TextColumn get label => text().withLength(min: 1, max: 32)();
  IntColumn get hour => integer()();
  IntColumn get minute => integer()();
  TextColumn get repeatDaysJson => text().withDefault(const Constant('[]'))();
  BoolColumn get isEnabled => boolean().withDefault(const Constant(true))();
  BoolColumn get isOneTime => boolean().withDefault(const Constant(false))();
  BoolColumn get snoozeEnabled => boolean().withDefault(const Constant(true))();
  IntColumn get snoozeDuration => integer().withDefault(const Constant(5))();
  TextColumn get syncStatus => text().withDefault(const Constant('localOnly'))();
  DateTimeColumn get lastSyncTimestamp => dateTime().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

/// SQLite Table Definition for Software Calendar Events
class CalendarEventsTable extends Table {
  TextColumn get id => text()();
  TextColumn get title => text().withLength(min: 1, max: 64)();
  TextColumn get description => text().withDefault(const Constant(''))();
  DateTimeColumn get startTime => dateTime()();
  DateTimeColumn get endTime => dateTime()();
  BoolColumn get isAllDay => boolean().withDefault(const Constant(false))();
  TextColumn get category => text().withDefault(const Constant('general'))();
  TextColumn get location => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

/// SQLite Table Definition for Software Reminders
class RemindersTable extends Table {
  TextColumn get id => text()();
  TextColumn get title => text().withLength(min: 1, max: 64)();
  DateTimeColumn get dueDate => dateTime()();
  BoolColumn get isCompleted => boolean().withDefault(const Constant(false))();
  TextColumn get notes => text().withDefault(const Constant(''))();
  TextColumn get notificationType => text().withDefault(const Constant('soundAndNotification'))();

  @override
  Set<Column> get primaryKey => {id};
}

/// SQLite Table Definition for Paired Hardware Devices
class PairedDevicesTable extends Table {
  TextColumn get deviceId => text()();
  TextColumn get name => text()();
  TextColumn get transportType => text()();
  DateTimeColumn get lastConnected => dateTime()();
  TextColumn get metadataJson => text().withDefault(const Constant('{}'))();

  @override
  Set<Column> get primaryKey => {deviceId};
}

/// App Database definition
@DriftDatabase(tables: [AlarmsTable, CalendarEventsTable, RemindersTable, PairedDevicesTable])
class AppDatabase extends _$AppDatabase {
  AppDatabase(QueryExecutor e) : super(e);

  @override
  int get schemaVersion => 1;
}
