# Standardized Firmware Communication Protocol Specification

## 1. Overview & Protocol Principles
The Smart Clock system defines a versioned, transport-agnostic message protocol for communication between the mobile companion application and the ESP32 firmware.

Whether transmitted via **Bluetooth Low Energy (GATT Characteristics)** or **Local Wi-Fi (HTTP REST / WebSockets)**, the payload adheres to the exact same JSON schema.

### Core Protocol Tenets
1. **Explicit Request-Response Handshake:** Every command includes a unique `request_id`.
2. **Deterministic Versioning:** All messages declare `"protocol_version": 1`.
3. **Hardware Truth:** An operation is only confirmed when the microcontroller returns `"success": true`.
4. **Idempotency:** Re-transmissions of identical `request_id` or `alarm_id` updates do not create duplicates.
5. **No Cloud Dependency:** Communication is entirely peer-to-peer over local RF links (BLE / SoftAP / LAN).

---

## 2. Standard Frame Formats

### 2.1 Request Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SmartClockProtocolRequest",
  "type": "object",
  "required": ["protocol_version", "request_id", "command", "timestamp", "payload"],
  "properties": {
    "protocol_version": {
      "type": "integer",
      "minimum": 1,
      "maximum": 1
    },
    "request_id": {
      "type": "string",
      "format": "uuid",
      "description": "Client-generated UUIDv4"
    },
    "command": {
      "type": "string",
      "description": "Standardized command identifier from registry"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp with explicit timezone offset"
    },
    "payload": {
      "type": "object",
      "description": "Command-specific parameters"
    }
  }
}
```

### 2.2 Response Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SmartClockProtocolResponse",
  "type": "object",
  "required": ["protocol_version", "request_id", "success", "timestamp"],
  "properties": {
    "protocol_version": {
      "type": "integer",
      "minimum": 1
    },
    "request_id": {
      "type": "string",
      "description": "Echoed client request UUID"
    },
    "success": {
      "type": "boolean",
      "description": "True if operation executed and committed to hardware"
    },
    "data": {
      "type": ["object", "array", "null"],
      "description": "Command-specific return values"
    },
    "error": {
      "type": ["object", "null"],
      "properties": {
        "code": { "type": "string" },
        "message": { "type": "string" },
        "subsystem": { "type": "string" }
      }
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

---

## 3. Wire Formats by Transport

| Transport | Fragmentation Limit | Serialization | Transfer Mechanism |
| :--- | :--- | :--- | :--- |
| **Wi-Fi HTTP REST** | Unlimited (Chunked) | UTF-8 JSON Text | POST body / JSON response |
| **Wi-Fi WebSocket** | Frame max 4096 bytes | UTF-8 JSON Text | Bi-directional Text Frames |
| **Bluetooth LE** | ATT MTU (Negotiated 23-512B) | Chunked UTF-8 or Compact JSON | Command Char Write -> Response Char Indication |

---

## 4. End-to-End Command Life Cycle
```
[ Mobile App ]                                       [ ESP32 Firmware ]
     |                                                       |
     |--- 1. Send Command (UUID, "SET_CLOCK_TIME") --------->|
     |                                                       |--- 2. Validate JSON & Schema
     |                                                       |--- 3. Verify RTC Ready (I2C 0x68)
     |                                                       |--- 4. Write BCD to DS3231
     |                                                       |--- 5. Pulse CD4518 Counter Sync
     |<-- 6. Response (UUID, success: true, data) -----------|
     |                                                       |
     |=== 7. App Updates UI from "Pending" to "Synced" ======|
```
