import 'dart:async';
import '../interfaces/hardware_transport_adapter.dart';
import '../protocol/hardware_command.dart';
import '../protocol/command_registry.dart';

class DeviceTelemetry {
  final bool isConnected;
  final bool isRtcAvailable;
  final DateTime? hardwareTime;
  final String? deviceName;
  final String? deviceId;
  final String? firmwareVersion;
  final String? hardwareModel;
  final int activeAlarmsCount;
  final bool buzzerActive;
  final DateTime? lastSyncTime;
  final bool isCached;
  final String? lastError;

  const DeviceTelemetry({
    this.isConnected = false,
    this.isRtcAvailable = false,
    this.hardwareTime,
    this.deviceName,
    this.deviceId,
    this.firmwareVersion,
    this.hardwareModel,
    this.activeAlarmsCount = 0,
    this.buzzerActive = false,
    this.lastSyncTime,
    this.isCached = true,
    this.lastError,
  });

  DeviceTelemetry copyWith({
    bool? isConnected,
    bool? isRtcAvailable,
    DateTime? hardwareTime,
    String? deviceName,
    String? deviceId,
    String? firmwareVersion,
    String? hardwareModel,
    int? activeAlarmsCount,
    bool? buzzerActive,
    DateTime? lastSyncTime,
    bool? isCached,
    String? lastError,
  }) {
    return DeviceTelemetry(
      isConnected: isConnected ?? this.isConnected,
      isRtcAvailable: isRtcAvailable ?? this.isRtcAvailable,
      hardwareTime: hardwareTime ?? this.hardwareTime,
      deviceName: deviceName ?? this.deviceName,
      deviceId: deviceId ?? this.deviceId,
      firmwareVersion: firmwareVersion ?? this.firmwareVersion,
      hardwareModel: hardwareModel ?? this.hardwareModel,
      activeAlarmsCount: activeAlarmsCount ?? this.activeAlarmsCount,
      buzzerActive: buzzerActive ?? this.buzzerActive,
      lastSyncTime: lastSyncTime ?? this.lastSyncTime,
      isCached: isCached ?? this.isCached,
      lastError: lastError ?? this.lastError,
    );
  }
}

/// Central Device State Monitor
class DeviceStateManager {
  final _telemetryController = StreamController<DeviceTelemetry>.broadcast();
  DeviceTelemetry _currentTelemetry = const DeviceTelemetry();

  Timer? _statusPollTimer;

  Stream<DeviceTelemetry> get telemetryStream => _telemetryController.stream;
  DeviceTelemetry get currentTelemetry => _currentTelemetry;

  void updateConnection(bool connected, {String? deviceId, String? deviceName}) {
    _currentTelemetry = _currentTelemetry.copyWith(
      isConnected: connected,
      deviceId: deviceId ?? _currentTelemetry.deviceId,
      deviceName: deviceName ?? _currentTelemetry.deviceName,
      isCached: !connected,
    );
    _telemetryController.add(_currentTelemetry);
  }

  void updateFromStatusResponse(Map<String, dynamic> data) {
    DateTime? rtcTime;
    if (data['current_time'] != null) {
      rtcTime = DateTime.tryParse(data['current_time'] as String);
    }

    _currentTelemetry = _currentTelemetry.copyWith(
      isConnected: true,
      isRtcAvailable: data['rtc_available'] as bool? ?? false,
      hardwareTime: rtcTime,
      activeAlarmsCount: data['active_alarms_count'] as int? ?? _currentTelemetry.activeAlarmsCount,
      buzzerActive: data['buzzer_active'] as bool? ?? false,
      lastSyncTime: DateTime.now(),
      isCached: false,
      lastError: null,
    );
    _telemetryController.add(_currentTelemetry);
  }

  void updateDeviceInfo(Map<String, dynamic> data) {
    _currentTelemetry = _currentTelemetry.copyWith(
      deviceId: data['device_id'] as String?,
      deviceName: data['device_name'] as String?,
      firmwareVersion: data['firmware_version'] as String?,
      hardwareModel: data['hardware_model'] as String?,
      isCached: false,
    );
    _telemetryController.add(_currentTelemetry);
  }

  void recordError(String error) {
    _currentTelemetry = _currentTelemetry.copyWith(lastError: error);
    _telemetryController.add(_currentTelemetry);
  }

  void dispose() {
    _statusPollTimer?.cancel();
    _telemetryController.close();
  }
}
