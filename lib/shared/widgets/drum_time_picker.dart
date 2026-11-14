import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';

/// C08: Drum Time Picker (Custom scroll wheel with red-orange highlight strip)
class DrumTimePicker extends StatefulWidget {
  final int initialHour;
  final int initialMinute;
  final bool is24Hour;
  final void Function(int hour, int minute) onTimeChanged;

  const DrumTimePicker({
    super.key,
    this.initialHour = 7,
    this.initialMinute = 0,
    this.is24Hour = true,
    required this.onTimeChanged,
  });

  @override
  State<DrumTimePicker> createState() => _DrumTimePickerState();
}

class _DrumTimePickerState extends State<DrumTimePicker> {
  late int _selectedHour;
  late int _selectedMinute;
  late FixedExtentScrollController _hourController;
  late FixedExtentScrollController _minuteController;

  static const double itemHeight = 60.0;

  @override
  void initState() {
    super.initState();
    _selectedHour = widget.initialHour;
    _selectedMinute = widget.initialMinute;
    _hourController = FixedExtentScrollController(initialItem: _selectedHour);
    _minuteController = FixedExtentScrollController(initialItem: _selectedMinute);
  }

  @override
  void dispose() {
    _hourController.dispose();
    _minuteController.dispose();
    super.dispose();
  }

  void _notify() {
    widget.onTimeChanged(_selectedHour, _selectedMinute);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 200,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Red-Orange Semi-Transparent Overlay Strip for selected row
          Container(
            height: itemHeight,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.18),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.primary.withOpacity(0.5),
                width: 1.5,
              ),
            ),
          ),
          // Scroll Columns
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Hours Wheel
              Expanded(
                child: ListWheelScrollView.useDelegate(
                  controller: _hourController,
                  itemExtent: itemHeight,
                  perspective: 0.003,
                  diameterRatio: 1.3,
                  physics: const FixedExtentScrollPhysics(),
                  onSelectedItemChanged: (index) {
                    setState(() {
                      _selectedHour = index % 24;
                    });
                    _notify();
                  },
                  childDelegate: ListWheelChildLoopingListDelegate(
                    children: List.generate(24, (i) {
                      final isSelected = i == _selectedHour;
                      return Center(
                        child: Text(
                          i.toString().padLeft(2, '0'),
                          style: isSelected
                              ? AppTypography.timePickerSelected
                              : AppTypography.timePickerUnselected,
                        ),
                      );
                    }),
                  ),
                ),
              ),
              // Separator ":"
              const Text(
                ':',
                style: TextStyle(
                  fontSize: 40,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              // Minutes Wheel
              Expanded(
                child: ListWheelScrollView.useDelegate(
                  controller: _minuteController,
                  itemExtent: itemHeight,
                  perspective: 0.003,
                  diameterRatio: 1.3,
                  physics: const FixedExtentScrollPhysics(),
                  onSelectedItemChanged: (index) {
                    setState(() {
                      _selectedMinute = index % 60;
                    });
                    _notify();
                  },
                  childDelegate: ListWheelChildLoopingListDelegate(
                    children: List.generate(60, (i) {
                      final isSelected = i == _selectedMinute;
                      return Center(
                        child: Text(
                          i.toString().padLeft(2, '0'),
                          style: isSelected
                              ? AppTypography.timePickerSelected
                              : AppTypography.timePickerUnselected,
                        ),
                      );
                    }),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
