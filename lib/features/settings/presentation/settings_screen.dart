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
                    showDivider: false,
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

            // About & Version Info
            const Text('ABOUT & HARDWARE SPECS', style: AppTypography.caption),
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
                    icon: Icons.developer_board_rounded,
                    title: 'Hardware Circuit Architecture',
                    subtitle: 'ESP32 + DS3231 + CD4518 + 74HCT245',
                    onTap: () => context.push('/diagnostics'),
                  ),
                  SettingsRow(
                    icon: Icons.info_outline_rounded,
                    title: 'Mobile Companion Version',
                    subtitle: 'v1.0.0 (Production Architecture)',
                    showDivider: false,
                  ),
                ],
              ),
            ),
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
}
