import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/app_bar_back.dart';

/// Screen 24: Appearance & Visual Themes
class AppearanceSettingsScreen extends StatefulWidget {
  const AppearanceSettingsScreen({super.key});

  @override
  State<AppearanceSettingsScreen> createState() => _AppearanceSettingsScreenState();
}

class _AppearanceSettingsScreenState extends State<AppearanceSettingsScreen> {
  int _selectedThemeIndex = 0; // 0 = Dark (Default), 1 = Light, 2 = System

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const AppBarBack(),
        title: const Text('Appearance'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.screenMarginHorizontal),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('THEME SELECTION', style: AppTypography.caption),
              const SizedBox(height: 12),

              Row(
                children: [
                  _buildThemeCard(0, 'Dark', Colors.black, AppColors.primary),
                  const SizedBox(width: 12),
                  _buildThemeCard(1, 'Light', Colors.white, Colors.black),
                  const SizedBox(width: 12),
                  _buildThemeCard(2, 'System', const Color(0xFF333333), AppColors.secondary),
                ],
              ),
              const SizedBox(height: AppSpacing.sectionGap),

              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AppSpacing.cardPadding),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('High-Contrast Dark Aesthetic', style: AppTypography.cardTitle),
                    SizedBox(height: 6),
                    Text(
                      'Optimized for OLED displays with near-black background (#111111) and bold saturated card blocks (#E84B2F, #3B5BDB). Minimizes battery consumption during hardware monitoring.',
                      style: AppTypography.bodySecondary,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildThemeCard(int index, String label, Color bg, Color accent) {
    final isSelected = _selectedThemeIndex == index;

    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedThemeIndex = index),
        child: Container(
          height: 120,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
            border: Border.all(
              color: isSelected ? AppColors.primary : Colors.transparent,
              width: 2,
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                height: 50,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: bg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white24),
                ),
                child: Center(
                  child: Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(color: accent, shape: BoxShape.circle),
                  ),
                ),
              ),
              Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected ? AppColors.primary : AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
