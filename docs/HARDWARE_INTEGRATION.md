# Hardware Integration & Circuit Architecture Guide

This document details the physical electrical wiring, component selection, voltage level shifting, and digital logic integration for the **ESP32 Digital Clock & Smart Alarm System**.

---

## 1. System Block Diagram

```
       +-------------------------------------------------------------+
       |                         POWER SUPPLY                        |
       |                5.0V DC Main Rail (2A Supply)                |
       |             3.3V LDO Regulator (AMS1117 / On-board)         |
       +-------------------------------------------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v                                                         v
   [ 3.3V Domain ]                                           [ 5.0V Domain ]
+----------------------+                               +------------------------+
|   ESP32-WROOM-32     |                               |   CD4518 Dual BCD      |
|                      |                               |   Synchronous Counters |
|   - Wi-Fi AP & REST  |                               +------------------------+
|   - NVS Alarm Flash  |                                           |
|   - Web Control      |                                           v
+----------------------+                               +------------------------+
         |     |                                       |   74HC08 / 74HC32      |
     I2C |     | PWM (GPIO 25)                         |   Reset & Modulo Logic |
   (3.3V)|     v                                       +------------------------+
         |   [ 2N2222 Driver ]                                     |
         |         |                                               v
         |         v                                   +------------------------+
         |     ( Piezo Buzzer )                        |   CD4511 BCD Decoders  |
         |                                             +------------------------+
         v                                                         |
+----------------------+                                           v
|    DS3231 RTC Module |  1Hz SQW PPS Pulse            +------------------------+
|  (Authoritative Time)| ----------------------------> | 6x Common-Cathode      |
|  Address: 0x68       |   (Level Shifted to 5V)       | 7-Segment LED Displays |
+----------------------+                               +------------------------+
```

---

## 2. Component Bill of Materials (BOM)

| Component | Part / Model | Quantity | Operating Voltage | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| Microcontroller | ESP32-WROOM-32 DevKit | 1 | 3.3V | Wi-Fi REST API, alarm scheduling, control |
| Real-Time Clock | DS3231 RTC Module | 1 | 3.3V / 5V | High-precision TCXO timekeeper (CR2032 backup) |
| Astable Timer | NE555 Timer IC | 1 | 5V | Hardware 1Hz display clock fallback |
| BCD Counters | CD4518 Dual BCD Counter | 3 | 5V | Seconds, Minutes, Hours counting |
| AND Gates | 74HC08 Quad 2-Input AND | 1 | 5V | Modulo-60 and Modulo-24 counter reset logic |
| OR Gates | 74HC32 Quad 2-Input OR | 1 | 5V | Reset pulse combinational logic |
| Inverters | 74HC04 Hex Inverter | 1 | 5V | Signal inversion and counter clock edge selection |
| Display Drivers | CD4511 BCD to 7-Segment | 6 | 5V | Latched 7-segment display decoding |
| Displays | Common-Cathode 7-Segment | 6 | 5V | HH:MM:SS numerical readouts |
| Transistor | 2N2222 NPN BJT | 1 | 5V | Piezo buzzer low-side switch |
| Buzzer | 5V Active / Passive Piezo | 1 | 5V | Audible hardware wake-up alarm |
| Level Shifter | 74HCT245 or TXS0108E | 1-2 | 3.3V / 5.0V | Bidirectional level translation |

---

## 3. Voltage Level Shifting Architecture (CRITICAL)

The ESP32 is **NOT 5V tolerant**. Maximum permissible voltage on any GPIO pin is **3.6V**.

### Rules for Safe Interfacing:
1. **DS3231 I2C Bus:**
   - Power the DS3231 module from **3.3V** (`VCC = 3.3V`).
   - Use 4.7kΩ pull-up resistors to the **3.3V rail** on GPIO 21 (SDA) and GPIO 22 (SCL).
   - If using a pre-assembled DS3231 breakout board, ensure the onboard battery charging diode is disabled (or use a rechargeable LIR2032 cell).

2. **Counter Sync Pulse (ESP32 -> CD4518):**
   - The ESP32 outputs a 3.3V pulse on GPIO 26 to reset or synchronize the CD4518 counters.
   - While CD4518 CMOS logic powered at 5V has a high-level input threshold $V_{IH} \approx 3.5V$, standard 3.3V output may sit near the threshold boundary.
   - **Recommended Solution:** Route GPIO 26 through a **74HCT series buffer** (e.g., 74HCT08 or 74HCT245) powered at 5V. 74HCT inputs treat any signal $> 2.0V$ as logic HIGH and output a full 5.0V signal.

3. **DS3231 1Hz Square-Wave (SQW) -> CD4518 Clock:**
   - The DS3231 SQW pin is open-drain. Pull it up to 5.0V with a 4.7kΩ resistor so it directly clocks the 5V CD4518 BCD counters with clean, crystal-accurate 1-second pulses.

---

## 4. Buzzer Driver Circuit

```
            +5V Rail
               |
               +---------------+
               |               |
             [ + ]             |
          Piezo Buzzer     1N4148 Diode
             [ - ]          (Flyback)
               |               |
               +---------------+
               |
               | Collector
         +-----+
  1kΩ    |   2N2222
GPIO 25 -+-/\/\/-| Base
                 |
                 | Emitter
                 v
                GND
```

- When GPIO 25 is driven with 2.4kHz PWM from the ESP32 LEDC peripheral, the transistor turns on and off rapidly, driving high volume into the 5V buzzer without overloading the ESP32 GPIO pin.

---

## 5. Single Source of Truth Synchronization Strategy

To prevent drift between the software time, the DS3231 RTC, and the digital logic counter display:

1. **Authoritative Master:** The DS3231 hardware RTC maintains time with ±2 ppm accuracy (approx. 1 minute per year).
2. **Display Counters:** The CD4518 BCD counters receive their clock directly from the DS3231's 1Hz SQW output.
3. **Resynchronization:** When time is set via the website:
   - ESP32 writes new time registers to DS3231 via I2C.
   - ESP32 generates a momentary reset pulse on GPIO 26 to align the CD4518 BCD counters to the exact target second.
   - Website reflects confirmed readback from DS3231.

---

## 6. Pinout Mapping Table

| ESP32 GPIO | Function | Connected Peripheral | Electrical Type |
| :--- | :--- | :--- | :--- |
| **GPIO 21** | I2C SDA | DS3231 SDA | 3.3V Bidirectional (4.7kΩ pullup) |
| **GPIO 22** | I2C SCL | DS3231 SCL | 3.3V Bidirectional (4.7kΩ pullup) |
| **GPIO 25** | LEDC PWM | 2N2222 Buzzer Base | 3.3V Output (1kΩ series resistor) |
| **GPIO 26** | Counter Sync | CD4518 Reset Line | 3.3V Output (Via 74HCT buffer to 5V) |
| **GPIO 34** | PPS Interrupt | DS3231 SQW Output | 3.3V Input (Only if monitoring SQW) |
| **3V3** | Power Output | DS3231 VCC | 3.3V Power |
| **GND** | Ground | Common Ground | 0V Common Reference |
| **VIN / 5V** | Power Input | Main 5V Rail | 5V DC Supply |
