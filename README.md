# Digital Clock & Smart Alarm — ESP32 Web Control System

A minimalist, responsive web application and firmware system designed as the central control panel for an **ESP32-based Digital Clock & Smart Alarm System** featuring a **DS3231 I2C real-time clock**, **CD4518 BCD counters**, **74HC logic gates**, and an audible piezo buzzer.

Designed with an Apple-inspired editorial aesthetic matching the reference storyboard: warm neutral tones, restrained typography, a signature mechanical scrolling time picker, and an interactive **"Clean Entire Field"** wake-up game.

---

## 📸 Key Features & Interactions

1. **Dual Operational Modes:**
   - **Mode A — Simulation Mode:** Fully autonomous without hardware! Runs an in-browser software clock, handles alarm creation/editing/scheduling, simulates buzzer audio via the Web Audio API, supports hardware fault injection, and persists data in `localStorage`.
   - **Mode B — Hardware Mode:** Seamlessly connects over Wi-Fi to the ESP32 REST API (Access Point or Station mode) with zero frontend rewrites.

2. **Signature Mechanical Time Picker:**
   - Dual vertical scroll wheels for Hours and Minutes.
   - Distinctive intersecting curved background treatment (hourglass / dual-lens aesthetic).
   - Centered active numbers in deep black (`#171717`) with fading surrounding digits.
   - Tactile audio feedback (subtle mechanical haptic clicks) as numbers scroll.
   - Integrated quick controls for **Sound**, **Snooze**, and **Repeat**.

3. **Interactive Wake-Up Mission: "Clean Entire Field":**
   - Circular progress gauge with rotating mechanical indicator hands and yellow progress arc.
   - Real-time elapsed timer (`00:19` / `02:00` limit).
   - Interactive dot matrix field where the user navigates a glowing yellow dot to clear dots and stop the alarm buzzer.
   - Victory confetti celebration!

4. **Authoritative Clock Synchronization:**
   - Single source of truth centered on the DS3231 high-precision I2C RTC.
   - Synchronize browser time to hardware with one tap.
   - Read and calibrate hardware RTC registers.
   - CD4518 BCD counter sync pulse generator on GPIO 26.

5. **Aesthetic & Theme:**
   - Editorial presentation layout with desktop phone-frame presentation + full responsive mobile view.
   - Warm neutral palette: Light Warm Grey (`#E8E7E1`), Secondary Surface (`#F2F1EC`), Text (`#171717`), Accent Yellow (`#E9D82C`).
   - Industrial Dark Mode toggle (`#171715` / `#22221F`).

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React, Canvas-Confetti
- **State Management:** Zustand with persistent browser storage
- **Audio Synthesis:** Web Audio API (tactile wheel clicks + 2.4kHz piezo buzzer patterns)
- **Firmware:** ESP32 Arduino C++, WebServer, ArduinoJson, Wire (I2C), Preferences (NVS)

---

## 🚀 Quick Start

### 1. Install & Run Web Control Panel
```bash
# Clone the repository
git clone https://github.com/Omprakash-prog03/DLD-project-.git
cd DLD-project-

# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Build for Production
```bash
npm run build
npm run preview
```

### 3. Flash ESP32 Firmware
1. Open `firmware/esp32_smart_alarm/esp32_smart_alarm.ino` in the Arduino IDE or PlatformIO.
2. Select board: **ESP32 Dev Module**.
3. Install libraries: `ArduinoJson` (v6 or v7).
4. Flash over USB to your ESP32-WROOM-32 board.
5. Connect your phone or laptop to the Wi-Fi network `DigitalClock-ESP32` (password: `clock1234`).
6. In the web application, switch to **Hardware Mode** and connect to `192.168.4.1`.

---

## 📁 Repository Structure

```
.
├── src/
│   ├── types/
│   │   └── index.ts                 # Type-safe data models (Alarm, ClockTime, DeviceStatus)
│   ├── services/
│   │   ├── audio/
│   │   │   └── buzzerAudio.ts       # Web Audio API piezo buzzer & tactile wheel clicks
│   │   └── device/
│   │       ├── deviceService.ts     # Common abstraction layer (Simulation vs Hardware)
│   │       ├── simulatedDevice.ts   # Standalone simulation engine
│   │       └── hardwareDevice.ts    # ESP32 HTTP REST API client
│   ├── store/
│   │   └── useAppStore.ts           # Central Zustand store & 1-second alarm ticker
│   ├── utils/
│   │   └── timeCalculations.ts      # 12h/24h formatting, next alarm countdown calculations
│   ├── components/
│   │   ├── common/
│   │   │   ├── EditorialLayout.tsx  # Editorial 3-column layout matching reference artwork
│   │   │   ├── PhoneFrame.tsx       # iOS frame with Dynamic Island & Navigation
│   │   │   ├── StatusBar.tsx        # Top status bar with time & hardware badge
│   │   │   └── NavigationBar.tsx    # Bottom navigation bar
│   │   ├── clock/
│   │   │   ├── DigitalClock.tsx     # Large digital clock with time source badge
│   │   │   └── TimelineBar.tsx      # 24-hour tick marks & scheduled alarm markers
│   │   ├── timePicker/
│   │   │   └── MechanicalTimePicker.tsx # Signature curved scroll wheel time picker
│   │   ├── alarms/
│   │   │   ├── AlarmCard.tsx        # Alarm entry with toggle & quick test
│   │   │   ├── AlarmList.tsx        # Active & disabled alarm library
│   │   │   ├── AlarmRingingModal.tsx# Alarm trigger modal with snooze & dismiss
│   │   │   └── WakeUpGame.tsx       # "Clean Entire Field" interactive mission
│   │   └── settings/
│   │       ├── ClockSettingsView.tsx    # Manual time register configuration & sync
│   │       ├── DeviceConnectionView.tsx # ESP32 IP, Wi-Fi AP info & ping latency
│   │       ├── DiagnosticsView.tsx      # I2C telemetry, gate status & fault simulator
│   │       └── AppSettingsView.tsx      # Theme & layout preferences
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── firmware/
│   └── esp32_smart_alarm/
│       └── esp32_smart_alarm.ino    # Complete ESP32 REST server & DS3231 driver
├── docs/
│   ├── API_DOCUMENTATION.md         # Full REST API specification with JSON examples
│   ├── HARDWARE_INTEGRATION.md      # Circuit schematic, level shifting & pinouts
│   └── DEPLOYMENT.md                # Vercel/Netlify hosting & network guide
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## ⚡ Acceptance Criteria Verification

- [x] **Website operates without ESP32:** Simulation mode starts immediately, keeping time and saving alarms in `localStorage`.
- [x] **Software clock runs accurately:** 1-second ticks update the large digital clock, date, and timeline needle.
- [x] **Manual time adjustment:** Dedicated clock configuration screen with validation and confirmation dialogs.
- [x] **Full alarm management:** Create, edit, toggle, delete, and view alarms.
- [x] **Repeat scheduling:** Support for Once, Daily, Weekdays, Weekends, and Custom day selection.
- [x] **Persistent alarms:** Stored in browser storage and ESP32 NVS flash.
- [x] **Signature Mechanical Time Picker:** Authentic curved intersecting layout with drag, scroll wheel, and haptic audio clicks.
- [x] **Wake-Up Mission Game:** Interactive "Clean Entire Field" dot grid game with circular timer gauge and confetti.
- [x] **Hardware communication abstraction:** Clean `IDeviceService` interface decoupling UI from network protocols.
- [x] **Hardware Mode & REST API:** Complete ESP32 firmware implementing all endpoints with CORS.
- [x] **Independent alarm triggering:** Hardware checks alarms and sounds buzzer autonomously.
- [x] **Comprehensive documentation:** API contract, hardware integration notes, and deployment instructions included.
