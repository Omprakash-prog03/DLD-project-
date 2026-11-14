import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../features/alarms/domain/alarm_model.dart';
import 'sync_status_badge.dart';

/// C01: Alarm Card Component
class AlarmCard extends StatelessWidget {
  final AlarmModel alarm;
  final ValueChanged<bool>? onToggle;
  final VoidCallback? onTap;

  const AlarmCard({
    super.key,
    required this.alarm,
    this.onToggle,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.cardGap),
        padding: const EdgeInsets.all(AppSpacing.cardPadding),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      alarm.formattedTime(),
                      style: TextStyle(
                        fontFamily: AppTypography.fontFamily,
                        fontSize: 34,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -1.0,
                        color: alarm.isEnabled
                            ? AppColors.textPrimary
                            : AppColors.textSecondary.withOpacity(0.5),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      alarm.label.isNotEmpty ? alarm.label : 'Alarm',
                      style: AppTypography.bodySecondary,
                    ),
                  ],
                ),
                Switch(
                  value: alarm.isEnabled,
                  activeColor: Colors.white,
                  activeTrackColor: AppColors.primary,
                  inactiveThumbColor: AppColors.textSecondary,
                  inactiveTrackColor: AppColors.surfaceElevated,
                  trackOutlineColor: MaterialStateProperty.all(Colors.transparent),
                  onChanged: onToggle,
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Repeat Day Chips
                Row(
                  children: List.generate(7, (idx) {
                    final isDayActive = alarm.repeatDays.contains(idx);
                    return Container(
                      margin: const EdgeInsets.only(right: 6),
                      width: 26,
                      height: 26,
                      decoration: BoxDecoration(
                        color: isDayActive
                            ? AppColors.primary
                            : AppColors.surfaceElevated,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        dayNames[idx],
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: isDayActive ? Colors.white : AppColors.textSecondary,
                        ),
                      ),
                    );
                  }),
                ),
                // Sync Status Badge
                SyncStatusBadge(status: alarm.syncStatus),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
