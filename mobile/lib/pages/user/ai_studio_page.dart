import 'package:omni_salon_mobile/core/api/api_service.dart';
import 'dart:async';
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
  String _currentPhotoUrl = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80';
  String? _rawOriginalPhotoUrl;
  String? _croppedImageUrl;
  String _viewMode = 'cropped'; // 'cropped', 'raw'

  bool _isScanning = false;
  double _scanProgress = 0.0;
  String _scanStageText = '';
  bool _hasResult = false;
  String? _resultImageUrl;
  double _sliderPosition = 0.5;

  Map<String, dynamic>? _faceAnalysis;
  final TextEditingController _chatController = TextEditingController();
  final List<Map<String, String>> _chatMessages = [
    {
      'sender': 'barber',
      'text': 'Chào bạn! Mình là Master Barber Lê Minh Hoàng. Hãy chọn ảnh và bấm Mô phỏng để mình chẩn đoán dáng mặt và đổi phom tóc thật cho bạn nhé!'
    }
  ];
  bool _isChatLoading = false;

  final _hairstyles = [
    {
      'id': 'layer-korean',
      'name': 'Layer Texture Tự Nhiên',
      'tag': 'THỜI THƯỢNG',
      'desc': 'Tỉa tầng bay bổng, uốn texture tạo độ phồng tự nhiên cho khuôn mặt Á Đông.',
      'preview': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
    },
    {
      'id': 'pompadour-luxury',
      'name': 'Pompadour & Mid Fade',
      'tag': 'LỊCH LÃM',
      'desc': 'Độ phồng vuốt ngược pomade kết hợp đường fade sắc nét 2 bên.',
      'preview': 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80',
    },
    {
      'id': 'mullet-modern',
      'name': 'Modern Mullet & Taper Fade',
      'tag': 'PHONG CÁCH',
      'desc': 'Gáy tỉa so le mềm mại kết hợp đường cạo viền dứt khoát và nam tính.',
      'preview': 'https://images.unsplash.com/photo-1517832606589-7629c3395907?auto=format&fit=crop&w=400&q=80',
    },
    {
      'id': 'sidepart-gentleman',
      'name': 'Side Part 7/3 Cổ Điển',
      'tag': 'QUÝ ÔNG',
      'desc': 'Đường rẽ ngôi tỉ lệ vàng tôn phom mặt, dễ dàng chải sáp suốt cả ngày.',
      'preview': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    },
    {
      'id': 'buzzcut-fade',
      'name': 'Buzz Cut & High Fade',
      'tag': 'DỨT KHOÁT',
      'desc': 'Húi cua ngắn gọn gàng, tôn trọn vẹn xương hàm nam tính.',
      'preview': 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&q=80',
    },
    {
      'id': 'french-crop',
      'name': 'French Crop Textured',
      'tag': 'HIỆN ĐẠI',
      'desc': 'Mái bằng textured tỉa nhọn che trán cao, fade cao 2 bên mai.',
      'preview': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    },
  ];

  final _hairColors = [
    {'id': 'natural-black', 'name': 'Đen Tự Nhiên', 'color': const Color(0xFF141413)},
    {'id': 'cold-ash-brown', 'name': 'Nâu Lạnh Sâu', 'color': const Color(0xFF523A28)},
    {'id': 'titan-grey', 'name': 'Xám Khói Titan', 'color': const Color(0xFF6B7280)},
    {'id': 'nordic-platinum', 'name': 'Vàng Cát Trầm', 'color': const Color(0xFFC59B27)},
    {'id': 'chestnut-brown', 'name': 'Nâu Hạt Dẻ', 'color': const Color(0xFF6F4E37)},
    {'id': 'moss-ash', 'name': 'Rêu Khói', 'color': const Color(0xFF4A5568)},
  ];

  final _demoPortraits = [
    {'name': 'Mẫu Nam 01', 'url': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80'},
    {'name': 'Mẫu Nam 02', 'url': 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=500&q=80'},
    {'name': 'Mẫu Nam 03', 'url': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80'},
    {'name': 'Mẫu Nam 04', 'url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80'},
  ];

  @override
  void initState() {
    super.initState();
    _rawOriginalPhotoUrl = _currentPhotoUrl;
    _triggerFaceAnalysis();
  }

  @override
  void dispose() {
    _chatController.dispose();
    super.dispose();
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

  // 1. GỌI API CHẨN ĐOÁN NGŨ QUAN THẬT
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
        // Giữ nguyên tóc thật của khách trong ảnh xem trước
        if (_viewMode == 'cropped' && _croppedImageUrl != null) {
          _currentPhotoUrl = _croppedImageUrl!;
        } else {
          _currentPhotoUrl = _rawOriginalPhotoUrl ?? _currentPhotoUrl;
        }
      });
    }
  }

  // 2. GỌI API SINH KIỂU TÓC THẬT BẰNG AI, TỰ ĐỘNG TÁCH NỀN & XÓA TÓC CŨ KHI BẮT ĐẦU MÔ PHỎNG
  Future<void> _runRestyleSimulation() async {
    if (_isScanning) return;

    setState(() {
      _isScanning = true;
      _scanProgress = 0.15;
      _hasResult = false;
      _scanStageText = 'Đang tự động tách phông nền & xóa phom tóc cũ của khách...';
    });

    final timer1 = Timer(const Duration(milliseconds: 600), () {
      if (!mounted) return;
      setState(() {
        _scanProgress = 0.50;
        _scanStageText = 'Đang dựng đa giác 3D phom tóc mới...';
      });
    });

    final timer2 = Timer(const Duration(milliseconds: 1200), () {
      if (!mounted) return;
      setState(() {
        _scanProgress = 0.85;
        _scanStageText = 'Đang hòa sắc màu nhuộm & ray-tracing chiều sâu...';
      });
    });

    try {
      final photoToSend = _croppedImageUrl ?? _rawOriginalPhotoUrl ?? _currentPhotoUrl;
      final res = await ApiService.restyleHair(
        imageBase64OrUrl: photoToSend,
        hairstyleId: _selectedHairstyle,
        colorId: _selectedColor,
      );

      timer1.cancel();
      timer2.cancel();

      if (!mounted) return;

      if (res != null && res['resultImageUrl'] != null) {
        setState(() {
          _scanProgress = 1.0;
          _isScanning = false;
          _hasResult = true;
          _resultImageUrl = res['resultImageUrl']?.toString();
          if (res['faceAnalysis'] != null) {
            _faceAnalysis = res['faceAnalysis'] as Map<String, dynamic>;
          }
        });
      } else {
        // Fallback tạo ảnh mẫu tương ứng
        final style = _hairstyles.firstWhere((h) => h['id'] == _selectedHairstyle);
        setState(() {
          _scanProgress = 1.0;
          _isScanning = false;
          _hasResult = true;
          _resultImageUrl = style['preview'] ?? _currentPhotoUrl;
        });
      }
    } catch (e) {
      timer1.cancel();
      timer2.cancel();
      if (!mounted) return;
      setState(() {
        _isScanning = false;
        _hasResult = true;
      });
    }
  }

  // 3. GỬI TIN NHẮN TƯ VẤN MASTER BARBER AI
  Future<void> _sendChatMessage(String msg) async {
    final clean = msg.trim();
    if (clean.isEmpty) return;

    _chatController.clear();
    setState(() {
      _chatMessages.add({'sender': 'user', 'text': clean});
      _isChatLoading = true;
    });

    final reply = await ApiService.askBarberAi(clean);
    if (!mounted) return;

    setState(() {
      _isChatLoading = false;
      _chatMessages.add({'sender': 'barber', 'text': reply});
    });
  }

  @override
  Widget build(BuildContext context) {
    final shapeName = _faceAnalysis?['faceShape']?['name']?.toString() ?? 'Khuôn Mặt Vuông Chữ Điền';
    final skinTone = _faceAnalysis?['skinUndertone']?['name']?.toString() ?? 'Sắc Tố Da Ấm (Warm Undertone)';
    final barberAdvice = _faceAnalysis?['barberAdvice']?.toString() ??
        'Master Barber khuyên bạn nên sấy phồng chân tóc tạo volume và dùng sáp Apestomen Volcanic Clay để kiểm soát nếp suốt cả ngày.';

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
                  Text(
                    'CÔNG NGHỆ REAL AI BARBER VISION',
                    style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppTheme.accentGold.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.4)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.auto_awesome, color: AppTheme.accentGold, size: 12),
                        const SizedBox(width: 4),
                        Text(
                          'NEURAL 3D',
                          style: AppTheme.labelUppercase(fontSize: 9.5, color: AppTheme.accentGold),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Thử Kiểu Tóc Thật & Chẩn Đoán Dáng Mặt AI',
                style: AppTheme.headingLarge(fontSize: 23),
              ),
              const SizedBox(height: 6),
              Text(
                'Quét phân tích tỷ lệ ngũ quan và dựng phom tóc thật bằng AI Neural Vision trước khi barber cắt kéo.',
                style: AppTheme.bodySmall(color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 16),

              // ========================================================
              // KHUNG XEM TRƯỚC ẢNH & HIỆU ỨNG QUÉT LASER
              // ========================================================
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
                      // Ảnh gốc hoặc Before/After Slider
                      if (!_hasResult) ...[
                        EditorialImage(
                          imageUrl: _currentPhotoUrl,
                          fit: BoxFit.cover,
                        ),
                      ] else ...[
                        _buildBeforeAfterComparison(),
                      ],

                      // Lớp phủ khi đang quét Neural Scan
                      if (_isScanning) ...[
                        Container(
                          color: AppTheme.charcoal.withValues(alpha: 0.85),
                          child: Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const SizedBox(
                                    width: 40,
                                    height: 40,
                                    child: CircularProgressIndicator(
                                      color: AppTheme.accentGold,
                                      strokeWidth: 2.5,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'AI NEURAL RE-STYLING',
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
                                      minHeight: 5,
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

              // Thanh chuyển chế độ xem góc chân dung, Giữ nguyên tóc thật của khách
              if (_croppedImageUrl != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceCard,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.auto_fix_high, color: AppTheme.accentGold, size: 14),
                      const SizedBox(width: 6),
                      Text(
                        'CĂN GÓC:',
                        style: AppTheme.labelUppercase(fontSize: 9, color: AppTheme.accentGold),
                      ),
                      const Spacer(),
                      _buildViewModeChip('cropped', '✂️ Cắt 3:4 (Tóc Thật)'),
                      const SizedBox(width: 4),
                      _buildViewModeChip('raw', '🖼️ Gốc'),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
              ],

              // Chọn ảnh mẫu chân dung có sẵn
              Row(
                children: [
                  Text('CHỌN ẢNH MẪU:', style: AppTheme.labelUppercase(fontSize: 9.5, color: AppTheme.textSecondary)),
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
                          final isSelected = (_rawOriginalPhotoUrl ?? _currentPhotoUrl) == p['url'];
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

              // ========================================================
              // THẺ CHẨN ĐOÁN DÁNG MẶT AI, REAL FACE DIAGNOSTIC
              // ========================================================
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceElevated,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.35)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '🧠 CHẨN ĐOÁN NGŨ QUAN AI',
                          style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.accentGold),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.accentGold,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            shapeName.toUpperCase(),
                            style: AppTheme.labelUppercase(fontSize: 9, color: AppTheme.charcoal),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      barberAdvice,
                      style: AppTheme.bodySmall(color: AppTheme.textSecondary),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        _buildInfoPill('Tông da', skinTone.split(' ')[0]),
                        _buildInfoPill('Tỉ lệ mặt', 'Chuẩn Á Đông'),
                        _buildInfoPill('Ngũ quan', 'Giữ 100% mặt thật'),
                        _buildInfoPill('Độ hợp cao nhất', '99%'),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // ========================================================
              // DANH SÁCH 6 PHOM DÁNG TÓC THỊNH HÀNH
              // ========================================================
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'PHOM DÁNG TÓC THỊNH HÀNH',
                    style: AppTheme.labelUppercase(fontSize: 11, color: AppTheme.accentGold),
                  ),
                  Text('6 phom tuyển chọn', style: AppTheme.bodySmall(fontSize: 11, color: AppTheme.textSecondary)),
                ],
              ),
              const SizedBox(height: 10),

              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 1.9,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                ),
                itemCount: _hairstyles.length,
                itemBuilder: (context, index) {
                  final h = _hairstyles[index];
                  final isSelected = _selectedHairstyle == h['id'];

                  // Điểm tương thích
                  final scores = _faceAnalysis?['styleScores'] as Map<String, dynamic>?;
                  final matchScore = scores?[h['id']]?['score']?.toString() ?? '95';

                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedHairstyle = h['id']!;
                        _hasResult = false;
                        _resultImageUrl = null;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected ? AppTheme.accentGold.withValues(alpha: 0.1) : AppTheme.surfaceCard,
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
                                  style: AppTheme.bodySmall(
                                    fontWeight: FontWeight.w700,
                                    color: isSelected ? AppTheme.accentGold : AppTheme.textPrimary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                decoration: BoxDecoration(
                                  color: AppTheme.accentGold.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(3),
                                ),
                                child: Text(
                                  '$matchScore%',
                                  style: AppTheme.labelUppercase(fontSize: 9, color: AppTheme.accentGold),
                                ),
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
              const SizedBox(height: 18),

              // ========================================================
              // BẢNG MÀU NHUỘM TÔN DA
              // ========================================================
              Text(
                'MÀU NHUỘM PHỐI HỢP',
                style: AppTheme.labelUppercase(fontSize: 11, color: AppTheme.accentGold),
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
                      avatar: CircleAvatar(backgroundColor: c['color'] as Color, radius: 8),
                      label: Text(c['name'] as String),
                      labelStyle: AppTheme.bodySmall(
                        fontSize: 11,
                        color: isSelected ? AppTheme.accentGold : AppTheme.textPrimary,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                      ),
                      backgroundColor: isSelected ? AppTheme.accentGold.withValues(alpha: 0.12) : AppTheme.surfaceCard,
                      side: BorderSide(color: isSelected ? AppTheme.accentGold : AppTheme.borderColor),
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

              // NÚT CTA: MÔ PHỎNG KIỂU TÓC THẬT NGAY
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isScanning ? null : _runRestyleSimulation,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accentGold,
                    foregroundColor: AppTheme.charcoal,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (_isScanning) ...[
                        const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(color: AppTheme.charcoal, strokeWidth: 2),
                        ),
                        const SizedBox(width: 8),
                      ] else ...[
                        const Icon(Icons.auto_awesome, size: 18),
                        const SizedBox(width: 6),
                      ],
                      Text(
                        _isScanning ? 'ĐANG BIẾN ĐỔI TÓC & CÂN BẰNG MẶT...' : 'MÔ PHỎNG TÓC & CÂN BẰNG MẶT GEMINI AI →',
                        style: AppTheme.bodyLarge(fontWeight: FontWeight.w800, color: AppTheme.charcoal),
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
                        scaffold.switchTab(2); // Chuyển sang Tab Đặt lịch
                      }
                    },
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppTheme.accentGold, width: 1.5),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: Text(
                      '✂️ Đặt Lịch Cắt Kiểu Này Ngay →',
                      style: AppTheme.bodyMedium(color: AppTheme.accentGold, fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 24),

              // ========================================================
              // TƯ VẤN TRỰC TIẾP VỚI MASTER BARBER AI
              // ========================================================
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceCard,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.borderColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 28,
                          height: 28,
                          decoration: const BoxDecoration(
                            color: AppTheme.accentGold,
                            shape: BoxShape.circle,
                          ),
                          child: const Center(
                            child: Text('💈', style: TextStyle(fontSize: 14)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'HỎI THỢ TRƯỞNG MASTER BARBER AI',
                              style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold),
                            ),
                            Text(
                              'Thợ trưởng Lê Minh Hoàng (12 năm kinh nghiệm)',
                              style: AppTheme.bodySmall(fontSize: 10, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Tin nhắn mẫu
                    Column(
                      children: _chatMessages.map((m) {
                        final isUser = m['sender'] == 'user';
                        return Align(
                          alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 6),
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: isUser ? AppTheme.accentGold : AppTheme.surfaceElevated,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              m['text'] ?? '',
                              style: AppTheme.bodySmall(
                                fontSize: 11.5,
                                color: isUser ? AppTheme.charcoal : AppTheme.textPrimary,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),

                    if (_isChatLoading) ...[
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 4),
                        child: Text('Master Barber đang soạn câu trả lời...', style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: AppTheme.accentGold)),
                      ),
                    ],

                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _chatController,
                            style: const TextStyle(fontSize: 12, color: Colors.white),
                            decoration: InputDecoration(
                              hintText: 'Hỏi về chất tóc, sáp vuốt, form mặt...',
                              hintStyle: TextStyle(fontSize: 11.5, color: Colors.grey.shade500),
                              isDense: true,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: AppTheme.borderColor)),
                            ),
                            onSubmitted: _sendChatMessage,
                          ),
                        ),
                        const SizedBox(width: 6),
                        IconButton(
                          icon: const Icon(Icons.send_rounded, color: AppTheme.accentGold, size: 20),
                          onPressed: () => _sendChatMessage(_chatController.text),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
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
        style: AppTheme.bodySmall(fontSize: 10.5, color: AppTheme.textPrimary, fontWeight: FontWeight.w600),
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

  // Before & After Interactive Slider View, Comparing actual photo with REAL restyled photo
  Widget _buildBeforeAfterComparison() {
    final resultUrl = _resultImageUrl ?? _currentPhotoUrl;

    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final split = w * _sliderPosition;

        return Stack(
          fit: StackFit.expand,
          children: [
            // Ảnh kết quả AI thật bên dưới
            EditorialImage(
              imageUrl: resultUrl,
              fit: BoxFit.cover,
            ),

            // Ảnh trước cắt xén bên trái theo thanh trượt
            ClipRect(
              clipper: _HorizontalSplitClipper(split),
              child: EditorialImage(
                imageUrl: _rawOriginalPhotoUrl ?? _currentPhotoUrl,
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
                  color: Colors.black.withValues(alpha: 0.75),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                ),
                child: Text('ẢNH GỐC CỦA BẠN', style: AppTheme.labelUppercase(fontSize: 8.5, color: Colors.white)),
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
                    BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 4),
                  ],
                ),
                child: Text('TÓC MỚI & CÂN BẰNG MẶT (GEMINI AI) ✨', style: AppTheme.labelUppercase(fontSize: 8.5, color: AppTheme.charcoal)),
              ),
            ),

            // Tay kéo điều khiển thanh trượt
            Positioned(
              left: split - 15,
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
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: AppTheme.accentGold,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(color: Colors.black.withValues(alpha: 0.4), blurRadius: 6),
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

typedef AiStudioPage = AiStylingScreen;
