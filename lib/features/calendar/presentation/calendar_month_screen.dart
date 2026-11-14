import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/di/providers.dart';
import '../domain/calendar_event_model.dart';
import '../../../shared/widgets/event_card.dart';
import '../../../shared/widgets/section_header.dart';

/// Screen 09: Calendar Monthly View (Software-only schedule manager)
class CalendarMonthScreen extends ConsumerStatefulWidget {
  const CalendarMonthScreen({super.key});

  @override
  ConsumerState<CalendarMonthScreen> createState() => _CalendarMonthScreenState();
}

class _CalendarMonthScreenState extends ConsumerState<CalendarMonthScreen> {
  DateTime _currentMonth = DateTime(2026, 11, 1);
  DateTime _selectedDate = DateTime(2026, 11, 14);

  void _previousMonth() {
    setState(() {
      _currentMonth = DateTime(_currentMonth.year, _currentMonth.month - 1, 1);
    });
  }

  void _nextMonth() {
    setState(() {
      _currentMonth = DateTime(_currentMonth.year, _currentMonth.month + 1, 1);
    });
  }

  @override
  Widget build(BuildContext context) {
    final eventsAsync = ref.watch(calendarEventsForDateProvider(_selectedDate));
    final events = eventsAsync.valueOrNull ?? [];

    final titleFormat = DateFormat('MMMM yyyy');
    final daysInMonth = DateTime(_currentMonth.year, _currentMonth.month + 1, 0).day;
    final firstWeekday = DateTime(_currentMonth.year, _currentMonth.month, 1).weekday; // 1 = Mon ... 7 = Sun

    return Scaffold(
      appBar: AppBar(
        title: Text(titleFormat.format(_currentMonth)),
        actions: [
          IconButton(
            icon: const Icon(Icons.chevron_left_rounded, color: Colors.white, size: 28),
            onPressed: _previousMonth,
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right_rounded, color: Colors.white, size: 28),
            onPressed: _nextMonth,
          ),
          IconButton(
            icon: Container(
              width: 32,
              height: 32,
              decoration: const BoxDecoration(
                color: AppColors.secondary,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.add, color: Colors.white, size: 18),
            ),
            onPressed: () => context.push('/calendar/create-event'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Calendar View Switcher Chips (Month / Week / Day)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenMarginHorizontal),
              child: Row(
                children: [
                  _buildViewTab('Month', true, () {}),
                  const SizedBox(width: 8),
                  _buildViewTab('Week', false, () => context.push('/calendar/week')),
                  const SizedBox(width: 8),
                  _buildViewTab('Agenda', false, () => context.push('/calendar/agenda')),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Month Grid Card
            Container(
              margin: const EdgeInsets.symmetric(horizontal: AppSpacing.screenMarginHorizontal),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
              ),
              child: Column(
                children: [
                  // Weekday Header Row (Mo Tu We Th Fr Sa Su)
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _WeekdayLabel('Mo'),
                      _WeekdayLabel('Tu'),
                      _WeekdayLabel('We'),
                      _WeekdayLabel('Th'),
                      _WeekdayLabel('Fr'),
                      _WeekdayLabel('Sa'),
                      _WeekdayLabel('Su'),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // 7-Column Days Grid
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 7,
                      mainAxisSpacing: 6,
                      crossAxisSpacing: 6,
                    ),
                    itemCount: (firstWeekday - 1) + daysInMonth,
                    itemBuilder: (context, index) {
                      if (index < firstWeekday - 1) {
                        return const SizedBox.shrink(); // Empty leading cells
                      }

                      final dayNum = index - (firstWeekday - 2);
                      final cellDate = DateTime(_currentMonth.year, _currentMonth.month, dayNum);
                      final isToday = cellDate.year == DateTime.now().year &&
                          cellDate.month == DateTime.now().month &&
                          cellDate.day == DateTime.now().day;
                      final isSelected = cellDate.year == _selectedDate.year &&
                          cellDate.month == _selectedDate.month &&
                          cellDate.day == _selectedDate.day;

                      // Highlight event indicator for demo dates
                      final hasEvent = [14, 15, 18, 22].contains(dayNum);

                      return GestureDetector(
                        onTap: () => setState(() => _selectedDate = cellDate),
                        child: Container(
                          decoration: BoxDecoration(
                            color: isToday
                                ? AppColors.primary
                                : (isSelected ? AppColors.primary.withOpacity(0.25) : Colors.transparent),
                            shape: BoxShape.circle,
                            border: isSelected && !isToday
                                ? Border.all(color: AppColors.primary, width: 1.5)
                                : null,
                          ),
                          alignment: Alignment.center,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                '$dayNum',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: isToday || isSelected ? FontWeight.w700 : FontWeight.w500,
                                  color: isToday ? Colors.white : AppColors.textPrimary,
                                ),
                              ),
                              if (hasEvent)
                                Container(
                                  margin: const EdgeInsets.only(top: 2),
                                  width: 4,
                                  height: 4,
                                  decoration: BoxDecoration(
                                    color: isToday ? Colors.white : AppColors.secondary,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Selected Day Agenda Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenMarginHorizontal),
              child: SectionHeader(
                title: DateFormat('EEEE, d MMMM').format(_selectedDate),
                actionLabel: '+ Add Event',
                onAction: () => context.push('/calendar/create-event'),
              ),
            ),

            // Events List
            Expanded(
              child: events.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(AppSpacing.screenMarginHorizontal),
                        child: Text(
                          'No scheduled events for this day.',
                          style: AppTypography.bodySecondary,
                        ),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenMarginHorizontal),
                      itemCount: events.length,
                      itemBuilder: (context, idx) => EventCard(
                        event: events[idx],
                        onTap: () => context.push('/calendar/events/${events[idx].id}'),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildViewTab(String label, bool isSelected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.secondary : AppColors.surfaceElevated,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _WeekdayLabel extends StatelessWidget {
  final String text;
  const _WeekdayLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 36,
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}
