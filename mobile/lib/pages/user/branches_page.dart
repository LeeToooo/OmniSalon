import 'package:flutter/material.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';
import 'package:omni_salon_mobile/models/branch.dart';
import 'package:omni_salon_mobile/core/api/api_service.dart';
import 'package:omni_salon_mobile/components/omni_image.dart';
import 'package:omni_salon_mobile/pages/user/booking_page.dart';

class BranchesScreen extends StatefulWidget {
  const BranchesScreen({super.key});

  @override
  State<BranchesScreen> createState() => _BranchesScreenState();
}

class _BranchesScreenState extends State<BranchesScreen> {
  List<Branch> allBranches = [];
  bool isLoading = true;
  String selectedDistrict = 'all';
  final TextEditingController _searchController = TextEditingController();

  final districts = [
    {'id': 'all', 'label': 'Toàn Hệ Thống'},
    {'id': 'Quận 1', 'label': 'Quận 1 (Flagship)'},
    {'id': 'Quận 3', 'label': 'Quận 3'},
    {'id': 'Quận 4', 'label': 'Quận 4'},
    {'id': 'Quận 5', 'label': 'Quận 5'},
    {'id': 'Quận 7', 'label': 'Quận 7'},
    {'id': 'Quận 10', 'label': 'Quận 10'},
    {'id': 'Bình Thạnh', 'label': 'Bình Thạnh'},
    {'id': 'Tân Bình', 'label': 'Tân Bình'},
    {'id': 'Gò Vấp', 'label': 'Gò Vấp'},
    {'id': 'Phú Nhuận', 'label': 'Phú Nhuận'},
    {'id': 'Thủ Đức', 'label': 'TP. Thủ Đức'},
  ];

  @override
  void initState() {
    super.initState();
    _loadBranches();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadBranches() async {
    setState(() => isLoading = true);
    final list = await ApiService.fetchBranches();
    if (!mounted) return;
    setState(() {
      allBranches = list;
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final query = _searchController.text.trim().toLowerCase();

    final filtered = allBranches.where((b) {
      // 1. Lọc theo quận
      if (selectedDistrict != 'all') {
        final text = '${b.name} ${b.address}'.toLowerCase();
        if (!text.contains(selectedDistrict.toLowerCase())) {
          return false;
        }
      }

      // 2. Lọc theo ô tìm kiếm
      if (query.isNotEmpty) {
        final text = '${b.name} ${b.address} ${b.phone}'.toLowerCase();
        if (!text.contains(query)) {
          return false;
        }
      }

      return true;
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: AppTheme.textPrimary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Hệ Thống 20 Chi Nhánh',
              style: AppTheme.headingSmall(fontSize: 18),
            ),
            Text(
              'Không gian chuẩn mực Barbershop tại TP.HCM',
              style: AppTheme.bodySmall(fontSize: 11, color: AppTheme.textSecondary),
            ),
          ],
        ),
        backgroundColor: AppTheme.bgPrimary,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppTheme.accentGold),
            onPressed: _loadBranches,
            tooltip: 'Làm mới',
          ),
        ],
      ),
      body: Column(
        children: [
          // 1. Ô tìm kiếm chi nhánh
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              controller: _searchController,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                hintText: 'Tìm theo tên đường, quận, chi nhánh...',
                prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppTheme.textMuted),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {});
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                isDense: true,
                filled: true,
                fillColor: AppTheme.surfaceCard,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppTheme.borderColor),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppTheme.borderColor),
                ),
              ),
            ),
          ),

          // 2. Danh mục quận / khu vực
          Container(
            color: AppTheme.bgPrimary,
            padding: const EdgeInsets.only(bottom: 8),
            child: SizedBox(
              height: 38,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: districts.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, idx) {
                  final d = districts[idx];
                  final isSelected = selectedDistrict == d['id'];
                  return ChoiceChip(
                    label: Text(
                      d['label']!,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isSelected ? AppTheme.charcoal : AppTheme.textPrimary,
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: AppTheme.accentGold,
                    backgroundColor: AppTheme.surfaceCard,
                    side: BorderSide(
                      color: isSelected ? AppTheme.accentGold : AppTheme.borderColor,
                    ),
                    onSelected: (_) {
                      setState(() => selectedDistrict = d['id']!);
                    },
                  );
                },
              ),
            ),
          ),

          // 3. Danh sách thẻ chi nhánh Lookbook (Chuẩn Ảnh 2)
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.accentGold))
                : filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.storefront_outlined, size: 48, color: AppTheme.textMuted),
                            const SizedBox(height: 12),
                            Text(
                              'Không tìm thấy chi nhánh nào.',
                              style: AppTheme.bodyMedium(color: AppTheme.textSecondary),
                            ),
                            const SizedBox(height: 12),
                            OutlinedButton(
                              onPressed: () {
                                _searchController.clear();
                                setState(() => selectedDistrict = 'all');
                              },
                              child: const Text('Xem lại tất cả chi nhánh'),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: filtered.length,
                        itemBuilder: (context, idx) {
                          final b = filtered[idx];
                          final isFlagship = b.id == 'CN01' || b.name.contains('Bến Thành') || b.name.contains('Q1');

                          return Container(
                            margin: const EdgeInsets.only(bottom: 18),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceCard,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isFlagship ? AppTheme.accentGold.withValues(alpha: 0.4) : AppTheme.borderColor,
                                width: isFlagship ? 1.4 : 1.0,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.05),
                                  blurRadius: 12,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Stack(
                                  children: [
                                    OmniImage(
                                      imageUrl: b.image,
                                      height: 175,
                                      width: double.infinity,
                                      fit: BoxFit.cover,
                                      borderRadius: const BorderRadius.vertical(top: Radius.circular(13)),
                                      fallbackIcon: Icons.storefront,
                                    ),
                                    Container(
                                      height: 175,
                                      decoration: BoxDecoration(
                                        borderRadius: const BorderRadius.vertical(top: Radius.circular(13)),
                                        gradient: LinearGradient(
                                          begin: Alignment.topCenter,
                                          end: Alignment.bottomCenter,
                                          colors: [
                                            Colors.black.withValues(alpha: 0.1),
                                            Colors.black.withValues(alpha: 0.55),
                                          ],
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      top: 10,
                                      left: 10,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: AppTheme.charcoal.withValues(alpha: 0.9),
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.6)),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(Icons.star_rounded, size: 14, color: AppTheme.accentGold),
                                            const SizedBox(width: 4),
                                            Text(
                                              '4.9 (500+ Đánh giá)',
                                              style: AppTheme.labelUppercase(color: AppTheme.textLight, fontSize: 9.5),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      top: 10,
                                      right: 10,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: isFlagship ? AppTheme.accentGold : AppTheme.charcoal.withValues(alpha: 0.85),
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: isFlagship ? AppTheme.accentGold : AppTheme.borderColor),
                                        ),
                                        child: Text(
                                          isFlagship ? 'CƠ SỞ FLAGSHIP' : 'CHI NHÁNH ${b.id}',
                                          style: AppTheme.labelUppercase(
                                            color: isFlagship ? AppTheme.charcoal : AppTheme.accentGold,
                                            fontSize: 9.5,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      left: 14,
                                      bottom: 12,
                                      right: 14,
                                      child: Text(
                                        b.name,
                                        style: AppTheme.headingSmall(fontSize: 18, color: AppTheme.textLight),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                                Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Icon(Icons.location_on_outlined, size: 18, color: AppTheme.accentGold),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              b.address,
                                              style: AppTheme.bodySmall(color: AppTheme.textSecondary, fontSize: 13),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          const Icon(Icons.access_time_rounded, size: 16, color: AppTheme.accentGold),
                                          const SizedBox(width: 6),
                                          Text(
                                            b.hours.isNotEmpty ? b.hours : '8:30 - 21:30 (Cả tuần)',
                                            style: AppTheme.bodySmall(color: AppTheme.textSecondary, fontWeight: FontWeight.w600),
                                          ),
                                          const Spacer(),
                                          const Icon(Icons.phone_in_talk_rounded, size: 16, color: AppTheme.statusSuccess),
                                          const SizedBox(width: 4),
                                          Text(
                                            b.phone,
                                            style: AppTheme.bodySmall(color: AppTheme.statusSuccess, fontWeight: FontWeight.w700),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 16),
                                      SizedBox(
                                        width: double.infinity,
                                        height: 44,
                                        child: ElevatedButton.icon(
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppTheme.accentGold,
                                            foregroundColor: AppTheme.charcoal,
                                            elevation: 0,
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                          ),
                                          onPressed: () {
                                            Navigator.of(context).push(
                                              MaterialPageRoute(
                                                builder: (_) => BookingScreen(preselectedBranchId: b.id),
                                              ),
                                            );
                                          },
                                          icon: const Icon(Icons.calendar_month_rounded, size: 18),
                                          label: const Text(
                                            'Đặt Lịch Tại Chi Nhánh Này',
                                            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

typedef BranchesPage = BranchesScreen;
