import 'package:omni_salon_mobile/core/api/api_service.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';
import 'package:omni_salon_mobile/models/service.dart';
import 'package:omni_salon_mobile/models/stylist.dart';
import 'package:omni_salon_mobile/components/editorial_image.dart';

class ServicesScreen extends StatefulWidget {
  final void Function({String? serviceId, String? stylistId, String? branchId})? onNavigateToBooking;

  const ServicesScreen({super.key, this.onNavigateToBooking});

  // Modal xem chi tiết dịch vụ dùng chung cho cả Services Screen và Home Screen
  static void showServiceDetailModal(
    BuildContext context, {
    required SalonService service,
    void Function({String? serviceId, String? stylistId, String? branchId})? onNavigateToBooking,
  }) {
    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫', decimalDigits: 0);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(ctx).size.height * 0.85,
          ),
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(color: AppTheme.borderColor, borderRadius: BorderRadius.circular(2)),
                  ),
                ),
                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: SizedBox(
                    height: 180,
                    width: double.infinity,
                    child: EditorialImage(imageUrl: service.image, fit: BoxFit.cover),
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppTheme.accentGold.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        service.category.toUpperCase(),
                        style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.accentGold),
                      ),
                    ),
                    Row(
                      children: [
                        Icon(Icons.schedule_rounded, size: 14, color: AppTheme.textSecondary),
                        const SizedBox(width: 4),
                        Text('${service.duration} phút', style: AppTheme.bodySmall(color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(service.name, style: AppTheme.headingSmall(fontSize: 18)),
                const SizedBox(height: 4),
                Text(currencyFormat.format(service.price), style: AppTheme.headingMedium(fontSize: 20, color: AppTheme.accentGold)),
                const SizedBox(height: 10),
                Text(service.description, style: AppTheme.bodySmall(color: AppTheme.textSecondary, fontSize: 13)),
                const SizedBox(height: 14),

                Text('QUY TRÌNH THỰC HIỆN TIÊU CHUẨN', style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.accentGold)),
                const SizedBox(height: 6),
                _buildStepItem('1', 'Tư vấn phom dáng mặt & cấu trúc sợi tóc.'),
                _buildStepItem('2', 'Gội xả thảo mộc & massage bấm huyệt đả thông kinh lạc.'),
                _buildStepItem('3', 'Cắt fade & tỉa texture tạo tầng bồng bềnh bằng kéo nhật.'),
                _buildStepItem('4', 'Cạo viền sắc nét & chườm khăn nóng thư giãn.'),
                _buildStepItem('5', 'Sấy tạo phom & vuốt sáp / pomade khóa form giữ nếp cả ngày.'),
                const SizedBox(height: 16),

                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(ctx).pop();
                      if (onNavigateToBooking != null) {
                        onNavigateToBooking(serviceId: service.id);
                      }
                    },
                    child: Text('ĐẶT LỊCH DỊCH VỤ NÀY NGAY (${currencyFormat.format(service.price)})'),
                  ),
                ),
                const SizedBox(height: 18),
                Divider(color: AppTheme.borderColorSubtle),
                const SizedBox(height: 12),
                FutureBuilder<List<Map<String, dynamic>>>(
                  future: ApiService.fetchReviews(serviceId: service.id),
                  builder: (context, snapshot) {
                    final reviews = snapshot.data ?? [];
                    final count = reviews.length;
                    double avg = 5.0;
                    if (count > 0) {
                      final total = reviews.fold<int>(0, (sum, r) => sum + (int.tryParse(r['rating']?.toString() ?? '5') ?? 5));
                      avg = total / count;
                    }
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('ĐÁNH GIÁ DỊCH VỤ', style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.accentGold)),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(Icons.star_rounded, size: 15, color: Color(0xFFF59E0B)),
                            const SizedBox(width: 4),
                            Text(
                              count > 0
                                  ? '${avg.toStringAsFixed(1)} / 5.0 ($count đánh giá)'
                                  : 'Chưa có đánh giá',
                              style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        if (snapshot.connectionState == ConnectionState.waiting)
                          const Center(
                            child: Padding(
                              padding: EdgeInsets.all(12),
                              child: SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.accentGold),
                              ),
                            ),
                          )
                        else if (reviews.isEmpty)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceElevated,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppTheme.borderColorSubtle),
                            ),
                            child: Text(
                              'Chưa có đánh giá nào cho dịch vụ này. Hãy đặt lịch và trải nghiệm để lại đánh giá bạn nhé!',
                              style: AppTheme.bodySmall(fontSize: 11.5, color: AppTheme.textSecondary),
                            ),
                          )
                        else
                          ...reviews.take(3).map((r) {
                            final stars = int.tryParse(r['rating']?.toString() ?? '5') ?? 5;
                            final dateStr = (r['date'] ?? '').toString();
                            final shortDate = dateStr.length >= 10 ? dateStr.substring(0, 10) : dateStr;
                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppTheme.surfaceElevated,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppTheme.borderColorSubtle),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        r['customerName'] ?? 'Khách Hàng',
                                        style: AppTheme.bodySmall(fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                                      ),
                                      Text(
                                        shortDate.isNotEmpty ? shortDate : 'Gần đây',
                                        style: AppTheme.bodySmall(fontSize: 10.5, color: AppTheme.textMuted),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: List.generate(
                                      5,
                                      (idx) => Icon(
                                        Icons.star_rounded,
                                        size: 13,
                                        color: idx < stars ? const Color(0xFFF59E0B) : AppTheme.borderColor,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    r['comment'] ?? '',
                                    style: AppTheme.bodySmall(fontSize: 11.5, color: AppTheme.textSecondary),
                                  ),
                                ],
                              ),
                            );
                          }),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  static Widget _buildStepItem(String num, String desc) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 18,
            height: 18,
            margin: const EdgeInsets.only(top: 1, right: 8),
            decoration: BoxDecoration(
              color: AppTheme.surfaceElevated,
              shape: BoxShape.circle,
              border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.6)),
            ),
            child: Center(
              child: Text(num, style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: AppTheme.accentGold)),
            ),
          ),
          Expanded(child: Text(desc, style: AppTheme.bodySmall(fontSize: 11.5, color: AppTheme.textPrimary))),
        ],
      ),
    );
  }

  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> with SingleTickerProviderStateMixin {
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫', decimalDigits: 0);

  late TabController _tabController;
  List<SalonService> _allServices = [];
  List<Stylist> _allStylists = [];
  bool _isLoading = true;
  String _selectedCategory = 'all';

  final _categories = [
    {'id': 'all', 'label': 'Tất Cả'},
    {'id': 'Combo VIP', 'label': 'Combo Quý Tộc'},
    {'id': 'Cắt & Tạo Kiểu', 'label': 'Cắt & Tạo Kiểu'},
    {'id': 'Uốn & Nhuộm', 'label': 'Uốn & Nhuộm'},
    {'id': 'Dưỡng Sinh & Râu', 'label': 'Dưỡng Sinh & Râu'},
  ];

  final _stylistSearchController = TextEditingController();
  String _stylistQuery = '';
  final _serviceSearchController = TextEditingController();
  String _serviceQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _stylistSearchController.dispose();
    _serviceSearchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final services = await ApiService.fetchServices();
    final stylists = await ApiService.fetchStylists();

    if (!mounted) return;
    setState(() {
      _allServices = services;
      _allStylists = stylists;
      _isLoading = false;
    });
  }

  void _showServiceDetailModal(SalonService s) {
    ServicesScreen.showServiceDetailModal(
      context,
      service: s,
      onNavigateToBooking: widget.onNavigateToBooking,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      body: SafeArea(
        child: NestedScrollView(
          headerSliverBuilder: (context, innerBoxIsScrolled) => [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'BẢNG GIÁ & ĐỘI NGŨ',
                      style: AppTheme.labelUppercase(fontSize: 11, color: AppTheme.accentGold),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Dịch Vụ & Thợ Tạo Mẫu',
                      style: AppTheme.headingLarge(fontSize: 28),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Minh bạch bảng giá dịch vụ và tuyển chọn các Master Barber giàu trải nghiệm.',
                      style: AppTheme.bodySmall(color: AppTheme.textSecondary),
                    ),
                    const SizedBox(height: 16),

                    // Segmented Control 2 Tab
                    Container(
                      height: 42,
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceElevated,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppTheme.borderColor),
                      ),
                      child: TabBar(
                        controller: _tabController,
                        indicatorSize: TabBarIndicatorSize.tab,
                        indicator: BoxDecoration(
                          color: AppTheme.accentGold,
                          borderRadius: BorderRadius.circular(7),
                        ),
                        labelColor: AppTheme.charcoal,
                        unselectedLabelColor: AppTheme.textSecondary,
                        labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                        tabs: const [
                          Tab(text: 'Bảng Giá Dịch Vụ'),
                          Tab(text: 'Đội Ngũ Stylist'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          body: TabBarView(
            controller: _tabController,
            children: [
              _buildServicesTab(),
              _buildStylistsTab(),
            ],
          ),
        ),
      ),
    );
  }

  // TAB 1: DANH SÁCH DỊCH VỤ
  Widget _buildServicesTab() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.accentGold, strokeWidth: 2),
      );
    }

    final query = _serviceQuery.trim().toLowerCase();
    final filtered = _allServices.where((s) {
      bool matchesCat = true;
      if (_selectedCategory == 'all') {
        matchesCat = true;
      } else if (_selectedCategory == 'Combo VIP') {
        matchesCat = s.isCombo || s.category == 'Combo VIP';
      } else if (_selectedCategory == 'Cắt & Tạo Kiểu') {
        matchesCat = s.category == 'Cắt & Tạo Kiểu' && !s.isCombo;
      } else if (_selectedCategory == 'Uốn & Nhuộm') {
        final text = '${s.name} ${s.description} ${s.category}'.toLowerCase();
        matchesCat = s.category == 'Uốn & Nhuộm' ||
            text.contains('uốn') ||
            text.contains('nhuộm') ||
            text.contains('tẩy');
      } else if (_selectedCategory == 'Dưỡng Sinh & Râu' || _selectedCategory == 'Chăm Sóc & Phục Hồi') {
        final text = '${s.name} ${s.description} ${s.category}'.toLowerCase();
        matchesCat = s.category == 'Dưỡng Sinh & Râu' ||
            s.category == 'Chăm Sóc & Phục Hồi' ||
            text.contains('râu') ||
            text.contains('cạo mặt') ||
            text.contains('ráy tai') ||
            text.contains('facial') ||
            text.contains('dưỡng sinh') ||
            text.contains('gội') ||
            text.contains('massage') ||
            text.contains('chăm sóc');
      } else {
        matchesCat = s.category == _selectedCategory;
      }

      if (!matchesCat) return false;
      if (query.isEmpty) return true;
      return s.name.toLowerCase().contains(query) ||
          s.description.toLowerCase().contains(query) ||
          s.category.toLowerCase().contains(query);
    }).toList();

    return Column(
      children: [
        // Thanh tìm kiếm dịch vụ
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 6),
          child: Container(
            height: 42,
            decoration: BoxDecoration(
              color: AppTheme.surfaceCard,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppTheme.borderColor),
            ),
            child: TextField(
              controller: _serviceSearchController,
              onChanged: (val) => setState(() => _serviceQuery = val),
              style: AppTheme.bodyMedium(),
              decoration: InputDecoration(
                hintText: 'Tìm kiếm dịch vụ, combo, uốn nhuộm...',
                hintStyle: AppTheme.bodySmall(color: AppTheme.textMuted),
                prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppTheme.accentGold),
                suffixIcon: _serviceQuery.isNotEmpty
                    ? IconButton(
                        icon: Icon(Icons.clear_rounded, size: 18, color: AppTheme.textSecondary),
                        onPressed: () {
                          _serviceSearchController.clear();
                          setState(() => _serviceQuery = '');
                        },
                      )
                    : null,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
            ),
          ),
        ),

        // Filter Chips ngang
        SizedBox(
          height: 44,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
            scrollDirection: Axis.horizontal,
            itemCount: _categories.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, idx) {
              final cat = _categories[idx];
              final isSelected = _selectedCategory == cat['id'];
              return ChoiceChip(
                label: Text(
                  cat['label']!,
                  style: AppTheme.bodySmall(
                    color: isSelected ? AppTheme.charcoal : AppTheme.textPrimary,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
                selected: isSelected,
                selectedColor: AppTheme.accentGold,
                backgroundColor: AppTheme.surfaceCard,
                side: BorderSide(
                  color: isSelected ? AppTheme.accentGold : AppTheme.borderColor,
                ),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                onSelected: (_) {
                  setState(() => _selectedCategory = cat['id']!);
                },
              );
            },
          ),
        ),
        const SizedBox(height: 6),

        Expanded(
          child: filtered.isEmpty
              ? Center(
                  child: Text(
                    'Không tìm thấy dịch vụ phù hợp',
                    style: AppTheme.bodyMedium(color: AppTheme.textSecondary),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final s = filtered[index];
                    return _buildDetailedServiceCard(s);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildDetailedServiceCard(SalonService s) {
    return GestureDetector(
      onTap: () => _showServiceDetailModal(s),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: AppTheme.surfaceCard,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppTheme.borderColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(9),
                    bottomRight: Radius.circular(9),
                  ),
                  child: SizedBox(
                    width: 58,
                    height: 58,
                    child: EditorialImage(
                      imageUrl: s.image,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 6, 12, 6),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              s.category.toUpperCase(),
                              style: AppTheme.labelUppercase(fontSize: 9.5, color: AppTheme.accentGold),
                            ),
                            Row(
                              children: [
                                Icon(Icons.schedule_rounded, size: 12, color: AppTheme.textSecondary),
                                const SizedBox(width: 3),
                                Text(
                                  '${s.duration} phút',
                                  style: AppTheme.bodySmall(fontSize: 11, color: AppTheme.textSecondary),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 3),
                        Text(
                          s.name,
                          style: AppTheme.headingSmall(fontSize: 15),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            Divider(color: AppTheme.borderColorSubtle, height: 1),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    currencyFormat.format(s.price),
                    style: AppTheme.headingSmall(fontSize: 15.5, color: AppTheme.accentGold),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      if (widget.onNavigateToBooking != null) {
                        widget.onNavigateToBooking!(serviceId: s.id);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accentGold,
                      foregroundColor: AppTheme.charcoal,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                    ),
                    child: Text(
                      'Đặt Lịch Ngay',
                      style: AppTheme.bodySmall(color: AppTheme.charcoal, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // TAB 2: DANH SÁCH MASTER BARBER
  Widget _buildStylistsTab() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.accentGold, strokeWidth: 2),
      );
    }

    final query = _stylistQuery.trim().toLowerCase();
    final filtered = _allStylists.where((barber) {
      final levelLower = barber.level.toLowerCase();
      final roleLower = barber.role.toLowerCase();
      if (roleLower.contains('thu ngân') ||
          roleLower.contains('cashier') ||
          roleLower.contains('kế toán') ||
          levelLower.contains('thu ngân') ||
          levelLower == 'nhân viên') {
        return false;
      }
      if (query.isEmpty) return true;
      return barber.name.toLowerCase().contains(query) ||
          barber.level.toLowerCase().contains(query) ||
          barber.branchName.toLowerCase().contains(query);
    }).toList();

    return Column(
      children: [
        // Thanh tìm kiếm thợ
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 6),
          child: Container(
            height: 42,
            decoration: BoxDecoration(
              color: AppTheme.surfaceCard,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppTheme.borderColor),
            ),
            child: TextField(
              controller: _stylistSearchController,
              onChanged: (val) => setState(() => _stylistQuery = val),
              style: AppTheme.bodyMedium(),
              decoration: InputDecoration(
                hintText: 'Tìm kiếm thợ theo tên, tay nghề, chi nhánh...',
                hintStyle: AppTheme.bodySmall(color: AppTheme.textMuted),
                prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppTheme.accentGold),
                suffixIcon: _stylistQuery.isNotEmpty
                    ? IconButton(
                        icon: Icon(Icons.clear_rounded, size: 18, color: AppTheme.textSecondary),
                        onPressed: () {
                          _stylistSearchController.clear();
                          setState(() => _stylistQuery = '');
                        },
                      )
                    : null,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
            ),
          ),
        ),

        Expanded(
          child: filtered.isEmpty
              ? Center(
                  child: Text(
                    'Không tìm thấy thợ phù hợp',
                    style: AppTheme.bodyMedium(color: AppTheme.textSecondary),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final barber = filtered[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceCard,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.borderColor),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: SizedBox(
                                width: 72,
                                height: 72,
                                child: EditorialImage(
                                  imageUrl: barber.avatar,
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppTheme.accentGold.withValues(alpha: 0.15),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          barber.level.toUpperCase(),
                                          style: AppTheme.labelUppercase(fontSize: 9, color: AppTheme.accentGold),
                                        ),
                                      ),
                                      const Spacer(),
                                      const Icon(Icons.star_rounded, size: 15, color: AppTheme.accentGold),
                                      const SizedBox(width: 3),
                                      Text(
                                        barber.rating.toStringAsFixed(1),
                                        style: AppTheme.bodySmall(fontWeight: FontWeight.w700),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    barber.name,
                                    style: AppTheme.headingSmall(fontSize: 16),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${barber.experienceYears}+ Năm KN • ${barber.branchName.split("-").last.trim()}',
                                    style: AppTheme.bodySmall(color: AppTheme.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            IconButton(
                              icon: const Icon(Icons.calendar_month_outlined, color: AppTheme.accentGold, size: 22),
                              tooltip: 'Đặt lịch với thợ này',
                              onPressed: () {
                                if (widget.onNavigateToBooking != null) {
                                  widget.onNavigateToBooking!(
                                    stylistId: barber.id,
                                    branchId: barber.branchId,
                                  );
                                }
                              },
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

typedef ServicesPage = ServicesScreen;
