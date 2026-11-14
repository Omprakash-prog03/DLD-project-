import 'package:drift/drift.dart';

part 'app_database.g.dart';

/// SQLite Table Definition for Alarms Cache
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

/// SQLite Table Definition for Pending Operations Queue (Offline Resilience)
class SyncQueueTable extends Table {
  TextColumn get operationId => text()();
  TextColumn get command => text()();
  TextColumn get payloadJson => text()();
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {operationId};
}

/// SQLite Table Definition for Technical Diagnostics History
class DiagnosticHistoryTable extends Table {
  IntColumn get id => integer().autoIncrement()();
  DateTimeColumn get timestamp => dateTime()();
  TextColumn get logType => text()();
  TextColumn get summary => text()();
  TextColumn get details => text()();
}

/// App Database definition with Migrations
@DriftDatabase(tables: [
  AlarmsTable,
  CalendarEventsTable,
  RemindersTable,
  PairedDevicesTable,
  SyncQueueTable,
  DiagnosticHistoryTable,
])
class AppDatabase extends _$AppDatabase {
  AppDatabase(QueryExecutor e) : super(e);

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (Migrator m) async {
          await m.createAll();
        },
        onUpgrade: (Migrator m, int from, int to) async {
          if (from < 2) {
            await m.createTable(syncQueueTable);
            await m.createTable(diagnosticHistoryTable);
          }
        },
      );
}
