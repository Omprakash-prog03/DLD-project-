import 'package:flutter_test/flutter_test.dart';
import 'package:smart_clock_app/hardware/protocol/hardware_command.dart';
import 'package:smart_clock_app/hardware/protocol/hardware_response.dart';
import 'package:smart_clock_app/hardware/protocol/command_registry.dart';

void main() {
  group('Hardware Protocol Serialization & Validation', () {
    test('HardwareCommand serialization generates valid version 1 JSON frame', () {
      final cmd = HardwareCommand(
        command: CommandRegistry.setClockTime,
        payload: {
          'year': 2026,
          'month': 11,
          'day': 14,
          'hour': 21,
          'minute': 30,
          'second': 0,
        },
      );

      final json = cmd.toJson();
      expect(json['protocol_version'], equals(1));
      expect(json['command'], equals('SET_CLOCK_TIME'));
      expect(json['request_id'], isNotEmpty);
      expect(json['payload']['hour'], equals(21));
    });

    test('HardwareResponse successfully parses valid hardware confirmation frame', () {
      final raw = {
        'protocol_version': 1,
        'request_id': 'req-test-123',
        'success': true,
        'data': {
          'device_name': 'Smart Clock',
          'rtc_available': true,
        },
        'timestamp': '2026-11-14T21:30:00.000Z',
      };

      final resp = HardwareResponse.fromJson(raw);
      expect(resp.protocolVersion, equals(1));
      expect(resp.requestId, equals('req-test-123'));
      expect(resp.success, isTrue);
      expect(resp.data?['device_name'], equals('Smart Clock'));
      expect(resp.error, isNull);
    });

    test('HardwareResponse handles error frames and extracts failure codes', () {
      final errorRaw = {
        'protocol_version': 1,
        'request_id': 'req-fail-456',
        'success': false,
        'error': {
          'code': 'ERR_3001',
          'message': 'DS3231 I2C ACK Failed',
          'subsystem': 'RTC',
        },
        'timestamp': '2026-11-14T21:30:00.000Z',
      };

      final resp = HardwareResponse.fromJson(errorRaw);
      expect(resp.success, isFalse);
      expect(resp.errorCode, equals('ERR_3001'));
      expect(resp.errorMessage, equals('DS3231 I2C ACK Failed'));
    });

    test('CommandRegistry identifies valid protocol commands', () {
      expect(CommandRegistry.isValidCommand('GET_DEVICE_INFO'), isTrue);
      expect(CommandRegistry.isValidCommand('SET_CLOCK_TIME'), isTrue);
      expect(CommandRegistry.isValidCommand('CREATE_ALARM'), isTrue);
      expect(CommandRegistry.isValidCommand('INVALID_COMMAND_NAME'), isFalse);
    });
  });
}
