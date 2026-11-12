/**
 * hardware_config.h
 * Centralized Hardware Pinout & Configuration for ESP32 Digital Clock
 * 
 * Electrical Guidelines:
 * - ESP32 is NOT 5V tolerant! Maximum GPIO input voltage is 3.6V.
 * - DS3231 must be powered at 3.3V with 4.7k pullups to 3.3V.
 * - 74HCT245 Level Shifter (powered at 5.0V):
 *     DIR = HIGH (Transmit A to B: 3.3V inputs on A -> 5.0V outputs on B).
 *     /OE = LOW (GND) to enable outputs.
 *     NEVER use 74HCT245 to output into ESP32 GPIOs, as 5V outputs exceed 3.6V limit!
 * - Transistor Buzzer Driver:
 *     GPIO 25 -> 1k resistor -> 2N2222 NPN Base -> Collector to 5V buzzer.
 */

#ifndef HARDWARE_CONFIG_H
#define HARDWARE_CONFIG_H

// ==================== GPIO Pin Assignments ====================
#define PIN_I2C_SDA         21  // DS3231 I2C Data line (3.3V)
#define PIN_I2C_SCL         22  // DS3231 I2C Clock line (3.3V)
#define PIN_BUZZER          25  // PWM Output (LEDC) to 2N2222 transistor base
#define PIN_COUNTER_SYNC    26  // Sync pulse to CD4518 (via 74HCT245 A->B)
#define PIN_COUNTER_RESET   27  // Reset pulse to CD4518 (via 74HCT245 A->B)
#define PIN_DS3231_SQW_INT  34  // DS3231 1Hz SQW input (Input-only, max 3.3V!)

// ==================== Wi-Fi Configuration =====================
#define DEFAULT_AP_SSID     "DigitalClock-ESP32"
#define DEFAULT_AP_PASS     "clock1234"  // Firmware configurable password (min 8 chars)
#define DEFAULT_AP_IP       IPAddress(192, 168, 4, 1)
#define DEFAULT_AP_GATEWAY  IPAddress(192, 168, 4, 1)
#define DEFAULT_AP_SUBNET   IPAddress(255, 255, 255, 0)
#define HTTP_REST_PORT      80

// ==================== I2C & Sensor Config =====================
#define DS3231_I2C_ADDR     0x68
#define I2C_BUS_FREQ_HZ     100000

// ==================== Buzzer PWM Specs ========================
#define BUZZER_PWM_CHANNEL  0
#define BUZZER_PWM_FREQ     2400   // 2.4 kHz resonant frequency for piezo
#define BUZZER_PWM_RES      8      // 8-bit resolution (0-255)
#define BUZZER_DUTY_CYCLE   128    // 50% square wave duty

// ==================== System Limits ===========================
#define MAX_ALARMS          16
#define TIMEZONE_NAME       "Asia/Kolkata"

#endif // HARDWARE_CONFIG_H
