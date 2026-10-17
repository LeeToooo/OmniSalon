import 'dart:async';
import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/editorial_image.dart';
import '../main_scaffold.dart';

class AiStylingScreen extends StatefulWidget {
  const AiStylingScreen({super.key});

  @override
  State<AiStylingScreen> createState() => _AiStylingScreenState();
}

class _AiStylingScreenState extends State<AiStylingScreen> {
  String _selectedHairstyle = 'layer-korean';
  String _selectedColor = 'natural-black';
  String _currentPhotoUrl = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80';

  bool _isScanning = false;
  double _scanProgress = 0.0;
  String _scanStageText = '';
  bool _hasResult = false;
  double _sliderPosition = 0.5;

  final _hairstyles = [
    {
      'id': 'layer-korean',
      'name': 'Layer Texture Tự Nhiên',
      'tag': 'THỜI THƯỢNG',
      'desc': 'Tỉa tầng bay bổng, uốn texture tạo độ phồng tự nhiên cho khuôn mặt Á Đông.',
      'preview': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
      'result': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
    },
    {
      'id': 'pompadour-luxury',
      'name': 'Pompadour & Mid Fade',
      'tag': 'LỊCH LÃM',
      'desc': 'Độ phồng vuốt ngược pomade kết hợp đường fade sắc nét 2 bên.',
      'preview': 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80',
      'result': 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
    },
    {
      'id': 'mullet-modern',
      'name': 'Modern Mullet & Taper Fade',
      'tag': 'PHONG CÁCH',
      'desc': 'Gáy tỉa so le mềm mại kết hợp đường cạo viền dứt khoát và nam tính.',
      'preview': 'https://images.unsplash.com/photo-1517832606589-7629c3395907?auto=format&fit=crop&w=400&q=80',
      'result': 'https://images.unsplash.com/photo-1517832606589-7629c3395907?auto=format&fit=crop&w=600&q=80',
    },
    {
      'id': 'sidepart-gentleman',
      'name': 'Side Part 7/3 Cổ Điển',
      'tag': 'QUÝ ÔNG',
      'desc': 'Đường rẽ ngôi tỉ lệ vàng tôn phom mặt, dễ dàng chải sáp suốt cả ngày.',
      'preview': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      'result': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    },
  ];

  final _hairColors = [
    {'id': 'natural-black', 'name': 'Đen Tự Nhiên', 'color': const Color(0xFF141413)},
    {'id': 'cold-ash-brown', 'name': 'Nâu Lạnh Sâu', 'color': const Color(0xFF523A28)},
    {'id': 'titan-grey', 'name': 'Xám Khói Titan', 'color': const Color(0xFF6B7280)},
    {'id': 'nordic-platinum', 'name': 'Vàng Cát Trầm', 'color': const Color(0xFFC59B27)},
  ];

  final _demoPortraits = [
    {'name': 'Mẫu Nam 01', 'url': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80'},
    {'name': 'Mẫu Nam 02', 'url': 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=500&q=80'},
    {'name': 'Mẫu Nam 03', 'url': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80'},
  ];

  void _runRestyleSimulation() {
    if (_isScanning) return;

    setState(() {
      _isScanning = true;
      _scanProgress = 0.0;
      _hasResult = false;
      _scanStageText = 'Đang nhận diện tọa độ ngũ quan và hộp sọ...';
    });

    Timer(const Duration(milliseconds: 700), () {
      if (!mounted) return;
      setState(() {
        _scanProgress = 0.45;
        _scanStageText = 'Đang dựng đa giác 3D phom tóc tuyển chọn...';
      });
    });

    Timer(const Duration(milliseconds: 1400), () {
      if (!mounted) return;
      setState(() {
        _scanProgress = 0.85;
        _scanStageText = 'Đang phối màu nhuộm & ray-tracing chiều sâu...';
      });
    });

    Timer(const Duration(milliseconds: 2100), () {
      if (!mounted) return;
      setState(() {
        _scanProgress = 1.0;
        _isScanning = false;
        _hasResult = true;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'CÔNG NGHỆ 3D VISION',
                style: AppTheme.labelUppercase(fontSize: 11, color: AppTheme.accentGold),
              ),
              const SizedBox(height: 6),
              Text(
                'Thử Kiểu Tóc 3D & Định Hình Phom Dáng',
                style: AppTheme.headingLarge(fontSize: 26),
              ),
              const SizedBox(height: 6),
              Text(
                'Mô phỏng chân thực dáng tóc theo từng đường nét khuôn mặt trước khi thợ barber thực hiện cắt kéo.',
                style: AppTheme.bodySmall(color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 18),

              // ========================================================
              // KHUNG XEM TRƯỚC ẢNH & HIỆU ỨNG QUÉT LASER
              // ========================================================
              Container(
                width: double.infinity,
                height: 300,
                decoration: BoxDecoration(
                  color: AppTheme.surfaceCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.borderColor),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(11),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      // Ảnh gốc hoặc Before/After
                      if (!_hasResult) ...[
                        EditorialImage(
                          imageUrl: _currentPhotoUrl,
                          fit: BoxFit.cover,
                        ),
                      ] else ...[
                        _buildBeforeAfterComparison(),
                      ],

                      // Lớp phủ khi đang quét
                      if (_isScanning) ...[
                        Container(
                          color: AppTheme.charcoal.withValues(alpha: 0.8),
                          child: Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const SizedBox(
                                    width: 36,
                                    height: 36,
                                    child: CircularProgressIndicator(
                                      color: AppTheme.accentGold,
                                      strokeWidth: 2.5,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'AI NEURAL SCANNING',
                                    style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.accentGold),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    _scanStageText,
                                    style: AppTheme.bodySmall(color: AppTheme.textLight, fontWeight: FontWeight.w600),
                                    textAlign: TextAlign.center,
                                  ),
                                  const SizedBox(height: 14),
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(3),
                                    child: LinearProgressIndicator(
                                      value: _scanProgress,
                                      backgroundColor: Colors.white.withValues(alpha: 0.15),
                                      valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.accentGold),
                                      minHeight: 4,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Chọn ảnh mẫu chân dung có sẵn
              Row(
                children: [
                  Text('CHỌN ẢNH MẪU:', style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.textSecondary)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: SizedBox(
                      height: 34,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _demoPortraits.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, idx) {
                          final p = _demoPortraits[idx];
                          final isSelected = _currentPhotoUrl == p['url'];
                          return ActionChip(
                            avatar: CircleAvatar(
                              backgroundImage: NetworkImage(p['url']!),
                              radius: 10,
                            ),
                            label: Text(p['name']!),
                            labelStyle: AppTheme.bodySmall(
                              fontSize: 11,
                              color: isSelected ? AppTheme.charcoal : AppTheme.textPrimary,
                              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                            ),
                            backgroundColor: isSelected ? AppTheme.accentGold : AppTheme.surfaceCard,
                            side: BorderSide(color: isSelected ? AppTheme.accentGold : AppTheme.borderColor),
                            onPressed: () {
                              setState(() {
                                _currentPhotoUrl = p['url']!;
                                _hasResult = false;
                              });
                            },
                          );
                        },
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // ========================================================
              // DANH SÁCH 4 PHOM DÁNG TÓC THỊNH HÀNH
              // ========================================================
              Text(
                'PHOM DÁNG TÓC THỊNH HÀNH',
                style: AppTheme.labelUppercase(fontSize: 11, color: AppTheme.accentGold),
              ),
              const SizedBox(height: 6),
              Text(
                'Chọn 1 phom tóc bên dưới để ướm thử lên khuôn mặt:',
                style: AppTheme.bodySmall(color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 12),

              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 1.85,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                ),
                itemCount: _hairstyles.length,
                itemBuilder: (context, index) {
                  final h = _hairstyles[index];
                  final isSelected = _selectedHairstyle == h['id'];

                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedHairstyle = h['id']!;
                        _hasResult = false;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isSelected ? AppTheme.surfaceElevated : AppTheme.surfaceCard,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isSelected ? AppTheme.accentGold : AppTheme.borderColor,
                          width: isSelected ? 1.5 : 1,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  h['name']!,
                                  style: AppTheme.headingSmall(
                                    fontSize: 13,
                                    color: isSelected ? AppTheme.accentGold : AppTheme.textPrimary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Icon(
                                isSelected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                                color: isSelected ? AppTheme.accentGold : AppTheme.textMuted,
                                size: 16,
                              ),
                            ],
                          ),
                          const SizedBox(height: 3),
                          Text(
                            h['tag']!,
                            style: AppTheme.labelUppercase(fontSize: 9, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 20),

              // ========================================================
              // MÀU NHUỘM PHỐI HỢP
              // ========================================================
              Text(
                'MÀU NHUỘM PHỐI HỢP',
                style: AppTheme.labelUppercase(fontSize: 11, color: AppTheme.accentGold),
              ),
              const SizedBox(height: 10),

              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: _hairColors.map((c) {
                  final isSelected = _selectedColor == c['id'];
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedColor = c['id'] as String;
                        _hasResult = false;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected ? AppTheme.surfaceElevated : AppTheme.surfaceCard,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isSelected ? AppTheme.accentGold : AppTheme.borderColor,
                          width: isSelected ? 1.5 : 1,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 14,
                            height: 14,
                            decoration: BoxDecoration(
                              color: c['color'] as Color,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: c['id'] == 'natural-black' ? const Color(0xFF94A3B8) : Colors.white,
                                width: 1.2,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            c['name'] as String,
                            style: AppTheme.bodySmall(
                              color: isSelected ? AppTheme.accentGold : AppTheme.textPrimary,
                              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),

              // NÚT CTA: MÔ PHỎNG KIỂU TÓC NGAY
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isScanning ? null : _runRestyleSimulation,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accentGold,
                    foregroundColor: AppTheme.charcoal,
                  ),
                  child: Text(
                    _isScanning ? 'ĐANG MÔ PHỎNG 3D...' : 'MÔ PHỎNG KIỂU TÓC NGAY →',
                    style: AppTheme.bodyLarge(fontWeight: FontWeight.w800, color: AppTheme.charcoal),
                  ),
                ),
              ),

              if (_hasResult) ...[
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton(
                    onPressed: () {
                      final scaffold = MainScaffold.of(context);
                      if (scaffold != null) {
                        scaffold.switchTab(2); // Chuyển sang Tab Đặt lịch
                      }
                    },
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppTheme.accentGold, width: 1.5),
                    ),
                    child: Text(
                      'Đặt Lịch Cắt Kiểu Này Ngay →',
                      style: AppTheme.bodyMedium(color: AppTheme.accentGold, fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  // Before & After Interactive Slider View
  Widget _buildBeforeAfterComparison() {
    final style = _hairstyles.firstWhere((h) => h['id'] == _selectedHairstyle);

    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final split = w * _sliderPosition;

        return Stack(
          fit: StackFit.expand,
          children: [
            // Ảnh kết quả bên dưới
            EditorialImage(
              imageUrl: style['result']!,
              fit: BoxFit.cover,
            ),

            // Ảnh trước cắt cắt xén bên trái
            ClipRect(
              clipper: _HorizontalSplitClipper(split),
              child: EditorialImage(
                imageUrl: _currentPhotoUrl,
                fit: BoxFit.cover,
              ),
            ),

            // Nhãn Trước / Sau
            Positioned(
              left: 12,
              bottom: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text('ẢNH GỐC', style: AppTheme.labelUppercase(fontSize: 9, color: Colors.white)),
              ),
            ),
            Positioned(
              right: 12,
              bottom: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.accentGold.withValues(alpha: 0.85),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text('MẪU 3D', style: AppTheme.labelUppercase(fontSize: 9, color: AppTheme.charcoal)),
              ),
            ),

            // Tay kéo điều khiển thanh trượt
            Positioned(
              left: split - 14,
              top: 0,
              bottom: 0,
              child: GestureDetector(
                behavior: HitTestBehavior.translucent,
                onHorizontalDragUpdate: (details) {
                  setState(() {
                    _sliderPosition = (_sliderPosition + details.delta.dx / w).clamp(0.05, 0.95);
                  });
                },
                child: Center(
                  child: Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: AppTheme.accentGold,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 6),
                      ],
                    ),
                    child: const Icon(Icons.compare_arrows_rounded, color: AppTheme.charcoal, size: 18),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _HorizontalSplitClipper extends CustomClipper<Rect> {
  final double splitWidth;
  _HorizontalSplitClipper(this.splitWidth);

  @override
  Rect getClip(Size size) {
    return Rect.fromLTWH(0, 0, splitWidth, size.height);
  }

  @override
  bool shouldReclip(_HorizontalSplitClipper oldClipper) => splitWidth != oldClipper.splitWidth;
}
