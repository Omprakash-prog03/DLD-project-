import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/di/providers.dart';
import '../domain/alarm_model.dart';
import '../../../shared/widgets/app_bar_back.dart';
import '../../../shared/widgets/sync_status_badge.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/secondary_button.dart';
import '../../../shared/widgets/confirmation_dialog.dart';

/// Screen 08: Alarm Details Screen (Read-only hardware confirmation view)
class AlarmDetailScreen extends ConsumerWidget {
  final String alarmId;

  const AlarmDetailScreen({super.key, required this.alarmId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final alarmsAsync = ref.watch(alarmsListProvider);
    final alarms = alarmsAsync.valueOrNull ?? [];
    final alarm = alarms.firstWhere(
      (a) => a.id == alarmId,
      orElse: () => AlarmModel(id: '', label: 'Not Found', hour: 0, minute: 0),
    );

    if (alarm.id.isEmpty) {
      return Scaffold(
        appBar: AppBar(leading: const AppBarBack(), title: const Text('Alarm Details')),
        body: const Center(child: Text('Alarm not found', style: AppTypography.cardTitle)),
      );
    }

    return Scaffold(
      appBar: AppBar(
        leading: const AppBarBack(),
        title: const Text('Alarm Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined, color: Colors.white),
            onPressed: () => context.push('/alarms/${alarm.id}/edit'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.screenMarginHorizontal),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hero Time Card (Red-Orange)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          alarm.formattedTime(),
                          style: AppTypography.displayClock,
                        ),
                        SyncStatusBadge(status: alarm.syncStatus),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      alarm.label,
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Repeats: ${alarm.formattedRepeatDays()}',
                      style: const TextStyle(fontSize: 14, color: Colors.white70),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sectionGap),

              // Detailed Specifications
              Container(
                padding: const EdgeInsets.all(AppSpacing.cardPadding),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                ),
                child: Column(
                  children: [
                    _buildDetailRow('Status', alarm.isEnabled ? 'Active & Armed' : 'Disabled'),
                    const Divider(color: AppColors.divider),
                    _buildDetailRow('Snooze', alarm.snoozeEnabled ? '${alarm.snoozeDuration} minutes' : 'Disabled'),
                    const Divider(color: AppColors.divider),
                    _buildDetailRow(
                      'Hardware Confirmed',
                      alarm.syncStatus == AlarmSyncStatus.synchronized ? 'Yes (NVS Flash)' : 'Pending Sync',
                    ),
                    const Divider(color: AppColors.divider),
                    _buildDetailRow(
                      'Last Sync',
                      alarm.lastSyncTimestamp != null
                          ? DateFormat('d MMM yyyy, HH:mm').format(alarm.lastSyncTimestamp!)
                          : 'Never',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sectionGap),

              // Action Buttons Row (Edit & Delete)
              Row(
                children: [
                  Expanded(
                    child: SecondaryButton(
                      label: 'Edit Alarm',
                      icon: Icons.edit_rounded,
                      onPressed: () => context.push('/alarms/${alarm.id}/edit'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: SecondaryButton(
                      label: 'Delete',
                      icon: Icons.delete_outline_rounded,
                      textColor: AppColors.error,
                      backgroundColor: AppColors.error.withOpacity(0.12),
                      onPressed: () {
                        ConfirmationDialog.show(
                          context,
                          title: 'Delete Alarm',
                          message: 'Remove this alarm from hardware clock?',
                          confirmLabel: 'Delete',
                          isDestructive: true,
                          onConfirm: () async {
                            final repo = ref.read(alarmRepositoryProvider);
                            await repo.deleteAlarm(alarm.id);
                            if (context.mounted) {
                              context.go('/alarms');
                            }
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTypography.bodySecondary),
          Text(value, style: AppTypography.cardTitle.copyWith(fontSize: 15)),
        ],
      ),
    );
  }
}
