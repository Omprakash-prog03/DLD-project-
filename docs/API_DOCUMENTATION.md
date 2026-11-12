# ESP32 Digital Clock & Smart Alarm — REST API Specification

This document defines the complete JSON REST API contract shared between the frontend web control interface and the ESP32 firmware (`firmware/esp32_smart_alarm/esp32_smart_alarm.ino`).

---

## 1. Network & Protocol Standards

- **Protocols:** HTTP/1.1 REST API, JSON request/response payloads.
- **Default Endpoints:**
  - **ESP32 Access Point (SoftAP):** `http://192.168.4.1:80`
  - **ESP32 Wi-Fi Station (Local LAN):** `http://<DHCP_IP>:80`
- **CORS Headers:** Served on every request:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Authorization`
- **Timezone:** Standardized on `Asia/Kolkata` (UTC+5:30).

---

## 2. Standard Response Format

### Success Response:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Specific error description"
}
```

---

## 3. Endpoints

### 3.1 Device Status
#### `GET /api/status`
Returns general operational status, connected peripheral detection, and memory telemetry.

**Response (200 OK):**
```json
{
  "connected": true,
  "device": "ESP32-WROOM-32",
  "clockSource": "DS3231",
  "rtcStatus": "available",
  "alarmCount": 2,
  "buzzerStatus": false,
  "firmwareVersion": "1.2.0",
  "uptime": 1420,
  "freeHeap": 184520,
  "wifiMode": "AP",
  "wifiSSID": "DigitalClock-ESP32"
}
```

---

### 3.2 Real-Time Clock (DS3231)

#### `GET /api/time`
Reads the authoritative current date and time from the DS3231 RTC registers over I2C.

**Response (200 OK):**
```json
{
  "hour": 22,
  "minute": 30,
  "second": 15,
  "day": 12,
  "month": 11,
  "year": 2026,
  "source": "DS3231",
  "timezone": "Asia/Kolkata"
}
```

#### `POST /api/time`
Validates and writes new date/time registers into the DS3231 RTC, then pulses GPIO 26 to synchronize the CD4518 BCD counters.

**Request Payload:**
```json
{
  "hour": 9,
  "minute": 50,
  "second": 0,
  "day": 12,
  "month": 11,
  "year": 2026
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Time successfully updated on DS3231 RTC"
}
```

**Validation Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Day must be between 1 and 30 for month 11"
}
```

---

### 3.3 Alarm Management

#### `GET /api/alarms`
Returns all configured alarms stored persistently in ESP32 non-volatile storage (NVS).

**Response (200 OK):**
```json
[
  {
    "id": "alarm-01",
    "title": "Morning Routine",
    "description": "Wake up, hydrate, and stretch",
    "hour": 7,
    "minute": 0,
    "second": 0,
    "enabled": true,
    "repeat": {
      "type": "weekdays",
      "days": [1, 2, 3, 4, 5]
    },
    "date": null,
    "soundId": "buzzer-standard",
    "snoozeDuration": 10,
    "wakeUpMission": true
  },
  {
    "id": "alarm-02",
    "title": "Focus Block",
    "description": "Hardware circuit testing",
    "hour": 9,
    "minute": 50,
    "second": 0,
    "enabled": true,
    "repeat": {
      "type": "daily",
      "days": [0, 1, 2, 3, 4, 5, 6]
    },
    "date": null,
    "soundId": "buzzer-pulsed",
    "snoozeDuration": 5,
    "wakeUpMission": true
  }
]
```

#### `POST /api/alarms`
Creates a new hardware alarm in ESP32 flash memory.

**Request Payload:**
```json
{
  "title": "Evening Review",
  "description": "Log circuit telemetry",
  "hour": 22,
  "minute": 30,
  "second": 0,
  "enabled": true,
  "repeat": {
    "type": "custom",
    "days": [1, 3, 5]
  },
  "soundId": "buzzer-gentle",
  "snoozeDuration": 15,
  "wakeUpMission": false,
  "date": null
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "id": "alm-17629392"
}
```

#### `PUT /api/alarms/{id}`
Updates an existing alarm in ESP32 NVS.

**Request Payload:**
```json
{
  "title": "Updated Alarm Name",
  "hour": 8,
  "minute": 15,
  "enabled": true,
  "repeat": {
    "type": "daily",
    "days": [0, 1, 2, 3, 4, 5, 6]
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Alarm updated"
}
```

#### `DELETE /api/alarms/{id}`
Deletes an alarm from memory.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Alarm deleted"
}
```

#### `POST /api/alarms/{id}/toggle`
Toggles an alarm's enabled state between `true` and `false`.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Alarm state toggled"
}
```

#### `POST /api/alarms/{id}/dismiss` (or `POST /api/alarms/dismiss`)
Silences an active ringing hardware buzzer. Supported with or without an ID parameter.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Alarm dismissed"
}
```

---

### 3.4 Wi-Fi Network Configuration

#### `POST /api/network/wifi`
Configures development SoftAP credentials (SSID & password) or Station credentials in ESP32 NVS non-volatile flash.

**Request Payload:**
```json
{
  "apSsid": "DigitalClock-ESP32",
  "apPassword": "newSecretPassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Wi-Fi parameters saved to NVS. Reboot to apply."
}
```

---

### 3.5 Hardware Diagnostics & Health

#### `GET /api/device/health`
Returns hardware diagnostics including I2C bus scan, internal die temperature, logic gate status, and GPIO pin configuration.

**Response (200 OK):**
```json
{
  "wifiStatus": "AP",
  "rtcAvailable": true,
  "temperatureCelsius": 26.75,
  "buzzerStatus": false,
  "uptime": 1420,
  "freeHeap": 184520,
  "ne555Freq": 1.0,
  "cd4518CounterSync": true,
  "logicGatesStatus": "3.3V to 5.0V 74HCT245 Bus Buffer Active",
  "gpioConfig": {
    "buzzerPin": 25,
    "i2cSdaPin": 21,
    "i2cSclPin": 22,
    "counterSyncPin": 26,
    "counterResetPin": 27,
    "ppsInterruptPin": 34
  },
  "i2cScan": [
    "0x68 (DS3231 RTC)",
    "0x57 (AT24C32 EEPROM)"
  ]
}
```

#### `POST /api/device/buzzer-test`
Sends a short test pulse (800ms, 2.4kHz PWM) to GPIO 25.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Buzzer test triggered (800ms PWM)"
}
```
