import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../models/service.dart';
import '../models/stylist.dart';
import '../services/api_service.dart';
import '../widgets/editorial_image.dart';

class ServicesScreen extends StatefulWidget {
  final Function(String? serviceId)? onNavigateToBooking;

  const ServicesScreen({super.key, this.onNavigateToBooking});

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
    {'id': 'Chăm Sóc & Phục Hồi', 'label': 'Dưỡng Sinh & Râu'},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
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
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
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
                  child: EditorialImage(imageUrl: s.image, fit: BoxFit.cover),
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
                      s.category.toUpperCase(),
                      style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.accentGold),
                    ),
                  ),
                  Row(
                    children: [
                      const Icon(Icons.schedule_rounded, size: 14, color: AppTheme.textSecondary),
                      const SizedBox(width: 4),
                      Text('${s.duration} phút', style: AppTheme.bodySmall(color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(s.name, style: AppTheme.headingSmall(fontSize: 18)),
              const SizedBox(height: 4),
              Text(currencyFormat.format(s.price), style: AppTheme.headingMedium(fontSize: 20, color: AppTheme.accentGold)),
              const SizedBox(height: 10),
              Text(s.description, style: AppTheme.bodySmall(color: AppTheme.textSecondary, fontSize: 13)),
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
                    if (widget.onNavigateToBooking != null) {
                      widget.onNavigateToBooking!(s.id);
                    }
                  },
                  child: Text('ĐẶT LỊCH DỊCH VỤ NÀY NGAY (${currencyFormat.format(s.price)})'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStepItem(String num, String desc) {
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

    final filtered = _allServices.where((s) {
      if (_selectedCategory == 'all') return true;
      if (_selectedCategory == 'Combo VIP') return s.isCombo;
      return s.category == _selectedCategory;
    }).toList();

    return Column(
      children: [
        // Filter Chips ngang
        SizedBox(
          height: 46,
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
          child: ListView.builder(
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
        margin: const EdgeInsets.only(bottom: 14),
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
                    width: 90,
                    height: 90,
                    child: EditorialImage(
                      imageUrl: s.image,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
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
                                const Icon(Icons.schedule_rounded, size: 12, color: AppTheme.textSecondary),
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
                          style: AppTheme.headingSmall(fontSize: 15.5),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 3),
                        Text(
                          s.description,
                          style: AppTheme.bodySmall(color: AppTheme.textSecondary),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const Divider(color: AppTheme.borderColorSubtle, height: 1),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Giá niêm yết', style: AppTheme.bodySmall(fontSize: 10.5, color: AppTheme.textMuted)),
                      Text(
                        currencyFormat.format(s.price),
                        style: AppTheme.headingSmall(fontSize: 16, color: AppTheme.accentGold),
                      ),
                    ],
                  ),
                  ElevatedButton(
                    onPressed: () {
                      if (widget.onNavigateToBooking != null) {
                        widget.onNavigateToBooking!(s.id);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accentGold,
                      foregroundColor: AppTheme.charcoal,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      itemCount: _allStylists.length,
      itemBuilder: (context, index) {
        final barber = _allStylists[index];
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
                      widget.onNavigateToBooking!(null);
                    }
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
