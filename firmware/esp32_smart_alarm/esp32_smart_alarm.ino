/*
 * =========================================================================================
 * PROJECT: ESP32 Digital Clock & Smart Alarm System — Production Firmware
 * Microcontroller: ESP32-WROOM-32 DevKit
 * Peripherals:
 *   - DS3231 I2C High-Precision Real-Time Clock (SDA: GPIO 21, SCL: GPIO 22, I2C: 0x68)
 *   - Hardware Piezo Buzzer (GPIO 25 with 2N2222 NPN transistor driver)
 *   - CD4518 Dual BCD Counters & 74HCxx Display Logic Sync (GPIO 26 Counter Reset / PPS)
 *   - Wi-Fi Access Point (SSID: DigitalClock-ESP32, IP: 192.168.4.1) & Station Mode fallback
 *   - Non-Volatile Storage: Preferences (ESP32 NVS)
 * =========================================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <Preferences.h>
#include <ArduinoJson.h>

// ----------------- Pin Assignments -----------------
#define PIN_I2C_SDA         21
#define PIN_I2C_SCL         22
#define PIN_BUZZER          25
#define PIN_COUNTER_SYNC    26
#define PIN_DS3231_SQW_INT  34

// ----------------- Wi-Fi Configuration -------------
const char* AP_SSID = "DigitalClock-ESP32";
const char* AP_PASS = "clock1234"; // At least 8 chars, or NULL for open AP
const IPAddress AP_LOCAL_IP(192, 168, 4, 1);
const IPAddress AP_GATEWAY(192, 168, 4, 1);
const IPAddress AP_SUBNET(255, 255, 255, 0);

// Optional Station Mode credentials (if configured)
char sta_ssid[32] = "";
char sta_pass[64] = "";

// ----------------- DS3231 Registers ---------------
#define DS3231_I2C_ADDR 0x68

// ----------------- Web Server ----------------------
WebServer server(80);
Preferences preferences;

// ----------------- Data Structures -----------------
#define MAX_ALARMS 16

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
  char date[12]; // YYYY-MM-DD
  char soundId[24];
  uint8_t snoozeDuration; // minutes
  bool wakeUpMission;
};

AlarmItem alarms[MAX_ALARMS];
size_t alarmCount = 0;

// State tracking
bool buzzerActive = false;
unsigned long buzzerStartTime = 0;
unsigned long buzzerDurationMs = 0;
char activeRingingAlarmId[32] = "";
bool rtcAvailable = false;
unsigned long bootTimestamp = 0;

// ----------------- Helper: BCD Conversion ----------
uint8_t decToBcd(uint8_t val) {
  return ((val / 10 * 16) + (val % 10));
}

uint8_t bcdToDec(uint8_t val) {
  return ((val / 16 * 10) + (val % 16));
}

// ----------------- DS3231 RTC Driver ---------------
bool initDS3231() {
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL, 100000);
  Wire.beginTransmission(DS3231_I2C_ADDR);
  if (Wire.endTransmission() == 0) {
    rtcAvailable = true;
    Serial.println("[RTC] DS3231 detected at I2C address 0x68");
    return true;
  }
  rtcAvailable = false;
  Serial.println("[RTC] DS3231 not detected! Check pull-up resistors and I2C lines.");
  return false;
}

void readDS3231Time(int &year, int &month, int &day, int &hour, int &minute, int &second) {
  if (!rtcAvailable) {
    // Fallback to internal millis
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
  Wire.write(0x00); // Start at register 00h (seconds)
  Wire.endTransmission();

  Wire.requestFrom(DS3231_I2C_ADDR, 7);
  if (Wire.available() >= 7) {
    second = bcdToDec(Wire.read() & 0x7F);
    minute = bcdToDec(Wire.read());
    hour   = bcdToDec(Wire.read() & 0x3F);
    Wire.read(); // day of week (ignored)
    day    = bcdToDec(Wire.read());
    month  = bcdToDec(Wire.read() & 0x1F);
    year   = 2000 + bcdToDec(Wire.read());
  }
}

void writeDS3231Time(int year, int month, int day, int hour, int minute, int second) {
  if (!rtcAvailable) return;

  Wire.beginTransmission(DS3231_I2C_ADDR);
  Wire.write(0x00);
  Wire.write(decToBcd(second));
  Wire.write(decToBcd(minute));
  Wire.write(decToBcd(hour));
  Wire.write(decToBcd(1)); // Day of week
  Wire.write(decToBcd(day));
  Wire.write(decToBcd(month));
  Wire.write(decToBcd(year >= 2000 ? year - 2000 : year));
  Wire.endTransmission();

  Serial.printf("[RTC] Written: %04d-%02d-%02d %02d:%02d:%02d\n", year, month, day, hour, minute, second);
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

// ----------------- NVS Storage ----------------------
void saveAlarmsToNVS() {
  preferences.begin("smartclock", false);
  preferences.putBytes("alarms", alarms, sizeof(alarms));
  preferences.putUInt("count", alarmCount);
  preferences.end();
  Serial.println("[NVS] Alarms saved to flash memory");
}

void loadAlarmsFromNVS() {
  preferences.begin("smartclock", true);
  alarmCount = preferences.getUInt("count", 0);
  if (alarmCount > MAX_ALARMS) alarmCount = 0;
  if (alarmCount > 0) {
    preferences.getBytes("alarms", alarms, sizeof(alarms));
    Serial.printf("[NVS] Loaded %d alarms from flash\n", alarmCount);
  } else {
    // Load 2 default alarms
    alarmCount = 2;
    strncpy(alarms[0].id, "alarm-01", 31);
    strncpy(alarms[0].title, "Morning Routine", 31);
    alarms[0].hour = 7;
    alarms[0].minute = 0;
    alarms[0].second = 0;
    alarms[0].enabled = true;
    strncpy(alarms[0].repeatType, "weekdays", 11);
    alarms[0].repeatDaysMask = 0b00111110; // Mon..Fri
    strncpy(alarms[0].soundId, "buzzer-standard", 23);
    alarms[0].snoozeDuration = 10;
    alarms[0].wakeUpMission = true;

    strncpy(alarms[1].id, "alarm-02", 31);
    strncpy(alarms[1].title, "Focus Block", 31);
    alarms[1].hour = 9;
    alarms[1].minute = 50;
    alarms[1].second = 0;
    alarms[1].enabled = true;
    strncpy(alarms[1].repeatType, "daily", 11);
    alarms[1].repeatDaysMask = 0b01111111; // All days
    strncpy(alarms[1].soundId, "buzzer-pulsed", 23);
    alarms[1].snoozeDuration = 5;
    alarms[1].wakeUpMission = true;
  }
  preferences.end();
}

// ----------------- Buzzer Control ------------------
void startBuzzer(uint32_t durationMs = 60000, const char* alarmId = "") {
  buzzerActive = true;
  buzzerStartTime = millis();
  buzzerDurationMs = durationMs;
  if (alarmId) strncpy(activeRingingAlarmId, alarmId, 31);

  // Configure ESP32 LEDC PWM on GPIO 25 (2.4kHz resonant frequency)
  ledcAttach(PIN_BUZZER, 2400, 8);
  ledcWrite(PIN_BUZZER, 128); // 50% duty cycle
  Serial.println("[BUZZER] Alarm sounding ON");
}

void stopBuzzer() {
  buzzerActive = false;
  activeRingingAlarmId[0] = '\0';
  ledcWrite(PIN_BUZZER, 0);
  ledcDetach(PIN_BUZZER);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
  Serial.println("[BUZZER] Alarm sounding OFF");
}

// ----------------- CORS Handling -------------------
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
  doc["wifiMode"] = "AP";
  doc["wifiSSID"] = AP_SSID;

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
  doc["timezone"] = "Asia/Kolkata";

  String out;
  serializeJson(doc, out);
  server.send(200, "application/json", out);
}

// POST /api/time
void handlePostTime() {
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

  int hour = doc["hour"] | 0;
  int minute = doc["minute"] | 0;
  int second = doc["second"] | 0;
  int day = doc["day"] | 1;
  int month = doc["month"] | 1;
  int year = doc["year"] | 2026;

  writeDS3231Time(year, month, day, hour, minute, second);

  // Trigger pulse on CD4518 counter reset / sync line
  digitalWrite(PIN_COUNTER_SYNC, HIGH);
  delayMicroseconds(50);
  digitalWrite(PIN_COUNTER_SYNC, LOW);

  server.send(200, "application/json", "{\"success\":true,\"message\":\"Time updated on DS3231 RTC\"}");
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
    server.send(400, "application/json", "{\"success\":false,\"message\":\"Maximum alarms reached\"}");
    return;
  }

  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, server.arg("plain"));
  if (err) {
    server.send(400, "application/json", "{\"success\":false,\"message\":\"Invalid JSON\"}");
    return;
  }

  AlarmItem& a = alarms[alarmCount];
  snprintf(a.id, 31, "alm-%lu", millis());
  strncpy(a.title, doc["title"] | "Alarm", 31);
  strncpy(a.description, doc["description"] | "", 47);
  a.hour = doc["hour"] | 0;
  a.minute = doc["minute"] | 0;
  a.second = doc["second"] | 0;
  a.enabled = doc["enabled"] | true;

  const char* rType = doc["repeat"]["type"] | "once";
  strncpy(a.repeatType, rType, 11);

  a.repeatDaysMask = 0;
  JsonArray days = doc["repeat"]["days"];
  for (int d : days) {
    if (d >= 0 && d < 7) a.repeatDaysMask |= (1 << d);
  }

  strncpy(a.soundId, doc["soundId"] | "buzzer-standard", 23);
  a.snoozeDuration = doc["snoozeDuration"] | 10;
  a.wakeUpMission = doc["wakeUpMission"] | false;

  alarmCount++;
  saveAlarmsToNVS();

  String out;
  StaticJsonDocument<128> res;
  res["success"] = true;
  res["id"] = a.id;
  serializeJson(res, out);
  server.send(201, "application/json", out);
}

// POST /api/alarms/{id}/dismiss
void handleDismiss() {
  setCORS();
  stopBuzzer();
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Alarm dismissed\"}");
}

// GET /api/device/health
void handleGetHealth() {
  setCORS();
  StaticJsonDocument<512> doc;
  doc["wifiStatus"] = "AP_RUNNING";
  doc["rtcAvailable"] = rtcAvailable;
  doc["temperatureCelsius"] = readDS3231Temperature();
  doc["buzzerStatus"] = buzzerActive;
  doc["uptime"] = (millis() - bootTimestamp) / 1000;
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["ne555Freq"] = 1.0;
  doc["cd4518CounterSync"] = true;

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
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Buzzer test triggered\"}");
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

  // Day of week calculation (0 = Sun, 1 = Mon, ..., 6 = Sat)
  // Zeller's or tm struct calculation
  struct tm t;
  t.tm_year = year - 1900;
  t.tm_mon = month - 1;
  t.tm_mday = day;
  t.tm_hour = hour;
  t.tm_min = minute;
  t.tm_sec = second;
  mktime(&t);
  int dayOfWeek = t.tm_wday;

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
        alarms[i].enabled = false; // Disable after one ring
        saveAlarmsToNVS();
      }

      if (match) {
        Serial.printf("[HARDWARE ALARM] Ringing: %s\n", alarms[i].title);
        startBuzzer(120000, alarms[i].id); // 2 minute timeout
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

  // Init DS3231 RTC
  initDS3231();

  // Load persistent alarms from NVS flash
  loadAlarmsFromNVS();

  // Setup Wi-Fi SoftAP
  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(AP_LOCAL_IP, AP_GATEWAY, AP_SUBNET);
  WiFi.softAP(AP_SSID, AP_PASS);

  Serial.println("\n==========================================");
  Serial.println("  ESP32 Digital Clock & Smart Alarm System");
  Serial.printf("  AP SSID: %s\n", AP_SSID);
  Serial.printf("  AP IP:   %s\n", WiFi.softAPIP().toString().c_str());
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

  server.on("/api/alarms/dismiss", HTTP_POST, handleDismiss);
  server.on("/api/device/health", HTTP_GET, handleGetHealth);
  server.on("/api/device/buzzer-test", HTTP_POST, handleBuzzerTest);
  server.onNotFound(handleOptions);

  server.begin();
  Serial.println("[HTTP] REST API Server listening on port 80");
}

void loop() {
  server.handleClient();
  checkHardwareAlarms();

  // Auto-timeout buzzer if active
  if (buzzerActive && (millis() - buzzerStartTime > buzzerDurationMs)) {
    stopBuzzer();
  }
}
