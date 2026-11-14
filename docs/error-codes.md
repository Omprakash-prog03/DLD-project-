# Error Codes & Troubleshooting Reference

## 1. System Error Code Catalog

### 1.1 Transport & Connection Errors (1000–1999)
| Code | Constant Name | Description | Recovery Strategy |
| :--- | :--- | :--- | :--- |
| `ERR_1001` | `BLE_ADAPTER_DISABLED` | Bluetooth adapter is turned off on mobile device | Prompt user to enable Bluetooth in settings |
| `ERR_1002` | `BLE_PERMISSION_DENIED` | Missing `BLUETOOTH_SCAN` or `BLUETOOTH_CONNECT` permissions | Request runtime permissions with explanation |
| `ERR_1003` | `DEVICE_DISCOVERY_TIMEOUT` | No ESP32 advertisement detected within 15 seconds | Verify ESP32 power, ensure device is in range |
| `ERR_1004` | `BLE_GATT_CONNECT_FAILED` | GATT connection failed or peripheral disconnected | Retry connection with exponential backoff |
| `ERR_1005` | `BLE_SERVICE_NOT_FOUND` | Custom Smart Clock Service UUID not found on device | Check firmware version on ESP32 |
| `ERR_1010` | `WIFI_UNREACHABLE` | HTTP request to ESP32 IP timed out | Verify Wi-Fi network connection (AP or LAN) |
| `ERR_1011` | `WIFI_NETWORK_CHANGED` | Phone switched network during command transmission | Re-verify IP and reconnect socket |

### 1.2 Protocol & Command Errors (2000–2999)
| Code | Constant Name | Description | Recovery Strategy |
| :--- | :--- | :--- | :--- |
| `ERR_2001` | `PROTOCOL_VERSION_MISMATCH` | ESP32 firmware protocol version does not match app | Update firmware or application |
| `ERR_2002` | `INVALID_JSON_PAYLOAD` | Command payload failed JSON parsing | Check serialization logic |
| `ERR_2003` | `UNKNOWN_COMMAND` | Command not supported by current firmware build | Query `GET_SUPPORTED_FEATURES` before invoking |
| `ERR_2004` | `COMMAND_TIMEOUT` | ESP32 failed to respond within command timeout window | Re-send request with identical `request_id` |

### 1.3 Hardware & Peripheral Errors (3000–3999)
| Code | Constant Name | Description | Recovery Strategy |
| :--- | :--- | :--- | :--- |
| `ERR_3001` | `DS3231_NOT_DETECTED` | I2C ACK failed at address 0x68 | Check 3.3V power, SDA/SCL pull-ups (4.7kΩ) |
| `ERR_3002` | `DS3231_OSCILLATOR_STOPPED` | Oscillator Stopped Flag (OSF) set — battery died | Replace CR2032 coin cell, perform time sync |
| `ERR_3003` | `INVALID_DATE_TIME` | Attempted to set invalid calendar date (e.g. Feb 30) | Validate client date calculation |
| `ERR_3010` | `ALARM_LIMIT_EXCEEDED` | Attempted to create > 16 alarms on ESP32 | Prompt user to delete unneeded alarms |
| `ERR_3011` | `ALARM_NVS_WRITE_FAILED` | ESP32 Flash memory write error | Device flash may be corrupted; reboot ESP32 |
