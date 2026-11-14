import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/di/providers.dart';
import '../domain/alarm_model.dart';
import '../../../shared/widgets/app_bar_back.dart';
import '../../../shared/widgets/drum_time_picker.dart';
import '../../../shared/widgets/custom_chip.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/confirmation_dialog.dart';

/// Screen 07: Edit Alarm Screen
class EditAlarmScreen extends ConsumerStatefulWidget {
  final String alarmId;

  const EditAlarmScreen({super.key, required this.alarmId});

  @override
  ConsumerState<EditAlarmScreen> createState() => _EditAlarmScreenState();
}

class _EditAlarmScreenState extends ConsumerState<EditAlarmScreen> {
  late TextEditingController _labelController;
  int _hour = 7;
  int _minute = 0;
  List<int> _repeatDays = [];
  bool _isOneTime = false;
  bool _snoozeEnabled = true;
  int _snoozeDuration = 5;
  bool _isSaving = false;
  bool _isLoaded = false;
  AlarmModel? _originalAlarm;

  final List<String> _dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  @override
  void initState() {
    super.initState();
    _labelController = TextEditingController();
    _loadAlarm();
  }

  Future<void> _loadAlarm() async {
    final repo = ref.read(alarmRepositoryProvider);
    final a = await repo.getAlarmById(widget.alarmId);
    if (a != null && mounted) {
      setState(() {
        _originalAlarm = a;
        _labelController.text = a.label;
        _hour = a.hour;
        _minute = a.minute;
        _repeatDays = List.from(a.repeatDays);
        _isOneTime = a.isOneTime;
        _snoozeEnabled = a.snoozeEnabled;
        _snoozeDuration = a.snoozeDuration;
        _isLoaded = true;
      });
    }
  }

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

  Future<void> _updateAlarm() async {
    if (_originalAlarm == null) return;
    setState(() => _isSaving = true);
    final repo = ref.read(alarmRepositoryProvider);

    final updated = _originalAlarm!.copyWith(
      label: _labelController.text.trim().isEmpty ? 'Alarm' : _labelController.text.trim(),
      hour: _hour,
      minute: _minute,
      repeatDays: _repeatDays,
      isOneTime: _isOneTime,
      snoozeEnabled: _snoozeEnabled,
      snoozeDuration: _snoozeDuration,
    );

    await repo.updateAlarm(updated);
    setState(() => _isSaving = false);

    if (mounted) {
      context.pop();
    }
  }

  Future<void> _deleteAlarm() async {
    ConfirmationDialog.show(
      context,
      title: 'Delete Alarm',
      message: 'Are you sure you want to remove this alarm from your device and physical clock?',
      confirmLabel: 'Delete',
      isDestructive: true,
      onConfirm: () async {
        final repo = ref.read(alarmRepositoryProvider);
        await repo.deleteAlarm(widget.alarmId);
        if (mounted) {
          context.go('/alarms');
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final is24H = ref.watch(is24HourFormatProvider);

    if (!_isLoaded) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    return Scaffold(
      appBar: AppBar(
        leading: const AppBarBack(),
        title: const Text('Edit Alarm'),
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _updateAlarm,
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

              const Text('Alarm Label', style: AppTypography.cardTitle),
              const SizedBox(height: 8),
              TextField(
                controller: _labelController,
                style: const TextStyle(color: Colors.white, fontSize: 16),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: AppColors.surface,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.sectionGap),

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
              const SizedBox(height: AppSpacing.sectionGap),

              PrimaryButton(
                label: 'Update Alarm',
                isLoading: _isSaving,
                onPressed: _updateAlarm,
              ),
              const SizedBox(height: 14),

              SizedBox(
                width: double.infinity,
                child: TextButton.icon(
                  onPressed: _deleteAlarm,
                  icon: const Icon(Icons.delete_outline_rounded, color: AppColors.error),
                  label: const Text(
                    'Delete Alarm',
                    style: TextStyle(
                      color: AppColors.error,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
