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
  String _selectedVolume = 'standard'; // 'natural' | 'standard' | 'high'
  String _selectedFinish = 'matte'; // 'matte' | 'gloss'
  String _selectedCategory = 'all';

  // Quản lý ảnh chân dung người dùng (trống ban đầu cho đến khi chọn/nhập ảnh thật)
  String? _currentPhotoUrl;
  String? _rawOriginalPhotoUrl;
  String? _croppedImageUrl;
  String _viewMode = 'cropped'; // 'cropped' (3:4) hoặc 'raw'

  // Trạng thái AI xử lý thực tế
  bool _isScanning = false;

  // Trạng thái kết quả sau khi ghép tóc
  bool _hasResult = false;
  String? _resultImageUrl;
  Map<String, dynamic>? _restyleMeta;
  double _sliderPosition = 0.5;

  // Dữ liệu phân tích ngũ quan từ MediaPipe 3D Mesh
  Map<String, dynamic>? _faceAnalysis;
  bool _isAnalyzingFace = false;
  String? _faceAnalysisError;

  // Bộ sưu tập 12 phom tóc nam chuẩn Salon Barbershop
  final List<Map<String, dynamic>> _hairstyles = [
    {
      'id': 'layer-korean',
      'name': 'Layer Texture Hàn Quốc',
      'category': 'trends',
      'tag': 'THỜI THƯỢNG',
      'desc': 'Tỉa tầng bay bổng, uốn texture tạo độ phồng tự nhiên cho khuôn mặt Á Đông.',
      'preview': '/assets/hairstyles/layer-korean.jpg',
      'serviceId': 'DV03',
      'serviceName': 'Uốn tóc xoăn Texture / Ziczac phồng Hàn Quốc',
    },
    {
      'id': 'pompadour-luxury',
      'name': 'Pompadour & Mid Fade',
      'category': 'classic',
      'tag': 'LỊCH LÃM',
      'desc': 'Độ phồng vuốt ngược pomade kết hợp đường fade sắc nét 2 bên mang phong thái quý ông.',
      'preview': '/assets/hairstyles/pompadour-luxury.jpg',
      'serviceId': 'DV01',
      'serviceName': 'Cắt tóc nam Fade & Tạo kiểu sáp Pomade',
    },
    {
      'id': 'mullet-modern',
      'name': 'Modern Mullet & Taper Fade',
      'category': 'trends',
      'tag': 'PHONG CÁCH',
      'desc': 'Gáy tỉa so le mềm mại kết hợp đường cạo viền dứt khoát, phá cách và nam tính.',
      'preview': '/assets/hairstyles/mullet-modern.jpg',
      'serviceId': 'DV03',
      'serviceName': 'Uốn tóc xoăn Texture / Ziczac phồng Hàn Quốc',
    },
    {
      'id': 'sidepart-gentleman',
      'name': 'Side Part 7/3 Cổ Điển',
      'category': 'classic',
      'tag': 'QUÝ ÔNG',
      'desc': 'Đường rẽ ngôi cân đối tôn phom mặt, dễ dàng chải sáp vào nếp suốt cả ngày.',
      'preview': '/assets/hairstyles/sidepart-gentleman.jpg',
      'serviceId': 'CB01',
      'serviceName': 'Combo Quý Tộc Barber (Cắt + Gội + Cạo râu)',
    },
    {
      'id': 'buzzcut-fade',
      'name': 'Buzz Cut & High Fade',
      'category': 'edgy',
      'tag': 'DỨT KHOÁT',
      'desc': 'Húi cua ngắn gọn gàng, tôn trọn vẹn xương hàm góc cạnh và đường nét nam tính.',
      'preview': '/assets/hairstyles/buzzcut-fade.jpg',
      'serviceId': 'DV01',
      'serviceName': 'Cắt tóc nam Fade & Tạo kiểu sáp Pomade',
    },
    {
      'id': 'french-crop',
      'name': 'French Crop Textured',
      'category': 'edgy',
      'tag': 'HIỆN ĐẠI',
      'desc': 'Mái bằng textured tỉa nhọn che khuyết điểm trán cao, fade cao 2 bên mai.',
      'preview': '/assets/hairstyles/french-crop.jpg',
      'serviceId': 'DV02',
      'serviceName': 'Cắt & Ép Side tóc nam (Down Perm Combo)',
    },
    {
      'id': 'short-quiff',
      'name': 'Short Quiff & Mid Taper',
      'category': 'trends',
      'tag': 'NĂNG ĐỘNG',
      'desc': 'Mái vuốt nhẹ dựng trẻ trung, tôn sống mũi cao và phom mặt sáng ngời.',
      'preview': '/assets/hairstyles/short-quiff.jpg',
      'serviceId': 'DV01',
      'serviceName': 'Cắt tóc nam Fade & Tạo kiểu sáp Pomade',
    },
    {
      'id': 'two-block',
      'name': 'Two-Block 6/4 Lãng Tử',
      'category': 'trends',
      'tag': 'K-STYLE IDOL',
      'desc': 'Chia 2 tầng tóc bồng bềnh, che phủ gò má và mang phong thái thần tượng xứ Hàn.',
      'preview': '/assets/hairstyles/two-block.jpg',
      'serviceId': 'DV02',
      'serviceName': 'Cắt & Ép Side tóc nam (Down Perm Combo)',
    },
    {
      'id': 'ivy-league',
      'name': 'Ivy League Hiện Đại',
      'category': 'classic',
      'tag': 'DOANH NHÂN',
      'desc': 'Phom tóc giới thượng lưu phương Tây, chỉn chu, thanh lịch cho môi trường công sở.',
      'preview': '/assets/hairstyles/ivy-league.jpg',
      'serviceId': 'CB01',
      'serviceName': 'Combo Quý Tộc Barber (Cắt + Gội + Cạo râu)',
    },
    {
      'id': 'undercut-slick',
      'name': 'Undercut Slicked Back',
      'category': 'classic',
      'tag': 'QUYỀN LỰC',
      'desc': 'Cắt sát 2 bên và sau gáy, chải mượt toàn bộ mái về sau thể hiện quyền lực.',
      'preview': '/assets/hairstyles/undercut-slick.jpg',
      'serviceId': 'DV01',
      'serviceName': 'Cắt tóc nam Fade & Tạo kiểu sáp Pomade',
    },
    {
      'id': 'ripple-perm',
      'name': 'Uốn Con Sâu / Ripple Curls',
      'category': 'wavy',
      'tag': 'CÁ TÍNH',
      'desc': 'Sóng xoăn dập xù bùng nổ năng lượng, tạo độ dày gấp đôi cho mái tóc mỏng.',
      'preview': '/assets/hairstyles/ripple-perm.jpg',
      'serviceId': 'DV05',
      'serviceName': 'Uốn tóc con sâu Dreadlocks / Uốn Ruffled phá cách',
    },
    {
      'id': 'mohican-fade',
      'name': 'Mohican Ngắn & Sharp Fade',
      'category': 'edgy',
      'tag': 'BỤI BẶM',
      'desc': 'Dọc sống tóc vuốt nhọn cá tính, đường cạo fade bén ngót đậm chất đường phố.',
      'preview': '/assets/hairstyles/mohican-fade.jpg',
      'serviceId': 'DV01',
      'serviceName': 'Cắt tóc nam Fade & Tạo kiểu sáp Pomade',
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
    {'id': 'caramel-mocha', 'name': 'Nâu Mocha Caramel', 'color': const Color(0xFF8B5A2B), 'hex': '#8B5A2B'},
    {'id': 'pure-platinum', 'name': 'Bạch Kim Khói', 'color': const Color(0xFFE5E7EB), 'hex': '#E5E7EB'},
  ];

  // Danh sách ảnh chụp người thật tại salon (không dùng ảnh AI)
  final List<Map<String, String>> _demoPortraits = [
    {'name': 'Ảnh thật 01', 'url': '/DataPicture/ChanDungTho/Tho4.jpg'},
    {'name': 'Ảnh thật 02', 'url': '/DataPicture/ChanDungTho/Tho2.jpg'},
    {'name': 'Ảnh thật 03', 'url': '/DataPicture/ChanDungTho/Tho7.jpg'},
  ];

  @override
  void initState() {
    super.initState();
    AppTheme.isDarkModeNotifier.addListener(_onThemeChanged);
    _syncAiCatalogFromServer();
  }

  Future<void> _syncAiCatalogFromServer() async {
    try {
      final data = await ApiService.fetchAiHairstyles();
      if (!mounted || data == null) return;
      final serverColors = data['hairColors'];
      final serverStyles = data['hairstyles'];
      setState(() {
        if (serverColors is List && serverColors.isNotEmpty) {
          for (final sc in serverColors) {
            if (sc is Map) {
              final sid = sc['id']?.toString();
              final sname = sc['name']?.toString();
              final idx = _hairColors.indexWhere((c) => c['id'] == sid);
              if (idx != -1 && sname != null && sname.isNotEmpty) {
                _hairColors[idx]['name'] = sname.split(' (').first;
              }
            }
          }
        }
      if (serverStyles is List && serverStyles.isNotEmpty) {
          for (final ss in serverStyles) {
            if (ss is Map) {
              final sid = ss['id']?.toString();
              final idx = _hairstyles.indexWhere((h) => h['id'] == sid);
              if (idx != -1) {
                if (ss['name'] != null) _hairstyles[idx]['name'] = ss['name'].toString();
                if (ss['category'] != null) _hairstyles[idx]['category'] = ss['category'].toString();
                if (ss['tag'] != null) _hairstyles[idx]['tag'] = ss['tag'].toString();
                if (ss['desc'] != null) _hairstyles[idx]['desc'] = ss['desc'].toString();
                if (ss['suggestedService'] is Map) {
                  final svc = ss['suggestedService'] as Map;
                  if (svc['id'] != null) _hairstyles[idx]['serviceId'] = svc['id'].toString();
                  if (svc['name'] != null) _hairstyles[idx]['serviceName'] = svc['name'].toString();
                }
                if (ss['suggestedProduct'] is Map) {
                  _hairstyles[idx]['suggestedProduct'] = Map<String, dynamic>.from(ss['suggestedProduct'] as Map);
                }
              }
            }
          }
        }
      });
    } catch (e) {
      debugPrint('[AiStudio] Sync catalog skipped: $e');
    }
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
        _currentPhotoUrl = _croppedImageUrl;
      } else {
        _currentPhotoUrl = _rawOriginalPhotoUrl ?? _currentPhotoUrl;
      }
    });
  }

  Future<void> _triggerFaceAnalysis() async {
    final targetPhoto = _rawOriginalPhotoUrl ?? _currentPhotoUrl;
    if (targetPhoto == null || targetPhoto.isEmpty) return;
    if (mounted) {
      setState(() {
        _isAnalyzingFace = true;
        _faceAnalysisError = null;
      });
    }
    try {
      final res = await ApiService.analyzeFace(targetPhoto);
      if (!mounted) return;
      if (res['faceShape'] != null) {
        setState(() {
          _isAnalyzingFace = false;
          _faceAnalysis = res;
          _faceAnalysisError = null;
          if (res['croppedImageUrl'] != null) {
            _croppedImageUrl = res['croppedImageUrl'].toString();
          }
          if (_viewMode == 'cropped' && _croppedImageUrl != null) {
            _currentPhotoUrl = _croppedImageUrl;
          } else {
            _currentPhotoUrl = _rawOriginalPhotoUrl ?? _currentPhotoUrl;
          }
        });
      } else {
        setState(() {
          _isAnalyzingFace = false;
          _faceAnalysis = null;
          _faceAnalysisError = res['message']?.toString() ?? 'Không thể nhận diện khuôn mặt rõ nét từ ảnh.';
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isAnalyzingFace = false;
        _faceAnalysis = null;
        _faceAnalysisError = 'Lỗi phân tích khuôn mặt: $e';
      });
    }
  }

  Future<void> _runRestyle() async {
    if (_isScanning) return;
    // Luôn gửi ảnh gốc ban đầu (tránh cắt 2 lần làm lệch khung Before/After)
    final photoToSend = _rawOriginalPhotoUrl ?? _currentPhotoUrl ?? _croppedImageUrl;
    if (photoToSend == null || photoToSend.isEmpty) {
      _showToast('Vui lòng chọn ảnh thật hoặc nhập link ảnh chân dung trước!', isError: true);
      return;
    }

    setState(() {
      _isScanning = true;
      _hasResult = false;
    });

    try {
      final res = await ApiService.restyleHair(
        imageBase64OrUrl: photoToSend,
        hairstyleId: _selectedHairstyle,
        colorId: _selectedColor,
        volume: _selectedVolume,
        finish: _selectedFinish,
      );

      if (!mounted) return;

      if (res['resultImageUrl'] != null && res['resultImageUrl'].toString().isNotEmpty) {
        setState(() {
          _isScanning = false;
          _hasResult = true;
          _viewMode = 'cropped';
          if (_croppedImageUrl != null) {
            _currentPhotoUrl = _croppedImageUrl;
          }
          _sliderPosition = 0.5;
          _resultImageUrl = res['resultImageUrl']?.toString();
          _restyleMeta = res;
          if (res['faceAnalysis'] != null) {
            _faceAnalysis = res['faceAnalysis'] as Map<String, dynamic>;
            _faceAnalysisError = null;
          }
        });
        _showToast('Đã tạo mẫu kiểu tóc mới thành công!', isSuccess: true);
      } else {
        // Tuyệt đối không fallback sang ảnh mẫu tĩnh để đảm bảo tính xác thực
        final errMsg = res['message']?.toString() ??
            'Không thể nhận diện khuôn mặt rõ nét từ ảnh đã chọn. Vui lòng chọn góc chụp thẳng, sáng rõ!';
        setState(() {
          _isScanning = false;
          _hasResult = false;
          _resultImageUrl = null;
        });
        _showToast(errMsg, isError: true);
      }
    } catch (e) {
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
    final shapeName = _faceAnalysis?['faceShape']?['name']?.toString() ??
        (_isAnalyzingFace ? 'Đang phân tích 3D...' : 'Chưa có dữ liệu phân tích');
    final skinTone = _faceAnalysis?['skinUndertone']?['name']?.toString() ?? '--';
    final barberAdvice = _faceAnalysis?['barberAdvice']?.toString() ??
        (_isAnalyzingFace
            ? 'Hệ thống đang đo tỷ lệ khuôn mặt qua MediaPipe 3D Mesh...'
            : (_faceAnalysisError ??
                'Vui lòng chọn ảnh chân dung rõ nét để AI phân tích hình dáng khuôn mặt và tư vấn kiểu tóc thực tế.'));
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
          'Thử trực tiếp 12 phom tóc nam thịnh hành và phân tích ngũ quan 3D trước khi bước vào ghế cắt.',
          style: AppTheme.bodySmall(color: AppTheme.textSecondary, fontSize: 11.5),
        ),
      ],
    );
  }

  Widget _buildPortraitViewer() {
    final activePhoto = _currentPhotoUrl;
    final hasPhoto = activePhoto != null && activePhoto.isNotEmpty;

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
            if (!hasPhoto) ...[
              Container(
                color: AppTheme.surfaceElevated,
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.face_retouching_natural, size: 46, color: AppTheme.accentGold),
                    const SizedBox(height: 12),
                    Text(
                      'CHỌN ẢNH CHÂN DUNG ĐỂ BẮT ĐẦU',
                      style: AppTheme.headingSmall(fontSize: 14, color: AppTheme.textPrimary),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Chọn một trong 3 ảnh chụp người thật bên dưới hoặc dán link ảnh rõ khuôn mặt.',
                      style: AppTheme.bodySmall(color: AppTheme.textSecondary, fontSize: 11.5),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ] else if (!_hasResult) ...[
              EditorialImage(
                imageUrl: activePhoto,
                fit: BoxFit.cover,
                enableWarmFilter: false,
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

            if (hasPhoto)
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

            if (_isScanning) _buildScanningHudOverlay(),
          ],
        ),
      ),
    );
  }

  Widget _buildInteractiveSliderViewer() {
    final resultUrl = _resultImageUrl ?? _currentPhotoUrl ?? '/DataPicture/ChanDungTho/Tho4.jpg';
    // Ưu tiên ảnh 3:4 đã căn chuẩn đầu để khung Before/After trùng khít từng milimet trên thanh trượt
    final originalUrl = (_viewMode == 'raw' ? _rawOriginalPhotoUrl : _croppedImageUrl) ??
        _croppedImageUrl ??
        _rawOriginalPhotoUrl ??
        _currentPhotoUrl ??
        '/DataPicture/ChanDungTho/Tho4.jpg';

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
              // 1. Ảnh kết quả kiểu tóc mới (nằm dưới - tắt warm filter giữ màu thật)
              EditorialImage(
                imageUrl: resultUrl,
                fit: BoxFit.cover,
                enableWarmFilter: false,
              ),

              // 2. Ảnh gốc đã căn khung 3:4 (nằm trên, bị cắt tỉ lệ theo thanh trượt)
              ClipRect(
                clipper: _HorizontalSplitClipper(split),
                child: EditorialImage(
                  imageUrl: originalUrl,
                  fit: BoxFit.cover,
                  enableWarmFilter: false,
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
              'Đang nhận diện khung đầu 3D và ghép kiểu tóc theo ảnh của bạn...',
              style: AppTheme.bodySmall(color: Colors.white, fontWeight: FontWeight.w500),
              textAlign: TextAlign.center,
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

  List<Widget> _buildFaceMetricPills(String skinTone) {
    final hasAnalysis = _faceAnalysis != null && _faceAnalysis?['faceShape'] != null;
    if (!hasAnalysis) {
      return [
        _buildInfoPill(
          'Trạng thái',
          _isAnalyzingFace ? 'Đang quét 3D...' : 'Chờ ảnh phân tích',
        ),
      ];
    }

    int? maxScore;
    final scores = _faceAnalysis?['styleScores'];
    if (scores is Map) {
      for (final entry in scores.values) {
        if (entry is Map && entry['score'] != null) {
          final parsed = int.tryParse(entry['score'].toString());
          if (parsed != null && (maxScore == null || parsed > maxScore)) {
            maxScore = parsed;
          }
        }
      }
    }

    final ratioVal = _faceAnalysis?['metrics']?['ratioLengthToWidth']?.toString() ??
        _faceAnalysis?['metrics']?['faceRatio']?.toString();

    return [
      _buildInfoPill('Tông da', skinTone.split(' ').first),
      if (ratioVal != null && ratioVal.isNotEmpty) _buildInfoPill('Tỉ lệ D/R', ratioVal),
      if (maxScore != null) _buildInfoPill('Độ hợp cao nhất', '$maxScore%'),
    ];
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
            children: _buildFaceMetricPills(skinTone),
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
                          final prodImage = suggestedProduct['image']?.toString() ?? '';
                          scaffold.addToCart(OrderItem(
                            productId: suggestedProduct['id']?.toString() ?? 'SP01',
                            name: suggestedProduct['name']?.toString() ?? 'Apestomen Volcanic Clay VIP',
                            price: int.tryParse(suggestedProduct['price']?.toString() ?? '345000') ?? 345000,
                            quantity: 1,
                            image: prodImage.isNotEmpty
                                ? prodImage
                                : 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay/Apestomen_Volcanic_Clay_01.jpg',
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
                          scaffold.navigateToBooking(serviceId: suggestedService['id']?.toString() ?? 'DV01');
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
      {'id': 'trends', 'label': 'K-Style & Trend (4)'},
      {'id': 'edgy', 'label': 'Gọn & Fade (3)'},
      {'id': 'wavy', 'label': 'Uốn Texture (1)'},
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
        final matchScore = scores?[h['id']]?['score']?.toString();

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
                      if (matchScore != null)
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
    final volumeOptions = [
      {'id': 'natural', 'label': 'Tự nhiên'},
      {'id': 'standard', 'label': 'Tiêu chuẩn'},
      {'id': 'high', 'label': 'Bồng bềnh'},
    ];
    final finishOptions = [
      {'id': 'matte', 'label': 'Sáp Mờ'},
      {'id': 'gloss', 'label': 'Bóng Pomade'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'ĐỘ PHỒNG & CHẤT LIỆU SÁP:',
              style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.accentGold),
            ),
            Text(
              'Tùy chỉnh phom thật',
              style: AppTheme.bodySmall(fontSize: 10.5, color: AppTheme.textSecondary),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              ...volumeOptions.map((v) {
                final isAct = _selectedVolume == v['id'];
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: ChoiceChip(
                    label: Text(v['label']!),
                    labelStyle: AppTheme.bodySmall(
                      fontSize: 10.5,
                      color: isAct ? AppTheme.charcoal : AppTheme.textPrimary,
                      fontWeight: isAct ? FontWeight.w700 : FontWeight.w500,
                    ),
                    selected: isAct,
                    selectedColor: AppTheme.accentGold,
                    backgroundColor: AppTheme.surfaceCard,
                    side: BorderSide(color: isAct ? AppTheme.accentGold : AppTheme.borderColor),
                    onSelected: (val) {
                      if (val) setState(() => _selectedVolume = v['id']!);
                    },
                  ),
                );
              }),
              const SizedBox(width: 6),
              ...finishOptions.map((f) {
                final isAct = _selectedFinish == f['id'];
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: ChoiceChip(
                    label: Text(f['label']!),
                    labelStyle: AppTheme.bodySmall(
                      fontSize: 10.5,
                      color: isAct ? AppTheme.charcoal : AppTheme.textPrimary,
                      fontWeight: isAct ? FontWeight.w700 : FontWeight.w500,
                    ),
                    selected: isAct,
                    selectedColor: AppTheme.accentGold,
                    backgroundColor: AppTheme.surfaceCard,
                    side: BorderSide(color: isAct ? AppTheme.accentGold : AppTheme.borderColor),
                    onSelected: (val) {
                      if (val) setState(() => _selectedFinish = f['id']!);
                    },
                  ),
                );
              }),
            ],
          ),
        ),
        const SizedBox(height: 16),
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
    final metaService = _restyleMeta?['suggestedService'] as Map<String, dynamic>?;
    final targetServiceId = metaService?['id']?.toString() ??
        currentStyle['serviceId']?.toString() ??
        suggestedService?['id']?.toString() ??
        'DV01';

    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _isScanning ? null : _runRestyle,
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
                    'Đang xử lý ghép kiểu tóc...',
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
