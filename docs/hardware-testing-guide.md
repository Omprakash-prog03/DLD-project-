# Hardware Testing & Bench Verification Guide

## 1. Safety & Pre-Power Verification
Before applying 5V mains power to the digital clock circuit:

1. **Multimeter Continuity Check:**
   - Verify GND plane continuity between ESP32 GND, DS3231 GND, 74HCT245 GND, and CD4518 GND.
   - Verify NO continuity between +5.0V rail and +3.3V rail.
2. **Voltage Level Verification:**
   - Power the 5V rail.
   - Measure 3.3V regulator output with a DMM: must read $3.25\text{V} - 3.35\text{V}$.
   - Verify 3.3V on DS3231 $V_{CC}$ pin and I2C pullup resistors.
3. **74HCT245 Pin Voltage Check:**
   - Measure pin 20 ($V_{CC}$): $5.0\text{V} \pm 0.25\text{V}$.
   - Measure pin 1 (DIR): $5.0\text{V}$ (HIGH).
   - Measure pin 19 (/OE): $0.0\text{V}$ (GND).
   - Ensure NO pin on Port B connects back to ESP32 inputs.

---

## 2. Functional Test Matrix

| Step | Subsystem | Action | Expected Physical Result | Pass/Fail Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **T01** | Power | Connect 5V 2A USB power | ESP32 Power LED on; displays show 00:00:00 | Regulated 3.3V stable |
| **T02** | DS3231 I2C | ESP32 boot log check | `[RTC] DS3231 detected at 0x68` in Serial monitor | I2C ACK received |
| **T03** | 1Hz SQW | Check GPIO 34 with oscilloscope | 1.000 Hz square wave, 50% duty, 3.3V peak | PPS pulse verified |
| **T04** | Display Step | Wait 60 seconds | Seconds counters increment cleanly from 00 to 59 | No ghosting or flicker |
| **T05** | Buzzer PWM | Trigger `/api/device/buzzer-test` | 200 ms audible 2.4 kHz beep | Crisp tone, no distortion |
| **T06** | Mobile BLE Sync | Send `SYNC_CLOCK` from Mobile App | Mobile time transferred to DS3231; displays update | Clock matches phone within 200ms |
| **T07** | Alarm Ring | Create alarm for current minute + 1 | At 00 seconds, buzzer sounds for 120s | Autonomous ring verified |
| **T08** | Physical Snooze | Press GPIO 33 button while ringing | Buzzer stops; snoozed for 5 minutes | Hardware button responsive |
| **T09** | Power Outage | Disconnect 5V power for 5 minutes | Displays go dark; on reconnect, time is accurate | DS3231 CR2032 backup confirmed |
