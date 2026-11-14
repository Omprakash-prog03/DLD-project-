package com.smartclock.mobile.alarm;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/**
 * Native Android Exact Alarm Scheduler (Java).
 * Schedules alarm triggers using AlarmManager.setExactAndAllowWhileIdle()
 * to wake the device and synchronize state with the ESP32 hardware.
 */
public class AndroidAlarmScheduler {
    private final Context context;
    private final AlarmManager alarmManager;

    public AndroidAlarmScheduler(Context context) {
        this.context = context;
        this.alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    }

    public void scheduleExactAlarm(int alarmId, long triggerEpochMs, String label) {
        if (alarmManager == null) return;

        Intent intent = new Intent(context, AlarmNotificationReceiver.class);
        intent.putExtra("alarmId", alarmId);
        intent.putExtra("label", label);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, alarmId, intent, flags);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerEpochMs, pendingIntent);
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerEpochMs, pendingIntent);
        }
    }

    public void cancelAlarm(int alarmId) {
        if (alarmManager == null) return;

        Intent intent = new Intent(context, AlarmNotificationReceiver.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, alarmId, intent, flags);
        alarmManager.cancel(pendingIntent);
    }
}
