/**
 * Centralized Hardware & Device Configuration
 * Decouples hardware GPIO and network settings from UI components.
 */

export interface HardwarePinConfig {
  buzzerPin: number;
  i2cSdaPin: number;
  i2cSclPin: number;
  counterSyncPin: number;
  counterResetPin: number;
  ds3231SqwPin: number;
}

export interface NetworkConfig {
  defaultApSsid: string;
  defaultApIp: string;
  defaultPort: number;
  timeoutMs: number;
  maxRetries: number;
  timezone: string;
}

export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  defaultApSsid: 'DigitalClock-ESP32',
  defaultApIp: '192.168.4.1',
  defaultPort: 80,
  timeoutMs: 4000,
  maxRetries: 3,
  timezone: 'Asia/Kolkata',
};

export const DEFAULT_HARDWARE_PINS: HardwarePinConfig = {
  buzzerPin: 25,          // PWM Output to 2N2222 Transistor Driver
  i2cSdaPin: 21,          // DS3231 I2C Data (3.3V with 4.7k pullup)
  i2cSclPin: 22,          // DS3231 I2C Clock (3.3V with 4.7k pullup)
  counterSyncPin: 26,     // 1Hz sync pulse to CD4518 (via 74HCT buffer)
  counterResetPin: 27,    // Counter reset pulse to CD4518
  ds3231SqwPin: 34,       // DS3231 1Hz SQW Interrupt (3.3V input only)
};

export const TIMEZONE_OFFSET_MINUTES = 330; // UTC+5:30 for Asia/Kolkata
