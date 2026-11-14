# Bluetooth Low Energy (BLE) GATT Specification

## 1. Overview
The ESP32 firmware provides a custom GATT (Generic Attribute Profile) service to allow low-latency, low-power control and synchronization directly from Android and iOS mobile devices without requiring Wi-Fi association.

---

## 2. Centralized BLE UUID Registry

All UUIDs are 128-bit custom identifiers rooted under the Smart Clock base UUID `00000000-D1DC-4000-8000-00805F9B34FB`:

| Entity | UUID String | Properties | Description |
| :--- | :--- | :--- | :--- |
| **Primary Service** | `0000D1D0-D1DC-4000-8000-00805F9B34FB` | Primary Service | Smart Clock Main GATT Service |
| **Status Char** | `0000D1D1-D1DC-4000-8000-00805F9B34FB` | Read, Notify | Real-time device telemetry & state updates |
| **Command Char** | `0000D1D2-D1DC-4000-8000-00805F9B34FB` | Write, Write Without Response | Client JSON command input buffer |
| **Response Char** | `0000D1D3-D1DC-4000-8000-00805F9B34FB` | Read, Indicate | Server command response delivery buffer |
| **Sync Event Char** | `0000D1D4-D1DC-4000-8000-00805F9B34FB` | Notify | Asynchronous alerts (Alarm Ringing, RTC PPS) |

---

## 3. BLE Advertising & Discovery
- **Advertising Name:** `SmartClock-ESP32` or `DigitalClock-XXXX` (where `XXXX` is the lower 4 hex digits of the MAC address).
- **Service UUID in Advertisement:** `0x0000D1D0-D1DC-4000-8000-00805F9B34FB` included in 128-bit Service Solicitation or Complete Service List.
- **Advertising Interval:** 100 ms (Fast connect mode) for the first 30 seconds after boot, throttling to 500 ms thereafter to conserve energy.
- **Max Transmission Unit (ATT MTU):** The mobile application requests an MTU exchange of 512 bytes upon connection. If negotiation yields $< 512$ bytes, chunked framing with a 4-byte header (`[pkt_index, total_pkts, seq_id_hi, seq_id_lo]`) is used.

---

## 4. Connection Workflow
1. **Scanning:** Mobile app scans for BLE peripherals matching Service UUID `0000D1D0-D1DC-4000-8000-00805F9B34FB` or local name starting with `SmartClock`.
2. **Connection Establishment:** Central connects with a 15–30 ms connection interval.
3. **MTU Exchange:** Central issues MTU negotiation request (512 bytes).
4. **Service Discovery:** Central queries Primary Service and discovers the four characteristics.
5. **Subscription:** Central writes `0x0001` to the CCCD (Client Characteristic Configuration Descriptor) of **Response Char** and **Sync Event Char** to enable notifications/indications.
6. **Handshake:** Central writes `GET_DEVICE_INFO` command to **Command Char**.
7. **Acknowledgement:** Peripheral responds on **Response Char** with hardware metadata, firmware version, and RTC status.
