# Hardware Architecture & System Integration Specification

## 1. Executive Summary & Overview
The **Smart Digital Clock & Smart Alarm System** is a hybrid embedded system combining discrete digital logic, high-precision RTC timing, and an ESP32-WROOM-32 microcontroller. The mobile application operates as the primary user interface and configuration master, while the ESP32 acts as the embedded control bridge and autonomous alarm executor.

This document details the hardware architecture, physical subsystems, electrical voltage domains, level shifting interfaces, and pin assignments.

---

## 2. System Hardware Subsystems

```
+-----------------------------------------------------------------------------------+
|                                  POWER RAIL DOMAINS                               |
|                     5.0V DC Main Rail (2A Wall Adapter / Regulated)               |
|                     3.3V LDO Output (AMS1117-3.3V or On-Board ESP32 LDO)          |
+-----------------------------------------------------------------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                                                   |
        v (3.3V Logic & Power)                                              v (5.0V Logic & Power)
+---------------------------------------+                   +----------------------------------+
|          ESP32-WROOM-32 DevKit        |                   |      CD4518 Dual BCD Counters    |
| - Tensilica Xtensa Dual-Core 240MHz   |                   | - Cascaded Hours, Minutes, Secs  |
| - Bluetooth LE 4.2 / Wi-Fi 802.11 bgn |                   +----------------------------------+
| - NVS Flash Persistent Storage        |                                    |
| - Hardware LEDC PWM Buzzer Driver     |                                    v (BCD 4-bit)
+---------------------------------------+                   +----------------------------------+
   |             |            |                             |   74HC08 / 74HC32 Gate Logic     |
   | I2C (3.3V)  |            |                             | - Modulo 60 / 24 Reset Gates     |
   | SDA: 21     |            |                             +----------------------------------+
   | SCL: 22     |            |                                              |
   v             |            |                                              v (BCD 4-bit)
+-------------+  |            | Pulse Sync                  +----------------------------------+
| DS3231 RTC  |  |            | GPIO 26, 27                 |   CD4511 BCD-to-7-Segment Driver |
| High Accel  |  |            | (Via 74HCT245               | - 6x Decoders for HH:MM:SS       |
| TCXO Crystal|  |            |  3.3V -> 5.0V Buffer)       +----------------------------------+
| 0x68 (3.3V) |  |            v                                              |
+-------------+  |   +-------------------+                                   v
   |             |   |  74HCT245 Buffer  |                  +----------------------------------+
   | 1Hz SQW     |   |  DIR=HIGH /OE=GND |                  |    6x Common-Cathode 7-Segment   |
   | (PPS Clock) |   +-------------------+                  |    LED Displays (Red 0.56")      |
   +-------------+----------------------------------------> +----------------------------------+
                 |
                 v GPIO 25 (LEDC PWM)
         +-------------------+
         | 2N2222 Transistor | ---> [ Piezo Buzzer 5V Resonant @ 2.4kHz ]
         +-------------------+
```

---

## 3. Voltage Domain Separation & Level Shifting Rules

### 3.1 Strict 3.3V vs 5.0V Isolation
1. **ESP32 Absolute Maximum GPIO Voltage:** **3.6V**. Connecting 5.0V logic directly to any ESP32 GPIO causes irreversible silicon degradation or immediate latch-up.
2. **DS3231 Module:** Powered exclusively from the **3.3V rail**. I2C bus pull-up resistors (4.7kΩ) must pull up to 3.3V.
3. **CD4518 / CD4511 / Discrete Logic:** Powered at **5.0V** to ensure optimal LED drive current and clean logic threshold margins for common-cathode 7-segment displays.
4. **74HCT245 Bus Transceiver:**
   - Powered at **5.0V**.
   - Input pins (Port A) are TTL-compatible: high threshold $V_{IH} = 2.0V$, which is safely driven by the ESP32 3.3V output ($V_{OH} \approx 3.0V$).
   - Output pins (Port B) output true 5.0V CMOS/TTL levels into the CD4518 counters.
   - `DIR` pin wired permanently to **HIGH** ($V_{CC} = 5.0V$).
   - `\OE` (Output Enable) wired permanently to **LOW** (GND).
   - **CRITICAL SAFETY DIRECTIVE:** Direction must NEVER be reversed. Port B must never transmit back to ESP32 Port A without bidirectional voltage clamps.

---

## 4. Pin Assignment Registry

| ESP32 Pin | Function | Logic Level | Direction | Connected Subsystem | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GPIO 21** | I2C SDA | 3.3V | Bidirectional | DS3231 RTC Module | 4.7kΩ Pull-up to 3.3V |
| **GPIO 22** | I2C SCL | 3.3V | Output | DS3231 RTC Module | 4.7kΩ Pull-up to 3.3V, 100 kHz bus |
| **GPIO 25** | LEDC PWM Buzzer | 3.3V | Output | 2N2222 NPN Base | 1kΩ base resistor; drives 5V Piezo |
| **GPIO 26** | Counter Clock Sync | 3.3V -> 5V | Output | CD4518 Clock Pin via 74HCT245 | Pulse injected to step display |
| **GPIO 27** | Counter Hardware Reset | 3.3V -> 5V | Output | CD4518 Reset Line via 74HCT245 | Resets display counters to 00:00:00 |
| **GPIO 34** | DS3231 SQW 1Hz PPS | 3.3V | Input (Only) | DS3231 SQW Pin | Configured as 1Hz interrupt input |
| **GPIO 32** | Status Indicator LED | 3.3V | Output | Onboard Blue LED | Blinks during BLE/WiFi sync |
| **GPIO 33** | Hardware Alarm Button | 3.3V | Input (Pullup) | Momentary Push Button | Physical snooze/dismiss button |

---

## 5. Buzzer Circuit Specification
- **Driver:** 2N2222 NPN BJT in common-emitter configuration.
- **Base Resistor:** $1\text{ k}\Omega$, ensuring $I_B \approx \frac{3.3V - 0.7V}{1000\Omega} = 2.6\text{ mA}$, driving the transistor into deep saturation ($V_{CE(sat)} < 0.2V$).
- **Collector Load:** 5V Passive Piezo Transducer with a 1N4148 flyback diode in parallel (cathode to +5V, anode to collector) to suppress inductive voltage spikes.
- **Modulation:** ESP32 LEDC PWM channel 0, frequency = 2400 Hz (piezo resonance peak), 50% duty cycle (128 / 255).
- **Auto-Silence Safety:** Hard timeout of 120 seconds in firmware to prevent battery exhaustion or noise hazard if the user is absent.

---

## 6. Real-Time Clock (DS3231) Interface
- **I2C Address:** `0x68`.
- **Clock Bus Speed:** 100 kHz standard mode.
- **TCXO (Temperature-Compensated Crystal Oscillator):** $\pm 2\text{ ppm}$ accuracy from 0°C to +40°C ($\approx 1\text{ minute/year}$ drift).
- **Battery Backup:** CR2032 3V Coin Cell ensures continuous timekeeping during mains power outages.
- **SQW Interrupt:** Generates an accurate 1.000 Hz square wave to synchronize second transitions.
