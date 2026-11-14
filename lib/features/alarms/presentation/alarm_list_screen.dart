import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/di/providers.dart';
import '../../../shared/widgets/alarm_card.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/mock_mode_banner.dart';

/// Screen 05: Alarm List Screen (View & manage hardware autonomous alarms)
class AlarmListScreen extends ConsumerWidget {
  const AlarmListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hwManager = ref.watch(hardwareManagerProvider);
    final alarmsAsync = ref.watch(alarmsListProvider);
    final repo = ref.watch(alarmRepositoryProvider);

    final alarms = alarmsAsync.valueOrNull ?? [];
    final activeAlarms = alarms.where((a) => a.isEnabled).toList();
    final inactiveAlarms = alarms.where((a) => !a.isEnabled).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Alarms'),
        actions: [
          IconButton(
            icon: Container(
              width: 36,
              height: 36,
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.add, color: Colors.white, size: 22),
            ),
            onPressed: () => context.push('/alarms/create'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (hwManager.isMockMode) const MockModeBanner(),
            Expanded(
              child: alarms.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(AppSpacing.screenMarginHorizontal),
                        child: EmptyStateView(
                          icon: Icons.alarm_off_rounded,
                          title: 'No Alarms Set',
                          description: 'Configure hardware alarms that trigger autonomously on the ESP32 and DS3231 even when phone is disconnected.',
                          buttonLabel: 'Create Alarm',
                          onButtonPressed: () => context.push('/alarms/create'),
                        ),
                      ),
                    )
                  : ListView(
                      padding: const EdgeInsets.all(AppSpacing.screenMarginHorizontal),
                      children: [
                        if (activeAlarms.isNotEmpty) ...[
                          const Padding(
                            padding: EdgeInsets.only(bottom: 12),
                            child: Text(
                              'ACTIVE ALARMS',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.8,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ),
                          ...activeAlarms.map((a) => AlarmCard(
                                alarm: a,
                                onToggle: (_) => repo.toggleAlarm(a.id),
                                onTap: () => context.push('/alarms/${a.id}'),
                              )),
                          const SizedBox(height: 16),
                        ],
                        if (inactiveAlarms.isNotEmpty) ...[
                          const Padding(
                            padding: EdgeInsets.only(bottom: 12),
                            child: Text(
                              'INACTIVE ALARMS',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.8,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ),
                          ...inactiveAlarms.map((a) => AlarmCard(
                                alarm: a,
                                onToggle: (_) => repo.toggleAlarm(a.id),
                                onTap: () => context.push('/alarms/${a.id}'),
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
