import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/di/providers.dart';
import '../../../shared/widgets/app_bar_back.dart';
import '../../../shared/widgets/primary_button.dart';

/// Screen 04: Clock Detail & DS3231 Synchronization Control
class ClockDetailScreen extends ConsumerStatefulWidget {
  const ClockDetailScreen({super.key});

  @override
  ConsumerState<ClockDetailScreen> createState() => _ClockDetailScreenState();
}

class _ClockDetailScreenState extends ConsumerState<ClockDetailScreen> {
  late Timer _timer;
  DateTime _phoneTime = DateTime.now();
  bool _isSyncing = false;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() {
          _phoneTime = DateTime.now();
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
    final is24H = ref.watch(is24HourFormatProvider);
    final hwManager = ref.watch(hardwareManagerProvider);
    final telemetryAsync = ref.watch(deviceTelemetryProvider);
    final telemetry = telemetryAsync.valueOrNull ?? hwManager.stateManager.currentTelemetry;

    final phoneTimeStr = DateFormat(is24H ? 'HH:mm:ss' : 'h:mm:ss a').format(_phoneTime);
    final rtcTime = telemetry.hardwareTime;
    final rtcTimeStr = rtcTime != null
        ? DateFormat(is24H ? 'HH:mm:ss' : 'h:mm:ss a').format(rtcTime)
        : (telemetry.isConnected ? 'Reading...' : '--:--:--');

    return Scaffold(
      appBar: AppBar(
        leading: const AppBarBack(),
        title: const Text('Clock'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Colors.white),
            onPressed: () => context.push('/settings'),
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
              // Hero Time Card (Red-Orange Accent)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'HARDWARE TIME',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.0,
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      rtcTime != null
                          ? DateFormat(is24H ? 'HH:mm' : 'h:mm').format(rtcTime)
                          : DateFormat(is24H ? 'HH:mm' : 'h:mm').format(_phoneTime),
                      style: AppTypography.displayClock,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      DateFormat('EEEE, d MMMM yyyy').format(_phoneTime),
                      style: const TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Timezone: Asia/Kolkata (UTC+05:30)',
                      style: TextStyle(fontSize: 13, color: Colors.white70),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.cardGap),

              // Dual Status Row (Phone Time vs RTC Time)
              SizedBox(
                height: 110,
                child: Row(
                  children: [
                    // Phone Time (White Card)
                    Expanded(
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
                            const Text(
                              'Phone Time',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textSecondaryLight,
                              ),
                            ),
                            Text(
                              phoneTimeStr,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textOnLight,
                              ),
                            ),
                            const Text(
                              'NTP Reference',
                              style: TextStyle(fontSize: 11, color: AppColors.textSecondaryLight),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.cardGap),

                    // RTC Time (Blue Card)
                    Expanded(
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
                            const Text(
                              'DS3231 RTC',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Colors.white70,
                              ),
                            ),
                            Text(
                              rtcTimeStr,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                            Text(
                              telemetry.isRtcAvailable ? 'Hardware Ready' : 'Disconnected',
                              style: const TextStyle(fontSize: 11, color: Colors.white70),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.cardGap),

              // Synchronization Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AppSpacing.cardPadding),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.sync_rounded, color: AppColors.primary, size: 22),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Time Synchronization', style: AppTypography.cardTitle),
                            Text(
                              telemetry.lastSyncTime != null
                                  ? 'Last sync: ${DateFormat('HH:mm:ss').format(telemetry.lastSyncTime!)}'
                                  : 'Not synchronized yet',
                              style: AppTypography.bodySecondary,
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Sends authoritative UTC timestamp to ESP32 microcontroller and writes BCD registers to DS3231 over I2C (address 0x68). Pulses CD4518 counters.',
                      style: AppTypography.bodySecondary,
                    ),
                    const SizedBox(height: 20),
                    PrimaryButton(
                      label: 'Synchronize Clock Now',
                      icon: Icons.sync_rounded,
                      isLoading: _isSyncing,
                      onPressed: () async {
                        setState(() => _isSyncing = true);
                        final res = await hwManager.syncEngine.synchronizeClockTime();
                        setState(() => _isSyncing = false);

                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                res.success
                                    ? 'Hardware clock & DS3231 RTC synchronized!'
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
              ),
              const SizedBox(height: AppSpacing.cardGap),

              // Time Format Toggle Card
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Time Display Format', style: AppTypography.cardTitle),
                        Text('12-Hour (AM/PM) or 24-Hour Military', style: AppTypography.caption),
                      ],
                    ),
                    SegmentedButton<bool>(
                      segments: const [
                        ButtonSegment(value: true, label: Text('24H')),
                        ButtonSegment(value: false, label: Text('12H')),
                      ],
                      selected: {is24H},
                      onSelectionChanged: (set) {
                        ref.read(is24HourFormatProvider.notifier).state = set.first;
                      },
                      style: ButtonStyle(
                        backgroundColor: MaterialStateProperty.resolveWith<Color>((states) {
                          if (states.contains(MaterialState.selected)) return AppColors.primary;
                          return AppColors.surfaceElevated;
                        }),
                        foregroundColor: MaterialStateProperty.all(Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
