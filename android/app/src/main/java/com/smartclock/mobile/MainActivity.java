package com.smartclock.mobile;

import android.os.Bundle;
import io.flutter.embedding.android.FlutterActivity;
import io.flutter.embedding.engine.FlutterEngine;
import io.flutter.plugin.common.MethodChannel;
import com.smartclock.mobile.hardware.BleTransportManager;
import com.smartclock.mobile.hardware.WifiTransportManager;
import com.smartclock.mobile.alarm.AndroidAlarmScheduler;

/**
 * Main Android Activity for the Smart Clock Companion App.
 * Bridges Flutter platform channels with native Android Java subsystem services:
 * - Low-level Bluetooth LE scanner and GATT manager
 * - Direct local Wi-Fi HTTP / WebSocket communications
 * - Exact hardware alarm schedule reconciliation with AlarmManager
 */
public class MainActivity extends FlutterActivity {
    private static final String CHANNEL_HARDWARE = "com.smartclock.mobile/hardware";
    private static final String CHANNEL_ALARM = "com.smartclock.mobile/alarms";

    private BleTransportManager bleManager;
    private WifiTransportManager wifiManager;
    private AndroidAlarmScheduler alarmScheduler;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        bleManager = new BleTransportManager(this);
        wifiManager = new WifiTransportManager(this);
        alarmScheduler = new AndroidAlarmScheduler(this);
    }

    @Override
    public void configureFlutterEngine(FlutterEngine flutterEngine) {
        super.configureFlutterEngine(flutterEngine);

        // Hardware Communication Bridge
        new MethodChannel(flutterEngine.getDartExecutor().getBinaryMessenger(), CHANNEL_HARDWARE)
            .setMethodCallHandler((call, result) -> {
                switch (call.method) {
                    case "startBleScan":
                        bleManager.startScan(result);
                        break;
                    case "stopBleScan":
                        bleManager.stopScan();
                        result.success(true);
                        break;
                    case "connectBle":
                        String deviceAddress = call.argument("address");
                        bleManager.connect(deviceAddress, result);
                        break;
                    case "disconnectBle":
                        bleManager.disconnect();
                        result.success(true);
                        break;
                    case "sendBleCommand":
                        String payload = call.argument("payload");
                        bleManager.sendCommand(payload, result);
                        break;
                    case "sendWifiCommand":
                        String endpoint = call.argument("endpoint");
                        String body = call.argument("body");
                        wifiManager.sendPost(endpoint, body, result);
                        break;
                    default:
                        result.notImplemented();
                        break;
                }
            });

        // Exact Alarm Management Bridge
        new MethodChannel(flutterEngine.getDartExecutor().getBinaryMessenger(), CHANNEL_ALARM)
            .setMethodCallHandler((call, result) -> {
                switch (call.method) {
                    case "scheduleLocalAlarm":
                        int alarmId = call.argument("alarmId");
                        long triggerEpochMs = call.argument("triggerEpochMs");
                        String label = call.argument("label");
                        alarmScheduler.scheduleExactAlarm(alarmId, triggerEpochMs, label);
                        result.success(true);
                        break;
                    case "cancelLocalAlarm":
                        int cancelId = call.argument("alarmId");
                        alarmScheduler.cancelAlarm(cancelId);
                        result.success(true);
                        break;
                    default:
                        result.notImplemented();
                        break;
                }
            });
    }

    @Override
    protected void onDestroy() {
        if (bleManager != null) {
            bleManager.cleanup();
        }
        super.onDestroy();
    }
}
