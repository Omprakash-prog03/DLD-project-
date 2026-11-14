import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/di/providers.dart';
import '../../../hardware/interfaces/hardware_transport_adapter.dart';
import '../../../shared/widgets/settings_row.dart';

/// Screen 22: Application & Hardware Settings
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final is24H = ref.watch(is24HourFormatProvider);
    final hwManager = ref.watch(hardwareManagerProvider);
    final telemetryAsync = ref.watch(deviceTelemetryProvider);
    final telemetry = telemetryAsync.valueOrNull ?? hwManager.stateManager.currentTelemetry;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.screenMarginHorizontal),
          children: [
            // Appearance Section
            const Text('APPEARANCE', style: AppTypography.caption),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
              ),
              child: Column(
                children: [
                  SettingsRow(
                    icon: Icons.palette_outlined,
                    title: 'Theme & Accent',
                    subtitle: 'Dark Mode (High Contrast)',
                    onTap: () => context.push('/settings/appearance'),
                  ),
                  SettingsRow(
                    icon: Icons.notifications_outlined,
                    title: 'Notifications',
                    subtitle: 'Reminder alerts & status banners',
                    onTap: () => context.push('/settings/notifications'),
                    showDivider: false,
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.sectionGap),

            // Time & Clock Section
            const Text('TIME & SYNCHRONIZATION', style: AppTypography.caption),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
              ),
              child: Column(
                children: [
                  SettingsRow(
                    icon: Icons.schedule_rounded,
                    title: '24-Hour Military Time',
                    subtitle: is24H ? '21:30' : '9:30 PM',
                    trailing: Switch(
                      value: is24H,
                      activeColor: Colors.white,
                      activeTrackColor: AppColors.primary,
                      onChanged: (val) {
                        ref.read(is24HourFormatProvider.notifier).state = val;
                      },
                    ),
                  ),
                  SettingsRow(
                    icon: Icons.public_rounded,
                    title: 'Hardware Timezone',
                    subtitle: 'Asia/Kolkata (UTC+05:30)',
                  ),
                  SettingsRow(
                    icon: Icons.sync_lock_rounded,
                    title: 'Auto-Sync on Connect',
                    subtitle: 'Update DS3231 RTC upon connection',
                    trailing: Switch(
                      value: true,
                      activeColor: Colors.white,
                      activeTrackColor: AppColors.secondary,
                      onChanged: (_) {},
                    ),
                    showDivider: false,
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.sectionGap),

            // Buzzer & Sound Configuration (Confirmed Supported)
            const Text('BUZZER & ALARM AUDIO', style: AppTypography.caption),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Piezo Buzzer (LEDC PWM)', style: AppTypography.cardTitle),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text('GPIO 25 • 2.4kHz', style: TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    '2N2222 NPN driver with 120-second automatic firmware safety cutoff to prevent buzzer overheating.',
                    style: AppTypography.bodySecondary,
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.sectionGap),

            // Display Brightness (CONFIRMED UNSUPPORTED BY HARDWARE REV 1)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('DISPLAY BRIGHTNESS', style: AppTypography.caption),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.error.withOpacity(0.18),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text('HARDWARE UNSUPPORTED', style: TextStyle(fontSize: 10, color: AppColors.error, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface.withOpacity(0.6),
                borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                border: Border.all(color: AppColors.divider),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('7-Segment Display Intensity', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w600, fontSize: 15)),
                      Text('Fixed 100%', style: TextStyle(color: AppColors.textSecondary, fontFamily: 'monospace', fontSize: 13)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Display circuit uses CD4511 decoders powered by static 5.0V; no PWM blanking pin connected in current PCB revision. Control is disabled.',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.sectionGap),

            // Hardware Transport Switcher (Mock / BLE / Wi-Fi)
            const Text('HARDWARE TRANSPORT ENGINE', style: AppTypography.caption),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Active Communication Adapter', style: AppTypography.cardTitle),
                  const SizedBox(height: 4),
                  const Text(
                    'Switch between simulated hardware for offline testing and real ESP32 Bluetooth / Wi-Fi links.',
                    style: AppTypography.bodySecondary,
                  ),
                  const SizedBox(height: 14),
                  Wrap(
                    spacing: 8,
                    children: [
                      _buildTransportChip(
                        context,
                        label: 'Mock (Simulated)',
                        selected: hwManager.activeAdapter.transportType == TransportType.mock,
                        onTap: () => hwManager.setTransport(TransportType.mock),
                      ),
                      _buildTransportChip(
                        context,
                        label: 'Bluetooth LE',
                        selected: hwManager.activeAdapter.transportType == TransportType.bluetoothLe,
                        onTap: () => hwManager.setTransport(TransportType.bluetoothLe),
                      ),
                      _buildTransportChip(
                        context,
                        label: 'Wi-Fi (REST)',
                        selected: hwManager.activeAdapter.transportType == TransportType.wifiRest,
                        onTap: () => hwManager.setTransport(TransportType.wifiRest),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.sectionGap),

            // About & Verified Hardware Specs
            const Text('VERIFIED HARDWARE SPECIFICATIONS', style: AppTypography.caption),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
              ),
              child: Column(
                children: [
                  _buildSpecRow('Microcontroller', telemetry.hardwareModel ?? 'ESP32-WROOM-32 (240MHz)'),
                  const Divider(color: AppColors.divider),
                  _buildSpecRow('Firmware Version', telemetry.firmwareVersion ?? 'v1.2.0'),
                  const Divider(color: AppColors.divider),
                  _buildSpecRow('Hardware RTC', 'DS3231 I2C (Address 0x68)'),
                  const Divider(color: AppColors.divider),
                  _buildSpecRow('BCD Display Logic', 'CD4518 / 74HCT245 (5.0V Domain)'),
                  const Divider(color: AppColors.divider),
                  _buildSpecRow('Protocol Standard', 'JSON Protocol v1.0 (Strict ACK)'),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildTransportChip(
    BuildContext context, {
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      selectedColor: AppColors.primary,
      backgroundColor: AppColors.surfaceElevated,
      labelStyle: TextStyle(
        color: selected ? Colors.white : AppColors.textSecondary,
        fontWeight: FontWeight.w600,
        fontSize: 12,
      ),
      onSelected: (_) => onTap(),
    );
  }

  Widget _buildSpecRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTypography.bodySecondary),
          Text(value, style: AppTypography.cardTitle.copyWith(fontSize: 13)),
        ],
      ),
    );
  }
}
