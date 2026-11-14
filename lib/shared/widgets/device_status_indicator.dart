import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

/// C09: Device Status Indicator (Dot + Label with live hardware state)
class DeviceStatusIndicator extends StatelessWidget {
  final bool isConnected;
  final bool isConnecting;
  final String? customLabel;

  const DeviceStatusIndicator({
    super.key,
    required this.isConnected,
    this.isConnecting = false,
    this.customLabel,
  });

  @override
  Widget build(BuildContext context) {
    Color dotColor;
    String label;

    if (isConnecting) {
      dotColor = AppColors.warning;
      label = customLabel ?? 'Connecting...';
    } else if (isConnected) {
      dotColor = AppColors.success;
      label = customLabel ?? 'Connected';
    } else {
      dotColor = AppColors.disconnected;
      label = customLabel ?? 'Disconnected';
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: dotColor,
            shape: BoxShape.circle,
            boxShadow: isConnected
                ? [
                    BoxShadow(
                      color: dotColor.withOpacity(0.5),
                      blurRadius: 6,
                      spreadRadius: 1,
                    )
                  ]
                : null,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: isConnected ? AppColors.textPrimary : AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
}
