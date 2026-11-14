import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../features/reminders/domain/reminder_model.dart';

/// C03: Software Reminder Card Component (Blue stripe, software-only checkbox)
class ReminderCard extends StatelessWidget {
  final ReminderModel reminder;
  final ValueChanged<bool?>? onToggle;
  final VoidCallback? onTap;

  const ReminderCard({
    super.key,
    required this.reminder,
    this.onToggle,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final dateFmt = DateFormat('EEE, d MMM • HH:mm');
    final stripeColor = reminder.isCompleted ? AppColors.disconnected : AppColors.secondary;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.cardGap),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
        ),
        clipBehavior: Clip.antiAlias,
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Blue Software Accent Stripe
              Container(width: 5, color: stripeColor),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.cardPadding,
                    vertical: 16,
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              dateFmt.format(reminder.dueDate),
                              style: AppTypography.caption,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              reminder.title,
                              style: AppTypography.cardTitle.copyWith(
                                decoration: reminder.isCompleted
                                    ? TextDecoration.lineThrough
                                    : null,
                                color: reminder.isCompleted
                                    ? AppColors.textSecondary
                                    : AppColors.textPrimary,
                              ),
                            ),
                            if (reminder.notes.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                reminder.notes,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppTypography.bodySecondary,
                              ),
                            ],
                          ],
                        ),
                      ),
                      Checkbox(
                        value: reminder.isCompleted,
                        onChanged: onToggle,
                        activeColor: AppColors.secondary,
                        checkColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
