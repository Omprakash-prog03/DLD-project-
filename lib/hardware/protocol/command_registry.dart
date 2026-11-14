/// Central Command Registry for ESP32 Hardware Integration
/// Defines schemas, timeouts, idempotency, and firmware operational status.

class CommandDefinition {
  final String command;
  final String subsystem;
  final Map<String, String> inputSchema;
  final Map<String, String> outputSchema;
  final Duration timeout;
  final bool isIdempotent;
  final bool isConfirmedOperational;
  final String? unconfirmedReason;

  const CommandDefinition({
    required this.command,
    required this.subsystem,
    required this.inputSchema,
    required this.outputSchema,
    required this.timeout,
    required this.isIdempotent,
    required this.isConfirmedOperational,
    this.unconfirmedReason,
  });
}

class CommandRegistry {
  CommandRegistry._();

  // Device Info & Health
  static const String getDeviceInfo = 'GET_DEVICE_INFO';
  static const String getDeviceStatus = 'GET_DEVICE_STATUS';
  static const String getSupportedFeatures = 'GET_SUPPORTED_FEATURES';
  static const String pingDevice = 'PING_DEVICE';
  static const String restartDevice = 'RESTART_DEVICE';

  // Clock & DS3231 RTC
  static const String getClockTime = 'GET_CLOCK_TIME';
  static const String setClockTime = 'SET_CLOCK_TIME';
  static const String syncClock = 'SYNC_CLOCK';
  static const String getRtcStatus = 'GET_RTC_STATUS';

  // Alarms Management
  static const String getAlarms = 'GET_ALARMS';
  static const String createAlarm = 'CREATE_ALARM';
  static const String updateAlarm = 'UPDATE_ALARM';
  static const String deleteAlarm = 'DELETE_ALARM';
  static const String enableAlarm = 'ENABLE_ALARM';
  static const String disableAlarm = 'DISABLE_ALARM';
  static const String stopAlarm = 'STOP_ALARM';
  static const String snoozeAlarm = 'SNOOZE_ALARM';

  // Peripheral Configuration
  static const String getDeviceConfig = 'GET_DEVICE_CONFIG';
  static const String setDeviceConfig = 'SET_DEVICE_CONFIG';
  static const String setDisplayBrightness = 'SET_DISPLAY_BRIGHTNESS';
  static const String setBuzzerConfig = 'SET_BUZZER_CONFIG';

  static final Map<String, CommandDefinition> definitions = {
    getDeviceInfo: const CommandDefinition(
      command: getDeviceInfo,
      subsystem: 'Device',
      inputSchema: {},
      outputSchema: {'device_name': 'String', 'firmware_version': 'String', 'hardware_model': 'String'},
      timeout: Duration(seconds: 3),
      isIdempotent: true,
      isConfirmedOperational: true,
    ),
    getDeviceStatus: const CommandDefinition(
      command: getDeviceStatus,
      subsystem: 'Device',
      inputSchema: {},
      outputSchema: {'rtc_available': 'bool', 'current_time': 'String', 'active_alarms_count': 'int', 'buzzer_active': 'bool'},
      timeout: Duration(seconds: 2),
      isIdempotent: true,
      isConfirmedOperational: true,
    ),
    getSupportedFeatures: const CommandDefinition(
      command: getSupportedFeatures,
      subsystem: 'Capabilities',
      inputSchema: {},
      outputSchema: {'rtc': 'bool', 'buzzer': 'bool', 'alarms': 'bool', 'brightness': 'bool'},
      timeout: Duration(seconds: 2),
      isIdempotent: true,
      isConfirmedOperational: true,
    ),
    pingDevice: const CommandDefinition(
      command: pingDevice,
      subsystem: 'Diagnostics',
      inputSchema: {},
      outputSchema: {'pong': 'bool', 'timestamp': 'String'},
      timeout: Duration(milliseconds: 1500),
      isIdempotent: true,
      isConfirmedOperational: true,
    ),
    restartDevice: const CommandDefinition(
      command: restartDevice,
      subsystem: 'System',
      inputSchema: {},
      outputSchema: {'restarting': 'bool'},
      timeout: Duration(seconds: 5),
      isIdempotent: false,
      isConfirmedOperational: false,
      unconfirmedReason: 'Remote hardware reset endpoint not permitted by production security policy.',
    ),
    getClockTime: const CommandDefinition(
      command: getClockTime,
      subsystem: 'Clock',
      inputSchema: {},
      outputSchema: {'time': 'String', 'rtc_available': 'bool'},
      timeout: Duration(seconds: 2),
      isIdempotent: true,
      isConfirmedOperational: true,
    ),
    setClockTime: const CommandDefinition(
      command: setClockTime,
      subsystem: 'Clock',
      inputSchema: {'year': 'int', 'month': 'int', 'day': 'int', 'hour': 'int', 'minute': 'int', 'second': 'int'},
      outputSchema: {'synced_time': 'String', 'ds3231_ack': 'bool'},
      timeout: Duration(seconds: 4),
      isIdempotent: true,
      isConfirmedOperational: true,
    ),
    syncClock: const CommandDefinition(
      command: syncClock,
      subsystem: 'Clock',
      inputSchema: {'iso_time': 'String'},
      outputSchema: {'synced_time': 'String'},
      timeout: Duration(seconds: 4),
      isIdempotent: true,
      isConfirmedOperational: true,
    ),
    getRtcStatus: const CommandDefinition(
      command: getRtcStatus,
      subsystem: 'Clock',
      inputSchema: {},
      outputSchema: {'rtc_available': 'bool', 'oscillator_ok': 'bool'},
      timeout: Duration(seconds: 2),
      isIdempotent: true,
      isConfirmedOperational: true,
    ),
    getAlarms: const CommandDefinition(
      command: getAlarms,
      subsystem: 'Alarms',
      inputSchema: {},
      outputSchema: {'alarms': 'List<Alarm>'},
      timeout: Duration(seconds: 3),
      isIdempotent: true,
      isConfirmedOperational: true,
    ),
    createAlarm: const CommandDefinition(
      command: createAlarm,
      subsystem: 'Alarms',
      inputSchema: {'alarm_id': 'String', 'label': 'String', 'hour': 'int', 'minute': 'int', 'repeat_days': 'List<int>'},
      outputSchema: {'alarm_id': 'String', 'nvs_committed': 'bool'},
      timeout: Duration(seconds: 4),
      isIdempotent: true, // Idempotent when alarm_id UUID is supplied
      isConfirmedOperational: true,
    ),
    updateAlarm: const CommandDefinition(
      command: updateAlarm,
      subsystem: 'Alarms',
      inputSchema: {'alarm_id': 'String', 'label': 'String', 'hour': 'int', 'minute': 'int'},
      outputSchema: {'alarm_id': 'String', 'nvs_committed': 'bool'},
      timeout: Duration(seconds: 4),
      isIdempotent: true,
      isConfirmedOperational: true,
    ),
    deleteAlarm: const CommandDefinition(
      command: deleteAlarm,
      subsystem: 'Alarms',
      inputSchema: {'alarm_id': 'String'},
      outputSchema: {'deleted': 'bool'},
      timeout: Duration(seconds: 4),
      isIdempotent: true,
      isConfirmedOperational: true,
    ),
    enableAlarm: const CommandDefinition(
      command: enableAlarm,
      subsystem: 'Alarms',
      inputSchema: {'alarm_id': 'String'},
      outputSchema: {'enabled': 'bool'},
      timeout: Duration(seconds: 3),
      isIdempotent: true,
      isConfirmedOperational: true,
    ),
    disableAlarm: const CommandDefinition(
      command: disableAlarm,
      subsystem: 'Alarms',
      inputSchema: {'alarm_id': 'String'},
      outputSchema: {'enabled': 'bool'},
      timeout: Duration(seconds: 3),
      isIdempotent: true,
      isConfirmedOperational: true,
    ),
    stopAlarm: const CommandDefinition(
      command: stopAlarm,
      subsystem: 'Alarms',
      inputSchema: {},
      outputSchema: {'buzzer_stopped': 'bool'},
      timeout: Duration(seconds: 2),
      isIdempotent: true,
      isConfirmedOperational: true,
    ),
    snoozeAlarm: const CommandDefinition(
      command: snoozeAlarm,
      subsystem: 'Alarms',
      inputSchema: {'duration_minutes': 'int'},
      outputSchema: {'snoozed': 'bool'},
      timeout: Duration(seconds: 2),
      isIdempotent: true,
      isConfirmedOperational: true,
    ),
    setDisplayBrightness: const CommandDefinition(
      command: setDisplayBrightness,
      subsystem: 'Display',
      inputSchema: {'level': 'int'},
      outputSchema: {},
      timeout: Duration(seconds: 2),
      isIdempotent: true,
      isConfirmedOperational: false,
      unconfirmedReason: 'Display hardware uses CD4511 decoders powered by static 5V rail; no PWM blanking pin connected in current PCB revision.',
    ),
    setBuzzerConfig: const CommandDefinition(
      command: setBuzzerConfig,
      subsystem: 'Audio',
      inputSchema: {'pwm_freq_hz': 'int', 'auto_cutoff_sec': 'int'},
      outputSchema: {'pwm_configured': 'bool'},
      timeout: Duration(seconds: 2),
      isIdempotent: true,
      isConfirmedOperational: true,
    ),
    getDeviceConfig: const CommandDefinition(
      command: getDeviceConfig,
      subsystem: 'Config',
      inputSchema: {},
      outputSchema: {'device_name': 'String', 'timezone': 'String'},
      timeout: Duration(seconds: 3),
      isIdempotent: true,
      isConfirmedOperational: true,
    ),
    setDeviceConfig: const CommandDefinition(
      command: setDeviceConfig,
      subsystem: 'Config',
      inputSchema: {'device_name': 'String'},
      outputSchema: {'saved': 'bool'},
      timeout: Duration(seconds: 4),
      isIdempotent: true,
      isConfirmedOperational: true,
    ),
  };

  /// Verifies if a command string is valid in protocol version 1
  static bool isValidCommand(String command) {
    return definitions.containsKey(command);
  }

  /// Verifies if a command is confirmed as operational by hardware firmware
  static bool isOperational(String command) {
    return definitions[command]?.isConfirmedOperational ?? false;
  }
}
