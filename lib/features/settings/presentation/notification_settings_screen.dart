import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/app_bar_back.dart';

/// Screen 23: Notification Preferences
class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  bool _alarmBanners = true;
  bool _reminderSounds = true;
  bool _eventAlerts = true;
  bool _hardwareStatusAlerts = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const AppBarBack(),
        title: const Text('Notifications'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.screenMarginHorizontal),
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.cardPadding),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
              ),
              child: Column(
                children: [
                  _buildToggleRow(
                    'Alarm Synchronization Alerts',
                    'Notify when hardware alarm is confirmed or failed',
                    _alarmBanners,
                    (v) => setState(() => _alarmBanners = v),
                  ),
                  const Divider(color: AppColors.divider),
                  _buildToggleRow(
                    'Software Reminder Audio',
                    'Play notification tone for phone reminders',
                    _reminderSounds,
                    (v) => setState(() => _reminderSounds = v),
                  ),
                  const Divider(color: AppColors.divider),
                  _buildToggleRow(
                    'Calendar Event Reminders',
                    '15 minutes before scheduled start time',
                    _eventAlerts,
                    (v) => setState(() => _eventAlerts = v),
                  ),
                  const Divider(color: AppColors.divider),
                  _buildToggleRow(
                    'Hardware Offline Warnings',
                    'Alert when ESP32 disconnects during active sync',
                    _hardwareStatusAlerts,
                    (v) => setState(() => _hardwareStatusAlerts = v),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildToggleRow(String title, String subtitle, bool value, ValueChanged<bool> onChanged) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTypography.cardTitle),
                const SizedBox(height: 2),
                Text(subtitle, style: AppTypography.bodySecondary),
              ],
            ),
          ),
          Switch(
            value: value,
            activeColor: Colors.white,
            activeTrackColor: AppColors.secondary,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}
