import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/di/providers.dart';
import '../../../shared/widgets/app_bar_back.dart';
import '../../../shared/widgets/event_card.dart';

/// Screen 11: Daily Agenda View with "Now" time marker
class CalendarAgendaScreen extends ConsumerWidget {
  const CalendarAgendaScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final now = DateTime.now();
    final eventsAsync = ref.watch(calendarEventsForDateProvider(now));
    final events = eventsAsync.valueOrNull ?? [];

    return Scaffold(
      appBar: AppBar(
        leading: const AppBarBack(),
        title: Text(DateFormat('EEEE, d MMM').format(now)),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: Colors.white),
            onPressed: () => context.push('/calendar/create-event'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.screenMarginHorizontal),
          children: [
            // Current Time "NOW" Indicator
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.18),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary.withOpacity(0.5)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'NOW • ${DateFormat('HH:mm').format(now)}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),

            if (events.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32.0),
                  child: Text('No events on your agenda today', style: AppTypography.bodySecondary),
                ),
              )
            else
              ...events.map((e) => EventCard(
                    event: e,
                    onTap: () => context.push('/calendar/events/${e.id}'),
                  )),
          ],
        ),
      ),
    );
  }
}
