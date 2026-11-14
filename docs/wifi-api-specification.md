# Local Wi-Fi HTTP & WebSocket API Specification

## 1. Overview
The ESP32 microcontroller features a dual-core CPU with a full TCP/IP stack (LwIP). The firmware operates in two network configurations:
1. **SoftAP Mode (Direct Connection):**
   - **SSID:** `DigitalClock-ESP32`
   - **Password:** `clock1234`
   - **Static IP:** `192.168.4.1`
   - **Gateway / Subnet:** `192.168.4.1` / `255.255.255.0`
2. **Station Mode (Local LAN):**
   - Connects to user's home 2.4 GHz Wi-Fi router.
   - Assigned dynamic IP via DHCP or static IP.
   - mDNS Hostname: `http://smartclock.local`

---

## 2. Network REST Endpoints

### 2.1 Device Status
- **Method / Route:** `GET /api/status`
- **Description:** Returns live hardware metrics, RTC availability, free heap, and active ringing states.
- **Response Example (200 OK):**
```json
{
  "protocol_version": 1,
  "request_id": "status-req-001",
  "success": true,
  "data": {
    "device_name": "Smart Clock ESP32",
    "firmware_version": "1.2.0",
    "hardware_model": "ESP32-WROOM-32",
    "rtc_available": true,
    "current_time": "2026-11-14T21:30:00+05:30",
    "active_alarms_count": 3,
    "buzzer_active": false,
    "free_heap_bytes": 184520,
    "uptime_seconds": 3840,
    "wifi_rssi": -58
  },
  "error": null,
  "timestamp": "2026-11-14T21:30:00+05:30"
}
```

### 2.2 Time Management
- **Method / Route:** `GET /api/time`
- **Response:** Current DS3231 RTC timestamp and status.
- **Method / Route:** `POST /api/time`
- **Request Body:**
```json
{
  "protocol_version": 1,
  "request_id": "req-sync-102",
  "command": "SET_CLOCK_TIME",
  "timestamp": "2026-11-14T21:30:15+05:30",
  "payload": {
    "year": 2026,
    "month": 11,
    "day": 14,
    "hour": 21,
    "minute": 30,
    "second": 15,
    "timezone": "Asia/Kolkata"
  }
}
```

### 2.3 Alarm CRUD Operations
- `GET /api/alarms` — Retrieve all stored hardware alarms from NVS.
- `POST /api/alarms` — Create new hardware alarm (persisted in ESP32 NVS flash).
- `PUT /api/alarms/{id}` — Update existing alarm attributes.
- `DELETE /api/alarms/{id}` — Delete alarm and purge from NVS.
- `POST /api/alarms/{id}/toggle` — Toggle alarm enabled/disabled state.
- `POST /api/alarms/dismiss` — Stop the hardware buzzer immediately.
- `POST /api/alarms/snooze` — Postpone active ringing alarm by configured snooze duration.

### 2.4 Device Diagnostics & Health
- `GET /api/device/health` — Detailed hardware telemetry: I2C bus error rate, heap fragmentation, Flash NVS write wear, loop latency.
- `POST /api/device/buzzer-test` — Triggers a 200 ms audible verification beep.
