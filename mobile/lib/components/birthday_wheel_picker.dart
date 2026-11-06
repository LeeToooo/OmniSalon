import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';

/// Hiển thị bộ cuộn Ngày / Tháng / Năm dạng con lăn (Cupertino Wheel Picker)
/// chuẩn giao diện giống Hình 1 người dùng yêu cầu.
Future<DateTime?> showBirthdayWheelPicker(
  BuildContext context, {
  DateTime? initialDate,
}) async {
  final now = DateTime.now();
  final defaultDate = initialDate ?? DateTime(now.year - 20, 1, 1);
  const minYear = 1940;
  final maxYear = now.year - 5;

  int selectedYear = defaultDate.year.clamp(minYear, maxYear);
  int selectedMonth = defaultDate.month.clamp(1, 12);
  int selectedDay = defaultDate.day.clamp(1, 31);

  int getDaysInMonth(int year, int month) {
    return DateTime(year, month + 1, 0).day;
  }

  selectedDay = selectedDay.clamp(1, getDaysInMonth(selectedYear, selectedMonth));

  final dayController = FixedExtentScrollController(initialItem: selectedDay - 1);
  final monthController = FixedExtentScrollController(initialItem: selectedMonth - 1);
  final yearController = FixedExtentScrollController(initialItem: selectedYear - minYear);

  DateTime? confirmedDate;

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppTheme.surfaceCard,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) {
      return StatefulBuilder(
        builder: (ctx, setModal) {
          final maxDays = getDaysInMonth(selectedYear, selectedMonth);

          final selectionOverlay = Container(
            margin: const EdgeInsets.symmetric(horizontal: 4),
            decoration: BoxDecoration(
              color: AppTheme.isDarkMode
                  ? const Color(0x1FFFFFFF)
                  : const Color(0x0F000000),
              borderRadius: BorderRadius.circular(8),
            ),
          );

          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.only(left: 20, right: 20, top: 12, bottom: 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Thanh kéo handle
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: AppTheme.borderColor,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),

                  // Tiêu đề
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Ngày sinh',
                        style: AppTheme.headingMedium(fontSize: 22),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, size: 22),
                        color: AppTheme.textSecondary,
                        onPressed: () => Navigator.of(ctx).pop(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Hãy chọn ngày sinh của bạn để nhận đặc quyền và ưu đãi sinh nhật.',
                    style: AppTheme.bodySmall(color: AppTheme.textSecondary),
                  ),
                  const SizedBox(height: 12),

                  // Ô hiển thị ngày tháng năm đang chọn (ngày 8 tháng 12, 2003)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppTheme.bgPrimary,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.borderColor),
                    ),
                    child: Text(
                      'ngày $selectedDay tháng $selectedMonth, $selectedYear',
                      style: AppTheme.bodyLarge(
                        fontWeight: FontWeight.w700,
                        color: AppTheme.isDarkMode ? Colors.white : Colors.black,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Nút xác nhận: Chế độ tối giữ nguyên nền vàng, chế độ sáng viền vàng nền sáng như hình 2
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: AppTheme.isDarkMode
                        ? ElevatedButton(
                            onPressed: () {
                              confirmedDate = DateTime(selectedYear, selectedMonth, selectedDay);
                              Navigator.of(ctx).pop();
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.accentGold,
                              foregroundColor: AppTheme.charcoal,
                              elevation: 0,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: Text(
                              'Xác nhận',
                              style: AppTheme.bodyLarge(fontWeight: FontWeight.w700, color: AppTheme.charcoal),
                            ),
                          )
                        : OutlinedButton(
                            onPressed: () {
                              confirmedDate = DateTime(selectedYear, selectedMonth, selectedDay);
                              Navigator.of(ctx).pop();
                            },
                            style: OutlinedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: AppTheme.accentGold,
                              side: const BorderSide(color: AppTheme.accentGold, width: 1.5),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: Text(
                              'Xác nhận',
                              style: AppTheme.bodyLarge(fontWeight: FontWeight.w700, color: AppTheme.accentGold),
                            ),
                          ),
                  ),
                  const SizedBox(height: 16),

                  // Bộ 3 con lăn cuộn Ngày / Tháng / Năm
                  SizedBox(
                    height: 180,
                    child: Row(
                      children: [
                        // Cột Ngày
                        Expanded(
                          flex: 3,
                          child: CupertinoPicker.builder(
                            scrollController: dayController,
                            itemExtent: 40,
                            selectionOverlay: selectionOverlay,
                            onSelectedItemChanged: (idx) {
                              setModal(() {
                                selectedDay = idx + 1;
                              });
                            },
                            childCount: maxDays,
                            itemBuilder: (ctx, idx) {
                              final d = idx + 1;
                              final isSelected = d == selectedDay;
                              final textColor = isSelected
                                  ? (AppTheme.isDarkMode ? Colors.white : Colors.black)
                                  : AppTheme.textSecondary;
                              return Center(
                                child: Text(
                                  '$d',
                                  style: AppTheme.bodyLarge(
                                    fontSize: isSelected ? 18 : 15,
                                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400,
                                    color: textColor,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),

                        // Cột Tháng
                        Expanded(
                          flex: 4,
                          child: CupertinoPicker.builder(
                            scrollController: monthController,
                            itemExtent: 40,
                            selectionOverlay: selectionOverlay,
                            onSelectedItemChanged: (idx) {
                              setModal(() {
                                selectedMonth = idx + 1;
                                final newMax = getDaysInMonth(selectedYear, selectedMonth);
                                if (selectedDay > newMax) {
                                  selectedDay = newMax;
                                  dayController.jumpToItem(selectedDay - 1);
                                }
                              });
                            },
                            childCount: 12,
                            itemBuilder: (ctx, idx) {
                              final m = idx + 1;
                              final isSelected = m == selectedMonth;
                              final textColor = isSelected
                                  ? (AppTheme.isDarkMode ? Colors.white : Colors.black)
                                  : AppTheme.textSecondary;
                              return Center(
                                child: Text(
                                  'tháng $m',
                                  style: AppTheme.bodyLarge(
                                    fontSize: isSelected ? 18 : 15,
                                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400,
                                    color: textColor,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),

                        // Cột Năm
                        Expanded(
                          flex: 4,
                          child: CupertinoPicker.builder(
                            scrollController: yearController,
                            itemExtent: 40,
                            selectionOverlay: selectionOverlay,
                            onSelectedItemChanged: (idx) {
                              setModal(() {
                                selectedYear = minYear + idx;
                                final newMax = getDaysInMonth(selectedYear, selectedMonth);
                                if (selectedDay > newMax) {
                                  selectedDay = newMax;
                                  dayController.jumpToItem(selectedDay - 1);
                                }
                              });
                            },
                            childCount: maxYear - minYear + 1,
                            itemBuilder: (ctx, idx) {
                              final y = minYear + idx;
                              final isSelected = y == selectedYear;
                              final textColor = isSelected
                                  ? (AppTheme.isDarkMode ? Colors.white : Colors.black)
                                  : AppTheme.textSecondary;
                              return Center(
                                child: Text(
                                  '$y',
                                  style: AppTheme.bodyLarge(
                                    fontSize: isSelected ? 18 : 15,
                                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400,
                                    color: textColor,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      );
    },
  );

  dayController.dispose();
  monthController.dispose();
  yearController.dispose();

  return confirmedDate;
}
