import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';

/// C11: Dedicated Bottom Navigation Bar (72dp height, no pills, high contrast)
class BottomNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const BottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;

    final items = [
      (Icons.timer_outlined, Icons.timer_rounded, 'Home'),
      (Icons.calendar_today_outlined, Icons.calendar_month_rounded, 'Calendar'),
      (Icons.alarm_outlined, Icons.alarm_rounded, 'Alarms'),
      (Icons.devices_outlined, Icons.devices_rounded, 'Device'),
      (Icons.tune_outlined, Icons.tune_rounded, 'Settings'),
    ];

    return Container(
      height: AppSpacing.bottomNavHeight + bottomInset,
      padding: EdgeInsets.only(bottom: bottomInset),
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A1A),
        border: Border(
          top: BorderSide(color: AppColors.divider, width: 1),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(items.length, (idx) {
          final isSelected = currentIndex == idx;
          final item = items[idx];
          final color = isSelected ? AppColors.primary : const Color(0xFF666666);

          return Expanded(
            child: InkWell(
              onTap: () => onTap(idx),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    isSelected ? item.$2 : item.$1,
                    size: 24,
                    color: color,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.$3,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                      color: color,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}
