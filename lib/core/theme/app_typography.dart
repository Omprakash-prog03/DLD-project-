import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Centralized Typography Scale for Smart Clock App
/// Based on Inter / System Sans-Serif with dramatic weight and hierarchy contrasts.
class AppTypography {
  AppTypography._();

  static const String fontFamily = 'Inter';

  // Hero Display Numbers (Current Time, Large Counters)
  static const TextStyle displayClock = TextStyle(
    fontFamily: fontFamily,
    fontSize: 88,
    fontWeight: FontWeight.w800,
    letterSpacing: -2.0,
    height: 1.0,
    color: AppColors.textPrimary,
  );

  static const TextStyle displayClockSmall = TextStyle(
    fontFamily: fontFamily,
    fontSize: 72,
    fontWeight: FontWeight.w800,
    letterSpacing: -1.5,
    height: 1.0,
    color: AppColors.textPrimary,
  );

  // Large Metric Numbers (Stats, Metric rows)
  static const TextStyle largeStat = TextStyle(
    fontFamily: fontFamily,
    fontSize: 40,
    fontWeight: FontWeight.w700,
    letterSpacing: -1.0,
    height: 1.1,
    color: AppColors.textPrimary,
  );

  static const TextStyle largeStatLight = TextStyle(
    fontFamily: fontFamily,
    fontSize: 40,
    fontWeight: FontWeight.w700,
    letterSpacing: -1.0,
    height: 1.1,
    color: AppColors.textOnLight,
  );

  // Screen Titles
  static const TextStyle screenTitle = TextStyle(
    fontFamily: fontFamily,
    fontSize: 28,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.5,
    color: AppColors.textPrimary,
  );

  // Section Headings
  static const TextStyle sectionHeading = TextStyle(
    fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
  );

  // Card Titles
  static const TextStyle cardTitle = TextStyle(
    fontFamily: fontFamily,
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
  );

  // Body Text
  static const TextStyle bodyPrimary = TextStyle(
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: FontWeight.w400,
    color: AppColors.textPrimary,
  );

  static const TextStyle bodySecondary = TextStyle(
    fontFamily: fontFamily,
    fontSize: 13,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondary,
  );

  // Labels, Badges & Captions
  static const TextStyle caption = TextStyle(
    fontFamily: fontFamily,
    fontSize: 11,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.2,
    color: AppColors.textSecondary,
  );

  // Buttons
  static const TextStyle buttonText = TextStyle(
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.2,
    color: Colors.white,
  );

  // Time Picker Digits
  static const TextStyle timePickerSelected = TextStyle(
    fontFamily: fontFamily,
    fontSize: 48,
    fontWeight: FontWeight.w700,
    color: Colors.white,
  );

  static const TextStyle timePickerUnselected = TextStyle(
    fontFamily: fontFamily,
    fontSize: 48,
    fontWeight: FontWeight.w700,
    color: Color(0x66FFFFFF),
  );
}
