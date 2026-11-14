# Hardware Contracts, Missing Firmware Specifications & Circuit Boundaries

This document defines the strict boundaries between confirmed hardware capabilities and provisional integration contracts for the **ESP32 + DS3231 Digital Clock Companion System**.

---

## 1. Confirmed Hardware Capabilities (Authoritative)

The companion application, mobile Android Java layers, and web simulation strictly interface only with confirmed hardware circuits:

| Subsystem | Circuit Specification | Firmware Contract | Operational Status in App |
| :--- | :--- | :--- | :--- |
| **Microcontroller** | ESP32-WROOM-32 (240MHz Xtensa Dual-Core) | Firmware `v1.2.0` | **Confirmed Active** |
| **Hardware RTC** | DS3231 High-Precision Temperature-Compensated RTC | I2C Address `0x68`, 400kHz Fast Mode | **Confirmed Active** (Authoritative timekeeper) |
| **BCD Display Logic** | CD4518 Dual BCD Counters + CD4511 Decoders | 5.0V Domain shifted by 74HCT245 | **Confirmed Active** |
| **Piezo Buzzer** | 2.4kHz Resonant Piezo driven by 2N2222 NPN | GPIO 25 (LEDC PWM Channel 0) | **Confirmed Active** (120s safety cutoff) |
| **Local Wi-Fi** | Direct SoftAP / Local Station HTTP REST | `192.168.4.1` / `esp32-clock.local` | **Confirmed Active** (Zero cloud dependency) |

---

## 2. Identified Unconfirmed Hardware Contracts & Provisional Values

In accordance with strict safety requirements, the mobile application **does not invent capabilities or fake successful connections**:

### A. Provisional BLE UUIDs (`isBleUuidVerified: false`)
- **Status**: The firmware currently supports Wi-Fi REST/WebSocket endpoints and basic serial framing. Bluetooth Low Energy characteristic UUIDs have not yet been assigned by the firmware build system.
- **Provisional Placeholders**:
  - Service UUID: `0000FFF0-0000-1000-8000-00805F9B34FB`
  - Command Characteristic: `0000FFF1-0000-1000-8000-00805F9B34FB`
  - Response Characteristic: `0000FFF2-0000-1000-8000-00805F9B34FB`
- **Application Policy**: In `lib/core/constants/hardware_config_constants.dart` and `android/app/src/main/java/com/smartclock/mobile/hardware/BleTransportManager.java`, these are flagged with `isBleUuidVerified: false`. The application never fakes a successful BLE connection when hardware is absent or unmatched.

### B. Display Brightness Rejection (`SET_DISPLAY_BRIGHTNESS`)
- **Status**: **CONFIRMED HARDWARE UNSUPPORTED**
- **Circuit Limitation**: The 7-segment display logic utilizes CD4511 BCD-to-7-segment decoders powered by a static 5.0V power rail through 74HCT245 octal transceivers. In the current PCB hardware revision, no PWM blanking pin (`/BL`) or digital potentiometer is wired to the common cathode/anode pins.
- **Application Policy**:
  - `SET_DISPLAY_BRIGHTNESS` command definition has `isConfirmedByFirmware: false`.
  - Enqueueing this command fails locally with `ERR_1002_UNSUPPORTED_COMMAND`.
  - The UI slider is permanently disabled with a `"HARDWARE UNSUPPORTED"` badge and circuit explanation.

### C. Offline Data Integrity Policy
- Alarms are **never** marked as synchronized (`syncStatus: synchronized`) without an explicit `{"success": true}` acknowledgement frame from the ESP32 firmware.
- If the hardware is unreachable, alarms transition to `deviceOffline` or `pending` and are queued in SQLite (`SyncQueueTable`) for automatic reconciliation upon reconnection.
- Calendar events and Reminders are strictly local software features and are never transmitted to the ESP32.

---

## 3. Firmware JSON Protocol v1.0 Specifications

Every command dispatched over BLE or Wi-Fi follows strict framing:

```json
{
  "protocol_version": 1,
  "request_id": "req-1731604200000-01",
  "command": "SET_CLOCK_TIME",
  "timestamp": "2026-11-14T21:30:00+05:30",
  "payload": {
    "year": 2026,
    "month": 11,
    "day": 14,
    "hour": 21,
    "minute": 30,
    "second": 0,
    "timezone": "Asia/Kolkata"
  }
}
```

### Response Frame Specification:
```json
{
  "protocol_version": 1,
  "request_id": "req-1731604200000-01",
  "success": true,
  "data": {
    "acknowledged": true,
    "current_time": "2026-11-14T21:30:00+05:30"
  },
  "error": null,
  "timestamp": "2026-11-14T21:30:00+05:30"
}
```
