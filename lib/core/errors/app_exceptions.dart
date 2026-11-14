/// Standardized Application & Hardware Exception Hierarchy
class AppException implements Exception {
  final String code;
  final String message;
  final dynamic details;

  const AppException({
    required this.code,
    required this.message,
    this.details,
  });

  @override
  String toString() => 'AppException [$code]: $message';
}

/// Hardware Transport Exceptions (BLE / Wi-Fi)
class HardwareCommunicationException extends AppException {
  const HardwareCommunicationException({
    required String code,
    required String message,
    dynamic details,
  }) : super(code: code, message: message, details: details);
}

/// Protocol & Command Validation Exceptions
class ProtocolException extends AppException {
  const ProtocolException({
    required String code,
    required String message,
    dynamic details,
  }) : super(code: code, message: message, details: details);
}

/// Real-Time Clock & Time Synchronization Exceptions
class ClockSyncException extends AppException {
  const ClockSyncException({
    required String code,
    required String message,
    dynamic details,
  }) : super(code: code, message: message, details: details);
}

/// Alarm Storage & Validation Exceptions
class AlarmException extends AppException {
  const AlarmException({
    required String code,
    required String message,
    dynamic details,
  }) : super(code: code, message: message, details: details);
}
