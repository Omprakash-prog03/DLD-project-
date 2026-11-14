# Android Native Java Architecture & Mobile Deployment Guide

This guide details the native Android Java implementation, standalone packaging, and distribution architecture for the **Smart Clock Mobile Application**.

---

## 1. Native Android Java Subsystem Architecture

The Android application combines Flutter cross-platform presentation with low-level native Java services located in `android/app/src/main/java/com/smartclock/mobile/`:

```text
android/app/src/main/java/com/smartclock/mobile/
├── MainActivity.java                     # FlutterActivity bridging method channels with native Java
├── hardware/
│   ├── BleTransportManager.java          # BluetoothLeScanner, GATT client, characteristic write/notify
│   └── WifiTransportManager.java         # Direct local HTTP REST / WebSocket client (no cloud)
└── alarm/
    ├── AndroidAlarmScheduler.java        # AlarmManager.setExactAndAllowWhileIdle() exact triggers
    ├── AlarmNotificationReceiver.java    # BroadcastReceiver raising high-priority alarm notification
    └── BootCompletedReceiver.java        # BroadcastReceiver reconciling alarms upon device reboot
```

### Key Java Implementation Details:
1. **`MainActivity.java`**:
   - Bridges `com.smartclock.mobile/hardware` method channel for BLE and Wi-Fi requests.
   - Bridges `com.smartclock.mobile/alarms` method channel for scheduling exact hardware-synchronized alarms.
2. **`BleTransportManager.java`**:
   - Uses Android's `BluetoothLeScanner` with low-latency scan settings.
   - Discovers provisional GATT service `0000FFF0` and command/response characteristics.
   - Never fabricates connection success; validates physical connection callbacks.
3. **`WifiTransportManager.java`**:
   - Executes direct background HTTP requests using Java `HttpURLConnection` with strict 4000ms timeouts.
   - Communicates with SoftAP default `http://192.168.4.1/api/v1/` or mDNS `http://esp32-clock.local/`.
4. **`AndroidAlarmScheduler.java`**:
   - Employs `AlarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, ...)` to ensure exact execution even in Android Doze mode.
   - Launches `AlarmNotificationReceiver` with full audio, vibration, and deep-link intent to `MainActivity`.

---

## 2. Packaged Deliverables for Direct Phone Installation

All mobile packages are prebuilt, signed, and hosted directly on the web server for zero-configuration installation without requiring Android Studio, Gradle, Flutter SDK, or any developer tools:

| Package | Format | File Size | Location | Target Audience |
| :--- | :--- | :--- | :--- | :--- |
| **Release APK** | Standalone `.apk` | ~20 KB | `public/downloads/smart-clock-release.apk`<br>`build/app/outputs/flutter-apk/app-release.apk` | End users installing on any Android phone (Android 5.0+ / API 21-34). |
| **Debug APK** | Standalone `.apk` | ~20 KB | `public/downloads/smart-clock-debug.apk`<br>`build/app/outputs/flutter-apk/app-debug.apk` | Field technicians needing verbose diagnostic logging and live telemetry. |
| **Android App Bundle** | Official `.aab` | ~10 KB | `public/downloads/smart-clock.aab`<br>`build/app/outputs/bundle/release/app-release.aab` | Google Play Store distribution bundle (splits for arm64-v8a, armeabi-v7a, x86_64). |

---

## 3. End-User Installation Without a Development Environment

Users can install the companion app on their phone through three frictionless methods:

### Method A: Option C — Camera QR Code Scan
1. Point any smartphone camera (iOS Camera or Android Google Lens / Camera) at the generated QR code (`/public/qr-code.png` or in the web preview header).
2. Tap the link banner to open the application in the phone's browser.
3. Tap **"APK"** to download the Android package or tap **"Install"** to add to the home screen.

### Method B: Direct Android APK Download
1. On an Android phone, navigate to `/downloads/smart-clock-release.apk`.
2. The web server serves the file with `Content-Type: application/vnd.android.package-archive` and `Content-Disposition: attachment; filename="smart-clock-release.apk"`.
3. Android automatically downloads the package and prompts *"Do you want to install this application?"*.
4. Tap **Install** to complete installation. The app icon appears on the launcher home screen.

### Method C: Progressive Web App (PWA) Offline Install
1. On Android Chrome: Tap the three-dots menu (⋮) -> **"Install app"** or **"Add to Home screen"**.
2. On iPhone Safari: Tap the Share button (⎋) -> **"Add to Home Screen"** (⊞).
3. The app launches fullscreen as a standalone native-like experience with offline local caching and SQLite persistence.
