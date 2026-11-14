import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/di/providers.dart';
import '../../../shared/widgets/mock_mode_banner.dart';
import '../../../shared/widgets/section_header.dart';
import '../../../shared/widgets/event_card.dart';
import '../../../shared/widgets/device_status_indicator.dart';

/// Screen 03: Home Dashboard (Primary daily control interface)
class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  late Timer _timer;
  DateTime _currentTime = DateTime.now();

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() {
          _currentTime = DateTime.now();
        });
      }
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hwManager = ref.watch(hardwareManagerProvider);
    final is24H = ref.watch(is24HourFormatProvider);
    final telemetryAsync = ref.watch(deviceTelemetryProvider);
    final alarmsAsync = ref.watch(alarmsListProvider);
    final eventsAsync = ref.watch(calendarEventsForDateProvider(DateTime.now()));

    final telemetry = telemetryAsync.valueOrNull ?? hwManager.stateManager.currentTelemetry;
    final alarms = alarmsAsync.valueOrNull ?? [];
    final events = eventsAsync.valueOrNull ?? [];

    // Filter active alarms
    final activeAlarms = alarms.where((a) => a.isEnabled).toList();
    final nextAlarm = activeAlarms.isNotEmpty ? activeAlarms.first : null;

    final timeString = DateFormat(is24H ? 'HH:mm' : 'h:mm').format(_currentTime);
    final amPmString = is24H ? '' : DateFormat('a').format(_currentTime);
    final dateString = DateFormat('EEEE, d MMMM').format(_currentTime);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Mock Mode Banner (Visible during emulation)
            if (hwManager.isMockMode) const MockModeBanner(),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.screenMarginHorizontal,
                  vertical: AppSpacing.screenMarginVertical,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Top App Header: User / Title & Notifications
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Smart Digital Clock',
                              style: TextStyle(
                                fontSize: 13,
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Dashboard',
                              style: AppTypography.screenTitle,
                            ),
                          ],
                        ),
                        // Quick Action / Bell Icon
                        GestureDetector(
                          onTap: () => context.push('/diagnostics'),
                          child: Container(
                            width: 42,
                            height: 42,
                            decoration: const BoxDecoration(
                              color: AppColors.surfaceElevated,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.analytics_outlined,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Block A — Hero Current Time Card (Red-Orange Fill)
                    GestureDetector(
                      onTap: () => context.push('/clock'),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(AppSpacing.cardPadding),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.baseline,
                                  textBaseline: TextBaseline.alphabetic,
                                  children: [
                                    Text(
                                      timeString,
                                      style: AppTypography.displayClock,
                                    ),
                                    if (amPmString.isNotEmpty) ...[
                                      const SizedBox(width: 8),
                                      Text(
                                        amPmString,
                                        style: const TextStyle(
                                          fontSize: 24,
                                          fontWeight: FontWeight.w700,
                                          color: Colors.white70,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.sync_rounded,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              dateString,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                                color: Color(0xCCFFFFFF),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Timezone: Asia/Kolkata (UTC+05:30) • DS3231 RTC',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.white.withOpacity(0.65),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.cardGap),

                    // Block B — Dual Metric Row (50/50 Split, 110dp Height)
                    SizedBox(
                      height: AppSpacing.dualCardHeight,
                      child: Row(
                        children: [
                          // Left Card: White Contrast Card (Next Alarm)
                          Expanded(
                            child: GestureDetector(
                              onTap: () => context.push('/alarms'),
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceLight,
                                  borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      nextAlarm != null ? nextAlarm.formattedTime(is24Hour: is24H) : '--:--',
                                      style: AppTypography.largeStatLight,
                                    ),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        const Text(
                                          'Next Alarm',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.textSecondaryLight,
                                          ),
                                        ),
                                        Text(
                                          nextAlarm?.formattedRepeatDays() ?? 'None',
                                          style: const TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.cardGap),

                          // Right Card: Blue Fill Card (Active Alarms)
                          Expanded(
                            child: GestureDetector(
                              onTap: () => context.push('/alarms'),
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: AppColors.secondary,
                                  borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '${activeAlarms.length}',
                                      style: AppTypography.largeStat,
                                    ),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          'Active Alarms',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.white.withOpacity(0.8),
                                          ),
                                        ),
                                        const Text(
                                          'Manage →',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w700,
                                            color: Colors.white,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.cardGap),

                    // Block D — Device Status Strip (Connected Hardware Summary)
                    GestureDetector(
                      onTap: () => context.push('/device'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                DeviceStatusIndicator(
                                  isConnected: telemetry.isConnected,
                                  customLabel: '',
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      telemetry.deviceName ?? 'ESP32 Smart Clock',
                                      style: AppTypography.cardTitle.copyWith(fontSize: 15),
                                    ),
                                    Text(
                                      telemetry.isConnected
                                          ? 'Firmware: ${telemetry.firmwareVersion ?? "1.2.0"}'
                                          : 'Offline (Last known state)',
                                      style: AppTypography.caption,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: telemetry.isConnected
                                        ? AppColors.success.withOpacity(0.18)
                                        : AppColors.surfaceElevated,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    telemetry.isConnected ? 'Connected' : 'Disconnected',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: telemetry.isConnected
                                          ? AppColors.success
                                          : AppColors.textSecondary,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                const Icon(
                                  Icons.chevron_right_rounded,
                                  color: AppColors.textSecondary,
                                  size: 20,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sectionGap),

                    // Block E — Quick Actions Row
                    Row(
                      children: [
                        _buildQuickActionCard(
                          icon: Icons.alarm_add_rounded,
                          label: 'Set Alarm',
                          color: AppColors.primary,
                          onTap: () => context.push('/alarms/create'),
                        ),
                        const SizedBox(width: 10),
                        _buildQuickActionCard(
                          icon: Icons.event_available_rounded,
                          label: 'Add Event',
                          color: AppColors.secondary,
                          onTap: () => context.push('/calendar/create-event'),
                        ),
                        const SizedBox(width: 10),
                        _buildQuickActionCard(
                          icon: Icons.sync_rounded,
                          label: 'Sync Time',
                          color: AppColors.primary,
                          onTap: () async {
                            final res = await hwManager.syncEngine.synchronizeClockTime();
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    res.success
                                        ? 'Time synchronized with DS3231 RTC!'
                                        : (res.errorMessage ?? 'Sync failed'),
                                  ),
                                  backgroundColor: res.success ? AppColors.success : AppColors.error,
                                ),
                              );
                            }
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.sectionGap),

                    // Block C — Today's Schedule Section
                    SectionHeader(
                      title: 'Today',
                      actionLabel: 'See all >',
                      onAction: () => context.push('/calendar'),
                    ),
                    if (events.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.event_note_rounded, color: AppColors.textSecondary, size: 28),
                            SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('No events today', style: AppTypography.cardTitle),
                                  SizedBox(height: 2),
                                  Text('Tap "Add Event" to schedule', style: AppTypography.caption),
                                ],
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      ...events.take(3).map((e) => EventCard(
                            event: e,
                            onTap: () => context.push('/calendar/events/${e.id}'),
                          )),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionCard({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
          ),
          child: Column(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: Colors.white, size: 22),
              ),
              const SizedBox(height: 8),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
