enum ReminderNotificationType {
  notificationOnly,
  soundAndNotification,
  silent,
}

/// Software-only Reminder Task Model.
/// Independent of hardware clock.
class ReminderModel {
  final String id;
  final String title;
  final DateTime dueDate;
  final bool isCompleted;
  final String notes;
  final ReminderNotificationType notificationType;
  final DateTime createdAt;

  ReminderModel({
    required this.id,
    required this.title,
    required this.dueDate,
    this.isCompleted = false,
    this.notes = '',
    this.notificationType = ReminderNotificationType.soundAndNotification,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  ReminderModel copyWith({
    String? id,
    String? title,
    DateTime? dueDate,
    bool? isCompleted,
    String? notes,
    ReminderNotificationType? notificationType,
    DateTime? createdAt,
  }) {
    return ReminderModel(
      id: id ?? this.id,
      title: title ?? this.title,
      dueDate: dueDate ?? this.dueDate,
      isCompleted: isCompleted ?? this.isCompleted,
      notes: notes ?? this.notes,
      notificationType: notificationType ?? this.notificationType,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
