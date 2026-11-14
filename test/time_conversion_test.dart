import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Time Conversion & BCD Logic Tests', () {
    // DS3231 BCD Conversion Helpers (as used in ESP32 firmware)
    int decToBcd(int val) => ((val ~/ 10 * 16) + (val % 10));
    int bcdToDec(int val) => ((val ~/ 16 * 10) + (val % 16));

    test('Decimal to BCD conversion matches DS3231 register requirements', () {
      expect(decToBcd(0), equals(0x00));
      expect(decToBcd(9), equals(0x09));
      expect(decToBcd(10), equals(0x10));
      expect(decToBcd(23), equals(0x23));
      expect(decToBcd(59), equals(0x59));
    });

    test('BCD to Decimal inverse conversion is exact and loss-free', () {
      for (int i = 0; i <= 59; i++) {
        expect(bcdToDec(decToBcd(i)), equals(i));
      }
    });

    test('Leap year calendar calculation for DS3231 verification', () {
      bool isLeapYear(int year) =>
          ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0));

      expect(isLeapYear(2024), isTrue);
      expect(isLeapYear(2026), isFalse);
      expect(isLeapYear(2000), isTrue);
      expect(isLeapYear(2100), isFalse);
    });
  });
}
