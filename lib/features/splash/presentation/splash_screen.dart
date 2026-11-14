import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';

/// Screen 01: Splash Screen
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Timer(const Duration(milliseconds: 1800), () {
      if (mounted) {
        context.go('/');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Icon(Icons.alarm_rounded, color: Colors.white, size: 48),
            ),
            const SizedBox(height: 24),
            const Text('Smart Clock', style: AppTypography.screenTitle),
            const SizedBox(height: 8),
            const Text(
              'Hardware Companion v1.0.0',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13, letterSpacing: 0.5),
            ),
            const SizedBox(height: 48),
            const SizedBox(
              width: 140,
              child: LinearProgressIndicator(
                backgroundColor: AppColors.surfaceElevated,
                color: AppColors.primary,
                minHeight: 3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
