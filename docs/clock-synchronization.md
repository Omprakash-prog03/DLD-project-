# Real-Time Clock (DS3231) & Time Synchronization Guide

## 1. Synchronization Architecture
The mobile phone provides atomic, network-synchronized reference time (via NTP / Cellular network). The ESP32 transfers this reference time into the DS3231 hardware RTC via I2C, updating the CD4518 digital counters.

```
+---------------+        BLE / Wi-Fi         +---------------+       I2C (0x68)       +---------------+
|  Mobile Phone | ------------------------> | ESP32-WROOM-32| ---------------------> |  DS3231 RTC   |
| (NTP Master)  | <------------------------ | Microcntrller | <--------------------- |  (Hardware)   |
+---------------+       ACK & Drift         +---------------+       Readback BCD     +---------------+
                                                   |
                                                   v GPIO 26 Pulse (via 74HCT245)
                                            +----------------------------------------+
                                            | CD4518 Counters & 7-Segment Displays   |
                                            +----------------------------------------+
```

---

## 2. Synchronization Step-by-Step Sequence
1. **Pre-Flight Validation:** Mobile app verifies device connection and queries `GET_RTC_STATUS`.
2. **Snapshot Reference Time:** App captures high-precision local UTC time and local offset (e.g. `2026-11-14T21:30:00+05:30`).
3. **Dispatch `SET_CLOCK_TIME`:** Sent with sub-second transmission compensation.
4. **Firmware Reception & BCD Encoding:**
   - ESP32 extracts Year, Month, Day, Hour, Minute, Second.
   - Values are converted to BCD: `val_bcd = ((val / 10) << 4) | (val % 10)`.
5. **I2C Write to DS3231:**
   - Registers `0x00` (Seconds), `0x01` (Minutes), `0x02` (Hours 24-hr mode), `0x03` (Day of week), `0x04` (Date), `0x05` (Century/Month), `0x06` (Year).
6. **Hardware Counter Re-alignment:**
   - GPIO 27 (Counter Reset) is pulsed HIGH for $10\mu s$ to reset CD4518 BCD displays to 00:00:00.
   - GPIO 26 (Counter Sync) pulses the required number of clock ticks to bring displays into exact match with current time.
7. **Readback Verification:** ESP32 reads registers back from DS3231 to verify parity.
8. **Confirmation Response:** ESP32 returns `"success": true` with confirmed timestamp.
