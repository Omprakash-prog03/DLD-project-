import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

enum EventCategory {
  personal,
  work,
  study,
  general,
}

extension EventCategoryExtension on EventCategory {
  String get displayName {
    switch (this) {
      case EventCategory.personal:
        return 'Personal';
      case EventCategory.work:
        return 'Work';
      case EventCategory.study:
        return 'Study';
      case EventCategory.general:
        return 'General';
    }
  }

  Color get color {
    switch (this) {
      case EventCategory.personal:
        return AppColors.eventPersonal;
      case EventCategory.work:
        return AppColors.eventWork;
      case EventCategory.study:
        return AppColors.eventStudy;
      case EventCategory.general:
        return AppColors.eventGeneral;
    }
  }
}

/// Domain Model for Software Calendar Events.
/// Completely independent from hardware ESP32.
class CalendarEventModel {
  final String id;
  final String title;
  final String description;
  final DateTime startTime;
  final DateTime endTime;
  final bool isAllDay;
  final EventCategory category;
  final Color? customColor;
  final String? location;
  final bool hasNotification;
  final int reminderMinutesBefore;

  CalendarEventModel({
    required this.id,
    required this.title,
    this.description = '',
    required this.startTime,
    required this.endTime,
    this.isAllDay = false,
    this.category = EventCategory.general,
    this.customColor,
    this.location,
    this.hasNotification = true,
    this.reminderMinutesBefore = 15,
  });

  Color get displayColor => customColor ?? category.color;

  CalendarEventModel copyWith({
    String? id,
    String? title,
    String? description,
    DateTime? startTime,
    DateTime? endTime,
    bool? isAllDay,
    EventCategory? category,
    Color? customColor,
    String? location,
    bool? hasNotification,
    int? reminderMinutesBefore,
  }) {
    return CalendarEventModel(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      isAllDay: isAllDay ?? this.isAllDay,
      category: category ?? this.category,
      customColor: customColor ?? this.customColor,
      location: location ?? this.location,
      hasNotification: hasNotification ?? this.hasNotification,
      reminderMinutesBefore: reminderMinutesBefore ?? this.reminderMinutesBefore,
    );
  }
}
