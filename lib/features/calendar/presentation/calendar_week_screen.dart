import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/app_bar_back.dart';

/// Screen 10: Calendar Weekly Time Slot View
class CalendarWeekScreen extends ConsumerWidget {
  const CalendarWeekScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final now = DateTime.now();
    final weekStart = now.subtract(Duration(days: now.weekday - 1));
    final weekDays = List.generate(7, (i) => weekStart.add(Duration(days: i)));

    return Scaffold(
      appBar: AppBar(
        leading: const AppBarBack(),
        title: const Text('Week Schedule'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: Colors.white),
            onPressed: () => context.push('/calendar/create-event'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // 7-Column Day Header
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              color: AppColors.surface,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: weekDays.map((d) {
                  final isToday = d.day == now.day && d.month == now.month;
                  return Column(
                    children: [
                      Text(
                        DateFormat('E').format(d).substring(0, 2),
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: isToday ? AppColors.primary : Colors.transparent,
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          '${d.day}',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: isToday ? Colors.white : AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
            const Divider(color: AppColors.divider, height: 1),

            // Hourly Time Slots (60dp height per hour)
            Expanded(
              child: ListView.builder(
                itemCount: 24,
                itemBuilder: (context, hour) {
                  final timeLabel = '${hour.toString().padLeft(2, '0')}:00';
                  final hasDemoEvent = hour == 10 || hour == 15;

                  return Container(
                    height: 64,
                    decoration: const BoxDecoration(
                      border: Border(bottom: BorderSide(color: AppColors.divider, width: 0.8)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                          width: 60,
                          child: Padding(
                            padding: const EdgeInsets.only(top: 8, left: 12),
                            child: Text(timeLabel, style: AppTypography.caption),
                          ),
                        ),
                        Expanded(
                          child: hasDemoEvent
                              ? Container(
                                  margin: const EdgeInsets.all(6),
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: hour == 10 ? AppColors.secondary : AppColors.primary,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    hour == 10 ? 'ESP32 Firmware Review' : 'Hardware Lab Testing',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                )
                              : const SizedBox.shrink(),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
