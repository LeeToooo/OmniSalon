import 'dart:async';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class MarqueeBanner extends StatefulWidget {
  final List<String> items;
  final Color backgroundColor;
  final Color textColor;
  final double height;

  const MarqueeBanner({
    super.key,
    this.items = const [
      'AUTHENTIC BARBERSHOP',
      'PHONG CÁCH QUÝ ÔNG',
      'MÔ PHỎNG KIỂU TÓC 3D',
      'BẢO HÀNH KIỂU TÓC 7 NGÀY',
      'MASTER BARBER GIÀU KINH NGHIỆM',
      'DƯỢC LIỆU CAO CẤP',
    ],
    this.backgroundColor = AppTheme.charcoal,
    this.textColor = AppTheme.textLight,
    this.height = 36,
  });

  @override
  State<MarqueeBanner> createState() => _MarqueeBannerState();
}

class _MarqueeBannerState extends State<MarqueeBanner> {
  late final ScrollController _scrollController;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startAutoScroll();
    });
  }

  void _startAutoScroll() {
    _timer = Timer.periodic(const Duration(milliseconds: 30), (_) {
      if (!_scrollController.hasClients) return;
      final maxScroll = _scrollController.position.maxScrollExtent;
      final currentScroll = _scrollController.offset;
      if (currentScroll >= maxScroll - 1) {
        _scrollController.jumpTo(0);
      } else {
        _scrollController.jumpTo(currentScroll + 1.0);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Nhân bản danh sách items 4 lần để cuộn mượt mà vô tận
    final repeatedItems = [
      ...widget.items,
      ...widget.items,
      ...widget.items,
      ...widget.items,
    ];

    return Container(
      height: widget.height,
      color: widget.backgroundColor,
      alignment: Alignment.center,
      child: ListView.builder(
        controller: _scrollController,
        scrollDirection: Axis.horizontal,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: repeatedItems.length,
        itemBuilder: (context, index) {
          final text = repeatedItems[index];
          return Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: Text(
                  text,
                  style: AppTheme.labelUppercase(
                    fontSize: 10.5,
                    color: widget.textColor,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const Icon(
                Icons.circle,
                size: 4,
                color: AppTheme.accentGold,
              ),
            ],
          );
        },
      ),
    );
  }
}
