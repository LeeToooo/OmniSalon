import 'dart:async';
import 'package:flutter/material.dart';
import 'package:omni_salon_mobile/core/api/api_service.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';
import 'package:omni_salon_mobile/components/editorial_image.dart';
import 'package:omni_salon_mobile/components/main_scaffold.dart';
import 'package:omni_salon_mobile/models/order.dart';

class AiStylingScreen extends StatefulWidget {
  const AiStylingScreen({super.key});

  @override
  State<AiStylingScreen> createState() => _AiStylingScreenState();
}

class _AiStylingScreenState extends State<AiStylingScreen> {
  // Trạng thái kiểu tóc và màu nhuộm đang chọn
  String _selectedHairstyle = 'layer-korean';
  String _selectedColor = 'natural-black';
  String _selectedCategory = 'all';

  // Quản lý ảnh
  String _currentPhotoUrl = 'assets/hairstyles/sidepart-gentleman.jpg';
  String? _rawOriginalPhotoUrl;
  String? _croppedImageUrl;
  String _viewMode = 'cropped'; // 'cropped' (3:4) hoặc 'raw'

  // Trạng thái AI Scanning
  bool _isScanning = false;
  String _scanStageText = '';
  double _scanProgress = 0.0;
  Timer? _scanProgressTimer;

  // Trạng thái kết quả mô phỏng
  bool _hasResult = false;
  String? _resultImageUrl;
  double _sliderPosition = 0.5;

  // Dữ liệu phân tích ngũ quan từ MediaPipe 3D Mesh
  Map<String, dynamic>? _faceAnalysis;

  // Bộ sưu tập 12 phom tóc nam chuẩn Salon Barbershop
  final List<Map<String, dynamic>> _hairstyles = [
    {
      'id': 'layer-korean',
      'name': 'Layer Texture Hàn Quốc',
      'category': 'korean',
      'tag': 'THỜI THƯỢNG',
      'desc': 'Tỉa tầng bay bổng, uốn texture tạo độ phồng tự nhiên cho khuôn mặt Á Đông.',
      'preview': 'assets/hairstyles/layer-korean.jpg',
      'serviceId': 'DV2',
      'serviceName': 'Uốn Tóc Texture / Hàn Quốc',
    },
    {
      'id': 'pompadour-luxury',
      'name': 'Pompadour & Mid Fade',
      'category': 'classic',
      'tag': 'LỊCH LÃM',
      'desc': 'Độ phồng vuốt ngược pomade kết hợp đường fade sắc nét 2 bên mang phong thái quý ông.',
      'preview': 'assets/hairstyles/pompadour-luxury.jpg',
      'serviceId': 'DV1',
      'serviceName': 'Cắt Tóc Tạo Kiểu Master Barber',
    },
    {
      'id': 'mullet-modern',
      'name': 'Modern Mullet & Taper Fade',
      'category': 'modern',
      'tag': 'PHONG CÁCH',
      'desc': 'Gáy tỉa so le mềm mại kết hợp đường cạo viền dứt khoát, phá cách và nam tính.',
      'preview': 'assets/hairstyles/mullet-modern.jpg',
      'serviceId': 'DV1',
      'serviceName': 'Cắt Tóc Tạo Kiểu Master Barber',
    },
    {
      'id': 'sidepart-gentleman',
      'name': 'Side Part 7/3 Cổ Điển',
      'category': 'classic',
      'tag': 'QUÝ ÔNG',
      'desc': 'Đường rẽ ngôi tỉ lệ vàng tôn phom mặt, dễ dàng chải sáp vào nếp suốt cả ngày.',
      'preview': 'assets/hairstyles/sidepart-gentleman.jpg',
      'serviceId': 'DV1',
      'serviceName': 'Cắt Tóc Tạo Kiểu Master Barber',
    },
    {
      'id': 'buzzcut-fade',
      'name': 'Buzz Cut & High Fade',
      'category': 'modern',
      'tag': 'DỨT KHOÁT',
      'desc': 'Húi cua ngắn gọn gàng, tôn trọn vẹn xương hàm góc cạnh và đường nét nam tính.',
      'preview': 'assets/hairstyles/buzzcut-fade.jpg',
      'serviceId': 'DV1',
      'serviceName': 'Cắt Tóc Tạo Kiểu Master Barber',
    },
    {
      'id': 'french-crop',
      'name': 'French Crop Textured',
      'category': 'korean',
      'tag': 'HIỆN ĐẠI',
      'desc': 'Mái bằng textured tỉa nhọn che khuyết điểm trán cao, fade cao 2 bên mai.',
      'preview': 'assets/hairstyles/french-crop.jpg',
      'serviceId': 'DV1',
      'serviceName': 'Cắt Tóc Tạo Kiểu Master Barber',
    },
    {
      'id': 'short-quiff',
      'name': 'Short Quiff & Mid Taper',
      'category': 'modern',
      'tag': 'NĂNG ĐỘNG',
      'desc': 'Mái vuốt nhẹ dựng trẻ trung, tôn sống mũi cao và phom mặt sáng ngời.',
      'preview': 'assets/hairstyles/short-quiff.jpg',
      'serviceId': 'DV1',
      'serviceName': 'Cắt Tóc Tạo Kiểu Master Barber',
    },
    {
      'id': 'two-block',
      'name': 'Two-Block 6/4 Lãng Tử',
      'category': 'korean',
      'tag': 'K-STYLE IDOL',
      'desc': 'Chia 2 tầng tóc bồng bềnh, che phủ gò má và mang phong thái thần tượng xứ Hàn.',
      'preview': 'assets/hairstyles/two-block.jpg',
      'serviceId': 'DV2',
      'serviceName': 'Uốn Tóc Texture / Hàn Quốc',
    },
    {
      'id': 'ivy-league',
      'name': 'Ivy League Hiện Đại',
      'category': 'classic',
      'tag': 'DOANH NHÂN',
      'desc': 'Phom tóc giới thượng lưu phương Tây, chỉn chu, thanh lịch cho môi trường công sở.',
      'preview': 'assets/hairstyles/ivy-league.jpg',
      'serviceId': 'DV1',
      'serviceName': 'Cắt Tóc Tạo Kiểu Master Barber',
    },
    {
      'id': 'undercut-slick',
      'name': 'Undercut Slicked Back',
      'category': 'classic',
      'tag': 'QUYỀN LỰC',
      'desc': 'Cắt sát 2 bên và sau gáy, chải mượt toàn bộ mái về sau thể hiện quyền lực.',
      'preview': 'assets/hairstyles/undercut-slick.jpg',
      'serviceId': 'DV1',
      'serviceName': 'Cắt Tóc Tạo Kiểu Master Barber',
    },
    {
      'id': 'ripple-perm',
      'name': 'Uốn Con Sâu / Ripple Curls',
      'category': 'modern',
      'tag': 'CÁ TÍNH',
      'desc': 'Sóng xoăn dập xù bùng nổ năng lượng, tạo độ dày gấp đôi cho mái tóc mỏng.',
      'preview': 'assets/hairstyles/ripple-perm.jpg',
      'serviceId': 'DV2',
      'serviceName': 'Uốn Tóc Texture / Hàn Quốc',
    },
    {
      'id': 'mohican-fade',
      'name': 'Mohican Ngắn & Sharp Fade',
      'category': 'modern',
      'tag': 'BỤI BẶM',
      'desc': 'Dọc sống tóc vuốt nhọn cá tính, đường cạo fade bén ngót đậm chất đường phố.',
      'preview': 'assets/hairstyles/mohican-fade.jpg',
      'serviceId': 'DV1',
      'serviceName': 'Cắt Tóc Tạo Kiểu Master Barber',
    },
  ];

  // Bảng 8 màu nhuộm thời thượng
  final List<Map<String, dynamic>> _hairColors = [
    {'id': 'natural-black', 'name': 'Đen Tự Nhiên', 'color': const Color(0xFF141413), 'hex': '#141413'},
    {'id': 'cold-ash-brown', 'name': 'Nâu Lạnh Sâu', 'color': const Color(0xFF523A28), 'hex': '#523A28'},
    {'id': 'titan-grey', 'name': 'Xám Khói Titan', 'color': const Color(0xFF6B7280), 'hex': '#6B7280'},
    {'id': 'nordic-platinum', 'name': 'Vàng Cát Trầm', 'color': const Color(0xFFC59B27), 'hex': '#C59B27'},
    {'id': 'chestnut-brown', 'name': 'Nâu Hạt Dẻ', 'color': const Color(0xFF6F4E37), 'hex': '#6F4E37'},
    {'id': 'moss-ash', 'name': 'Rêu Khói', 'color': const Color(0xFF4A5568), 'hex': '#4A5568'},
    {'id': 'chocolate-brown', 'name': 'Nâu Socola', 'color': const Color(0xFF3D2817), 'hex': '#3D2817'},
    {'id': 'smoky-silver', 'name': 'Bạch Kim Bạc', 'color': const Color(0xFFD1D5DB), 'hex': '#D1D5DB'},
  ];

  // Danh sách ảnh mẫu chân dung góc chuẩn studio
  final List<Map<String, String>> _demoPortraits = [
    {'name': 'Mẫu 01 (Side Part)', 'url': 'assets/hairstyles/sidepart-gentleman.jpg'},
    {'name': 'Mẫu 02 (Pompadour)', 'url': 'assets/hairstyles/pompadour-luxury.jpg'},
    {'name': 'Mẫu 03 (Layer Hàn)', 'url': 'assets/hairstyles/layer-korean.jpg'},
    {'name': 'Mẫu 04 (Mullet)', 'url': 'assets/hairstyles/mullet-modern.jpg'},
    {'name': 'Mẫu 05 (Short Quiff)', 'url': 'assets/hairstyles/short-quiff.jpg'},
    {'name': 'Mẫu 06 (Two-Block)', 'url': 'assets/hairstyles/two-block.jpg'},
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
    _scanProgressTimer?.cancel();
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
    try {
      final res = await ApiService.analyzeFace(targetPhoto);
      if (!mounted) return;
      if (res != null && (res['faceShape'] != null || res['success'] == true)) {
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
    } catch (_) {}
  }

  void _startScanProgressSimulation() {
    _scanProgress = 0.05;
    _scanStageText = '1/4: Đang quét 478 điểm ngũ quan 3D Face Mesh...';
    _scanProgressTimer?.cancel();

    _scanProgressTimer = Timer.periodic(const Duration(milliseconds: 300), (timer) {
      if (!mounted || !_isScanning) {
        timer.cancel();
        return;
      }
      setState(() {
        if (_scanProgress < 0.28) {
          _scanProgress += 0.03;
          _scanStageText = '1/4: Đang quét 478 điểm ngũ quan 3D Face Mesh...';
        } else if (_scanProgress < 0.58) {
          _scanProgress += 0.025;
          _scanStageText = '2/4: Tách lớp tóc & nhận diện đường viền hairline...';
        } else if (_scanProgress < 0.82) {
          _scanProgress += 0.02;
          _scanStageText = '3/4: Ghép phom tóc mẫu & mô phỏng sợi tóc thật...';
        } else if (_scanProgress < 0.95) {
          _scanProgress += 0.01;
          _scanStageText = '4/4: Hòa sắc màu nhuộm & cân bằng ánh sáng studio...';
        }
      });
    });
  }

  Future<void> _runRestyleSimulation() async {
    if (_isScanning) return;

    setState(() {
      _isScanning = true;
      _hasResult = false;
    });
    _startScanProgressSimulation();

    try {
      final photoToSend = _croppedImageUrl ?? _rawOriginalPhotoUrl ?? _currentPhotoUrl;
      final res = await ApiService.restyleHair(
        imageBase64OrUrl: photoToSend,
        hairstyleId: _selectedHairstyle,
        colorId: _selectedColor,
      );

      _scanProgressTimer?.cancel();
      if (!mounted) return;

      if (res != null && res['resultImageUrl'] != null && res['resultImageUrl'].toString().isNotEmpty) {
        setState(() {
          _isScanning = false;
          _hasResult = true;
          _sliderPosition = 0.5;
          _resultImageUrl = res['resultImageUrl']?.toString();
          if (res['faceAnalysis'] != null) {
            _faceAnalysis = res['faceAnalysis'] as Map<String, dynamic>;
          }
        });
        _showToast('Đã mô phỏng kiểu tóc AI thành công!', isSuccess: true);
      } else {
        // Tuyệt đối không fallback sang ảnh mẫu tĩnh để đảm bảo tính xác thực
        final errMsg = res?['message']?.toString() ??
            'Không thể nhận diện khuôn mặt rõ nét từ ảnh đã chọn. Vui lòng chọn góc chụp thẳng, sáng rõ!';
        setState(() {
          _isScanning = false;
          _hasResult = false;
          _resultImageUrl = null;
        });
        _showToast(errMsg, isError: true);
      }
    } catch (e) {
      _scanProgressTimer?.cancel();
      if (!mounted) return;
      setState(() {
        _isScanning = false;
        _hasResult = false;
        _resultImageUrl = null;
      });
      _showToast('Lỗi kết nối AI: $e. Vui lòng thử lại!', isError: true);
    }
  }

  void _showToast(String message, {bool isSuccess = false, bool isError = false}) {
    if (!mounted) return;
    final iconColor = isSuccess
        ? const Color(0xFF10B981)
        : (isError ? const Color(0xFFEF4444) : AppTheme.accentGold);
    final borderColor = isSuccess
        ? const Color(0xFF10B981).withValues(alpha: 0.4)
        : (isError ? const Color(0xFFEF4444).withValues(alpha: 0.5) : AppTheme.accentGold.withValues(alpha: 0.3));

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              isSuccess
                  ? Icons.check_circle_rounded
                  : (isError ? Icons.error_outline_rounded : Icons.info_outline_rounded),
              color: iconColor,
              size: 20,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                message,
                style: AppTheme.bodySmall(color: Colors.white, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF1C1B18),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(color: borderColor),
        ),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  void _openCustomUrlDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: AppTheme.accentGold.withValues(alpha: 0.3)),
        ),
        title: Text(
          'NHẬP LINK ẢNH CHÂN DUNG',
          style: AppTheme.headingSmall(fontSize: 15, color: AppTheme.accentGold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Dán link ảnh chân dung góc chụp thẳng, rõ nét để hệ thống AI nhận diện ngũ quan tối ưu nhất.',
              style: AppTheme.bodySmall(color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              style: AppTheme.bodySmall(color: AppTheme.textPrimary),
              decoration: InputDecoration(
                hintText: 'https://...',
                hintStyle: AppTheme.bodySmall(color: AppTheme.textSecondary),
                filled: true,
                fillColor: AppTheme.surfaceElevated,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: AppTheme.borderColor),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppTheme.accentGold),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('HỦY', style: AppTheme.bodySmall(color: AppTheme.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () {
              final url = controller.text.trim();
              if (url.isNotEmpty) {
                Navigator.of(ctx).pop();
                setState(() {
                  _rawOriginalPhotoUrl = url;
                  _currentPhotoUrl = url;
                  _croppedImageUrl = null;
                  _hasResult = false;
                  _resultImageUrl = null;
                });
                _triggerFaceAnalysis();
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.accentGold,
              foregroundColor: AppTheme.charcoal,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('ÁP DỤNG', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final shapeName = _faceAnalysis?['faceShape']?['name']?.toString() ?? 'Mặt Vuông Chữ Điền (Square)';
    final skinTone = _faceAnalysis?['skinUndertone']?['name']?.toString() ?? 'Sắc Tố Da Ấm (Warm Undertone)';
    final barberAdvice = _faceAnalysis?['barberAdvice']?.toString() ??
        'Master Barber khuyên: Với khuôn mặt này, bạn nên chọn các kiểu tóc có độ phồng đỉnh đầu để kéo dài tỷ lệ khuôn mặt và làm mềm đường nét xương hàm.';
    final suggestedService = _faceAnalysis?['suggestedService'] as Map<String, dynamic>?;
    final suggestedProduct = _faceAnalysis?['suggestedProduct'] as Map<String, dynamic>?;

    final filteredStyles = _hairstyles.where((h) {
      if (_selectedCategory == 'all') return true;
      return h['category'] == _selectedCategory;
    }).toList();

    return ValueListenableBuilder<bool>(
      valueListenable: AppTheme.isDarkModeNotifier,
      builder: (context, isDark, _) {
        return Scaffold(
          backgroundColor: AppTheme.bgPrimary,
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  _buildHeader(),
                  const SizedBox(height: 14),

                  // Khung ảnh chân dung & Thanh so sánh Slider trực quan
                  _buildPortraitViewer(),
                  const SizedBox(height: 14),

                  // Dải chọn ảnh mẫu chân dung
                  _buildDemoPortraitsRow(),
                  const SizedBox(height: 16),

                  // Khối tư vấn ngũ quan & dáng mặt
                  _buildFaceAnalysisCard(shapeName, skinTone, barberAdvice, suggestedService, suggestedProduct),
                  const SizedBox(height: 20),

                  // Bộ lọc phân loại kiểu tóc
                  _buildCategoryFilterBar(),
                  const SizedBox(height: 12),

                  // Danh sách 12 phom tóc nam thịnh hành
                  _buildHairstylesGrid(filteredStyles),
                  const SizedBox(height: 20),

                  // Bảng màu nhuộm cao cấp
                  _buildColorPalette(),
                  const SizedBox(height: 24),

                  // Nút kích hoạt xem trước / đặt lịch
                  _buildActionButtons(suggestedService),
                  const SizedBox(height: 36),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                const Icon(Icons.auto_awesome, color: AppTheme.accentGold, size: 16),
                const SizedBox(width: 6),
                Text(
                  'OMNISALON AI HAIR STUDIO',
                  style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold),
                ),
              ],
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppTheme.accentGold.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.4)),
              ),
              child: Text(
                'AI 3D VISION',
                style: AppTheme.labelUppercase(fontSize: 9, color: AppTheme.accentGold),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          'THỬ KIỂU TÓC & ĐỊNH HÌNH PHONG CÁCH',
          style: AppTheme.headingLarge(fontSize: 20),
        ),
        const SizedBox(height: 4),
        Text(
          'Mô phỏng 12 phom tóc nam thịnh hành và phân tích ngũ quan 3D trước khi bước vào ghế cắt.',
          style: AppTheme.bodySmall(color: AppTheme.textSecondary, fontSize: 11.5),
        ),
      ],
    );
  }

  Widget _buildPortraitViewer() {
    return Container(
      width: double.infinity,
      height: 330,
      decoration: BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _hasResult ? AppTheme.accentGold.withValues(alpha: 0.5) : AppTheme.borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.25),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
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
              // Khung định vị mặt AI Scanner
              Positioned(
                top: 12,
                left: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          color: Color(0xFF10B981),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'KHUÔN MẶT SẴN SÀNG',
                        style: AppTheme.labelUppercase(fontSize: 8.5, color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ),
            ] else ...[
              _buildInteractiveSliderViewer(),
            ],

            // Thanh điều khiển tỉ lệ ảnh phía dưới
            Positioned(
              top: 12,
              right: 12,
              child: Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.75),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildViewModeChip('cropped', '3:4 Studio'),
                    const SizedBox(width: 4),
                    _buildViewModeChip('raw', 'Ảnh Gốc'),
                  ],
                ),
              ),
            ),

            // Màn hình HUD AI quét tiến trình (không laser sci-fi, chuyên nghiệp sang trọng)
            if (_isScanning) _buildScanningHudOverlay(),
          ],
        ),
      ),
    );
  }

  Widget _buildInteractiveSliderViewer() {
    final resultUrl = _resultImageUrl ?? _currentPhotoUrl;
    final originalUrl = _rawOriginalPhotoUrl ?? _currentPhotoUrl;

    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final split = w * _sliderPosition;

        return GestureDetector(
          behavior: HitTestBehavior.opaque,
          onHorizontalDragUpdate: (details) {
            setState(() {
              _sliderPosition = (_sliderPosition + details.delta.dx / w).clamp(0.05, 0.95);
            });
          },
          child: Stack(
            fit: StackFit.expand,
            children: [
              // 1. Ảnh kết quả kiểu tóc mới (nằm dưới)
              EditorialImage(
                imageUrl: resultUrl,
                fit: BoxFit.cover,
              ),

              // 2. Ảnh gốc ban đầu (nằm trên, bị cắt tỉ lệ theo thanh trượt)
              ClipRect(
                clipper: _HorizontalSplitClipper(split),
                child: EditorialImage(
                  imageUrl: originalUrl,
                  fit: BoxFit.cover,
                ),
              ),

              // 3. Đường ranh giới phân tách mạ vàng
              Positioned(
                left: split - 1,
                top: 0,
                bottom: 0,
                child: Container(
                  width: 2.5,
                  decoration: BoxDecoration(
                    color: AppTheme.accentGold,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.6),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                ),
              ),

              // 4. Tay nắm kéo tương tác chính giữa
              Positioned(
                left: split - 18,
                top: 0,
                bottom: 0,
                child: Center(
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppTheme.accentGold,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.5),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.compare_arrows_rounded,
                      color: AppTheme.charcoal,
                      size: 20,
                    ),
                  ),
                ),
              ),

              // 5. Huy hiệu nhãn phân định Trước / Sau
              Positioned(
                left: 12,
                bottom: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.75),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                  ),
                  child: Text(
                    'ẢNH GỐC',
                    style: AppTheme.labelUppercase(fontSize: 8.5, color: Colors.white),
                  ),
                ),
              ),
              Positioned(
                right: 12,
                bottom: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                  decoration: BoxDecoration(
                    color: AppTheme.accentGold.withValues(alpha: 0.95),
                    borderRadius: BorderRadius.circular(4),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 4),
                    ],
                  ),
                  child: Text(
                    'TÓC MỚI & MÀU',
                    style: AppTheme.labelUppercase(fontSize: 8.5, color: AppTheme.charcoal),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildScanningHudOverlay() {
    return Container(
      color: AppTheme.charcoal.withValues(alpha: 0.9),
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(
              width: 44,
              height: 44,
              child: CircularProgressIndicator(
                color: AppTheme.accentGold,
                strokeWidth: 3,
              ),
            ),
            const SizedBox(height: 18),
            Text(
              'ĐANG TẠO MẪU KIỂU TÓC AI',
              style: AppTheme.headingSmall(fontSize: 14, color: AppTheme.accentGold),
            ),
            const SizedBox(height: 6),
            Text(
              _scanStageText,
              style: AppTheme.bodySmall(color: Colors.white, fontWeight: FontWeight.w500),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 14),
            ClipRRect(
              borderRadius: BorderRadius.circular(3),
              child: SizedBox(
                width: 200,
                height: 5,
                child: LinearProgressIndicator(
                  value: _scanProgress,
                  backgroundColor: Colors.white.withValues(alpha: 0.15),
                  valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.accentGold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDemoPortraitsRow() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'ẢNH CHÂN DUNG THỰC NGHIỆM:',
              style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.textSecondary),
            ),
            InkWell(
              onTap: _openCustomUrlDialog,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 4),
                child: Row(
                  children: [
                    const Icon(Icons.link_rounded, size: 14, color: AppTheme.accentGold),
                    const SizedBox(width: 4),
                    Text(
                      'Tự nhập link ảnh',
                      style: AppTheme.bodySmall(fontSize: 11, color: AppTheme.accentGold, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 36,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _demoPortraits.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, idx) {
              final p = _demoPortraits[idx];
              final isSelected = (_rawOriginalPhotoUrl ?? _currentPhotoUrl) == p['url'];
              return ActionChip(
                label: Text(p['name']!),
                labelStyle: AppTheme.bodySmall(
                  fontSize: 11,
                  color: isSelected ? AppTheme.charcoal : AppTheme.textPrimary,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                ),
                backgroundColor: isSelected ? AppTheme.accentGold : AppTheme.surfaceCard,
                side: BorderSide(color: isSelected ? AppTheme.accentGold : AppTheme.borderColor),
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
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
      ],
    );
  }

  Widget _buildFaceAnalysisCard(
    String shapeName,
    String skinTone,
    String barberAdvice,
    Map<String, dynamic>? suggestedService,
    Map<String, dynamic>? suggestedProduct,
  ) {
    return Container(
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
              Flexible(
                child: Row(
                  children: [
                    const Icon(Icons.face_retouching_natural_rounded, color: AppTheme.accentGold, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      'TƯ VẤN NGŨ QUAN 3D',
                      style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.accentGold),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                decoration: BoxDecoration(
                  color: AppTheme.accentGold,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  shapeName.toUpperCase(),
                  style: AppTheme.labelUppercase(fontSize: 8.5, color: AppTheme.charcoal),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            barberAdvice,
            style: AppTheme.bodySmall(color: AppTheme.textSecondary, fontSize: 11.5),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              _buildInfoPill('Tông da', skinTone.split(' ')[0]),
              _buildInfoPill('Tỉ lệ mặt', 'Chuẩn Á Đông'),
              _buildInfoPill('Độ hợp cao nhất', '98%'),
            ],
          ),
          if (suggestedProduct != null || suggestedService != null) ...[
            const SizedBox(height: 10),
            Divider(color: AppTheme.borderColor.withValues(alpha: 0.5), height: 1),
            const SizedBox(height: 8),
            Row(
              children: [
                if (suggestedProduct != null)
                  Expanded(
                    child: InkWell(
                      onTap: () {
                        final scaffold = MainScaffold.of(context);
                        if (scaffold != null) {
                          scaffold.addToCart(OrderItem(
                            productId: suggestedProduct['id']?.toString() ?? 'SP01',
                            name: suggestedProduct['name']?.toString() ?? 'Sáp vuốt tóc',
                            price: int.tryParse(suggestedProduct['price']?.toString() ?? '480000') ?? 480000,
                            quantity: 1,
                            image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay/Apestomen_Volcanic_Clay_01.jpg',
                          ));
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.surfaceCard,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: AppTheme.borderColor),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.shopping_bag_outlined, color: AppTheme.accentGold, size: 14),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                suggestedProduct['name']?.toString() ?? 'Sáp đề xuất',
                                style: AppTheme.bodySmall(fontSize: 10.5, fontWeight: FontWeight.w600),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                if (suggestedProduct != null && suggestedService != null) const SizedBox(width: 8),
                if (suggestedService != null)
                  Expanded(
                    child: InkWell(
                      onTap: () {
                        final scaffold = MainScaffold.of(context);
                        if (scaffold != null) {
                          scaffold.navigateToBooking(serviceId: suggestedService['id']?.toString() ?? 'DV1');
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.accentGold.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.4)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.calendar_month_outlined, color: AppTheme.accentGold, size: 14),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                suggestedService['name']?.toString() ?? 'Dịch vụ đề xuất',
                                style: AppTheme.bodySmall(fontSize: 10.5, color: AppTheme.accentGold, fontWeight: FontWeight.w700),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCategoryFilterBar() {
    final categories = [
      {'id': 'all', 'label': 'Tất cả (12)'},
      {'id': 'classic', 'label': 'Lịch Lãm (4)'},
      {'id': 'korean', 'label': 'Hàn Quốc (3)'},
      {'id': 'modern', 'label': 'Cá Tính (5)'},
    ];

    return Row(
      children: [
        Text(
          'PHOM DÁNG TÓC:',
          style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.accentGold),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: SizedBox(
            height: 32,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 6),
              itemBuilder: (context, idx) {
                final cat = categories[idx];
                final isSelected = _selectedCategory == cat['id'];
                return ChoiceChip(
                  label: Text(cat['label']!),
                  labelStyle: AppTheme.bodySmall(
                    fontSize: 10.5,
                    color: isSelected ? AppTheme.charcoal : AppTheme.textPrimary,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  ),
                  selected: isSelected,
                  selectedColor: AppTheme.accentGold,
                  backgroundColor: AppTheme.surfaceCard,
                  side: BorderSide(color: isSelected ? AppTheme.accentGold : AppTheme.borderColor),
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
                  onSelected: (val) {
                    if (val) setState(() => _selectedCategory = cat['id']!);
                  },
                );
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHairstylesGrid(List<Map<String, dynamic>> styles) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.76,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: styles.length,
      itemBuilder: (context, index) {
        final h = styles[index];
        final isSelected = _selectedHairstyle == h['id'];
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
            decoration: BoxDecoration(
              color: isSelected ? AppTheme.accentGold.withValues(alpha: 0.08) : AppTheme.surfaceCard,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isSelected ? AppTheme.accentGold : AppTheme.borderColor,
                width: isSelected ? 2 : 1,
              ),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: AppTheme.accentGold.withValues(alpha: 0.25),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ]
                  : null,
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(9),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Ảnh minh họa phom tóc
                  Stack(
                    children: [
                      SizedBox(
                        width: double.infinity,
                        height: 105,
                        child: EditorialImage(
                          imageUrl: h['preview']!,
                          fit: BoxFit.cover,
                        ),
                      ),
                      Positioned(
                        top: 6,
                        left: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.75),
                            borderRadius: BorderRadius.circular(3),
                          ),
                          child: Text(
                            h['tag']!,
                            style: AppTheme.labelUppercase(fontSize: 7.5, color: AppTheme.accentGold),
                          ),
                        ),
                      ),
                      Positioned(
                        top: 6,
                        right: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981),
                            borderRadius: BorderRadius.circular(3),
                          ),
                          child: Text(
                            '$matchScore% Hợp',
                            style: AppTheme.labelUppercase(fontSize: 7.5, color: Colors.white),
                          ),
                        ),
                      ),
                      if (isSelected)
                        Positioned(
                          bottom: 6,
                          right: 6,
                          child: Container(
                            width: 22,
                            height: 22,
                            decoration: const BoxDecoration(
                              color: AppTheme.accentGold,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.check, color: AppTheme.charcoal, size: 14),
                          ),
                        ),
                    ],
                  ),
                  // Thông tin chi tiết
                  Padding(
                    padding: const EdgeInsets.all(8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          h['name']!,
                          style: AppTheme.bodySmall(
                            fontWeight: FontWeight.w700,
                            fontSize: 11.5,
                            color: isSelected ? AppTheme.accentGold : AppTheme.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 3),
                        Text(
                          h['desc']!,
                          style: AppTheme.bodySmall(
                            fontSize: 9.5,
                            color: AppTheme.textSecondary,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildColorPalette() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'MÀU NHUỘM THỜI THƯỢNG:',
              style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.accentGold),
            ),
            Text(
              '8 màu salon',
              style: AppTheme.bodySmall(fontSize: 10.5, color: AppTheme.textSecondary),
            ),
          ],
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
                avatar: Container(
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(
                    color: c['color'] as Color,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withValues(alpha: 0.4), width: 1),
                  ),
                ),
                label: Text(c['name'] as String),
                labelStyle: AppTheme.bodySmall(
                  fontSize: 11,
                  color: isSelected ? AppTheme.accentGold : AppTheme.textPrimary,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                ),
                backgroundColor: isSelected ? AppTheme.accentGold.withValues(alpha: 0.15) : AppTheme.surfaceCard,
                side: BorderSide(color: isSelected ? AppTheme.accentGold : AppTheme.borderColor),
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
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
      ],
    );
  }

  Widget _buildActionButtons(Map<String, dynamic>? suggestedService) {
    final currentStyle = _hairstyles.firstWhere(
      (h) => h['id'] == _selectedHairstyle,
      orElse: () => _hairstyles[0],
    );
    final targetServiceId = currentStyle['serviceId'] ?? suggestedService?['id']?.toString() ?? 'DV1';

    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _isScanning ? null : _runRestyleSimulation,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.accentGold,
              foregroundColor: AppTheme.charcoal,
              elevation: 4,
              shadowColor: AppTheme.accentGold.withValues(alpha: 0.4),
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
                  const Text(
                    'Đang xử lý mô phỏng AI...',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppTheme.charcoal),
                  ),
                ] else ...[
                  const Icon(Icons.auto_awesome, color: AppTheme.charcoal, size: 18),
                  const SizedBox(width: 8),
                  const Text(
                    'Xem Trước Kiểu Tóc Này →',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppTheme.charcoal),
                  ),
                ],
              ],
            ),
          ),
        ),

        if (_hasResult) ...[
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton(
              onPressed: () {
                final scaffold = MainScaffold.of(context);
                if (scaffold != null) {
                  scaffold.navigateToBooking(serviceId: targetServiceId);
                }
              },
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppTheme.accentGold, width: 1.5),
                backgroundColor: AppTheme.accentGold.withValues(alpha: 0.1),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.content_cut_rounded, color: AppTheme.accentGold, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    'Đặt Lịch Cắt Kiểu Này Ngay →',
                    style: AppTheme.bodyMedium(color: AppTheme.accentGold, fontWeight: FontWeight.w800),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildInfoPill(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
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
