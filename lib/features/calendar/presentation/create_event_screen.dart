import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/di/providers.dart';
import '../domain/calendar_event_model.dart';
import '../../../shared/widgets/app_bar_back.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/custom_chip.dart';

/// Screen 12: Create Event Screen
class CreateEventScreen extends ConsumerStatefulWidget {
  const CreateEventScreen({super.key});

  @override
  ConsumerState<CreateEventScreen> createState() => _CreateEventScreenState();
}

class _CreateEventScreenState extends ConsumerState<CreateEventScreen> {
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  DateTime _startTime = DateTime.now().add(const Duration(hours: 1));
  DateTime _endTime = DateTime.now().add(const Duration(hours: 2));
  bool _isAllDay = false;
  EventCategory _category = EventCategory.general;

  Future<void> _saveEvent() async {
    if (_titleController.text.trim().isEmpty) return;

    final repo = ref.read(calendarRepositoryProvider);
    final event = CalendarEventModel(
      id: 'evt-${const Uuid().v4().substring(0, 8)}',
      title: _titleController.text.trim(),
      description: _descController.text.trim(),
      startTime: _startTime,
      endTime: _endTime,
      isAllDay: _isAllDay,
      category: _category,
    );

    await repo.createEvent(event);
    if (mounted) context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final timeFmt = DateFormat('EEE, d MMM • HH:mm');

    return Scaffold(
      appBar: AppBar(
        leading: const AppBarBack(),
        title: const Text('New Event'),
        actions: [
          TextButton(
            onPressed: _saveEvent,
            child: const Text(
              'Save',
              style: TextStyle(color: AppColors.secondary, fontSize: 16, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.screenMarginHorizontal),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Event Title Field
              TextField(
                controller: _titleController,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'Event Title',
                  hintStyle: TextStyle(color: AppColors.textSecondary, fontSize: 22),
                  border: InputBorder.none,
                ),
              ),
              const Divider(color: AppColors.divider),
              const SizedBox(height: 16),

              // Category Selector Chips
              const Text('Category', style: AppTypography.cardTitle),
              const SizedBox(height: 10),
              Row(
                children: EventCategory.values.map((cat) {
                  final isSelected = _category == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: CustomChip(
                      label: cat.displayName,
                      isSelected: isSelected,
                      activeColor: cat.color,
                      onTap: () => setState(() => _category = cat),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: AppSpacing.sectionGap),

              // Start & End Time Pickers Card
              Container(
                padding: const EdgeInsets.all(AppSpacing.cardPadding),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Starts', style: AppTypography.bodyPrimary),
                        Text(timeFmt.format(_startTime), style: AppTypography.cardTitle.copyWith(fontSize: 15)),
                      ],
                    ),
                    const Divider(color: AppColors.divider, height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Ends', style: AppTypography.bodyPrimary),
                        Text(timeFmt.format(_endTime), style: AppTypography.cardTitle.copyWith(fontSize: 15)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sectionGap),

              // Description Textarea
              const Text('Description', style: AppTypography.cardTitle),
              const SizedBox(height: 8),
              TextField(
                controller: _descController,
                maxLines: 4,
                style: const TextStyle(color: Colors.white, fontSize: 15),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: AppColors.surface,
                  hintText: 'Add notes, location or agenda...',
                  hintStyle: const TextStyle(color: AppColors.textSecondary),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 24),

              PrimaryButton(
                label: 'Save Event',
                backgroundColor: AppColors.secondary,
                onPressed: _saveEvent,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
