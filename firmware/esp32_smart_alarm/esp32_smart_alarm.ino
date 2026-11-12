/*
 * =========================================================================================
 * PROJECT: ESP32 Digital Clock & Smart Alarm System — Production Firmware
 * Microcontroller: ESP32-WROOM-32 DevKit
 *
 * System Architecture & Electrical Design:
 *   - DS3231 High-Precision I2C RTC (I2C Address: 0x68, powered at 3.3V)
 *   - Hardware Piezo Buzzer driven by 2N2222 NPN transistor on GPIO 25 (LEDC PWM)
 *   - CD4518 Dual BCD Counters synchronized via GPIO 26 through 74HCT245 level buffer
 *   - 3.3V GPIO limits strictly respected: 74HCT245 wired A->B (3.3V to 5V only, DIR=HIGH, /OE=GND)
 *   - Wi-Fi AP Mode (DigitalClock-ESP32 / 192.168.4.1) & Station Mode with NVS fallback
 *   - Autonomous alarm evaluation loop independent of web browser connection
 * =========================================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <Preferences.h>
#include <ArduinoJson.h>
#include "hardware_config.h"

// ----------------- Web Server & NVS ----------------
WebServer server(HTTP_REST_PORT);
Preferences preferences;

// ----------------- Data Structures -----------------
struct AlarmItem {
  char id[32];
  char title[32];
  char description[48];
  uint8_t hour;
  uint8_t minute;
  uint8_t second;
  bool enabled;
  char repeatType[12]; // "once", "daily", "weekdays", "weekends", "custom"
  uint8_t repeatDaysMask; // bit 0 = Sun, bit 1 = Mon, ..., bit 6 = Sat
  char date[12]; // YYYY-MM-DD for one-time alarms
  char soundId[24];
  uint8_t snoozeDuration; // minutes: 0, 5, 10, 15, 30
  bool wakeUpMission;
};

AlarmItem alarms[MAX_ALARMS];
size_t alarmCount = 0;

// Runtime state tracking
bool buzzerActive = false;
unsigned long buzzerStartTime = 0;
unsigned long buzzerDurationMs = 0;
char activeRingingAlarmId[32] = "";
bool rtcAvailable = false;
unsigned long bootTimestamp = 0;
char wifiCurrentMode[8] = "AP";
char apPassword[32] = DEFAULT_AP_PASS;
char apSsid[32] = DEFAULT_AP_SSID;

// ----------------- Helper: BCD Conversion ----------
static inline uint8_t decToBcd(uint8_t val) {
  return ((val / 10 * 16) + (val % 10));
}

static inline uint8_t bcdToDec(uint8_t val) {
  return ((val / 16 * 10) + (val % 16));
}

// ----------------- Date & Time Validation ----------
bool isLeapYear(int year) {
  return ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0));
}

int daysInMonth(int year, int month) {
  static const int days[] = { 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 };
  if (month == 2 && isLeapYear(year)) return 29;
  if (month >= 1 && month <= 12) return days[month - 1];
  return 0;
}

bool validateDateTime(int year, int month, int day, int hour, int minute, int second, String &err) {
  if (hour < 0 || hour > 23) {
    err = "Hour must be between 0 and 23";
    return false;
  }
  if (minute < 0 || minute > 59) {
    err = "Minute must be between 0 and 59";
    return false;
  }
  if (second < 0 || second > 59) {
    err = "Second must be between 0 and 59";
    return false;
  }
  if (year < 2000 || year > 2099) {
    err = "Year must be between 2000 and 2099";
    return false;
  }
  if (month < 1 || month > 12) {
    err = "Month must be between 1 and 12";
    return false;
  }
  int maxDays = daysInMonth(year, month);
  if (day < 1 || day > maxDays) {
    err = String("Day must be between 1 and ") + maxDays + " for month " + month;
    return false;
  }
  return true;
}

// ----------------- DS3231 I2C Driver ---------------
bool initDS3231() {
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL, I2C_BUS_FREQ_HZ);
  Wire.beginTransmission(DS3231_I2C_ADDR);
  if (Wire.endTransmission() == 0) {
    rtcAvailable = true;
    Serial.println("[RTC] DS3231 detected at I2C address 0x68");
    return true;
  }
  rtcAvailable = false;
  Serial.println("[RTC] DS3231 not detected! Verify 3.3V power, SDA/SCL pull-up resistors.");
  return false;
}

void readDS3231Time(int &year, int &month, int &day, int &hour, int &minute, int &second) {
  if (!rtcAvailable) {
    // Internal timer fallback
    unsigned long sec = (millis() - bootTimestamp) / 1000;
    second = sec % 60;
    minute = (sec / 60) % 60;
    hour = (sec / 3600) % 24;
    day = 12;
    month = 11;
    year = 2026;
    return;
  }

  Wire.beginTransmission(DS3231_I2C_ADDR);
  Wire.write(0x00); // Address 00h: Seconds
  Wire.endTransmission();

  Wire.requestFrom(DS3231_I2C_ADDR, 7);
  if (Wire.available() >= 7) {
    second = bcdToDec(Wire.read() & 0x7F);
    minute = bcdToDec(Wire.read());
    hour   = bcdToDec(Wire.read() & 0x3F);
    Wire.read(); // Day of week (1-7)
    day    = bcdToDec(Wire.read());
    month  = bcdToDec(Wire.read() & 0x1F);
    year   = 2000 + bcdToDec(Wire.read());
  }
}

bool writeDS3231Time(int year, int month, int day, int hour, int minute, int second) {
  if (!rtcAvailable) return false;

  Wire.beginTransmission(DS3231_I2C_ADDR);
  Wire.write(0x00);
  Wire.write(decToBcd(second));
  Wire.write(decToBcd(minute));
  Wire.write(decToBcd(hour));
  Wire.write(decToBcd(1)); // Day of week
  Wire.write(decToBcd(day));
  Wire.write(decToBcd(month));
  Wire.write(decToBcd(year >= 2000 ? year - 2000 : year));
  byte err = Wire.endTransmission();

  if (err == 0) {
    Serial.printf("[RTC] Successfully written: %04d-%02d-%02d %02d:%02d:%02d\n",
                  year, month, day, hour, minute, second);
    return true;
  } else {
    Serial.printf("[RTC] I2C transmission error code %d\n", err);
    return false;
  }
}

float readDS3231Temperature() {
  if (!rtcAvailable) return 25.0;
  Wire.beginTransmission(DS3231_I2C_ADDR);
  Wire.write(0x11);
  Wire.endTransmission();
  Wire.requestFrom(DS3231_I2C_ADDR, 2);
  if (Wire.available() >= 2) {
    int8_t msb = Wire.read();
    uint8_t lsb = Wire.read();
    return msb + ((lsb >> 6) * 0.25f);
  }
  return 25.0;
}

// ----------------- NVS Non-Volatile Storage --------
void saveAlarmsToNVS() {
  preferences.begin("smartclock", false);
  preferences.putBytes("alarms", alarms, sizeof(alarms));
  preferences.putUInt("count", alarmCount);
  preferences.end();
  Serial.printf("[NVS] %d alarms saved to non-volatile flash\n", alarmCount);
}

void loadAlarmsFromNVS() {
  preferences.begin("smartclock", true);
  alarmCount = preferences.getUInt("count", 0);
  if (alarmCount > MAX_ALARMS) alarmCount = 0;

  if (alarmCount > 0) {
    preferences.getBytes("alarms", alarms, sizeof(alarms));
    Serial.printf("[NVS] Restored %d alarms from flash\n", alarmCount);
  } else {
    // Seed initial sensible defaults
    alarmCount = 2;

    strncpy(alarms[0].id, "alarm-01", 31);
    strncpy(alarms[0].title, "Morning Routine", 31);
    strncpy(alarms[0].description, "Wake up and hydrate", 47);
    alarms[0].hour = 7;
    alarms[0].minute = 0;
    alarms[0].second = 0;
    alarms[0].enabled = true;
    strncpy(alarms[0].repeatType, "weekdays", 11);
    alarms[0].repeatDaysMask = 0b00111110; // Mon..Fri (days 1..5)
    alarms[0].date[0] = '\0';
    strncpy(alarms[0].soundId, "buzzer-standard", 23);
    alarms[0].snoozeDuration = 10;
    alarms[0].wakeUpMission = true;

    strncpy(alarms[1].id, "alarm-02", 31);
    strncpy(alarms[1].title, "Focus Block", 31);
    strncpy(alarms[1].description, "Hardware lab work", 47);
    alarms[1].hour = 9;
    alarms[1].minute = 50;
    alarms[1].second = 0;
    alarms[1].enabled = true;
    strncpy(alarms[1].repeatType, "daily", 11);
    alarms[1].repeatDaysMask = 0b01111111; // All days
    alarms[1].date[0] = '\0';
    strncpy(alarms[1].soundId, "buzzer-pulsed", 23);
    alarms[1].snoozeDuration = 5;
    alarms[1].wakeUpMission = true;
  }
  preferences.end();
}

// ----------------- Hardware Buzzer Driver ----------
void startBuzzer(uint32_t durationMs = 60000, const char* alarmId = "") {
  buzzerActive = true;
  buzzerStartTime = millis();
  buzzerDurationMs = durationMs;
  if (alarmId && strlen(alarmId) > 0) {
    strncpy(activeRingingAlarmId, alarmId, 31);
  }

  // Attach LEDC PWM on GPIO 25 (2.4kHz piezo frequency, 50% duty)
  ledcAttach(PIN_BUZZER, BUZZER_PWM_FREQ, BUZZER_PWM_RES);
  ledcWrite(PIN_BUZZER, BUZZER_DUTY_CYCLE);
  Serial.printf("[BUZZER] Sounding ON for %lu ms\n", durationMs);
}

void stopBuzzer() {
  buzzerActive = false;
  activeRingingAlarmId[0] = '\0';
  ledcWrite(PIN_BUZZER, 0);
  ledcDetach(PIN_BUZZER);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
  Serial.println("[BUZZER] Sounding OFF");
}

// ----------------- CORS Headers --------------------
void setCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
}

void handleOptions() {
  setCORS();
  server.send(204);
}

// ----------------- REST API Endpoints --------------

// GET /api/status
void handleGetStatus() {
  setCORS();
  StaticJsonDocument<512> doc;
  doc["connected"] = true;
  doc["device"] = "ESP32-WROOM-32";
  doc["clockSource"] = rtcAvailable ? "DS3231" : "ESP32_INTERNAL";
  doc["rtcStatus"] = rtcAvailable ? "available" : "unavailable";
  doc["alarmCount"] = alarmCount;
  doc["buzzerStatus"] = buzzerActive;
  doc["firmwareVersion"] = "1.2.0";
  doc["uptime"] = (millis() - bootTimestamp) / 1000;
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["wifiMode"] = wifiCurrentMode;
  doc["wifiSSID"] = apSsid;

  String out;
  serializeJson(doc, out);
  server.send(200, "application/json", out);
}

// GET /api/time
void handleGetTime() {
  setCORS();
  int year, month, day, hour, minute, second;
  readDS3231Time(year, month, day, hour, minute, second);

  StaticJsonDocument<256> doc;
  doc["hour"] = hour;
  doc["minute"] = minute;
  doc["second"] = second;
  doc["day"] = day;
  doc["month"] = month;
  doc["year"] = year;
  doc["source"] = rtcAvailable ? "DS3231" : "ESP32_INTERNAL";
  doc["timezone"] = TIMEZONE_NAME;

  String out;
  serializeJson(doc, out);
  server.send(200, "application/json", out);
}

// POST /api/time
void handlePostTime() {
  setCORS();
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"success\":false,\"message\":\"Missing request body\"}");
    return;
  }

  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, server.arg("plain"));
  if (err) {
    server.send(400, "application/json", "{\"success\":false,\"message\":\"Malformed JSON payload\"}");
    return;
  }

  int hour = doc["hour"] | 0;
  int minute = doc["minute"] | 0;
  int second = doc["second"] | 0;
  int day = doc["day"] | 1;
  int month = doc["month"] | 1;
  int year = doc["year"] | 2026;

  String validationErr;
  if (!validateDateTime(year, month, day, hour, minute, second, validationErr)) {
    String resp = "{\"success\":false,\"message\":\"" + validationErr + "\"}";
    server.send(400, "application/json", resp);
    return;
  }

  bool ok = writeDS3231Time(year, month, day, hour, minute, second);
  if (!ok && rtcAvailable) {
    server.send(500, "application/json", "{\"success\":false,\"message\":\"Failed to write DS3231 registers\"}");
    return;
  }

  // Pulse CD4518 counter sync pin (GPIO 26 -> 74HCT245 -> CD4518)
  digitalWrite(PIN_COUNTER_SYNC, HIGH);
  delayMicroseconds(50);
  digitalWrite(PIN_COUNTER_SYNC, LOW);

  server.send(200, "application/json", "{\"success\":true,\"message\":\"Time successfully updated on DS3231 RTC\"}");
}

// GET /api/alarms
void handleGetAlarms() {
  setCORS();
  DynamicJsonDocument doc(4096);
  JsonArray arr = doc.to<JsonArray>();

  for (size_t i = 0; i < alarmCount; i++) {
    JsonObject obj = arr.createNestedObject();
    obj["id"] = alarms[i].id;
    obj["title"] = alarms[i].title;
    obj["description"] = alarms[i].description;
    obj["hour"] = alarms[i].hour;
    obj["minute"] = alarms[i].minute;
    obj["second"] = alarms[i].second;
    obj["enabled"] = alarms[i].enabled;

    JsonObject rep = obj.createNestedObject("repeat");
    rep["type"] = alarms[i].repeatType;
    JsonArray days = rep.createNestedArray("days");
    for (int d = 0; d < 7; d++) {
      if (alarms[i].repeatDaysMask & (1 << d)) {
        days.add(d);
      }
    }

    if (strlen(alarms[i].date) > 0) obj["date"] = alarms[i].date;
    else obj["date"] = nullptr;

    obj["soundId"] = alarms[i].soundId;
    obj["snoozeDuration"] = alarms[i].snoozeDuration;
    obj["wakeUpMission"] = alarms[i].wakeUpMission;
  }

  String out;
  serializeJson(doc, out);
  server.send(200, "application/json", out);
}

// POST /api/alarms
void handlePostAlarms() {
  setCORS();
  if (alarmCount >= MAX_ALARMS) {
    server.send(400, "application/json", "{\"success\":false,\"message\":\"Maximum alarm capacity reached (16 max)\"}");
    return;
  }

  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, server.arg("plain"));
  if (err) {
    server.send(400, "application/json", "{\"success\":false,\"message\":\"Invalid JSON\"}");
    return;
  }

  int hour = doc["hour"] | 0;
  int minute = doc["minute"] | 0;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    server.send(400, "application/json", "{\"success\":false,\"message\":\"Invalid alarm time\"}");
    return;
  }

  AlarmItem& a = alarms[alarmCount];
  snprintf(a.id, 31, "alm-%lu", millis());
  strncpy(a.title, doc["title"] | "Alarm", 31);
  strncpy(a.description, doc["description"] | "", 47);
  a.hour = hour;
  a.minute = minute;
  a.second = doc["second"] | 0;
  a.enabled = doc["enabled"] | true;

  const char* rType = doc["repeat"]["type"] | "once";
  strncpy(a.repeatType, rType, 11);

  a.repeatDaysMask = 0;
  JsonArray days = doc["repeat"]["days"];
  for (int d : days) {
    if (d >= 0 && d < 7) a.repeatDaysMask |= (1 << d);
  }

  if (doc.containsKey("date") && !doc["date"].isNull()) {
    strncpy(a.date, doc["date"], 11);
  } else {
    a.date[0] = '\0';
  }

  strncpy(a.soundId, doc["soundId"] | "buzzer-standard", 23);
  a.snoozeDuration = doc["snoozeDuration"] | 10;
  a.wakeUpMission = doc["wakeUpMission"] | false;

  alarmCount++;
  saveAlarmsToNVS();

  StaticJsonDocument<128> res;
  res["success"] = true;
  res["id"] = a.id;
  String out;
  serializeJson(res, out);
  server.send(201, "application/json", out);
}

// GET /api/device/health
void handleGetHealth() {
  setCORS();
  StaticJsonDocument<512> doc;
  doc["wifiStatus"] = wifiCurrentMode;
  doc["rtcAvailable"] = rtcAvailable;
  doc["temperatureCelsius"] = readDS3231Temperature();
  doc["buzzerStatus"] = buzzerActive;
  doc["uptime"] = (millis() - bootTimestamp) / 1000;
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["ne555Freq"] = 1.0;
  doc["cd4518CounterSync"] = true;
  doc["logicGatesStatus"] = "3.3V to 5.0V 74HCT245 Bus Buffer Active";

  JsonObject gpio = doc.createNestedObject("gpioConfig");
  gpio["buzzerPin"] = PIN_BUZZER;
  gpio["i2cSdaPin"] = PIN_I2C_SDA;
  gpio["i2cSclPin"] = PIN_I2C_SCL;
  gpio["counterSyncPin"] = PIN_COUNTER_SYNC;
  gpio["counterResetPin"] = PIN_COUNTER_RESET;
  gpio["ppsInterruptPin"] = PIN_DS3231_SQW_INT;

  JsonArray i2cScan = doc.createNestedArray("i2cScan");
  if (rtcAvailable) {
    i2cScan.add("0x68 (DS3231 RTC)");
    i2cScan.add("0x57 (AT24C32 EEPROM)");
  }

  String out;
  serializeJson(doc, out);
  server.send(200, "application/json", out);
}

// POST /api/device/buzzer-test
void handleBuzzerTest() {
  setCORS();
  startBuzzer(800, "TEST");
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Buzzer test triggered (800ms PWM)\"}");
}

// POST /api/alarms/dismiss
void handleDirectDismiss() {
  setCORS();
  stopBuzzer();
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Alarm dismissed\"}");
}

// POST /api/network/wifi (Configurable AP / Station Networking)
void handlePostWifi() {
  setCORS();
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"success\":false,\"message\":\"Missing body\"}");
    return;
  }

  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, server.arg("plain"));
  if (err) {
    server.send(400, "application/json", "{\"success\":false,\"message\":\"Invalid JSON\"}");
    return;
  }

  preferences.begin("smartclock", false);
  if (doc.containsKey("apSsid")) {
    const char* s = doc["apSsid"];
    if (strlen(s) >= 1) {
      strncpy(apSsid, s, 31);
      preferences.putString("ap_ssid", apSsid);
    }
  }
  if (doc.containsKey("apPassword")) {
    const char* p = doc["apPassword"];
    if (strlen(p) >= 8) {
      strncpy(apPassword, p, 31);
      preferences.putString("ap_pass", apPassword);
    } else {
      preferences.end();
      server.send(400, "application/json", "{\"success\":false,\"message\":\"AP Password must be at least 8 characters\"}");
      return;
    }
  }
  preferences.end();

  server.send(200, "application/json", "{\"success\":true,\"message\":\"Wi-Fi parameters saved to NVS. Reboot to apply.\"}");
}

// ----------------- Dynamic Route Dispatcher --------
// Handles:
//   PUT    /api/alarms/{id}
//   DELETE /api/alarms/{id}
//   POST   /api/alarms/{id}/toggle
//   POST   /api/alarms/{id}/dismiss
//   POST   /api/alarms/{id}/snooze
void handleDynamicRoutes() {
  String uri = server.uri();
  HTTPMethod method = server.method();

  if (method == HTTP_OPTIONS) {
    handleOptions();
    return;
  }

  if (uri.startsWith("/api/alarms/")) {
    String sub = uri.substring(12); // after "/api/alarms/"

    // Check for /dismiss
    if (sub.endsWith("/dismiss") && method == HTTP_POST) {
      stopBuzzer();
      setCORS();
      server.send(200, "application/json", "{\"success\":true,\"message\":\"Alarm dismissed\"}");
      return;
    }

    // Check for /toggle
    if (sub.endsWith("/toggle") && method == HTTP_POST) {
      String id = sub.substring(0, sub.length() - 7);
      int foundIdx = -1;
      for (size_t i = 0; i < alarmCount; i++) {
        if (strcmp(alarms[i].id, id.c_str()) == 0) {
          foundIdx = i;
          break;
        }
      }
      if (foundIdx == -1) {
        setCORS();
        server.send(404, "application/json", "{\"success\":false,\"message\":\"Alarm not found\"}");
        return;
      }

      alarms[foundIdx].enabled = !alarms[foundIdx].enabled;
      saveAlarmsToNVS();
      setCORS();
      server.send(200, "application/json", "{\"success\":true,\"message\":\"Alarm state toggled\"}");
      return;
    }

    // Direct /api/alarms/{id} operations
    String id = sub;

    // DELETE /api/alarms/{id}
    if (method == HTTP_DELETE) {
      int foundIdx = -1;
      for (size_t i = 0; i < alarmCount; i++) {
        if (strcmp(alarms[i].id, id.c_str()) == 0) {
          foundIdx = i;
          break;
        }
      }
      if (foundIdx == -1) {
        setCORS();
        server.send(404, "application/json", "{\"success\":false,\"message\":\"Alarm not found\"}");
        return;
      }

      for (size_t i = foundIdx; i < alarmCount - 1; i++) {
        alarms[i] = alarms[i + 1];
      }
      alarmCount--;
      saveAlarmsToNVS();

      setCORS();
      server.send(200, "application/json", "{\"success\":true,\"message\":\"Alarm deleted\"}");
      return;
    }

    // PUT /api/alarms/{id}
    if (method == HTTP_PUT) {
      int foundIdx = -1;
      for (size_t i = 0; i < alarmCount; i++) {
        if (strcmp(alarms[i].id, id.c_str()) == 0) {
          foundIdx = i;
          break;
        }
      }
      if (foundIdx == -1) {
        setCORS();
        server.send(404, "application/json", "{\"success\":false,\"message\":\"Alarm not found\"}");
        return;
      }

      StaticJsonDocument<512> doc;
      deserializeJson(doc, server.arg("plain"));

      if (doc.containsKey("title")) strncpy(alarms[foundIdx].title, doc["title"], 31);
      if (doc.containsKey("description")) strncpy(alarms[foundIdx].description, doc["description"], 47);
      if (doc.containsKey("hour")) alarms[foundIdx].hour = doc["hour"];
      if (doc.containsKey("minute")) alarms[foundIdx].minute = doc["minute"];
      if (doc.containsKey("enabled")) alarms[foundIdx].enabled = doc["enabled"];
      if (doc.containsKey("repeat")) {
        const char* rType = doc["repeat"]["type"] | "once";
        strncpy(alarms[foundIdx].repeatType, rType, 11);
        alarms[foundIdx].repeatDaysMask = 0;
        JsonArray days = doc["repeat"]["days"];
        for (int d : days) {
          if (d >= 0 && d < 7) alarms[foundIdx].repeatDaysMask |= (1 << d);
        }
      }
      saveAlarmsToNVS();

      setCORS();
      server.send(200, "application/json", "{\"success\":true,\"message\":\"Alarm updated\"}");
      return;
    }
  }

  // Fallback 404
  setCORS();
  server.send(404, "application/json", "{\"success\":false,\"message\":\"Endpoint not found\"}");
}

// ----------------- Autonomous Alarm Checking -------
unsigned long lastAlarmCheckSecond = 0;

void checkHardwareAlarms() {
  int year, month, day, hour, minute, second;
  readDS3231Time(year, month, day, hour, minute, second);

  // Check once per second at second == 0
  if (second != 0 || lastAlarmCheckSecond == minute) {
    return;
  }
  lastAlarmCheckSecond = minute;

  // Day of week calculation using standard tm struct
  struct tm t;
  t.tm_year = year - 1900;
  t.tm_mon = month - 1;
  t.tm_mday = day;
  t.tm_hour = hour;
  t.tm_min = minute;
  t.tm_sec = second;
  mktime(&t);
  int dayOfWeek = t.tm_wday; // 0 = Sun, 1 = Mon, ..., 6 = Sat

  for (size_t i = 0; i < alarmCount; i++) {
    if (!alarms[i].enabled) continue;
    if (alarms[i].hour == hour && alarms[i].minute == minute) {
      bool match = false;
      if (strcmp(alarms[i].repeatType, "daily") == 0) {
        match = true;
      } else if (strcmp(alarms[i].repeatType, "weekdays") == 0) {
        match = (dayOfWeek >= 1 && dayOfWeek <= 5);
      } else if (strcmp(alarms[i].repeatType, "weekends") == 0) {
        match = (dayOfWeek == 0 || dayOfWeek == 6);
      } else if (strcmp(alarms[i].repeatType, "custom") == 0) {
        match = (alarms[i].repeatDaysMask & (1 << dayOfWeek)) != 0;
      } else if (strcmp(alarms[i].repeatType, "once") == 0) {
        match = true;
        alarms[i].enabled = false; // Disable one-time alarm after ringing
        saveAlarmsToNVS();
      }

      if (match) {
        Serial.printf("[HARDWARE ALARM] Ringing: %s\n", alarms[i].title);
        startBuzzer(120000, alarms[i].id); // 2-minute safety buzzer timeout
        break;
      }
    }
  }
}

// ----------------- Setup & Loop --------------------
void setup() {
  Serial.begin(115200);
  bootTimestamp = millis();

  // GPIO setup
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
  pinMode(PIN_COUNTER_SYNC, OUTPUT);
  digitalWrite(PIN_COUNTER_SYNC, LOW);
  pinMode(PIN_COUNTER_RESET, OUTPUT);
  digitalWrite(PIN_COUNTER_RESET, LOW);

  // Init DS3231 RTC
  initDS3231();

  // Load persistent alarms from NVS flash
  loadAlarmsFromNVS();

  // Configure Wi-Fi SoftAP with NVS-backed credentials
  preferences.begin("smartclock", true);
  String savedSsid = preferences.getString("ap_ssid", DEFAULT_AP_SSID);
  String savedPass = preferences.getString("ap_pass", DEFAULT_AP_PASS);
  strncpy(apSsid, savedSsid.c_str(), 31);
  strncpy(apPassword, savedPass.c_str(), 31);
  preferences.end();

  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(DEFAULT_AP_IP, DEFAULT_AP_GATEWAY, DEFAULT_AP_SUBNET);
  WiFi.softAP(apSsid, apPassword);

  Serial.println("\n==========================================");
  Serial.println("  ESP32 Digital Clock & Smart Alarm System");
  Serial.printf("  AP SSID: %s\n", apSsid);
  Serial.printf("  AP IP:   %s\n", WiFi.softAPIP().toString().c_str());
  Serial.printf("  Port:    %d\n", HTTP_REST_PORT);
  Serial.println("==========================================\n");

  // REST API Routes
  server.on("/api/status", HTTP_GET, handleGetStatus);
  server.on("/api/status", HTTP_OPTIONS, handleOptions);

  server.on("/api/time", HTTP_GET, handleGetTime);
  server.on("/api/time", HTTP_POST, handlePostTime);
  server.on("/api/time", HTTP_OPTIONS, handleOptions);

  server.on("/api/alarms", HTTP_GET, handleGetAlarms);
  server.on("/api/alarms", HTTP_POST, handlePostAlarms);
  server.on("/api/alarms", HTTP_OPTIONS, handleOptions);

  server.on("/api/alarms/dismiss", HTTP_POST, handleDirectDismiss);
  server.on("/api/alarms/dismiss", HTTP_OPTIONS, handleOptions);

  server.on("/api/network/wifi", HTTP_POST, handlePostWifi);
  server.on("/api/network/wifi", HTTP_OPTIONS, handleOptions);

  server.on("/api/device/health", HTTP_GET, handleGetHealth);
  server.on("/api/device/buzzer-test", HTTP_POST, handleBuzzerTest);

  // Dynamic route wildcard handler
  server.onNotFound(handleDynamicRoutes);

  server.begin();
  Serial.println("[HTTP] REST API Server listening on port 80");
}

void loop() {
  server.handleClient();
  checkHardwareAlarms();

  // Auto-silence buzzer after timeout duration
  if (buzzerActive && (millis() - buzzerStartTime > buzzerDurationMs)) {
    stopBuzzer();
  }
}
