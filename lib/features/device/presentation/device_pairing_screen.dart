import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/di/providers.dart';
import '../../../shared/widgets/app_bar_back.dart';
import '../../../shared/widgets/primary_button.dart';

/// Screen 19: Device Pairing (Secure handshake & MTU exchange)
class DevicePairingScreen extends ConsumerStatefulWidget {
  final String deviceId;
  final String deviceName;

  const DevicePairingScreen({
    super.key,
    required this.deviceId,
    required this.deviceName,
  });

  @override
  ConsumerState<DevicePairingScreen> createState() => _DevicePairingScreenState();
}

class _DevicePairingScreenState extends ConsumerState<DevicePairingScreen> {
  String _statusMessage = 'Initiating transport handshake...';
  bool _isConnecting = true;
  bool _isSuccess = false;

  @override
  void initState() {
    super.initState();
    _startPairing();
  }

  Future<void> _startPairing() async {
    final hw = ref.read(hardwareManagerProvider);

    setState(() => _statusMessage = 'Negotiating 512-byte ATT MTU...');
    await Future.delayed(const Duration(milliseconds: 600));

    setState(() => _statusMessage = 'Discovering GATT Smart Clock services...');
    final success = await hw.connect(widget.deviceId);

    if (mounted) {
      if (success) {
        setState(() {
          _isConnecting = false;
          _isSuccess = true;
          _statusMessage = 'Paired & Synchronized Successfully!';
        });
      } else {
        setState(() {
          _isConnecting = false;
          _isSuccess = false;
          _statusMessage = 'Connection failed. Please retry.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const AppBarBack(),
        title: const Text('Pair Device'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.screenMarginHorizontal),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              // Animated Pulse Icon Container
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: _isSuccess
                      ? AppColors.success.withOpacity(0.18)
                      : AppColors.primary.withOpacity(0.18),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: _isConnecting
                      ? const SizedBox(
                          width: 48,
                          height: 48,
                          child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 4),
                        )
                      : Icon(
                          _isSuccess ? Icons.check_circle_rounded : Icons.error_outline_rounded,
                          color: _isSuccess ? AppColors.success : AppColors.error,
                          size: 64,
                        ),
                ),
              ),
              const SizedBox(height: 32),

              Text(widget.deviceName, style: AppTypography.screenTitle),
              const SizedBox(height: 8),
              Text(
                'ID: ${widget.deviceId}',
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontFamily: 'monospace'),
              ),
              const SizedBox(height: 20),

              Text(
                _statusMessage,
                textAlign: TextAlign.center,
                style: AppTypography.bodyPrimary,
              ),
              const Spacer(),

              if (!_isConnecting)
                PrimaryButton(
                  label: _isSuccess ? 'Go to Dashboard' : 'Retry Pairing',
                  backgroundColor: _isSuccess ? AppColors.success : AppColors.primary,
                  onPressed: () {
                    if (_isSuccess) {
                      context.go('/');
                    } else {
                      setState(() => _isConnecting = true);
                      _startPairing();
                    }
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}
