# Hardware Integration & Electrical Circuit Architecture Guide

This document details the physical electrical wiring, component selection, voltage level shifting, and digital logic integration for the **ESP32 Digital Clock & Smart Alarm System**.

---

## 1. System Block Diagram & Power Domains

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
| Real-Time Clock | DS3231 RTC Module | 1 | 3.3V | High-precision TCXO timekeeper (CR2032 backup) |
| Astable Timer | NE555 Timer IC | 1 | 5V | Hardware 1Hz display clock fallback |
| BCD Counters | CD4518 Dual BCD Counter | 3 | 5V | Seconds, Minutes, Hours counting |
| AND Gates | 74HC08 Quad 2-Input AND | 1 | 5V | Modulo-60 and Modulo-24 counter reset logic |
| OR Gates | 74HC32 Quad 2-Input OR | 1 | 5V | Reset pulse combinational logic |
| Inverters | 74HC04 Hex Inverter | 1 | 5V | Signal inversion and counter clock edge selection |
| Display Drivers | CD4511 BCD to 7-Segment | 6 | 5V | Latched 7-segment display decoding |
| Displays | Common-Cathode 7-Segment | 6 | 5V | HH:MM:SS numerical readouts |
| Transistor | 2N2222 NPN BJT | 1 | 5V | Piezo buzzer low-side switch |
| Buzzer | 5V Active / Passive Piezo | 1 | 5V | Audible hardware wake-up alarm |
| Level Shifter | 74HCT245 Octal Transceiver | 1 | 5.0V VCC | 3.3V -> 5.0V Unidirectional Level Shifter |

---

## 3. Voltage Level Shifting Architecture & 74HCT245 Analysis (CRITICAL)

The ESP32 microcontroller is **NOT 5V tolerant**. The absolute maximum rating on any ESP32 GPIO pin is **$V_{DD} + 0.3V = 3.6V$**. Exceeding 3.6V on any GPIO will permanently degrade or destroy the internal protection diodes and I/O buffer transistors.

### 3.1 Detailed Analysis of the 74HCT245
The 74HCT245 is an Octal Bus Transceiver featuring TTL-compatible inputs.

```
                  74HCT245 DIP-20 Pinout
                 +----------------------+
          DIR -- | 1   [DIR]   [VCC] 20 | -- +5.0V Rail
    (ESP32) A1 -- | 2    [A1]    [B1] 19 | -- /OE (Tie to GND)
    (ESP32) A2 -- | 3    [A2]    [B2] 18 | -- (5V Logic) B1 (Sync to CD4518)
    (ESP32) A3 -- | 4    [A3]    [B3] 17 | -- (5V Logic) B2 (Reset to CD4518)
            A4 -- | 5    [A4]    [B4] 16 | -- B4
            A5 -- | 6    [A5]    [B5] 15 | -- B5
            A6 -- | 7    [A6]    [B6] 14 | -- B6
            A7 -- | 8    [A7]    [B7] 13 | -- B7
            A8 -- | 9    [A8]    [B8] 12 | -- B8
           GND -- | 10   [GND]   [B8] 11 |
                 +----------------------+
```

#### Direction (DIR) and Output Enable ($\overline{\text{OE}}$) Configuration:
To shift 3.3V ESP32 outputs up to 5.0V CMOS logic:
- **$\overline{\text{OE}}$ (Pin 19):** Must be tied directly to **GND (LOW)** to keep outputs continuously enabled.
- **DIR (Pin 1):** Must be tied to **+5.0V (HIGH)** to enforce transmission exclusively from **Port A (Inputs) to Port B (Outputs)**.

| $\overline{\text{OE}}$ | DIR | Operation | Safe for ESP32? |
| :---: | :---: | :--- | :--- |
| **LOW (GND)** | **HIGH (+5V)** | **Port A (3.3V Inputs) $\rightarrow$ Port B (5.0V Outputs)** | **YES: Safe & Correct** |
| LOW (GND) | LOW (GND) | Port B (5.0V Inputs) $\rightarrow$ Port A (Outputs to ESP32) | **DANGEROUS: Destroys ESP32!** |
| HIGH (+5V) | X | Isolation (High Impedance / Tri-state) | Safe but no signal transmitted |

#### Input Voltage Compatibility ($V_{IH} / V_{IL}$):
- The 74HCT series operates with TTL input levels:
  - $V_{IH\text{ (min)}} = 2.0\text{ V}$
  - $V_{IL\text{ (max)}} = 0.8\text{ V}$
- The ESP32 3.3V GPIO produces:
  - $V_{OH} \approx 3.0\text{ V} - 3.3\text{ V}$ (which safely exceeds the 2.0V threshold for a guaranteed logic HIGH).
  - $V_{OL} \le 0.4\text{ V}$ (which safely sits below the 0.8V threshold for a guaranteed logic LOW).
- **Output on Port B:** Delivered at full $V_{OH} \approx 4.5\text{ V} - 4.9\text{ V}$, which easily meets the $V_{IH\text{ (min)}} \approx 3.5\text{ V}$ requirement of the 5.0V CD4518 and 74HC logic gates!

#### Why the 74HCT245 Cannot Solve Bidirectional or Reverse Shifting:
If a signal needs to travel from a 5V CMOS device (e.g. CD4518 counter carry output) back into an ESP32 GPIO:
- The 74HCT245 **CANNOT** be reversed ($B \rightarrow A$). When powered at $V_{CC} = 5.0\text{ V}$, its Port A outputs will drive $\approx 4.8\text{ V}$, immediately violating the ESP32's 3.6V maximum rating.
- **Solution for 5V to 3.3V Inputs into ESP32:**
  Use a passive resistive divider:
  ```
  5V Logic Signal ----[ 2.2kΩ ]----+----> ESP32 GPIO (Input)
                                   |
                                [ 3.3kΩ ]
                                   |
                                  GND
  ```
  $V_{\text{ESP32}} = 5.0\text{ V} \times \frac{3.3\text{ k}\Omega}{2.2\text{ k}\Omega + 3.3\text{ k}\Omega} = 3.0\text{ V}$ (Safe logic HIGH, within 3.3V limits).

---

### 3.2 DS3231 RTC Module Connection
- Power the DS3231 module from **3.3V** (`VCC = 3.3V`).
- Pull up `SDA` (GPIO 21) and `SCL` (GPIO 22) with 4.7kΩ resistors to **3.3V**.
- Because both the ESP32 and DS3231 operate at 3.3V on the I2C bus, no level shifter is needed on the I2C lines.
- **Battery Safety:** Ensure any onboard diode charging circuit intended for rechargeable LIR2032 cells is disconnected if using standard non-rechargeable CR2032 lithium coin cells.

---

## 4. Hardware Buzzer Driver Circuit

```
                    +5.0V DC Rail
                          |
            +-------------+-------------+
            |                           |
            |                         [ | ] 1N4148 Diode
        [ + ] (Positive)              [ | ] (Flyback clamp)
      Piezo Buzzer                      |
        [ - ] (Negative)                |
            |                           |
            +-------------+-------------+
                          |
                          | Collector
                     +----+
      1.0kΩ          |   2N2222 NPN Transistor
ESP32 GPIO 25 -------+-/\/\/-| Base
                             |
                             | Emitter
                             v
                            GND
```

### Circuit Specifications:
- **Transistor:** 2N2222 (or 2N3904) NPN general-purpose BJT.
- **Base Resistor:** 1.0kΩ limits base current from ESP32 GPIO 25 to $\approx \frac{3.3\text{V} - 0.7\text{V}}{1000\Omega} = 2.6\text{ mA}$, protecting the ESP32 I/O pad while saturating the transistor ($h_{FE} \ge 30$).
- **Flyback Diode:** 1N4148 protects the transistor from inductive voltage spikes generated by electromagnetic buzzers.
- **Modulation:** Driven by ESP32 hardware LEDC PWM at 2.4 kHz (50% duty cycle) for maximum acoustic resonance.

---

## 5. Single Source of Truth Synchronization Strategy

```
  [ DS3231 RTC Module ]
  (Battery-backed, ±2ppm TCXO)
         |
         | 1.000 Hz SQW (Open Drain)
         v
  [ 4.7kΩ Pull-up to 5V ]
         |
         v
  [ CD4518 BCD Seconds Counter CLK ]
         |
         | BCD Count & 74HC Logic Modulo-60
         v
  [ CD4511 Decoders & 7-Segment Displays ]
         ^
         |
  [ ESP32 GPIO 26 ] ---> [ 74HCT245 Buffer ] ---> [ CD4518 Counter Reset/Sync ]
```

1. **Master Timekeeper:** The DS3231 RTC is the sole authoritative clock.
2. **Display Counters:** The CD4518 BCD counters receive their clock directly from the DS3231 1Hz SQW output.
3. **Synchronization Action:** When new time is submitted via the web control panel:
   - The ESP32 writes the validated date/time into the DS3231 registers via I2C.
   - The ESP32 immediately pulses GPIO 26 (through the 74HCT245 buffer) to reset the CD4518 counters to the target second.
   - The web app reads back and displays the confirmed DS3231 time.

---

## 6. Configurable Pinout Mapping Table

All pin assignments are defined in `firmware/esp32_smart_alarm/hardware_config.h` and `src/config/deviceConfig.ts`.

| ESP32 GPIO | Pin Function | Target Peripheral | Direction | Electrical Domain |
| :--- | :--- | :--- | :--- | :--- |
| **GPIO 21** | I2C SDA | DS3231 SDA | Bidirectional | 3.3V (4.7kΩ pull-up to 3.3V) |
| **GPIO 22** | I2C SCL | DS3231 SCL | Bidirectional | 3.3V (4.7kΩ pull-up to 3.3V) |
| **GPIO 25** | LEDC PWM | 2N2222 Buzzer Driver | Output | 3.3V (1kΩ base resistor) |
| **GPIO 26** | Counter Sync | 74HCT245 Pin 2 (A1) | Output | 3.3V Output $\rightarrow$ 5.0V B1 Output |
| **GPIO 27** | Counter Reset | 74HCT245 Pin 3 (A2) | Output | 3.3V Output $\rightarrow$ 5.0V B2 Output |
| **GPIO 34** | PPS Monitor | DS3231 SQW | Input-only | 3.3V Input (Must NOT exceed 3.3V!) |
| **3V3** | 3.3V Power | DS3231 VCC | Power | 3.3V Supply |
| **GND** | System Ground | Common Ground | Reference | 0.0V Ground |
| **5V / VIN** | 5.0V Power | 74HCT245, CD4518, Displays | Power | 5.0V DC Main Rail |

---

## 7. Hardware Troubleshooting Guide

1. **DS3231 Not Detected (`0x68 not responding`):**
   - Check if `VCC` is supplied with 3.3V.
   - Confirm 4.7kΩ pull-up resistors are installed between SDA $\rightarrow$ 3.3V and SCL $\rightarrow$ 3.3V.
   - Run the diagnostics tab in the web interface to view the live I2C bus scan.

2. **Displays Desynchronized from RTC Time:**
   - Verify that the DS3231 SQW pin is enabled for 1Hz output.
   - Check that the 74HCT245 $\overline{\text{OE}}$ pin is connected to GND and DIR is connected to +5V.
   - Tap **"Calibrate RTC"** on the Clock Settings page to issue a resynchronization pulse.

3. **Weak or Distorted Buzzer Sound:**
   - Ensure the buzzer is powered from the 5V rail rather than the ESP32 3.3V rail.
   - Check that the flyback diode (1N4148) is installed in reverse bias across the buzzer terminals.
