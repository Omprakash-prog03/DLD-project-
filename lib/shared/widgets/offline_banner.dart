import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

/// Compact Hardware Offline Notification Banner
class OfflineBanner extends StatelessWidget {
  final String message;
  final VoidCallback? onReconnect;

  const OfflineBanner({
    super.key,
    this.message = 'Physical clock is disconnected. Showing cached data.',
    this.onReconnect,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: const Color(0xFF332A15),
      child: Row(
        children: [
          const Icon(Icons.cloud_off_rounded, size: 16, color: AppColors.warning),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Color(0xFFFBE4A0),
              ),
            ),
          ),
          if (onReconnect != null)
            GestureDetector(
              onTap: onReconnect,
              child: const Text(
                'Reconnect',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.warning,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
