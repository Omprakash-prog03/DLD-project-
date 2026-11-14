import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/di/providers.dart';
import '../../../hardware/protocol/hardware_command.dart';
import '../../../hardware/protocol/command_registry.dart';
import '../../../hardware/manager/hardware_communication_manager.dart';
import '../../../shared/widgets/app_bar_back.dart';
import '../../../shared/widgets/custom_chip.dart';
import '../../../shared/widgets/secondary_button.dart';

/// Screen 21: Technical Diagnostics & Developer Telemetry
class DeviceDiagnosticsScreen extends ConsumerStatefulWidget {
  const DeviceDiagnosticsScreen({super.key});

  @override
  ConsumerState<DeviceDiagnosticsScreen> createState() => _DeviceDiagnosticsScreenState();
}

class _DeviceDiagnosticsScreenState extends ConsumerState<DeviceDiagnosticsScreen> {
  String _selectedFilter = 'ALL';

  @override
  Widget build(BuildContext context) {
    final hwManager = ref.watch(hardwareManagerProvider);
    final logsAsync = ref.watch(diagnosticLogsProvider);
    final allLogs = logsAsync.valueOrNull ?? hwManager.diagnosticLogs;

    final filteredLogs = allLogs.where((l) {
      if (_selectedFilter == 'ALL') return true;
      return l.type == _selectedFilter;
    }).toList();

    final errorCount = allLogs.where((l) => l.type == 'ERROR').length;
    final cmdCount = allLogs.where((l) => l.type == 'COMMAND').length;
    final successRate = cmdCount > 0 ? (((cmdCount - errorCount) / cmdCount) * 100).toInt() : 100;

    return Scaffold(
      appBar: AppBar(
        leading: const AppBarBack(),
        title: const Text('Diagnostics'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_sweep_outlined, color: Colors.white),
            tooltip: 'Clear Log',
            onPressed: () => hwManager.clearLogs(),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.screenMarginHorizontal),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Summary Telemetry Cards
              Row(
                children: [
                  _buildSummaryMetric('Commands', '$cmdCount', AppColors.secondary),
                  const SizedBox(width: 10),
                  _buildSummaryMetric('Errors', '$errorCount', AppColors.error),
                  const SizedBox(width: 10),
                  _buildSummaryMetric('Success', '$successRate%', AppColors.success),
                ],
              ),
              const SizedBox(height: 16),

              // Filter Chips Row
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: ['ALL', 'COMMAND', 'RESPONSE', 'ERROR', 'SYSTEM'].map((f) {
                    final isSel = _selectedFilter == f;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: CustomChip(
                        label: f,
                        isSelected: isSel,
                        activeColor: f == 'ERROR' ? AppColors.error : AppColors.primary,
                        onTap: () => setState(() => _selectedFilter = f),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 14),

              // Developer Actions
              Row(
                children: [
                  Expanded(
                    child: SecondaryButton(
                      label: 'Send Ping',
                      icon: Icons.network_ping_rounded,
                      onPressed: () async {
                        final resp = await hwManager.sendCommand(
                          HardwareCommand(command: CommandRegistry.pingDevice),
                        );
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(resp.success ? 'Pong received!' : 'Ping failed'),
                              backgroundColor: resp.success ? AppColors.success : AppColors.error,
                            ),
                          );
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: SecondaryButton(
                      label: 'Health Check',
                      icon: Icons.health_and_safety_rounded,
                      onPressed: () async {
                        final resp = await hwManager.sendCommand(
                          HardwareCommand(command: CommandRegistry.getDeviceStatus),
                        );
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(resp.success ? 'RTC & Heap Healthy' : 'Health query failed'),
                              backgroundColor: resp.success ? AppColors.success : AppColors.error,
                            ),
                          );
                        }
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              const Text('TRANSACTION AUDIT LOG', style: AppTypography.caption),
              const SizedBox(height: 8),

              // Log Console in Dark Monospace Card
              Expanded(
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0A0A0A),
                    borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: filteredLogs.isEmpty
                      ? const Center(
                          child: Text(
                            'No recorded transactions matching filter.',
                            style: TextStyle(color: AppColors.textSecondary, fontFamily: 'monospace', fontSize: 13),
                          ),
                        )
                      : ListView.builder(
                          itemCount: filteredLogs.length,
                          itemBuilder: (context, idx) {
                            final entry = filteredLogs[idx];
                            final timeStr = DateFormat('HH:mm:ss.SSS').format(entry.timestamp);

                            Color badgeColor;
                            switch (entry.type) {
                              case 'COMMAND':
                                badgeColor = AppColors.secondary;
                                break;
                              case 'RESPONSE':
                                badgeColor = AppColors.success;
                                break;
                              case 'ERROR':
                                badgeColor = AppColors.error;
                                break;
                              default:
                                badgeColor = AppColors.textSecondary;
                            }

                            return Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: badgeColor.withOpacity(0.2),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          entry.type,
                                          style: TextStyle(
                                            color: badgeColor,
                                            fontSize: 10,
                                            fontWeight: FontWeight.w700,
                                            fontFamily: 'monospace',
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        timeStr,
                                        style: const TextStyle(
                                          color: AppColors.textSecondary,
                                          fontSize: 11,
                                          fontFamily: 'monospace',
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          entry.summary,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            fontFamily: 'monospace',
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    entry.details,
                                    style: const TextStyle(
                                      color: Color(0xFF888888),
                                      fontSize: 11,
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryMetric(String title, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color)),
            const SizedBox(height: 2),
            Text(title, style: AppTypography.caption),
          ],
        ),
      ),
    );
  }
}
