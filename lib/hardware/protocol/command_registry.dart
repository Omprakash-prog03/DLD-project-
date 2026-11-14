/// Central Command Registry for ESP32 Hardware Integration
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

  /// Verifies if a command string is valid in protocol version 1
  static bool isValidCommand(String command) {
    return [
      getDeviceInfo,
      getDeviceStatus,
      getSupportedFeatures,
      pingDevice,
      restartDevice,
      getClockTime,
      setClockTime,
      syncClock,
      getRtcStatus,
      getAlarms,
      createAlarm,
      updateAlarm,
      deleteAlarm,
      enableAlarm,
      disableAlarm,
      stopAlarm,
      snoozeAlarm,
      getDeviceConfig,
      setDeviceConfig,
      setDisplayBrightness,
      setBuzzerConfig,
    ].contains(command);
  }
}
