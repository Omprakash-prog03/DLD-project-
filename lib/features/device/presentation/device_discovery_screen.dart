import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/di/providers.dart';
import '../../../hardware/interfaces/hardware_transport_adapter.dart';
import '../../../shared/widgets/app_bar_back.dart';
import '../../../shared/widgets/primary_button.dart';

/// Screen 18: Device Discovery (Scan for nearby ESP32 clocks over BLE / SoftAP)
class DeviceDiscoveryScreen extends ConsumerStatefulWidget {
  const DeviceDiscoveryScreen({super.key});

  @override
  ConsumerState<DeviceDiscoveryScreen> createState() => _DeviceDiscoveryScreenState();
}

class _DeviceDiscoveryScreenState extends ConsumerState<DeviceDiscoveryScreen> {
  bool _isScanning = false;
  final List<DiscoveredDevice> _devices = [];
  StreamSubscription? _scanSub;

  @override
  void initState() {
    super.initState();
    _startScan();
  }

  @override
  void dispose() {
    _scanSub?.cancel();
    super.dispose();
  }

  Future<void> _startScan() async {
    setState(() {
      _isScanning = true;
      _devices.clear();
    });

    final hwManager = ref.read(hardwareManagerProvider);
    final stream = await hwManager.scanDevices();

    _scanSub = stream.listen((device) {
      if (!_devices.any((d) => d.id == device.id)) {
        setState(() {
          _devices.add(device);
        });
      }
    });

    // Auto stop after 10 seconds
    Future.delayed(const Duration(seconds: 10), () {
      if (mounted) {
        setState(() => _isScanning = false);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const AppBarBack(),
        title: const Text('Discover Device'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.screenMarginHorizontal),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Pulse Scanning Hero Card (Blue)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.secondary,
                  borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.18),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: _isScanning
                            ? const SizedBox(
                                width: 28,
                                height: 28,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                              )
                            : const Icon(Icons.bluetooth_searching_rounded, color: Colors.white, size: 32),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      _isScanning ? 'Searching for Smart Clocks...' : 'Scan Complete',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Ensure your ESP32 device is powered and in proximity',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, color: Colors.white70),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sectionGap),

              const Text('DISCOVERED DEVICES', style: AppTypography.caption),
              const SizedBox(height: 10),

              Expanded(
                child: _devices.isEmpty
                    ? Center(
                        child: Text(
                          _isScanning ? 'Scanning RF channels...' : 'No Smart Clocks detected nearby.',
                          style: AppTypography.bodySecondary,
                        ),
                      )
                    : ListView.builder(
                        itemCount: _devices.length,
                        itemBuilder: (context, idx) {
                          final dev = _devices[idx];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 44,
                                      height: 44,
                                      decoration: BoxDecoration(
                                        color: AppColors.surfaceElevated,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: const Icon(Icons.watch_rounded, color: Colors.white, size: 24),
                                    ),
                                    const SizedBox(width: 14),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(dev.name, style: AppTypography.cardTitle),
                                        Text(
                                          '${dev.transportType.name.toUpperCase()} • RSSI: ${dev.rssi} dBm',
                                          style: AppTypography.caption,
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                ElevatedButton(
                                  onPressed: () {
                                    context.push('/device/pairing?id=${dev.id}&name=${Uri.encodeComponent(dev.name)}');
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                    minimumSize: const Size(80, 36),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                  child: const Text('Connect'),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),

              PrimaryButton(
                label: _isScanning ? 'Stop Scanning' : 'Restart Scan',
                isLoading: false,
                backgroundColor: AppColors.surfaceElevated,
                onPressed: _isScanning
                    ? () async {
                        final hw = ref.read(hardwareManagerProvider);
                        await hw.stopScan();
                        setState(() => _isScanning = false);
                      }
                    : _startScan,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
