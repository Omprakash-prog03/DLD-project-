# Alarm Data Model & Synchronization Engine

## 1. Domain Model Definition
Alarms configure the autonomous hardware alert system on the ESP32 and DS3231. The clock must fire the buzzer even when the phone is turned off, disconnected, or kilometers away.

```
+---------------------------------------------------------------+
|                       ALARM ENTITY                            |
+---------------------------------------------------------------+
| id: String (UUIDv4)                                           |
| label: String (Max 32 chars)                                  |
| hour: Int (0 - 23)                                            |
| minute: Int (0 - 59)                                          |
| repeatDays: List<Int> (0 = Sun, 1 = Mon ... 6 = Sat)          |
| isEnabled: Boolean                                            |
| isOneTime: Boolean                                            |
| snoozeEnabled: Boolean                                        |
| snoozeDuration: Int (Minutes: 5, 10, 15, 30)                  |
| syncStatus: AlarmSyncStatus (LOCAL, PENDING, SYNCED, FAILED)  |
| lastSyncTimestamp: DateTime?                                  |
| createdAt: DateTime                                           |
| updatedAt: DateTime                                           |
+---------------------------------------------------------------+
```

---

## 2. Weekday Convention & Bitmask
To conserve memory and bandwidth, repeat days use a unified standard:
- `0`: Sunday (Bit 0, `0x01`)
- `1`: Monday (Bit 1, `0x02`)
- `2`: Tuesday (Bit 2, `0x04`)
- `3`: Wednesday (Bit 3, `0x08`)
- `4`: Thursday (Bit 4, `0x10`)
- `5`: Friday (Bit 5, `0x20`)
- `6`: Saturday (Bit 6, `0x40`)

### Bitmask Representation
$$\text{Mask} = \sum_{d \in \text{repeat\_days}} 2^d$$
- Weekdays (Mon-Fri) = `0x3E` ($2+4+8+16+32 = 62$)
- Weekends (Sat-Sun) = `0x41` ($1+64 = 65$)
- Daily (All 7 days) = `0x7F` ($127$)

---

## 3. Synchronization State Machine
Every alarm in the mobile database transitions through deterministic states:

```
                  +-------------------------+
                  |  User Creates / Edits   |
                  +-------------------------+
                               |
                               v
                     +-------------------+
                     |  Saved as PENDING |
                     +-------------------+
                               |
            +------------------+------------------+
            | Device Connected                    | Device Offline
            v                                     v
  +--------------------+                 +--------------------+
  |    SYNCHRONIZING   |                 |    LOCAL_ONLY      |
  +--------------------+                 | (Queued in SQLite) |
     |              |                    +--------------------+
     | Success      | Timeout / Error               |
     v              v                               | Reconnect
+------------+  +------------+                      |
| SYNCHRONIZED|  |   FAILED   |<--------------------+
+------------+  +------------+
```

### State Definitions
1. **LOCAL_ONLY:** Created while device is disconnected. Ready in queue.
2. **PENDING:** Queued for transmission across transport.
3. **SYNCHRONIZING:** Actively being transmitted; waiting for ESP32 acknowledgement.
4. **SYNCHRONIZED:** Explicitly confirmed and committed to ESP32 NVS flash.
5. **FAILED:** Firmware rejected configuration or communication timed out.
6. **DEVICE_OFFLINE:** Displayed when device disconnected after sync.
