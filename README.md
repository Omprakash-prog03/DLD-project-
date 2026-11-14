# SMART CLOCK — PRODUCTION MOBILE APPLICATION & HARDWARE COMPANION

A modern, high-contrast, production-grade mobile application companion to a physical Digital Logic Clock built using discrete digital ICs (CD4518 BCD counters, 74HCT245 level shifters, CD4511 display decoders), a DS3231 high-precision real-time clock (RTC), and an ESP32-WROOM-32 microcontroller.

Built with **Flutter & Dart**, featuring a **Clean Architecture** with strict feature separation, **Riverpod** state management, **GoRouter** declarative navigation, **Drift (SQLite)** persistent offline data caching, and a pluggable hardware communication abstraction layer supporting **Bluetooth Low Energy (GATT)**, **Local Wi-Fi (REST / SoftAP)**, and an isolated **Mock Hardware Adapter** for development and automated testing.

---

## 🎨 Visual Design Language & Inspiration

The mobile application's visual architecture is directly adapted from a premium fitness tracker aesthetic:
- **Canvas & Surface Palette:** Near-black `#111111` canvas with dark surface cards (`#1E1E1E`, `#2A2A2A`) and high-contrast white cards (`#FFFFFF`).
- **Brand Accents:** Bold Red-Orange (`#E84B2F`) for the primary hero time card, active alarms, and CTAs; Deep Blue (`#3B5BDB`) for device status and secondary actions; Muted Red (`#8B2A1A`) for depth and inactive indicators.
- **Typography:** Inter sans-serif with dramatic weight contrasts: 88–96sp bold display numbers for the hero clock, 36–40sp bold numbers for dual metrics, and clean sans-serif body typography.
- **Card Styling:** Fully rounded corners (24dp radius), full-bleed solid color blocks, zero drop shadows (separation achieved purely through color contrast).
- **Custom Drum Time Picker (C08):** High-precision mechanical scroll wheel with an active red-orange highlighted overlay strip, avoiding generic OS time dialogs.
- **Dedicated 5-Tab Navigation (C11):** 72dp dark navigation bar featuring Home, Calendar, Alarms, Device, and Settings.

---

## 🏗️ Mobile Software Architecture

The application implements Clean Architecture with strict separation of concerns across domain, data, presentation, and hardware transport layers:

```
lib/
├── core/
│   ├── constants/
│   │   └── hardware_config_constants.dart   # Centralized BLE UUIDs, Wi-Fi endpoints & timeouts
│   ├── database/
│   │   └── app_database.dart                # Drift SQLite persistent local data storage
│   ├── di/
│   │   └── providers.dart                   # Riverpod dependency injection providers
│   ├── errors/
│   │   └── app_exceptions.dart              # Standardized exception & error hierarchy
│   ├── router/
│   │   └── app_router.dart                  # GoRouter configuration with ShellRoute & nested routes
│   └── theme/
│       ├── app_colors.dart                  # Design system color palette
│       ├── app_spacing.dart                 # Spacing, padding & corner radii constants
│       ├── app_theme.dart                   # Material 3 dark theme definition
│       └── app_typography.dart              # Typography scale & weight definitions
├── features/
│   ├── alarms/                              # Autonomous hardware alarm management
│   │   ├── data/alarm_repository.dart
│   │   ├── domain/alarm_model.dart
│   │   └── presentation/                    # List, Create, Edit, Details screens
│   ├── calendar/                            # Software-only calendar & agenda engine
│   │   ├── data/calendar_repository.dart
│   │   ├── domain/calendar_event_model.dart
│   │   └── presentation/                    # Month, Week, Agenda, Create/Edit screens
│   ├── clock/                               # Dedicated DS3231 RTC clock control & sync
│   │   └── presentation/clock_detail_screen.dart
│   ├── dashboard/                           # Home dashboard (Hero time, dual metrics, quick actions)
│   │   └── presentation/dashboard_screen.dart
│   ├── device/                              # Device dashboard, BLE discovery, pairing & diagnostics
│   │   ├── data/device_repository.dart
│   │   ├── domain/device_model.dart
│   │   └── presentation/                    # Dashboard, Discovery, Pairing, Diagnostics
│   ├── reminders/                           # Software-only task notifications
│   │   ├── data/reminder_repository.dart
│   │   ├── domain/reminder_model.dart
│   │   └── presentation/
│   └── settings/                            # Theme, time format & hardware transport configuration
│       └── presentation/
├── hardware/
│   ├── adapters/
│   │   ├── ble_adapter.dart                 # Production flutter_blue_plus BLE GATT adapter
│   │   ├── mock_hardware_adapter.dart       # Development & automated test simulation adapter
│   │   └── wifi_adapter.dart                # Local Wi-Fi HTTP REST transport adapter
│   ├── interfaces/
│   │   └── hardware_transport_adapter.dart  # Abstract transport contract
│   ├── manager/
│   │   ├── device_state_manager.dart        # Hardware state monitoring & polling
│   │   ├── hardware_communication_manager.dart # Central transport switcher & command queue
│   │   └── synchronization_engine.dart      # Clock & alarm synchronization state machine
│   └── protocol/
│       ├── command_registry.dart            # Command catalog & validation
│       ├── hardware_command.dart            # Standard JSON protocol request model
│       └── hardware_response.dart           # Standard JSON protocol response model
├── shared/
│   └── widgets/                             # Reusable Component Library (C01–C13)
│       ├── alarm_card.dart                  # C01
│       ├── app_bar_back.dart                # C12 (40dp circular back button)
│       ├── bottom_nav_bar.dart              # C11 (72dp 5-tab bar)
│       ├── confirmation_dialog.dart         # Custom dialogs
│       ├── custom_chip.dart                 # C07
│       ├── device_status_indicator.dart     # C09
│       ├── drum_time_picker.dart            # C08
│       ├── empty_state_view.dart            # Empty states
│       ├── error_state_view.dart            # Error states
│       ├── event_card.dart                  # C02
│       ├── mock_mode_banner.dart            # Persistent yellow banner for mock testing
│       ├── offline_banner.dart              # Offline indicator banner
│       ├── primary_button.dart              # C05 (56dp Red-Orange)
│       ├── reminder_card.dart               # C03
│       ├── secondary_button.dart            # C06 (56dp Dark Elevated)
│       ├── section_header.dart              # C10
│       ├── settings_row.dart                # C04
│       ├── skeleton_loader.dart             # Shimmer skeleton loader
│       └── sync_status_badge.dart           # C13 (Synced, Pending, Failed, Local Only, Offline)
└── main.dart                                # Application entry point
```

---

## 🔌 Hardware Architecture & Subsystems

The mobile app controls a physical embedded circuit comprised of:
1. **ESP32-WROOM-32 Microcontroller:** Dual-core Xtensa 240MHz, Bluetooth LE 4.2, 802.11 b/g/n Wi-Fi, and NVS flash for persistent alarm storage.
2. **DS3231 Real-Time Clock Module (0x68):** TCXO temperature-compensated crystal with $\pm 2\text{ ppm}$ precision and CR2032 battery backup.
3. **CD4518 Dual Synchronous BCD Counters:** Powered in the 5.0V domain, cascaded for seconds, minutes, and hours.
4. **74HCT245 Octal Level Shifter:** Direction pin hardwired to HIGH ($V_{CC} = 5.0V$), $/OE = GND$. Converts 3.3V GPIO sync and reset pulses from the ESP32 to 5.0V CMOS logic levels safely without back-feeding 5V into the ESP32.
5. **CD4511 BCD-to-7-Segment Decoders:** Drive 6 common-cathode red LED displays.
6. **Hardware Buzzer Circuit:** 2N2222 NPN transistor driven by ESP32 LEDC PWM on GPIO 25 at 2.4 kHz resonant frequency with automatic 120-second safety cutoff.

---

## 📡 Firmware Communication Protocol (v1)

All requests and responses use a strict, versioned JSON frame:

### Command Request Frame:
```json
{
  "protocol_version": 1,
  "request_id": "req-550e8400-e29b-41d4-a716-446655440000",
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

### Hardware Response Frame:
```json
{
  "protocol_version": 1,
  "request_id": "req-550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "synced_time": "2026-11-14T21:30:00+05:30",
    "ds3231_ack": true,
    "counters_reset": true
  },
  "error": null,
  "timestamp": "2026-11-14T21:30:00+05:30"
}
```

---

## 📚 Technical Documentation Catalog

Comprehensive firmware and electrical specifications are located in `docs/`:
- `docs/hardware-architecture.md` — Physical circuit wiring, BOM, 3.3V/5V isolation rules, and pin registry.
- `docs/communication-protocol.md` — Wire frames, JSON schemas, and command lifecycle.
- `docs/ble-specification.md` — GATT 128-bit UUID registry, MTU 512 negotiation, characteristics.
- `docs/wifi-api-specification.md` — SoftAP (`192.168.4.1`) & Station REST endpoints.
- `docs/command-reference.md` — Complete schema, timeouts, and validation rules for all 21 commands.
- `docs/alarm-data-model.md` — Repeat days bitmasks, NVS storage schema, and sync state machine.
- `docs/clock-synchronization.md` — DS3231 BCD conversion, NTP master time, and pulse synchronization.
- `docs/error-codes.md` — Error catalog (1000–3999) with recovery workflows.
- `docs/firmware-integration-guide.md` — Arduino / ESP-IDF C++ code templates and checklist.
- `docs/hardware-testing-guide.md` — Pre-power multimeter checks and 9-step bench test matrix.

---

## 🧪 Automated Testing

Unit and integration tests are located in `test/`:
- `test/alarm_validation_test.dart` — Alarm bounds, 12H/24H formatting, repeat bitmask calculations, and JSON serialization.
- `test/protocol_serialization_test.dart` — Protocol version 1 frame verification and response error parsing.
- `test/time_conversion_test.dart` — Decimal-to-BCD conversion for DS3231 registers and leap-year validations.
- `test/mock_hardware_adapter_test.dart` — End-to-end device discovery, connection transitions, command execution, and simulated RTC drift.
- `test/synchronization_engine_test.dart` — Clock and alarm synchronization, acknowledgement handling, and offline queue mapping.

To execute tests with Flutter:
```bash
flutter test
```

---

## 🚀 Android Build & Deployment Guide

### Prerequisites
- Flutter SDK 3.16+
- Android Studio with Android SDK API Level 34
- JDK 17

### 1. Build Debug APK (Local Testing)
```bash
flutter build apk --debug
```
The output APK is generated at: `build/app/outputs/flutter-apk/app-debug.apk`.

### 2. Build Release APK
```bash
flutter build apk --release
```
The optimized, shrink-wrapped APK is generated at: `build/app/outputs/flutter-apk/app-release.apk`.

### 3. Build Android App Bundle (AAB for Google Play Store)
```bash
flutter build appbundle --release
```
The bundle is generated at: `build/app/outputs/bundle/release/app-release.aab`.

### 4. Release Signing Instructions
Create `android/key.properties`:
```properties
storePassword=<keystore-password>
keyPassword=<key-password>
keyAlias=smartclock-key
storeFile=/path/to/keystore/upload-keystore.jks
```

---

## 📱 Interactive Mobile Simulator (Live Preview)

The project includes an interactive web emulator for testing the mobile UI on any browser:
```bash
npm install
npm run dev
```
Preview the mobile companion in your browser at `http://localhost:5173`. Toggle between Mock Mode and ESP32 Hardware mode directly from the top simulator bar!
