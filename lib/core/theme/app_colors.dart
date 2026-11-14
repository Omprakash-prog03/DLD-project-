import 'package:flutter/material.dart';

/// Centralized Design System Colors for Smart Clock App
/// Extracted from the high-contrast, bold color-blocked reference design.
class AppColors {
  AppColors._();

  // Canvas & Surfaces
  static const Color background = Color(0xFF111111);       // Near-black canvas
  static const Color surface = Color(0xFF1E1E1E);          // Standard card base
  static const Color surfaceElevated = Color(0xFF2A2A2A);  // Modals, bottom sheets, back buttons
  static const Color surfaceLight = Color(0xFFFFFFFF);     // High contrast white cards

  // Accent Colors
  static const Color primary = Color(0xFFE84B2F);          // Red-Orange (Hero, Alarms, Primary CTAs)
  static const Color secondary = Color(0xFF3B5BDB);        // Blue (Devices, Active states, Secondary)
  static const Color tertiary = Color(0xFF8B2A1A);         // Muted Red (Depth, Inactive states)

  // Typography Colors
  static const Color textPrimary = Color(0xFFFFFFFF);      // Primary text on dark surfaces
  static const Color textSecondary = Color(0xFFAAAAAA);    // Subtitles, captions, metadata
  static const Color textOnAccent = Color(0xFFFFFFFF);     // Text on primary/secondary cards
  static const Color textOnLight = Color(0xFF1A1A1A);      // Dark text on white cards
  static const Color textSecondaryLight = Color(0xFF666666);

  // Status Indicators
  static const Color success = Color(0xFF2ECC71);          // Connected, Synced
  static const Color warning = Color(0xFFF39C12);          // Pending, Syncing, Mock Banner
  static const Color error = Color(0xFFE84B2F);            // Failed, Disconnected error
  static const Color disconnected = Color(0xFF555555);     // Offline, Disabled

  // Structural & Dividers
  static const Color border = Color(0xFF2E2E2E);
  static const Color divider = Color(0xFF2A2A2A);

  // Calendar Event Categories
  static const Color eventPersonal = Color(0xFF3B5BDB);    // Blue
  static const Color eventWork = Color(0xFF7B2DBF);        // Purple
  static const Color eventStudy = Color(0xFF1A9B8C);       // Teal
  static const Color eventGeneral = Color(0xFF666666);     // Neutral Grey
  static const Color reminderAmber = Color(0xFFD4821A);    // Amber
}
