import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../models/service.dart';
import '../models/branch.dart';
import '../services/api_service.dart';
import '../widgets/editorial_image.dart';
import '../widgets/marquee_banner.dart';

class HomeScreen extends StatefulWidget {
  final Function(int)? onNavigateToTab;
  final Branch? selectedBranch;

  const HomeScreen({
    super.key,
    this.onNavigateToTab,
    this.selectedBranch,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫', decimalDigits: 0);

  List<SalonService> _featuredServices = [];
  List<Branch> _branches = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final services = await ApiService.fetchServices();
    final branches = await ApiService.fetchBranches();

    if (!mounted) return;
    setState(() {
      _featuredServices = services.take(4).toList();
      _branches = branches.take(3).toList();
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.accentGold, strokeWidth: 2),
      );
    }

    return RefreshIndicator(
      color: AppTheme.accentGold,
      backgroundColor: AppTheme.surfaceCard,
      onRefresh: _loadData,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // ========================================================
          // 1. HERO BANNER BỐ CỤC DỌC CHUẨN MOBILE
          // ========================================================
          SliverToBoxAdapter(
            child: _buildHeroBanner(context),
          ),

          // ========================================================
          // 2. THANH CHỮ CHẠY NGANG (MARQUEE BANNER)
          // ========================================================
          const SliverToBoxAdapter(
            child: MarqueeBanner(),
          ),

          // ========================================================
          // 3. ASYMMETRIC MOBILE BENTO GRID
          // ========================================================
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 28, 16, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'ĐIỂM KHÁC BIỆT',
                    style: AppTheme.labelUppercase(fontSize: 11, color: AppTheme.accentGold),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Trải Nghiệm Chuẩn Mực Barber',
                    style: AppTheme.headingMedium(fontSize: 24),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Không gian chăm sóc tóc và thư giãn đỉnh đạc dành riêng cho phái mạnh.',
                    style: AppTheme.bodySmall(color: AppTheme.textSecondary),
                  ),
                  const SizedBox(height: 16),
                  _buildAsymmetricBentoGrid(),
                ],
              ),
            ),
          ),

          // ========================================================
          // 4. DỊCH VỤ TẠO KIỂU ĐƯỢC ƯA CHUỘNG
          // ========================================================
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'DANH MỤC DỊCH VỤ',
                        style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Dịch Vụ Tiêu Biểu',
                        style: AppTheme.headingMedium(fontSize: 22),
                      ),
                    ],
                  ),
                  GestureDetector(
                    onTap: () {
                      if (widget.onNavigateToTab != null) widget.onNavigateToTab!(1);
                    },
                    child: Text(
                      'Xem tất cả →',
                      style: AppTheme.bodySmall(color: AppTheme.accentGold, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final service = _featuredServices[index];
                  return _buildServiceCard(service);
                },
                childCount: _featuredServices.length,
              ),
            ),
          ),

          // ========================================================
          // 5. HỆ THỐNG CHI NHÁNH CHUYÊN NGHIỆP
          // ========================================================
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 28, 16, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'MẠNG LƯỚI KHÔNG GIAN',
                    style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Hệ Thống Chi Nhánh Omni',
                    style: AppTheme.headingMedium(fontSize: 22),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Hiện diện tại các trục đường trung tâm, không gian đỗ xe thông thoáng.',
                    style: AppTheme.bodySmall(color: AppTheme.textSecondary),
                  ),
                  const SizedBox(height: 16),
                  ..._branches.map((b) => _buildBranchCard(b)),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // 1. Hero Banner: Bố cục dọc chuẩn Mobile với ảnh nghệ thuật phủ gradient tối
  Widget _buildHeroBanner(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 440,
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Ảnh nền nghệ thuật ấm
            const EditorialImage(
              imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1000&q=80',
              fit: BoxFit.cover,
            ),

            // Lớp phủ Gradient tối sâu dần từ trên xuống dưới
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppTheme.charcoal.withValues(alpha: 0.2),
                    AppTheme.charcoal.withValues(alpha: 0.65),
                    AppTheme.charcoal.withValues(alpha: 0.95),
                  ],
                  stops: const [0.0, 0.5, 1.0],
                ),
              ),
            ),

            // Nội dung chính của Hero Banner
            Positioned(
              left: 20,
              right: 20,
              bottom: 24,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Nhãn nhỏ Open Sans
                  Text(
                    'CHUẨN MỰC BARBERSHOP ĐƯƠNG ĐẠI',
                    style: AppTheme.labelUppercase(
                      fontSize: 10.5,
                      color: AppTheme.accentGold,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Tiêu đề lớn Playfair Display
                  Text(
                    'Định Hình Phong Cách & Bản Lĩnh Phái Mạnh',
                    style: AppTheme.headingLarge(
                      fontSize: 26,
                      color: AppTheme.textLight,
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Thẻ kính mờ BackdropFilter: 4.9★ (2,500+ Đánh giá) • Bảo hành kiểu tóc 7 ngày
                  ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.charcoal.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.star_rounded, size: 15, color: AppTheme.accentGold),
                            const SizedBox(width: 4),
                            Text(
                              '4.9★ (2,500+ Đánh giá) • Bảo hành kiểu tóc 7 ngày',
                              style: AppTheme.bodySmall(
                                fontSize: 11.5,
                                color: AppTheme.textLight,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),

                  // 2 Nút CTA: Đặt Lịch Hẹn Ngay & Xem bảng giá →
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            if (widget.onNavigateToTab != null) widget.onNavigateToTab!(2);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.accentGold,
                            foregroundColor: AppTheme.charcoal,
                            padding: const EdgeInsets.symmetric(vertical: 13),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          child: Text(
                            'Đặt Lịch Hẹn Ngay',
                            style: AppTheme.bodyMedium(
                              color: AppTheme.charcoal,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      OutlinedButton(
                        onPressed: () {
                          if (widget.onNavigateToTab != null) widget.onNavigateToTab!(1);
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.textLight,
                          side: BorderSide(color: AppTheme.textLight.withValues(alpha: 0.4), width: 1.2),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: Text(
                          'Xem bảng giá →',
                          style: AppTheme.bodyMedium(
                            color: AppTheme.textLight,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 2. Asymmetric Mobile Bento Grid:
  // Thẻ lớn ngang trên + 2 thẻ dọc lệch tỷ lệ ở giữa + 1 thẻ ngang ở dưới
  Widget _buildAsymmetricBentoGrid() {
    return Column(
      children: [
        // Thẻ lớn ngang ở trên: Không gian Authentic Barbershop
        _buildBentoCard(
          height: 160,
          title: 'Không Gian Authentic Barbershop',
          subtitle: 'Kiến trúc cổ điển kết hợp ánh sáng tự nhiên và hương gỗ đàn hương thư giãn.',
          tag: 'KHÔNG GIAN ĐẶC QUYỀN',
          imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
        ),
        const SizedBox(height: 10),

        // 2 Thẻ dọc lệch tỷ lệ ở giữa (1.2x và 0.8x)
        Row(
          children: [
            // Thẻ dọc trái (1.2x): Master Barber
            Expanded(
              flex: 12,
              child: _buildBentoCard(
                height: 210,
                title: 'Master Barber',
                subtitle: 'Kỹ thuật kéo tỉa kinh nghiệm trên 8 năm.',
                tag: 'TAY NGHỀ',
                imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=500&q=80',
              ),
            ),
            const SizedBox(width: 10),

            // Thẻ dọc phải (1.0x): Dược liệu & Pomade
            Expanded(
              flex: 10,
              child: _buildBentoCard(
                height: 210,
                title: 'Pomade & Dược Liệu',
                subtitle: '100% nhập khẩu chính ngạch.',
                tag: 'CHẤT LƯỢNG',
                imageUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=500&q=80',
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // Thẻ ngang ở dưới: Gội Dưỡng Sinh & Trị Liệu Đầu
        _buildBentoCard(
          height: 140,
          title: 'Gội Dưỡng Sinh & Bấm Huyệt Đỉnh Cao',
          subtitle: 'Khai thông kinh lạc vùng cổ vai gáy, xua tan căng thẳng mệt mỏi.',
          tag: 'THƯ GIÃN CHUYÊN SÂU',
          imageUrl: 'https://images.unsplash.com/photo-1517832606589-7629c3395907?auto=format&fit=crop&w=800&q=80',
        ),
      ],
    );
  }

  Widget _buildBentoCard({
    required double height,
    required String title,
    required String subtitle,
    required String tag,
    required String imageUrl,
  }) {
    return Container(
      height: height,
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(9),
        child: Stack(
          fit: StackFit.expand,
          children: [
            EditorialImage(
              imageUrl: imageUrl,
              fit: BoxFit.cover,
            ),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.15),
                    Colors.black.withValues(alpha: 0.8),
                  ],
                ),
              ),
            ),
            Positioned(
              left: 14,
              right: 14,
              bottom: 12,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    tag,
                    style: AppTheme.labelUppercase(fontSize: 9.5, color: AppTheme.accentGold),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    title,
                    style: AppTheme.headingSmall(fontSize: 15, color: AppTheme.textLight),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: AppTheme.bodySmall(fontSize: 11, color: AppTheme.textLightSecondary),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildServiceCard(SalonService s) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: SizedBox(
                width: 76,
                height: 76,
                child: EditorialImage(
                  imageUrl: s.image,
                  fit: BoxFit.cover,
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    s.category.toUpperCase(),
                    style: AppTheme.labelUppercase(fontSize: 9.5, color: AppTheme.accentGold),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    s.name,
                    style: AppTheme.headingSmall(fontSize: 15),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    s.description,
                    style: AppTheme.bodySmall(color: AppTheme.textSecondary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        currencyFormat.format(s.price),
                        style: AppTheme.headingSmall(fontSize: 15, color: AppTheme.accentGold),
                      ),
                      Row(
                        children: [
                          const Icon(Icons.schedule_rounded, size: 13, color: AppTheme.textSecondary),
                          const SizedBox(width: 3),
                          Text(
                            '${s.duration} phút',
                            style: AppTheme.bodySmall(color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBranchCard(Branch b) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(9)),
            child: SizedBox(
              width: double.infinity,
              height: 120,
              child: EditorialImage(
                imageUrl: b.image,
                fit: BoxFit.cover,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  b.name,
                  style: AppTheme.headingSmall(fontSize: 16),
                ),
                const SizedBox(height: 4),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.accentGold),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        b.address,
                        style: AppTheme.bodySmall(color: AppTheme.textSecondary),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.access_time_rounded, size: 14, color: AppTheme.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      b.hours,
                      style: AppTheme.bodySmall(color: AppTheme.textSecondary),
                    ),
                    const Spacer(),
                    Text(
                      b.phone,
                      style: AppTheme.bodySmall(color: AppTheme.accentGold, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
