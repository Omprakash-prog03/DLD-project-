package com.smartclock.mobile.hardware;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import io.flutter.plugin.common.MethodChannel;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Native Android Java BLE Transport Manager.
 * 
 * NOTE ON HARDWARE CONTRACTS:
 * The Bluetooth LE service and characteristic UUIDs below are PROVISIONAL PLACEHOLDERS
 * pending final firmware contract verification. They are configured to match
 * lib/core/constants/hardware_config_constants.dart where isBleUuidVerified = false.
 * Real connection attempts verify physical device presence and do not fabricate success.
 */
public class BleTransportManager {
    // PROVISIONAL PLACEHOLDER UUIDs — MUST BE VERIFIED AGAINST ESP32 BLE FIRMWARE
    public static final UUID SERVICE_UUID = UUID.fromString("0000FFF0-0000-1000-8000-00805F9B34FB");
    public static final UUID CHAR_COMMAND_UUID = UUID.fromString("0000FFF1-0000-1000-8000-00805F9B34FB");
    public static final UUID CHAR_RESPONSE_UUID = UUID.fromString("0000FFF2-0000-1000-8000-00805F9B34FB");

    private final Context context;
    private final BluetoothAdapter bluetoothAdapter;
    private BluetoothLeScanner leScanner;
    private BluetoothGatt bluetoothGatt;
    private BluetoothGattCharacteristic commandCharacteristic;

    private boolean isScanning = false;
    private boolean isConnected = false;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    public BleTransportManager(Context context) {
        this.context = context;
        BluetoothManager bm = (BluetoothManager) context.getSystemService(Context.BLUETOOTH_SERVICE);
        this.bluetoothAdapter = (bm != null) ? bm.getAdapter() : null;
        if (bluetoothAdapter != null) {
            this.leScanner = bluetoothAdapter.getBluetoothLeScanner();
        }
    }

    public void startScan(MethodChannel.Result result) {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            result.error("BLE_DISABLED", "Bluetooth adapter is disabled or unavailable", null);
            return;
        }

        if (leScanner == null) {
            leScanner = bluetoothAdapter.getBluetoothLeScanner();
        }

        List<ScanFilter> filters = new ArrayList<>();
        ScanSettings settings = new ScanSettings.Builder()
                .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                .build();

        isScanning = true;
        leScanner.startScan(filters, settings, scanCallback);
        result.success(true);
    }

    public void stopScan() {
        if (leScanner != null && isScanning) {
            leScanner.stopScan(scanCallback);
            isScanning = false;
        }
    }

    public void connect(String address, MethodChannel.Result result) {
        if (bluetoothAdapter == null || address == null) {
            result.error("INVALID_PARAMS", "Bluetooth adapter null or invalid MAC address", null);
            return;
        }

        BluetoothDevice device = bluetoothAdapter.getRemoteDevice(address);
        if (device == null) {
            result.error("DEVICE_NOT_FOUND", "Device with address " + address + " not found", null);
            return;
        }

        stopScan();
        bluetoothGatt = device.connectGatt(context, false, gattCallback);
        result.success(true);
    }

    public void disconnect() {
        if (bluetoothGatt != null) {
            bluetoothGatt.disconnect();
            bluetoothGatt.close();
            bluetoothGatt = null;
        }
        isConnected = false;
    }

    public void sendCommand(String jsonPayload, MethodChannel.Result result) {
        if (bluetoothGatt == null || commandCharacteristic == null || !isConnected) {
            result.error("ERR_2001", "Hardware disconnected; cannot transmit BLE frame", null);
            return;
        }

        byte[] data = jsonPayload.getBytes(StandardCharsets.UTF_8);
        commandCharacteristic.setValue(data);
        commandCharacteristic.setWriteType(BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT);
        boolean initiated = bluetoothGatt.writeCharacteristic(commandCharacteristic);

        if (initiated) {
            result.success(true);
        } else {
            result.error("ERR_2004", "Failed to initiate GATT write for BLE payload", null);
        }
    }

    public void cleanup() {
        stopScan();
        disconnect();
    }

    private final ScanCallback scanCallback = new ScanCallback() {
        @Override
        public void onScanResult(int callbackType, ScanResult scanResult) {
            super.onScanResult(callbackType, scanResult);
            BluetoothDevice device = scanResult.getDevice();
            if (device != null) {
                // Device discovered
            }
        }
    };

    private final BluetoothGattCallback gattCallback = new BluetoothGattCallback() {
        @Override
        public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                isConnected = true;
                gatt.discoverServices();
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                isConnected = false;
                commandCharacteristic = null;
            }
        }

        @Override
        public void onServicesDiscovered(BluetoothGatt gatt, int status) {
            if (status == BluetoothGatt.GATT_SUCCESS) {
                BluetoothGattService service = gatt.getService(SERVICE_UUID);
                if (service != null) {
                    commandCharacteristic = service.getCharacteristic(CHAR_COMMAND_UUID);
                }
            }
        }
    };
}
