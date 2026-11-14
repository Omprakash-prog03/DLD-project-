import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';

/// C12: Circular Back Button (40dp diameter, dark elevated surface)
class AppBarBack extends StatelessWidget {
  final VoidCallback? onPressed;

  const AppBarBack({super.key, this.onPressed});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 48,
      height: 48,
      child: Center(
        child: InkWell(
          onTap: onPressed ?? () => Navigator.of(context).maybePop(),
          borderRadius: BorderRadius.circular(AppSpacing.circularButtonDiameter / 2),
          child: Container(
            width: AppSpacing.circularButtonDiameter,
            height: AppSpacing.circularButtonDiameter,
            decoration: const BoxDecoration(
              color: AppColors.surfaceElevated,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.arrow_back_ios_new_rounded,
              color: Colors.white,
              size: 18,
            ),
          ),
        ),
      ),
    );
  }
}
