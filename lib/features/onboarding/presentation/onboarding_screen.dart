import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/primary_button.dart';

/// Screen 02: Onboarding Carousel (First launch introduction)
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<(String, String, IconData, Color)> _slides = [
    (
      'Your smart clock, in your hands',
      'Direct peer-to-peer control over your ESP32 digital clock with DS3231 RTC synchronization.',
      Icons.watch_rounded,
      AppColors.primary,
    ),
    (
      'Alarms that work offline',
      'Configured alarms execute autonomously on the hardware buzzer circuit even if your phone is off.',
      Icons.alarm_rounded,
      AppColors.secondary,
    ),
    (
      'Seamless hardware integration',
      'Instant low-latency pairing via Bluetooth Low Energy and local Wi-Fi SoftAP.',
      Icons.bluetooth_connected_rounded,
      AppColors.primary,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.screenMarginHorizontal),
          child: Column(
            children: [
              // Top Skip Button
              Align(
                alignment: Alignment.topRight,
                child: TextButton(
                  onPressed: () => context.go('/'),
                  child: const Text('Skip', style: TextStyle(color: AppColors.textSecondary)),
                ),
              ),

              // Page Carousel
              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: _slides.length,
                  onPageChanged: (idx) => setState(() => _currentPage = idx),
                  itemBuilder: (context, idx) {
                    final slide = _slides[idx];
                    return Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 140,
                          height: 140,
                          decoration: BoxDecoration(
                            color: slide.$4,
                            borderRadius: BorderRadius.circular(32),
                          ),
                          child: Icon(slide.$3, color: Colors.white, size: 72),
                        ),
                        const SizedBox(height: 36),
                        Text(
                          slide.$1,
                          textAlign: TextAlign.center,
                          style: AppTypography.screenTitle,
                        ),
                        const SizedBox(height: 12),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Text(
                            slide.$2,
                            textAlign: TextAlign.center,
                            style: AppTypography.bodyPrimary.copyWith(color: AppColors.textSecondary),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),

              // Dots Indicator
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_slides.length, (idx) {
                  final isSel = idx == _currentPage;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: isSel ? 24 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: isSel ? AppColors.primary : AppColors.surfaceElevated,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 32),

              // CTA Button
              PrimaryButton(
                label: _currentPage == _slides.length - 1 ? 'Get Started' : 'Next',
                onPressed: () {
                  if (_currentPage == _slides.length - 1) {
                    context.go('/');
                  } else {
                    _pageController.nextPage(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeInOut,
                    );
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
