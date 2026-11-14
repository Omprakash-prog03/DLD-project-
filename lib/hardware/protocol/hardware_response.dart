import 'dart:convert';

/// Immutable Representation of a Standard Protocol Response
class HardwareResponse {
  final int protocolVersion;
  final String requestId;
  final bool success;
  final Map<String, dynamic>? data;
  final Map<String, dynamic>? error;
  final DateTime timestamp;

  const HardwareResponse({
    required this.protocolVersion,
    required this.requestId,
    required this.success,
    this.data,
    this.error,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'protocol_version': protocolVersion,
        'request_id': requestId,
        'success': success,
        if (data != null) 'data': data,
        if (error != null) 'error': error,
        'timestamp': timestamp.toIso8601String(),
      };

  String serialize() => jsonEncode(toJson());

  factory HardwareResponse.fromJson(Map<String, dynamic> json) {
    return HardwareResponse(
      protocolVersion: json['protocol_version'] as int? ?? 1,
      requestId: json['request_id'] as String? ?? '',
      success: json['success'] as bool? ?? false,
      data: json['data'] as Map<String, dynamic>?,
      error: json['error'] as Map<String, dynamic>?,
      timestamp: DateTime.tryParse(json['timestamp'] as String? ?? '') ?? DateTime.now(),
    );
  }

  factory HardwareResponse.failure({
    required String requestId,
    required String code,
    required String message,
    String? subsystem,
  }) {
    return HardwareResponse(
      protocolVersion: 1,
      requestId: requestId,
      success: false,
      error: {
        'code': code,
        'message': message,
        if (subsystem != null) 'subsystem': subsystem,
      },
      timestamp: DateTime.now(),
    );
  }

  factory HardwareResponse.successResponse({
    required String requestId,
    Map<String, dynamic>? data,
  }) {
    return HardwareResponse(
      protocolVersion: 1,
      requestId: requestId,
      success: true,
      data: data,
      timestamp: DateTime.now(),
    );
  }

  String? get errorCode => error?['code'] as String?;
  String? get errorMessage => error?['message'] as String?;

  @override
  String toString() => 'HardwareResponse(id: $requestId, success: $success, data: $data, error: $error)';
}
