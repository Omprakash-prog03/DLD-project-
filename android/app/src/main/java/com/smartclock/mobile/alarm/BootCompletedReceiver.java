package com.smartclock.mobile.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * BroadcastReceiver triggered on system reboot (RECEIVE_BOOT_COMPLETED).
 * Reschedules active local alarms to ensure parity with ESP32 RTC.
 */
public class BootCompletedReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            // Signal alarm rescheduling service or background reconciliation
        }
    }
}
