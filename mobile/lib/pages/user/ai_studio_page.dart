import 'package:omni_salon_mobile/core/api/api_service.dart';
import 'package:flutter/material.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';
import 'package:omni_salon_mobile/components/editorial_image.dart';
import 'package:omni_salon_mobile/components/main_scaffold.dart';

class AiStylingScreen extends StatefulWidget {
  const AiStylingScreen({super.key});

  @override
  State<AiStylingScreen> createState() => _AiStylingScreenState();
}

class _AiStylingScreenState extends State<AiStylingScreen> {
  String _selectedHairstyle = 'layer-korean';
  String _selectedColor = 'natural-black';
  String _currentPhotoUrl = 'assets/hairstyles/sidepart-gentleman.jpg';
  String? _rawOriginalPhotoUrl;
  String? _croppedImageUrl;
  String _viewMode = 'cropped';

  bool _isScanning = false;
  String _scanStageText = '';
  bool _hasResult = false;
  String? _resultImageUrl;
  double _sliderPosition = 0.5;

  Map<String, dynamic>? _faceAnalysis;

  final _hairstyles = [
    {
      'id': 'layer-korean',
      'name': 'Layer Texture Tự Nhiên',
      'tag': 'THỜI THƯỢNG',
      'desc':
          'Tỉa tầng bay bổng, uốn texture tạo độ phồng tự nhiên cho khuôn mặt Á Đông.',
      'preview': 'assets/hairstyles/layer-korean.jpg',
    },
    {
      'id': 'pompadour-luxury',
      'name': 'Pompadour & Mid Fade',
      'tag': 'LỊCH LÃM',
      'desc': 'Độ phồng vuốt ngược pomade kết hợp đường fade sắc nét 2 bên.',
      'preview': 'assets/hairstyles/pompadour-luxury.jpg',
    },
    {
      'id': 'mullet-modern',
      'name': 'Modern Mullet & Taper Fade',
      'tag': 'PHONG CÁCH',
      'desc':
          'Gáy tỉa so le mềm mại kết hợp đường cạo viền dứt khoát và nam tính.',
      'preview': 'assets/hairstyles/mullet-modern.jpg',
    },
    {
      'id': 'sidepart-gentleman',
      'name': 'Side Part 7/3 Cổ Điển',
      'tag': 'QUÝ ÔNG',
      'desc':
          'Đường rẽ ngôi tỉ lệ vàng tôn phom mặt, dễ dàng chải sáp suốt cả ngày.',
      'preview': 'assets/hairstyles/sidepart-gentleman.jpg',
    },
    {
      'id': 'buzzcut-fade',
      'name': 'Buzz Cut & High Fade',
      'tag': 'DỨT KHOÁT',
      'desc': 'Húi cua ngắn gọn gàng, tôn trọn vẹn xương hàm nam tính.',
      'preview': 'assets/hairstyles/buzzcut-fade.jpg',
    },
    {
      'id': 'french-crop',
      'name': 'French Crop Textured',
      'tag': 'HIỆN ĐẠI',
      'desc': 'Mái bằng textured tỉa nhọn che trán cao, fade cao 2 bên mai.',
      'preview': 'assets/hairstyles/french-crop.jpg',
    },
  ];

  final _hairColors = [
    {
      'id': 'natural-black',
      'name': 'Đen Tự Nhiên',
      'color': const Color(0xFF141413)
    },
    {
      'id': 'cold-ash-brown',
      'name': 'Nâu Lạnh Sâu',
      'color': const Color(0xFF523A28)
    },
    {
      'id': 'titan-grey',
      'name': 'Xám Khói Titan',
      'color': const Color(0xFF6B7280)
    },
    {
      'id': 'nordic-platinum',
      'name': 'Vàng Cát Trầm',
      'color': const Color(0xFFC59B27)
    },
    {
      'id': 'chestnut-brown',
      'name': 'Nâu Hạt Dẻ',
      'color': const Color(0xFF6F4E37)
    },
    {'id': 'moss-ash', 'name': 'Rêu Khói', 'color': const Color(0xFF4A5568)},
  ];

  final _demoPortraits = [
    {
      'name': 'Mẫu 01 (Side Part)',
      'url': 'assets/hairstyles/sidepart-gentleman.jpg'
    },
    {
      'name': 'Mẫu 02 (Pompadour)',
      'url': 'assets/hairstyles/pompadour-luxury.jpg'
    },
    {
      'name': 'Mẫu 03 (Layer)',
      'url': 'assets/hairstyles/layer-korean.jpg'
    },
    {
      'name': 'Mẫu 04 (Mullet)',
      'url': 'assets/hairstyles/mullet-modern.jpg'
    },
  ];

  @override
  void initState() {
    super.initState();
    AppTheme.isDarkModeNotifier.addListener(_onThemeChanged);
    _rawOriginalPhotoUrl = _currentPhotoUrl;
    _triggerFaceAnalysis();
  }

  @override
  void dispose() {
    AppTheme.isDarkModeNotifier.removeListener(_onThemeChanged);
    super.dispose();
  }

  void _onThemeChanged() {
    if (mounted) setState(() {});
  }

  void _switchViewMode(String mode) {
    setState(() {
      _viewMode = mode;
      if (mode == 'cropped' && _croppedImageUrl != null) {
        _currentPhotoUrl = _croppedImageUrl!;
      } else {
        _currentPhotoUrl = _rawOriginalPhotoUrl ?? _currentPhotoUrl;
      }
    });
  }

  Future<void> _triggerFaceAnalysis() async {
    final targetPhoto = _rawOriginalPhotoUrl ?? _currentPhotoUrl;
    final res = await ApiService.analyzeFace(targetPhoto);
    if (!mounted) return;
    if (res != null && res['faceShape'] != null) {
      setState(() {
        _faceAnalysis = res;
        if (res['croppedImageUrl'] != null) {
          _croppedImageUrl = res['croppedImageUrl'].toString();
        }
        if (_viewMode == 'cropped' && _croppedImageUrl != null) {
          _currentPhotoUrl = _croppedImageUrl!;
        } else {
          _currentPhotoUrl = _rawOriginalPhotoUrl ?? _currentPhotoUrl;
        }
      });
    }
  }

  Future<void> _runRestyleSimulation() async {
    if (_isScanning) return;

    setState(() {
      _isScanning = true;
      _hasResult = false;
      _scanStageText = 'Đang tải ảnh lên và xử lý...';
    });

    try {
      final photoToSend =
          _croppedImageUrl ?? _rawOriginalPhotoUrl ?? _currentPhotoUrl;
      final res = await ApiService.restyleHair(
        imageBase64OrUrl: photoToSend,
        hairstyleId: _selectedHairstyle,
        colorId: _selectedColor,
      );

      if (!mounted) return;

      if (res != null && res['resultImageUrl'] != null) {
        setState(() {
          _isScanning = false;
          _hasResult = true;
          _resultImageUrl = res['resultImageUrl']?.toString();
          if (res['faceAnalysis'] != null) {
            _faceAnalysis = res['faceAnalysis'] as Map<String, dynamic>;
          }
        });
      } else {
        final style =
            _hairstyles.firstWhere((h) => h['id'] == _selectedHairstyle);
        setState(() {
          _isScanning = false;
          _hasResult = true;
          _resultImageUrl = style['preview'] ?? _currentPhotoUrl;
        });
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isScanning = false;
        _hasResult = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final shapeName = _faceAnalysis?['faceShape']?['name']?.toString() ??
        'Khuôn Mặt Vuông Chữ Điền';
    final skinTone = _faceAnalysis?['skinUndertone']?['name']?.toString() ??
        'Sắc Tố Da Ấm (Warm Undertone)';
    final barberAdvice = _faceAnalysis?['barberAdvice']?.toString() ??
        'Master Barber khuyên bạn nên sấy phồng chân tóc tạo volume và dùng sáp phù hợp để kiểm soát nếp suốt cả ngày.';

    return ValueListenableBuilder<bool>(
      valueListenable: AppTheme.isDarkModeNotifier,
      builder: (context, isDark, _) {
        return Scaffold(
          backgroundColor: AppTheme.bgPrimary,
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Text(
                          'OMNISALON LOOKBOOK & STYLING',
                          style: AppTheme.labelUppercase(
                              fontSize: 10.5, color: AppTheme.accentGold),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppTheme.accentGold.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                              color:
                                  AppTheme.accentGold.withValues(alpha: 0.4)),
                        ),
                        child: Text(
                          'TẠO MẪU',
                          style: AppTheme.labelUppercase(
                              fontSize: 9.5, color: AppTheme.accentGold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'THỬ KIỂU TÓC & TƯ VẤN DÁNG MẶT',
                    style: AppTheme.headingLarge(fontSize: 22),
                  ),
                  const SizedBox(height: 16),

                  // Khung xem trước ảnh
                  Container(
                    width: double.infinity,
                    height: 310,
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
                          if (!_hasResult) ...[
                            EditorialImage(
                              imageUrl: _currentPhotoUrl,
                              fit: BoxFit.cover,
                            ),
                          ] else ...[
                            _buildBeforeAfterComparison(),
                          ],

                          if (_isScanning) ...[
                            Container(
                              color: AppTheme.charcoal.withValues(alpha: 0.88),
                              child: Center(
                                child: Padding(
                                  padding: const EdgeInsets.all(24),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const SizedBox(
                                        width: 38,
                                        height: 38,
                                        child: CircularProgressIndicator(
                                          color: AppTheme.accentGold,
                                          strokeWidth: 2.5,
                                        ),
                                      ),
                                      const SizedBox(height: 16),
                                      Text(
                                        _scanStageText,
                                        style: AppTheme.bodySmall(
                                            color: AppTheme.textLight,
                                            fontWeight: FontWeight.w600),
                                        textAlign: TextAlign.center,
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

                  if (_croppedImageUrl != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceCard,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                            color: AppTheme.accentGold.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          Text(
                            'KHUNG HÌNH:',
                            style: AppTheme.labelUppercase(
                                fontSize: 9, color: AppTheme.accentGold),
                          ),
                          const Spacer(),
                          _buildViewModeChip('cropped', 'Tỉ lệ 3:4'),
                          const SizedBox(width: 4),
                          _buildViewModeChip('raw', 'Ảnh gốc'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],

                  // Chọn ảnh mẫu chân dung
                  Row(
                    children: [
                      Text('ẢNH MẪU:',
                          style: AppTheme.labelUppercase(
                              fontSize: 9.5, color: AppTheme.textSecondary)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: SizedBox(
                          height: 34,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: _demoPortraits.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(width: 8),
                            itemBuilder: (context, idx) {
                              final p = _demoPortraits[idx];
                              final isSelected =
                                  (_rawOriginalPhotoUrl ?? _currentPhotoUrl) ==
                                      p['url'];
                              return ActionChip(
                                label: Text(p['name']!),
                                labelStyle: AppTheme.bodySmall(
                                  fontSize: 11,
                                  color: isSelected
                                      ? AppTheme.charcoal
                                      : AppTheme.textPrimary,
                                  fontWeight: isSelected
                                      ? FontWeight.w700
                                      : FontWeight.w500,
                                ),
                                backgroundColor: isSelected
                                    ? AppTheme.accentGold
                                    : AppTheme.surfaceCard,
                                side: BorderSide(
                                    color: isSelected
                                        ? AppTheme.accentGold
                                        : AppTheme.borderColor),
                                onPressed: () {
                                  setState(() {
                                    _rawOriginalPhotoUrl = p['url']!;
                                    _currentPhotoUrl = p['url']!;
                                    _croppedImageUrl = null;
                                    _hasResult = false;
                                    _resultImageUrl = null;
                                  });
                                  _triggerFaceAnalysis();
                                },
                              );
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Khối tư vấn dáng mặt
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceElevated,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                          color: AppTheme.accentGold.withValues(alpha: 0.35)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Flexible(
                              flex: 5,
                              child: Text(
                                'TƯ VẤN DÁNG MẶT',
                                style: AppTheme.labelUppercase(
                                    fontSize: 10, color: AppTheme.accentGold),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Flexible(
                              flex: 6,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.accentGold,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  shapeName.toUpperCase(),
                                  style: AppTheme.labelUppercase(
                                      fontSize: 9, color: AppTheme.charcoal),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  textAlign: TextAlign.center,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          barberAdvice,
                          style:
                              AppTheme.bodySmall(color: AppTheme.textSecondary),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 4,
                          children: [
                            _buildInfoPill('Tông da', skinTone.split(' ')[0]),
                            _buildInfoPill('Tỉ lệ mặt', 'Chuẩn Á Đông'),
                            _buildInfoPill('Độ hợp cao nhất', '98%'),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Danh sách phom dáng tóc
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'PHOM DÁNG TÓC THỊNH HÀNH',
                        style: AppTheme.labelUppercase(
                            fontSize: 11, color: AppTheme.accentGold),
                      ),
                      Text('6 phom tuyển chọn',
                          style: AppTheme.bodySmall(
                              fontSize: 11, color: AppTheme.textSecondary)),
                    ],
                  ),
                  const SizedBox(height: 10),

                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 1.9,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                    ),
                    itemCount: _hairstyles.length,
                    itemBuilder: (context, index) {
                      final h = _hairstyles[index];
                      final isSelected = _selectedHairstyle == h['id'];
                      final scores = _faceAnalysis?['styleScores']
                          as Map<String, dynamic>?;
                      final matchScore =
                          scores?[h['id']]?['score']?.toString() ?? '95';

                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedHairstyle = h['id']!;
                            _hasResult = false;
                            _resultImageUrl = null;
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppTheme.accentGold.withValues(alpha: 0.1)
                                : AppTheme.surfaceCard,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isSelected
                                  ? AppTheme.accentGold
                                  : AppTheme.borderColor,
                              width: isSelected ? 1.5 : 1,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      h['name']!,
                                      style: AppTheme.bodySmall(
                                        fontWeight: FontWeight.w700,
                                        color: isSelected
                                            ? AppTheme.accentGold
                                            : AppTheme.textPrimary,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 4, vertical: 1),
                                    decoration: BoxDecoration(
                                      color: AppTheme.accentGold
                                          .withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(3),
                                    ),
                                    child: Text(
                                      '$matchScore%',
                                      style: AppTheme.labelUppercase(
                                          fontSize: 9,
                                          color: AppTheme.accentGold),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 3),
                              Text(
                                h['tag']!,
                                style: AppTheme.labelUppercase(
                                    fontSize: 9, color: AppTheme.textSecondary),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 18),

                  // Bảng màu nhuộm
                  Text(
                    'MÀU NHUỘM PHỐI HỢP',
                    style: AppTheme.labelUppercase(
                        fontSize: 11, color: AppTheme.accentGold),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 38,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _hairColors.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (context, idx) {
                        final c = _hairColors[idx];
                        final isSelected = _selectedColor == c['id'];
                        return ActionChip(
                          avatar: CircleAvatar(
                              backgroundColor: c['color'] as Color, radius: 8),
                          label: Text(c['name'] as String),
                          labelStyle: AppTheme.bodySmall(
                            fontSize: 11,
                            color: isSelected
                                ? AppTheme.accentGold
                                : AppTheme.textPrimary,
                            fontWeight:
                                isSelected ? FontWeight.w700 : FontWeight.w500,
                          ),
                          backgroundColor: isSelected
                              ? AppTheme.accentGold.withValues(alpha: 0.12)
                              : AppTheme.surfaceCard,
                          side: BorderSide(
                              color: isSelected
                                  ? AppTheme.accentGold
                                  : AppTheme.borderColor),
                          onPressed: () {
                            setState(() {
                              _selectedColor = c['id'] as String;
                              _hasResult = false;
                              _resultImageUrl = null;
                            });
                          },
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Nút xem trước kiểu tóc
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isScanning ? null : _runRestyleSimulation,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.accentGold,
                        foregroundColor: AppTheme.charcoal,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (_isScanning) ...[
                            const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                  color: AppTheme.charcoal, strokeWidth: 2),
                            ),
                            const SizedBox(width: 8),
                          ],
                          Flexible(
                            child: Text(
                              _isScanning
                                  ? 'Đang xử lý...'
                                  : 'Xem trước kiểu tóc →',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.charcoal,
                                letterSpacing: 0.2,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
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
                            scaffold.switchTab(2);
                          }
                        },
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(
                              color: AppTheme.accentGold, width: 1.5),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                        ),
                        child: Text(
                          'Đặt lịch cắt kiểu này ngay →',
                          style: AppTheme.bodyMedium(
                              color: AppTheme.accentGold,
                              fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 30),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildInfoPill(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Text(
        '$label: $value',
        style: AppTheme.bodySmall(
            fontSize: 10.5,
            color: AppTheme.textPrimary,
            fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget _buildViewModeChip(String mode, String label) {
    final isSelected = _viewMode == mode;
    return InkWell(
      onTap: () => _switchViewMode(mode),
      borderRadius: BorderRadius.circular(4),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.accentGold : Colors.transparent,
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 9.5,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? AppTheme.charcoal : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildBeforeAfterComparison() {
    final resultUrl = _resultImageUrl ?? _currentPhotoUrl;

    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final split = w * _sliderPosition;

        return Stack(
          fit: StackFit.expand,
          children: [
            EditorialImage(
              imageUrl: resultUrl,
              fit: BoxFit.cover,
            ),
            ClipRect(
              clipper: _HorizontalSplitClipper(split),
              child: EditorialImage(
                imageUrl: _rawOriginalPhotoUrl ?? _currentPhotoUrl,
                fit: BoxFit.cover,
              ),
            ),
            Positioned(
              left: 12,
              bottom: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.75),
                  borderRadius: BorderRadius.circular(4),
                  border:
                      Border.all(color: Colors.white.withValues(alpha: 0.2)),
                ),
                child: Text('ẢNH GỐC',
                    style: AppTheme.labelUppercase(
                        fontSize: 8.5, color: Colors.white)),
              ),
            ),
            Positioned(
              right: 12,
              bottom: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.accentGold.withValues(alpha: 0.95),
                  borderRadius: BorderRadius.circular(4),
                  boxShadow: [
                    BoxShadow(
                        color: Colors.black.withValues(alpha: 0.3),
                        blurRadius: 4),
                  ],
                ),
                child: Text('KIỂU TÓC MỚI',
                    style: AppTheme.labelUppercase(
                        fontSize: 8.5, color: AppTheme.charcoal)),
              ),
            ),
            Positioned(
              left: split - 15,
              top: 0,
              bottom: 0,
              child: GestureDetector(
                behavior: HitTestBehavior.translucent,
                onHorizontalDragUpdate: (details) {
                  setState(() {
                    _sliderPosition = (_sliderPosition + details.delta.dx / w)
                        .clamp(0.05, 0.95);
                  });
                },
                child: Center(
                  child: Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: AppTheme.accentGold,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                            color: Colors.black.withValues(alpha: 0.4),
                            blurRadius: 6),
                      ],
                    ),
                    child: const Icon(Icons.compare_arrows_rounded,
                        color: AppTheme.charcoal, size: 18),
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
  bool shouldReclip(_HorizontalSplitClipper oldClipper) =>
      splitWidth != oldClipper.splitWidth;
}

typedef AiStudioPage = AiStylingScreen;
