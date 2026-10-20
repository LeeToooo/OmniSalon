import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../models/service.dart';
import '../models/branch.dart';
import '../models/stylist.dart';
import '../services/api_service.dart';
import '../widgets/editorial_image.dart';
import '../widgets/marquee_banner.dart';
import 'stylists_screen.dart';
import 'booking_screen.dart';

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
  List<Stylist> _featuredStylists = [];
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
    final stylists = await ApiService.fetchStylists();
    final branches = await ApiService.fetchBranches();

    if (!mounted) return;
    setState(() {
      _featuredServices = services.take(4).toList();
      _featuredStylists = stylists.take(3).toList();
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
          // 1. HERO BANNER
          SliverToBoxAdapter(
            child: _buildHeroBanner(context),
          ),

          // 2. MARQUEE BANNER
          const SliverToBoxAdapter(
            child: MarqueeBanner(),
          ),

          // 3. ASYMMETRIC MOBILE BENTO GRID
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

          // 4. AI STUDIO 3D TEASER BANNER (ĐỒNG BỘ 100% VỚI WEB)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: _buildAiStudioBanner(),
            ),
          ),

          // 5. DỊCH VỤ TẠO KIỂU ĐƯỢC ƯA CHUỘNG
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

          // 6. ĐỘI NGŨ MASTER STYLIST (ĐỒNG BỘ 100% VỚI WEB 3-COLUMN SHOWCASE)
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
                        'NGHỆ NHÂN TẠO MẪU',
                        style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Master Stylist & Art Director',
                        style: AppTheme.headingMedium(fontSize: 22),
                      ),
                    ],
                  ),
                  GestureDetector(
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const StylistsScreen()),
                      );
                    },
                    child: Text(
                      'Xem toàn bộ thợ →',
                      style: AppTheme.bodySmall(color: AppTheme.accentGold, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: SizedBox(
              height: 275,
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: _featuredStylists.length,
                itemBuilder: (context, idx) {
                  final sty = _featuredStylists[idx];
                  return _buildStylistPreviewCard(sty);
                },
              ),
            ),
          ),

          // 7. HỆ THỐNG CHI NHÁNH CHUYÊN NGHIỆP
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

  // AI Studio 3D Teaser Card
  Widget _buildAiStudioBanner() {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.charcoal,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.5), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: AppTheme.accentGold.withValues(alpha: 0.1),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.accentGold.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.4)),
              ),
              child: const Icon(Icons.auto_awesome_rounded, color: AppTheme.accentGold, size: 28),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text('OMNI AI STUDIO 3D', style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.accentGold)),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: AppTheme.statusSuccess.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(3),
                        ),
                        child: const Text('NEURAL SCAN', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.w800, color: AppTheme.statusSuccess)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text('Thử Kiểu Tóc 3D Trên Khuôn Mặt', style: AppTheme.headingSmall(fontSize: 15, color: AppTheme.textLight)),
                  const SizedBox(height: 2),
                  Text('Tự động nhận diện ngũ quan & phối màu nhuộm thời thượng', style: AppTheme.bodySmall(fontSize: 11, color: AppTheme.textLightSecondary), maxLines: 1),
                ],
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              onPressed: () {
                if (widget.onNavigateToTab != null) widget.onNavigateToTab!(3);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.accentGold,
                foregroundColor: AppTheme.charcoal,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text('Trải Nghiệm', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800)),
            ),
          ],
        ),
      ),
    );
  }

  // Thẻ thợ tạo mẫu Master Stylist nằm ngang
  Widget _buildStylistPreviewCard(Stylist s) {
    return Container(
      width: 200,
      margin: const EdgeInsets.only(right: 14),
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
              height: 125,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  EditorialImage(imageUrl: s.avatar, fit: BoxFit.cover),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Colors.black.withValues(alpha: 0.7)],
                      ),
                    ),
                  ),
                  Positioned(
                    top: 6,
                    right: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.7),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star_rounded, size: 12, color: AppTheme.accentGold),
                          const SizedBox(width: 2),
                          Text('${s.rating}', style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                  decoration: BoxDecoration(
                    color: AppTheme.accentGold.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(3),
                  ),
                  child: Text(s.level.toUpperCase(), style: AppTheme.labelUppercase(fontSize: 8.5, color: AppTheme.accentGold)),
                ),
                const SizedBox(height: 3),
                Text(s.name, style: AppTheme.headingSmall(fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text('${s.experienceYears}+ Năm KN • ${s.branchName.split("-").last.trim()}', style: AppTheme.bodySmall(fontSize: 10.5, color: AppTheme.textSecondary), maxLines: 1),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  height: 32,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => BookingScreen(preselectedBranchId: s.branchId),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accentGold,
                      foregroundColor: AppTheme.charcoal,
                      padding: EdgeInsets.zero,
                      minimumSize: Size.zero,
                    ),
                    child: const Text('Đặt Lịch', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 1. Hero Banner
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
            const EditorialImage(
              imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1000&q=80',
              fit: BoxFit.cover,
            ),
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
            Positioned(
              left: 20,
              right: 20,
              bottom: 24,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'CHUẨN MỰC BARBERSHOP ĐƯƠNG ĐẠI',
                    style: AppTheme.labelUppercase(
                      fontSize: 10.5,
                      color: AppTheme.accentGold,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Định Hình Phong Cách & Bản Lĩnh Phái Mạnh',
                    style: AppTheme.headingLarge(
                      fontSize: 26,
                      color: AppTheme.textLight,
                    ),
                  ),
                  const SizedBox(height: 10),
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

  // 2. Bento Grid
  Widget _buildAsymmetricBentoGrid() {
    return Column(
      children: [
        _buildBentoCard(
          height: 160,
          title: 'Không Gian Authentic Barbershop',
          subtitle: 'Kiến trúc cổ điển kết hợp ánh sáng tự nhiên và hương gỗ đàn hương thư giãn.',
          tag: 'KHÔNG GIAN ĐẶC QUYỀN',
          imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
        ),
        const SizedBox(height: 10),
        Row(
          children: [
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
