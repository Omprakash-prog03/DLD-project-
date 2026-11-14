# Hardware Command Reference & Schema Registry

## 1. Registry Summary
The command manager validates each request against the command schema before transmission.

| Command Identifier | Subsystem | Min Protocol Ver | Timeout (ms) | Idempotent |
| :--- | :--- | :--- | :--- | :--- |
| `GET_DEVICE_INFO` | Device | 1 | 3000 | Yes |
| `GET_DEVICE_STATUS` | Device | 1 | 2000 | Yes |
| `GET_SUPPORTED_FEATURES` | Capabilities | 1 | 2000 | Yes |
| `PING_DEVICE` | Diagnostics | 1 | 1500 | Yes |
| `RESTART_DEVICE` | System | 1 | 5000 | No |
| `GET_CLOCK_TIME` | Clock / RTC | 1 | 2000 | Yes |
| `SET_CLOCK_TIME` | Clock / RTC | 1 | 4000 | Yes |
| `SYNC_CLOCK` | Clock / RTC | 1 | 4000 | Yes |
| `GET_RTC_STATUS` | Clock / RTC | 1 | 2000 | Yes |
| `GET_ALARMS` | Alarms | 1 | 3000 | Yes |
| `CREATE_ALARM` | Alarms | 1 | 4000 | Yes (by ID) |
| `UPDATE_ALARM` | Alarms | 1 | 4000 | Yes (by ID) |
| `DELETE_ALARM` | Alarms | 1 | 4000 | Yes (by ID) |
| `ENABLE_ALARM` | Alarms | 1 | 3000 | Yes |
| `DISABLE_ALARM` | Alarms | 1 | 3000 | Yes |
| `STOP_ALARM` | Alarms / Buzzer | 1 | 2000 | Yes |
| `SNOOZE_ALARM` | Alarms / Buzzer | 1 | 2000 | Yes |
| `GET_DEVICE_CONFIG` | Config | 1 | 3000 | Yes |
| `SET_DEVICE_CONFIG` | Config | 1 | 4000 | Yes |
| `SET_DISPLAY_BRIGHTNESS`| Display | 1 | 2000 | Yes |
| `SET_BUZZER_CONFIG` | Audio | 1 | 2000 | Yes |

---

## 2. Command Details & Payloads

### 2.1 `GET_DEVICE_INFO`
- **Payload:** `{}`
- **Success Data:**
```json
{
  "device_id": "ESP32-CLK-4A2F",
  "device_name": "Smart Clock",
  "hardware_model": "ESP32-WROOM-32",
  "firmware_version": "1.2.0",
  "protocol_version": 1,
  "mac_address": "24:6F:28:4A:2F:10",
  "supported_transports": ["BLE", "WIFI"]
}
```

### 2.2 `SET_CLOCK_TIME`
- **Payload:**
```json
{
  "year": 2026,
  "month": 11,
  "day": 14,
  "hour": 21,
  "minute": 30,
  "second": 0,
  "timezone": "Asia/Kolkata"
}
```
- **Validation:** Year: 2020–2099; Month: 1–12; Day: 1–31 (leap-year checked); Hour: 0–23; Minute: 0–59; Second: 0–59.
- **Hardware Effect:** Microcontroller converts values to Binary-Coded Decimal (BCD), writes to DS3231 I2C registers 0x00–0x06, and issues a 10µs pulse to CD4518 counters via GPIO 26.

### 2.3 `CREATE_ALARM`
- **Payload:**
```json
{
  "alarm_id": "alm-550e8400-e29b-41d4-a716-446655440000",
  "label": "Morning Wakeup",
  "hour": 7,
  "minute": 30,
  "repeat_days": [1, 2, 3, 4, 5],
  "enabled": true,
  "snooze_enabled": true,
  "snooze_duration": 5
}
```
- **Hardware Effect:** Stored in Non-Volatile Storage (NVS) `smartclock` partition.
