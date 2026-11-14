import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/di/providers.dart';
import '../domain/reminder_model.dart';
import '../../../shared/widgets/app_bar_back.dart';
import '../../../shared/widgets/secondary_button.dart';
import '../../../shared/widgets/confirmation_dialog.dart';

/// Screen 17: Reminder Details View
class ReminderDetailScreen extends ConsumerWidget {
  final String reminderId;

  const ReminderDetailScreen({super.key, required this.reminderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final remindersAsync = ref.watch(remindersListProvider);
    final reminders = remindersAsync.valueOrNull ?? [];
    final reminder = reminders.firstWhere(
      (r) => r.id == reminderId,
      orElse: () => ReminderModel(
        id: '',
        title: 'Not Found',
        dueDate: DateTime.now(),
      ),
    );

    return Scaffold(
      appBar: AppBar(
        leading: const AppBarBack(),
        title: const Text('Reminder Details'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.screenMarginHorizontal),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.secondary,
                  borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      reminder.isCompleted ? 'COMPLETED TASK' : 'ACTIVE REMINDER',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white70),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      reminder.title,
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Due: ${DateFormat('EEE, d MMM yyyy • HH:mm').format(reminder.dueDate)}',
                      style: const TextStyle(fontSize: 14, color: Colors.white70),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sectionGap),

              if (reminder.notes.isNotEmpty) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(AppSpacing.cardPadding),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Notes', style: AppTypography.caption),
                      const SizedBox(height: 6),
                      Text(reminder.notes, style: AppTypography.bodyPrimary),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.sectionGap),
              ],

              SecondaryButton(
                label: 'Delete Reminder',
                icon: Icons.delete_outline_rounded,
                textColor: AppColors.error,
                backgroundColor: AppColors.error.withOpacity(0.12),
                onPressed: () {
                  ConfirmationDialog.show(
                    context,
                    title: 'Delete Reminder',
                    message: 'Remove this reminder?',
                    confirmLabel: 'Delete',
                    isDestructive: true,
                    onConfirm: () async {
                      final repo = ref.read(reminderRepositoryProvider);
                      await repo.deleteReminder(reminderId);
                      if (context.mounted) context.pop();
                    },
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
