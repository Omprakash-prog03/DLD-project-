import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/di/providers.dart';
import '../../../shared/widgets/reminder_card.dart';
import '../../../shared/widgets/empty_state_view.dart';

/// Screen 15: Software Reminders Manager (Completely independent of ESP32 clock)
class ReminderListScreen extends ConsumerWidget {
  const ReminderListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final remindersAsync = ref.watch(remindersListProvider);
    final repo = ref.watch(reminderRepositoryProvider);
    final reminders = remindersAsync.valueOrNull ?? [];

    final upcoming = reminders.where((r) => !r.isCompleted).toList();
    final completed = reminders.where((r) => r.isCompleted).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reminders'),
        actions: [
          IconButton(
            icon: Container(
              width: 36,
              height: 36,
              decoration: const BoxDecoration(
                color: AppColors.secondary,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.add, color: Colors.white, size: 22),
            ),
            onPressed: () => context.push('/reminders/create'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Informational Disclaimer Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
              color: AppColors.secondary.withOpacity(0.12),
              child: const Row(
                children: [
                  Icon(Icons.info_outline_rounded, color: AppColors.secondary, size: 18),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Reminders use your phone\'s notification system and are independent of your physical hardware clock.',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            Expanded(
              child: reminders.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(AppSpacing.screenMarginHorizontal),
                        child: EmptyStateView(
                          icon: Icons.checklist_rtl_rounded,
                          title: 'No Reminders',
                          description: 'Keep track of circuit testing, battery replacements, and tasks.',
                          buttonLabel: 'Add Reminder',
                          onButtonPressed: () => context.push('/reminders/create'),
                        ),
                      ),
                    )
                  : ListView(
                      padding: const EdgeInsets.all(AppSpacing.screenMarginHorizontal),
                      children: [
                        if (upcoming.isNotEmpty) ...[
                          const Padding(
                            padding: EdgeInsets.only(bottom: 12),
                            child: Text(
                              'UPCOMING TASKS',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.8,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ),
                          ...upcoming.map((r) => ReminderCard(
                                reminder: r,
                                onToggle: (_) => repo.toggleReminder(r.id),
                                onTap: () => context.push('/reminders/${r.id}'),
                              )),
                          const SizedBox(height: 16),
                        ],
                        if (completed.isNotEmpty) ...[
                          const Padding(
                            padding: EdgeInsets.only(bottom: 12),
                            child: Text(
                              'COMPLETED',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.8,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ),
                          ...completed.map((r) => ReminderCard(
                                reminder: r,
                                onToggle: (_) => repo.toggleReminder(r.id),
                                onTap: () => context.push('/reminders/${r.id}'),
                              )),
                        ],
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
