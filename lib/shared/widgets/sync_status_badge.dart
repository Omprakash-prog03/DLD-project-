import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../features/alarms/domain/alarm_model.dart';

/// C13: Sync Status Badge (Strict adherence to hardware confirmation)
class SyncStatusBadge extends StatelessWidget {
  final AlarmSyncStatus status;

  const SyncStatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String label;
    IconData icon;

    switch (status) {
      case AlarmSyncStatus.synchronized:
        bg = AppColors.success.withOpacity(0.18);
        fg = AppColors.success;
        label = 'Synced';
        icon = Icons.check_circle_rounded;
        break;
      case AlarmSyncStatus.synchronizing:
      case AlarmSyncStatus.pending:
        bg = AppColors.warning.withOpacity(0.18);
        fg = AppColors.warning;
        label = status == AlarmSyncStatus.synchronizing ? 'Syncing...' : 'Pending';
        icon = Icons.schedule_rounded;
        break;
      case AlarmSyncStatus.failed:
        bg = AppColors.error.withOpacity(0.18);
        fg = AppColors.error;
        label = 'Sync Failed';
        icon = Icons.warning_amber_rounded;
        break;
      case AlarmSyncStatus.deviceOffline:
        bg = AppColors.disconnected.withOpacity(0.25);
        fg = AppColors.textSecondary;
        label = 'Device Offline';
        icon = Icons.cloud_off_rounded;
        break;
      case AlarmSyncStatus.localOnly:
        bg = AppColors.surfaceElevated;
        fg = AppColors.textSecondary;
        label = 'Local Only';
        icon = Icons.sd_storage_rounded;
        break;
    }

    return Container(
      height: 24,
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppSpacing.chipRadius),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: fg),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: fg,
            ),
          ),
        ],
      ),
    );
  }
}
