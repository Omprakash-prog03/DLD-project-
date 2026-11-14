# ESP32 Firmware Developer Integration Guide

## 1. Overview
This guide provides embedded developers with the exact technical requirements, libraries, and code templates necessary to build or update ESP32 firmware that is 100% compatible with the Smart Clock Mobile Application.

---

## 2. Firmware Prerequisites & Dependencies
- **Toolchain:** ESP-IDF v4.4+ or Arduino-ESP32 Core v2.0.14+
- **Required Libraries:**
  - `ArduinoJson` (v6.21+ or v7.x)
  - `Wire.h` (Hardware I2C at 100 kHz)
  - `Preferences.h` (Non-Volatile Storage for persistent alarms)
  - `BLEDevice.h` / `BLEServer.h` / `BLEUtils.h` (NimBLE recommended)
  - `WebServer.h` / `WiFi.h`

---

## 3. BLE Implementation Skeleton (NimBLE / Bluedroid)
```cpp
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>

#define SERVICE_UUID           "0000D1D0-D1DC-4000-8000-00805F9B34FB"
#define CHAR_STATUS_UUID       "0000D1D1-D1DC-4000-8000-00805F9B34FB"
#define CHAR_COMMAND_UUID      "0000D1D2-D1DC-4000-8000-00805F9B34FB"
#define CHAR_RESPONSE_UUID     "0000D1D3-D1DC-4000-8000-00805F9B34FB"
#define CHAR_SYNC_EVENT_UUID   "0000D1D4-D1DC-4000-8000-00805F9B34FB"

BLECharacteristic *pResponseChar;
BLECharacteristic *pStatusChar;

class CommandCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pChar) {
    std::string rxVal = pChar->getValue();
    if (rxVal.length() > 0) {
      StaticJsonDocument<512> doc;
      DeserializationError err = deserializeJson(doc, rxVal.c_str());
      if (err) return;

      const char* cmd = doc["command"];
      const char* reqId = doc["request_id"];

      StaticJsonDocument<512> resDoc;
      resDoc["protocol_version"] = 1;
      resDoc["request_id"] = reqId;

      if (strcmp(cmd, "GET_DEVICE_INFO") == 0) {
        resDoc["success"] = true;
        JsonObject data = resDoc.createNestedObject("data");
        data["device_name"] = "Smart Clock";
        data["firmware_version"] = "1.2.0";
        data["hardware_model"] = "ESP32-WROOM-32";
      }

      String output;
      serializeJson(resDoc, output);
      pResponseChar->setValue(output.c_str());
      pResponseChar->indicate();
    }
  }
};
```

---

## 4. Flash Persistence (NVS) Structure
Alarms are stored in the `smartclock` NVS namespace under the key `alarm_data`:
```cpp
Preferences prefs;
prefs.begin("smartclock", false);
prefs.putBytes("alarm_data", alarms, sizeof(alarms));
prefs.end();
```

---

## 5. Firmware Integration Checklist
- [ ] DS3231 I2C pull-ups verified at 3.3V (never 5V).
- [ ] 74HCT245 buffer verified: DIR=HIGH, /OE=LOW, A->B only.
- [ ] LEDC PWM channel 0 frequency set to 2400 Hz.
- [ ] 120-second automatic buzzer cutoff implemented.
- [ ] NVS storage verified across power cycles.
- [ ] BLE 512-byte MTU request supported.
- [ ] JSON protocol version 1 implemented.
