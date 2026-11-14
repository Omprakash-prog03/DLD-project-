/// Centralized Hardware Configuration and Protocol Constants
/// All hardware communication parameters MUST be configured here.
/// Do not hardcode magic strings or unverified values across UI widgets.
class HardwareConfigConstants {
  HardwareConfigConstants._();

  // Protocol Version
  static const int protocolVersion = 1;

  // Bluetooth Low Energy (BLE) GATT Specifications
  // Custom 128-bit Base UUID: 00000000-D1DC-4000-8000-00805F9B34FB
  static const String bleServiceUuid = "0000D1D0-D1DC-4000-8000-00805F9B34FB";
  static const String bleStatusCharUuid = "0000D1D1-D1DC-4000-8000-00805F9B34FB";
  static const String bleCommandCharUuid = "0000D1D2-D1DC-4000-8000-00805F9B34FB";
  static const String bleResponseCharUuid = "0000D1D3-D1DC-4000-8000-00805F9B34FB";
  static const String bleSyncEventCharUuid = "0000D1D4-D1DC-4000-8000-00805F9B34FB";

  // BLE Scan Filters
  static const String bleDeviceNamePrefix = "SmartClock";
  static const String bleAltDeviceNamePrefix = "DigitalClock";
  static const Duration bleScanTimeout = Duration(seconds: 15);
  static const int bleMtuNegotiatedSize = 512;

  // Local Wi-Fi (SoftAP & LAN) Specifications
  static const String wifiDefaultApSsid = "DigitalClock-ESP32";
  static const String wifiDefaultApPass = "clock1234";
  static const String wifiDefaultApIp = "192.168.4.1";
  static const int wifiHttpPort = 80;
  static const String wifiMdnsHostname = "smartclock.local";

  // Wi-Fi REST Endpoints
  static const String endpointStatus = "/api/status";
  static const String endpointTime = "/api/time";
  static const String endpointAlarms = "/api/alarms";
  static const String endpointAlarmsDismiss = "/api/alarms/dismiss";
  static const String endpointAlarmsSnooze = "/api/alarms/snooze";
  static const String endpointDeviceHealth = "/api/device/health";
  static const String endpointBuzzerTest = "/api/device/buzzer-test";

  // Communication Limits & Timeouts
  static const Duration commandDefaultTimeout = Duration(seconds: 4);
  static const Duration connectTimeout = Duration(seconds: 10);
  static const int maxRetryAttempts = 3;
  static const Duration retryDelay = Duration(milliseconds: 750);
  static const Duration backgroundPollInterval = Duration(seconds: 10);

  // Hardware Limits
  static const int maxHardwareAlarms = 16;
  static const int defaultSnoozeDurationMinutes = 5;
  static const int maxBuzzerDurationSeconds = 120;
  static const String defaultTimezone = "Asia/Kolkata";
}
