# ESP32 Digital Clock & Smart Alarm — REST API Documentation

This document describes the exact HTTP REST API contract implemented by the ESP32 firmware and consumed by the web control interface.

---

## Base URL

- **ESP32 Access Point (SoftAP):** `http://192.168.4.1` (Port 80)
- **ESP32 Wi-Fi Station (Home LAN):** `http://<ASSIGNED_DHCP_IP>`

All requests and responses use `Content-Type: application/json`.
CORS headers (`Access-Control-Allow-Origin: *`) are served on every endpoint.

---

## 1. Device Status

### `GET /api/status`
Returns general operational status, connected peripheral detection, and memory telemetry.

#### Response (200 OK):
```json
{
  "connected": true,
  "device": "ESP32-WROOM-32",
  "clockSource": "DS3231",
  "rtcStatus": "available",
  "alarmCount": 3,
  "buzzerStatus": false,
  "firmwareVersion": "1.2.0",
  "uptime": 1420,
  "freeHeap": 184520,
  "wifiMode": "AP",
  "wifiSSID": "DigitalClock-ESP32"
}
```

---

## 2. Real-Time Clock (DS3231)

### `GET /api/time`
Reads the authoritative current date and time from the DS3231 RTC registers over I2C.

#### Response (200 OK):
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

### `POST /api/time`
Updates the DS3231 RTC registers and pulses the CD4518 digital counters synchronization pin (GPIO 26).

#### Request Body:
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

#### Response (200 OK):
```json
{
  "success": true,
  "message": "Time updated on DS3231 RTC"
}
```

---

## 3. Alarm Management

### `GET /api/alarms`
Returns all configured alarms stored persistently in ESP32 NVS flash.

#### Response (200 OK):
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
  }
]
```

### `POST /api/alarms`
Creates a new hardware alarm.

#### Request Body:
```json
{
  "title": "Focus Block",
  "description": "Lab testing",
  "hour": 9,
  "minute": 50,
  "second": 0,
  "enabled": true,
  "repeat": {
    "type": "daily",
    "days": [0, 1, 2, 3, 4, 5, 6]
  },
  "soundId": "buzzer-pulsed",
  "snoozeDuration": 5,
  "wakeUpMission": true
}
```

#### Response (201 Created):
```json
{
  "success": true,
  "id": "alm-17629392"
}
```

### `PUT /api/alarms/{id}`
Updates an existing alarm in ESP32 flash memory.

### `DELETE /api/alarms/{id}`
Deletes an alarm from memory.

### `POST /api/alarms/{id}/toggle`
Enables or disables an alarm without removing its schedule.

### `POST /api/alarms/{id}/dismiss`
Silences an active ringing hardware buzzer.

#### Response (200 OK):
```json
{
  "success": true,
  "message": "Alarm dismissed"
}
```

---

## 4. Diagnostics & Hardware Health

### `GET /api/device/health`
Returns hardware diagnostics including I2C bus scan, internal die temperature, and logic gate integrity.

#### Response (200 OK):
```json
{
  "wifiStatus": "AP_RUNNING",
  "rtcAvailable": true,
  "temperatureCelsius": 26.75,
  "buzzerStatus": false,
  "uptime": 1420,
  "freeHeap": 184520,
  "ne555Freq": 1.0,
  "cd4518CounterSync": true,
  "i2cScan": [
    "0x68 (DS3231 RTC)",
    "0x57 (AT24C32 EEPROM)"
  ]
}
```

### `POST /api/device/buzzer-test`
Sends a short test pulse (800ms, 2.4kHz PWM) to GPIO 25.
