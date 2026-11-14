import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/di/providers.dart';
import '../domain/reminder_model.dart';
import '../../../shared/widgets/app_bar_back.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/custom_chip.dart';

/// Screen 16: Create Reminder Screen
class CreateReminderScreen extends ConsumerStatefulWidget {
  const CreateReminderScreen({super.key});

  @override
  ConsumerState<CreateReminderScreen> createState() => _CreateReminderScreenState();
}

class _CreateReminderScreenState extends ConsumerState<CreateReminderScreen> {
  final _titleController = TextEditingController();
  final _notesController = TextEditingController();
  DateTime _dueDate = DateTime.now().add(const Duration(hours: 3));
  ReminderNotificationType _type = ReminderNotificationType.soundAndNotification;

  Future<void> _saveReminder() async {
    if (_titleController.text.trim().isEmpty) return;

    final repo = ref.read(reminderRepositoryProvider);
    final reminder = ReminderModel(
      id: 'rem-${const Uuid().v4().substring(0, 8)}',
      title: _titleController.text.trim(),
      notes: _notesController.text.trim(),
      dueDate: _dueDate,
      notificationType: _type,
    );

    await repo.createReminder(reminder);
    if (mounted) context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const AppBarBack(),
        title: const Text('New Reminder'),
        actions: [
          TextButton(
            onPressed: _saveReminder,
            child: const Text('Save', style: TextStyle(color: AppColors.secondary, fontSize: 16, fontWeight: FontWeight.w700)),
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
              TextField(
                controller: _titleController,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'What would you like to remember?',
                  hintStyle: TextStyle(color: AppColors.textSecondary, fontSize: 18),
                  border: InputBorder.none,
                ),
              ),
              const Divider(color: AppColors.divider),
              const SizedBox(height: 16),

              // Due Date/Time Display
              Container(
                padding: const EdgeInsets.all(AppSpacing.cardPadding),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Due Time', style: AppTypography.cardTitle),
                    Text(
                      DateFormat('EEE, d MMM • HH:mm').format(_dueDate),
                      style: const TextStyle(color: AppColors.secondary, fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sectionGap),

              // Notification Type Selector
              const Text('Notification Style', style: AppTypography.cardTitle),
              const SizedBox(height: 10),
              Row(
                children: [
                  CustomChip(
                    label: 'Sound & Banner',
                    isSelected: _type == ReminderNotificationType.soundAndNotification,
                    activeColor: AppColors.secondary,
                    onTap: () => setState(() => _type = ReminderNotificationType.soundAndNotification),
                  ),
                  const SizedBox(width: 8),
                  CustomChip(
                    label: 'Banner Only',
                    isSelected: _type == ReminderNotificationType.notificationOnly,
                    activeColor: AppColors.secondary,
                    onTap: () => setState(() => _type = ReminderNotificationType.notificationOnly),
                  ),
                  const SizedBox(width: 8),
                  CustomChip(
                    label: 'Silent',
                    isSelected: _type == ReminderNotificationType.silent,
                    activeColor: AppColors.secondary,
                    onTap: () => setState(() => _type = ReminderNotificationType.silent),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.sectionGap),

              const Text('Notes', style: AppTypography.cardTitle),
              const SizedBox(height: 8),
              TextField(
                controller: _notesController,
                maxLines: 3,
                style: const TextStyle(color: Colors.white, fontSize: 15),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: AppColors.surface,
                  hintText: 'Additional details...',
                  hintStyle: const TextStyle(color: AppColors.textSecondary),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 24),

              PrimaryButton(
                label: 'Save Reminder',
                backgroundColor: AppColors.secondary,
                onPressed: _saveReminder,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
