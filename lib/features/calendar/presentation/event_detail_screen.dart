import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/di/providers.dart';
import '../domain/calendar_event_model.dart';
import '../../../shared/widgets/app_bar_back.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/secondary_button.dart';
import '../../../shared/widgets/confirmation_dialog.dart';

/// Screen 14: Event Details Screen
class EventDetailScreen extends ConsumerWidget {
  final String eventId;

  const EventDetailScreen({super.key, required this.eventId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final now = DateTime.now();
    final eventsAsync = ref.watch(calendarEventsForDateProvider(now));
    final events = eventsAsync.valueOrNull ?? [];
    final event = events.firstWhere(
      (e) => e.id == eventId,
      orElse: () => CalendarEventModel(
        id: '',
        title: 'Event Not Found',
        startTime: DateTime.now(),
        endTime: DateTime.now(),
      ),
    );

    final timeFmt = DateFormat('EEEE, d MMMM yyyy • HH:mm');

    return Scaffold(
      appBar: AppBar(
        leading: const AppBarBack(),
        title: const Text('Event Details'),
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
                  color: event.displayColor,
                  borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black26,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        event.category.displayName,
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      event.title,
                      style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: Colors.white),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${DateFormat('HH:mm').format(event.startTime)} - ${DateFormat('HH:mm').format(event.endTime)}',
                      style: const TextStyle(fontSize: 16, color: Colors.white70),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sectionGap),

              // Info Container
              Container(
                padding: const EdgeInsets.all(AppSpacing.cardPadding),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Date & Time', style: AppTypography.caption),
                    const SizedBox(height: 4),
                    Text(timeFmt.format(event.startTime), style: AppTypography.cardTitle.copyWith(fontSize: 15)),
                    if (event.description.isNotEmpty) ...[
                      const Divider(color: AppColors.divider, height: 28),
                      const Text('Notes', style: AppTypography.caption),
                      const SizedBox(height: 6),
                      Text(event.description, style: AppTypography.bodyPrimary),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sectionGap),

              SecondaryButton(
                label: 'Delete Event',
                icon: Icons.delete_outline_rounded,
                textColor: AppColors.error,
                backgroundColor: AppColors.error.withOpacity(0.12),
                onPressed: () {
                  ConfirmationDialog.show(
                    context,
                    title: 'Delete Event',
                    message: 'Are you sure you want to delete this calendar event?',
                    confirmLabel: 'Delete',
                    isDestructive: true,
                    onConfirm: () async {
                      final repo = ref.read(calendarRepositoryProvider);
                      await repo.deleteEvent(eventId);
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
