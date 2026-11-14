import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/di/providers.dart';
import '../domain/alarm_model.dart';
import '../../../shared/widgets/app_bar_back.dart';
import '../../../shared/widgets/drum_time_picker.dart';
import '../../../shared/widgets/custom_chip.dart';
import '../../../shared/widgets/primary_button.dart';

/// Screen 06: Create Alarm Screen
class CreateAlarmScreen extends ConsumerStatefulWidget {
  const CreateAlarmScreen({super.key});

  @override
  ConsumerState<CreateAlarmScreen> createState() => _CreateAlarmScreenState();
}

class _CreateAlarmScreenState extends ConsumerState<CreateAlarmScreen> {
  int _hour = 7;
  int _minute = 0;
  final TextEditingController _labelController = TextEditingController(text: 'Morning Wakeup');
  List<int> _repeatDays = [1, 2, 3, 4, 5]; // Mon-Fri default
  bool _isOneTime = false;
  bool _snoozeEnabled = true;
  int _snoozeDuration = 5;
  bool _isSaving = false;

  final List<String> _dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  void _toggleDay(int dayIndex) {
    setState(() {
      if (_repeatDays.contains(dayIndex)) {
        _repeatDays.remove(dayIndex);
      } else {
        _repeatDays.add(dayIndex);
        _repeatDays.sort();
      }
      _isOneTime = _repeatDays.isEmpty;
    });
  }

  Future<void> _saveAlarm() async {
    setState(() => _isSaving = true);
    final repo = ref.read(alarmRepositoryProvider);

    final alarm = AlarmModel(
      id: 'alm-${const Uuid().v4().substring(0, 8)}',
      label: _labelController.text.trim().isEmpty ? 'Alarm' : _labelController.text.trim(),
      hour: _hour,
      minute: _minute,
      repeatDays: _repeatDays,
      isEnabled: true,
      isOneTime: _isOneTime,
      snoozeEnabled: _snoozeEnabled,
      snoozeDuration: _snoozeDuration,
      syncStatus: AlarmSyncStatus.pending,
    );

    await repo.createAlarm(alarm);
    setState(() => _isSaving = false);

    if (mounted) {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final is24H = ref.watch(is24HourFormatProvider);

    return Scaffold(
      appBar: AppBar(
        leading: const AppBarBack(),
        title: const Text('New Alarm'),
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _saveAlarm,
            child: const Text(
              'Save',
              style: TextStyle(
                color: AppColors.primary,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
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
              // Custom Drum Time Picker (C08)
              DrumTimePicker(
                initialHour: _hour,
                initialMinute: _minute,
                is24Hour: is24H,
                onTimeChanged: (h, m) {
                  _hour = h;
                  _minute = m;
                },
              ),
              const SizedBox(height: AppSpacing.sectionGap),

              // Alarm Label Input
              const Text('Alarm Label', style: AppTypography.cardTitle),
              const SizedBox(height: 8),
              TextField(
                controller: _labelController,
                style: const TextStyle(color: Colors.white, fontSize: 16),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: AppColors.surface,
                  hintText: 'Wake up, Study, Workout...',
                  hintStyle: const TextStyle(color: AppColors.textSecondary),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.sectionGap),

              // Repeat Days Selector
              const Text('Repeat Days', style: AppTypography.cardTitle),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(7, (idx) {
                  final isSelected = _repeatDays.contains(idx);
                  return CustomChip(
                    label: _dayNames[idx],
                    isSelected: isSelected,
                    isCircular: true,
                    onTap: () => _toggleDay(idx),
                  );
                }),
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('One time only', style: AppTypography.bodyPrimary),
                value: _isOneTime,
                activeColor: AppColors.primary,
                onChanged: (val) {
                  setState(() {
                    _isOneTime = val;
                    if (val) _repeatDays.clear();
                  });
                },
              ),
              const SizedBox(height: AppSpacing.sectionGap),

              // Snooze Settings
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
                        const Text('Allow Snooze', style: AppTypography.cardTitle),
                        Switch(
                          value: _snoozeEnabled,
                          activeColor: Colors.white,
                          activeTrackColor: AppColors.primary,
                          onChanged: (val) => setState(() => _snoozeEnabled = val),
                        ),
                      ],
                    ),
                    if (_snoozeEnabled) ...[
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Snooze Duration', style: AppTypography.bodyPrimary),
                          Row(
                            children: [5, 10, 15].map((d) {
                              final isSelected = _snoozeDuration == d;
                              return Padding(
                                padding: const EdgeInsets.only(left: 8),
                                child: CustomChip(
                                  label: '$d min',
                                  isSelected: isSelected,
                                  onTap: () => setState(() => _snoozeDuration = d),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.cardGap),

              // Hardware Sync Info Card (Blue Accent Border)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: const Border(
                    left: BorderSide(color: AppColors.secondary, width: 4),
                  ),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline_rounded, color: AppColors.secondary, size: 22),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'This alarm will sync to your physical clock when connected. The ESP32 executes alarms autonomously.',
                        style: AppTypography.bodySecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              PrimaryButton(
                label: 'Save & Synchronize Alarm',
                isLoading: _isSaving,
                onPressed: _saveAlarm,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
