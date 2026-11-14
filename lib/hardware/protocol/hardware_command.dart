import 'dart:convert';
import 'package:uuid/uuid.dart';

/// Immutable Representation of a Standard Protocol Command
class HardwareCommand {
  final int protocolVersion;
  final String requestId;
  final String command;
  final DateTime timestamp;
  final Map<String, dynamic> payload;
  final Duration timeout;

  HardwareCommand({
    this.protocolVersion = 1,
    String? requestId,
    required this.command,
    DateTime? timestamp,
    this.payload = const {},
    this.timeout = const Duration(seconds: 4),
  })  : requestId = requestId ?? const Uuid().v4(),
        timestamp = timestamp ?? DateTime.now();

  Map<String, dynamic> toJson() => {
        'protocol_version': protocolVersion,
        'request_id': requestId,
        'command': command,
        'timestamp': timestamp.toIso8601String(),
        'payload': payload,
      };

  String serialize() => jsonEncode(toJson());

  factory HardwareCommand.fromJson(Map<String, dynamic> json) {
    return HardwareCommand(
      protocolVersion: json['protocol_version'] as int? ?? 1,
      requestId: json['request_id'] as String,
      command: json['command'] as String,
      timestamp: DateTime.tryParse(json['timestamp'] as String? ?? '') ?? DateTime.now(),
      payload: (json['payload'] as Map<String, dynamic>?) ?? {},
    );
  }

  @override
  String toString() => 'HardwareCommand($command, id: $requestId)';
}
