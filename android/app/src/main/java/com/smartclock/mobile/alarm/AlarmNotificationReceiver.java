package com.smartclock.mobile.alarm;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import com.smartclock.mobile.MainActivity;

/**
 * BroadcastReceiver triggered when an exact alarm fires on Android.
 * Raises high-priority notification with sound & vibration and opens companion app.
 */
public class AlarmNotificationReceiver extends BroadcastReceiver {
    private static final String CHANNEL_ID = "smart_clock_alarm_channel";

    @Override
    public void onReceive(Context context, Intent intent) {
        int alarmId = intent.getIntExtra("alarmId", 0);
        String label = intent.getStringExtra("label");
        if (label == null || label.isEmpty()) {
            label = "Smart Clock Alarm";
        }

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Hardware Alarms",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifications for Smart Clock hardware alarms");
            channel.enableVibration(true);
            nm.createNotificationChannel(channel);
        }

        Intent openAppIntent = new Intent(context, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        openAppIntent.putExtra("ringing_alarm_id", alarmId);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent contentIntent = PendingIntent.getActivity(context, alarmId, openAppIntent, flags);
        Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(label)
                .setContentText("Alarm is ringing — Tap to open controller")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setSound(alarmSound)
                .setAutoCancel(true)
                .setContentIntent(contentIntent);

        nm.notify(alarmId, builder.build());
    }
}
