import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/di/providers.dart';
import '../../../hardware/interfaces/hardware_transport_adapter.dart';
import '../../../hardware/protocol/hardware_command.dart';
import '../../../hardware/protocol/command_registry.dart';
import '../../../shared/widgets/mock_mode_banner.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/secondary_button.dart';

/// Screen 20: Device Dashboard (Real-time hardware status & peripheral telemetry)
class DeviceDashboardScreen extends ConsumerWidget {
  const DeviceDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hwManager = ref.watch(hardwareManagerProvider);
    final telemetryAsync = ref.watch(deviceTelemetryProvider);
    final telemetry = telemetryAsync.valueOrNull ?? hwManager.stateManager.currentTelemetry;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Device'),
        actions: [
          IconButton(
            icon: const Icon(Icons.analytics_outlined, color: Colors.white),
            onPressed: () => context.push('/diagnostics'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (hwManager.isMockMode) const MockModeBanner(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.screenMarginHorizontal),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Status Hero Card (Red-Orange if Connected, Dark Elevated if Disconnected)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: telemetry.isConnected ? AppColors.primary : AppColors.surface,
                        borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                        border: !telemetry.isConnected
                            ? Border.all(color: AppColors.border, width: 1.5)
                            : null,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                telemetry.isConnected ? 'Connected' : 'Disconnected',
                                style: const TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
                              ),
                              Container(
                                width: 14,
                                height: 14,
                                decoration: BoxDecoration(
                                  color: telemetry.isConnected ? AppColors.success : AppColors.disconnected,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            telemetry.deviceName ?? 'ESP32 Smart Clock',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            telemetry.lastSyncTime != null
                                ? 'Last heartbeat: ${DateFormat('HH:mm:ss').format(telemetry.lastSyncTime!)}'
                                : 'Hardware disconnected',
                            style: TextStyle(
                              fontSize: 12,
                              color: telemetry.isConnected ? Colors.white70 : AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.cardGap),

                    // Metric Row (Dual Cards)
                    SizedBox(
                      height: 110,
                      child: Row(
                        children: [
                          // Left: White Card (Firmware Version)
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
                                  Text(
                                    telemetry.firmwareVersion ?? 'v1.2.0',
                                    style: const TextStyle(
                                      fontSize: 28,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.textOnLight,
                                    ),
                                  ),
                                  const Text(
                                    'ESP32 Firmware',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.textSecondaryLight,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.cardGap),

                          // Right: Blue Card (RTC Status)
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
                                  Text(
                                    telemetry.isRtcAvailable ? 'OK' : 'OFFLINE',
                                    style: const TextStyle(
                                      fontSize: 28,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const Text(
                                    'DS3231 RTC Status',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.white70,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.cardGap),

                    // Quick Actions Row
                    Row(
                      children: [
                        Expanded(
                          child: SecondaryButton(
                            label: 'Sync Time',
                            icon: Icons.sync_rounded,
                            onPressed: () async {
                              final res = await hwManager.syncEngine.synchronizeClockTime();
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(res.success ? 'Time synchronized!' : 'Sync failed: ${res.errorMessage}'),
                                    backgroundColor: res.success ? AppColors.success : AppColors.error,
                                  ),
                                );
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: SecondaryButton(
                            label: 'Buzzer Test',
                            icon: Icons.volume_up_rounded,
                            onPressed: () async {
                              final resp = await hwManager.sendCommand(
                                HardwareCommand(command: CommandRegistry.stopAlarm),
                              );
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(resp.success ? 'Buzzer test tone triggered (200ms)' : 'Failed: ${resp.errorMessage}'),
                                    backgroundColor: resp.success ? AppColors.success : AppColors.error,
                                  ),
                                );
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.sectionGap),

                    // Connection Specifications & Details
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.cardPadding),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Hardware Specifications', style: AppTypography.cardTitle),
                          const SizedBox(height: 14),
                          _buildSpecRow('Active Transport', hwManager.activeAdapter.transportType.name.toUpperCase()),
                          const Divider(color: AppColors.divider),
                          _buildSpecRow('Microcontroller', telemetry.hardwareModel ?? 'ESP32-WROOM-32 (240MHz)'),
                          const Divider(color: AppColors.divider),
                          _buildSpecRow('RTC Crystal Module', 'DS3231 TCXO I2C (0x68)'),
                          const Divider(color: AppColors.divider),
                          _buildSpecRow('BCD Display Logic', 'CD4518 / 74HCT245 (5.0V Domain)'),
                          const Divider(color: AppColors.divider),
                          _buildSpecRow('Protocol Version', '1.0.0 (Strict Handshake)'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Connect / Disconnect Action
                    if (telemetry.isConnected)
                      SecondaryButton(
                        label: 'Disconnect Device',
                        icon: Icons.link_off_rounded,
                        textColor: AppColors.error,
                        onPressed: () => hwManager.disconnect(),
                      )
                    else
                      PrimaryButton(
                        label: 'Scan & Connect Device',
                        icon: Icons.bluetooth_searching_rounded,
                        onPressed: () => context.push('/device/discovery'),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSpecRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTypography.bodySecondary),
          Text(value, style: AppTypography.cardTitle.copyWith(fontSize: 14)),
        ],
      ),
    );
  }
}
