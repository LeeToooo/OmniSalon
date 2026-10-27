import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/stylist.dart';
import '../models/branch.dart';
import '../services/api_service.dart';
import '../widgets/editorial_image.dart';
import 'booking_screen.dart';

class StylistsScreen extends StatefulWidget {
  final String? initialBranchId;

  const StylistsScreen({super.key, this.initialBranchId});

  @override
  State<StylistsScreen> createState() => _StylistsScreenState();
}

class _StylistsScreenState extends State<StylistsScreen> {
  List<Stylist> _allStylists = [];
  List<Branch> _branches = [];
  bool _isLoading = true;
  String _selectedBranchId = 'all';

  @override
  void initState() {
    super.initState();
    if (widget.initialBranchId != null && widget.initialBranchId!.isNotEmpty) {
      _selectedBranchId = widget.initialBranchId!;
    }
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final stylists = await ApiService.fetchStylists();
    final branches = await ApiService.fetchBranches();
    if (!mounted) return;
    setState(() {
      _allStylists = stylists;
      _branches = branches;
      _isLoading = false;
    });
  }

  List<Stylist> get _filteredStylists {
    if (_selectedBranchId == 'all') return _allStylists;
    return _allStylists.where((s) => s.branchId == _selectedBranchId).toList();
  }

  String get _selectedBranchName {
    if (_selectedBranchId == 'all') return 'Tất Cả Chi Nhánh';
    final found = _branches.where((b) => b.id == _selectedBranchId);
    if (found.isEmpty) return 'CN $_selectedBranchId';
    return found.first.name.replaceAll(RegExp(r'^Omni Salon (Barber )?', caseSensitive: false), '').trim();
  }

  void _showBranchBubbleModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(ctx).size.height * 0.75,
          ),
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.accentGold.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'DANH SÁCH CHI NHÁNH',
                      style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.accentGold),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Chọn Chi Nhánh Đặt Lịch',
                style: AppTheme.headingSmall(fontSize: 20),
              ),
              const SizedBox(height: 4),
              Text(
                'Lọc nhanh đội ngũ Master Stylist trực tiếp phục vụ tại cơ sở.',
                style: AppTheme.bodySmall(color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 18),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  _buildBubbleChip(
                    label: 'Tất Cả Chi Nhánh (${_allStylists.length})',
                    isSelected: _selectedBranchId == 'all',
                    onTap: () {
                      setState(() => _selectedBranchId = 'all');
                      Navigator.of(ctx).pop();
                    },
                  ),
                  ..._branches.map((b) {
                    final isSel = _selectedBranchId == b.id;
                    final count = _allStylists.where((s) => s.branchId == b.id).length;
                    return _buildBubbleChip(
                      label: '${b.name} ($count)',
                      isSelected: isSel,
                      onTap: () {
                        setState(() => _selectedBranchId = b.id);
                        Navigator.of(ctx).pop();
                      },
                    );
                  }),
                ],
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    ),
  );
}

  Widget _buildBubbleChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.accentGold : AppTheme.surfaceElevated,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? AppTheme.accentGold : AppTheme.borderColor,
            width: 1.2,
          ),
        ),
        child: Text(
          label,
          style: AppTheme.bodySmall(
            color: isSelected ? AppTheme.charcoal : AppTheme.textPrimary,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredStylists;

    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Đội Ngũ Stylist & Barber',
          style: AppTheme.headingSmall(fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppTheme.accentGold),
            onPressed: _loadData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.accentGold, strokeWidth: 2),
            )
          : CustomScrollView(
              slivers: [
                // Header Banner Editorial
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.accentGold.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'ĐỘI NGŨ THỢ BARBER LÀNH NGHỀ',
                            style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Thợ Cắt Tóc & Chuyên Gia Tạo Mẫu',
                          style: AppTheme.headingLarge(fontSize: 24),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Tập hợp những tay kéo vững tay nghề, sắc sảo trong từng đường fade và thấu hiểu cấu trúc gương mặt để định hình phong cách riêng cho bạn.',
                          style: AppTheme.bodySmall(color: AppTheme.textSecondary),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),

                        // Nút mở Bubble Modal chọn chi nhánh
                        Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap: _showBranchBubbleModal,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: AppTheme.surfaceCard,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: AppTheme.borderColor),
                                  ),
                                  child: Row(
                                    children: [
                                      Text('Chi Nhánh: ', style: AppTheme.bodySmall(color: AppTheme.textSecondary)),
                                      Expanded(
                                        child: Text(
                                          _selectedBranchName,
                                          style: AppTheme.bodySmall(color: AppTheme.accentGold, fontWeight: FontWeight.w700),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppTheme.surfaceElevated,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          '${filtered.length} Thợ',
                                          style: AppTheme.bodySmall(fontSize: 10.5, fontWeight: FontWeight.w700),
                                        ),
                                      ),
                                      const SizedBox(width: 2),
                                      const Icon(Icons.arrow_drop_down_rounded, size: 18, color: AppTheme.accentGold),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            if (_selectedBranchId != 'all') ...[
                              const SizedBox(width: 8),
                              GestureDetector(
                                onTap: () => setState(() => _selectedBranchId = 'all'),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: AppTheme.surfaceElevated,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: AppTheme.borderColor),
                                  ),
                                  child: Text(
                                    'Xem Tất Cả',
                                    style: AppTheme.bodySmall(fontWeight: FontWeight.w700),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                // Lưới thẻ Master Stylist (Chuẩn 100% web stylists-page.js)
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 28),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final s = filtered[index];
                        return _buildStylistCard(s);
                      },
                      childCount: filtered.length,
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildStylistCard(Stylist s) {
    final isArtDirector = s.level.toUpperCase().contains('ART DIRECTOR');

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isArtDirector ? AppTheme.accentGold.withValues(alpha: 0.6) : AppTheme.borderColor,
          width: isArtDirector ? 1.4 : 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Thẻ ảnh chân dung HD với góc bo mượt
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(11)),
            child: SizedBox(
              height: 220,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  EditorialImage(
                    imageUrl: s.avatar,
                    fit: BoxFit.cover,
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          AppTheme.charcoal.withValues(alpha: 0.85),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.charcoal.withValues(alpha: 0.8),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.6)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star_rounded, color: AppTheme.accentGold, size: 16),
                          const SizedBox(width: 4),
                          Text(
                            s.rating.toStringAsFixed(1),
                            style: AppTheme.bodySmall(color: AppTheme.textLight, fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '(${s.reviewCount})',
                            style: AppTheme.bodySmall(color: AppTheme.textLightSecondary, fontSize: 10.5),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 12,
                    left: 14,
                    right: 14,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: isArtDirector ? AppTheme.accentGold : AppTheme.charcoalSurface,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            s.level.toUpperCase(),
                            style: AppTheme.labelUppercase(
                              fontSize: 9.5,
                              color: isArtDirector ? AppTheme.charcoal : AppTheme.accentGold,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          s.name,
                          style: AppTheme.headingMedium(fontSize: 20, color: AppTheme.textLight),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Nội dung chi tiết tay nghề và sở trường
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.storefront_outlined, size: 14, color: AppTheme.accentGold),
                    const SizedBox(width: 5),
                    Expanded(
                      child: Text(
                        s.branchName,
                        style: AppTheme.bodySmall(fontWeight: FontWeight.w600),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceElevated,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: AppTheme.borderColor),
                      ),
                      child: Text(
                        '${s.experienceYears}+ Năm Kinh Nghiệm',
                        style: AppTheme.bodySmall(fontSize: 10, color: AppTheme.textSecondary, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                Text(
                  'SỞ TRƯỜNG TẠO MẪU',
                  style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.textSecondary),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: s.specialties.map((spec) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceElevated,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: AppTheme.borderColorSubtle),
                      ),
                      child: Text(
                        '• $spec',
                        style: AppTheme.bodySmall(fontSize: 11, color: AppTheme.textPrimary),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 14),

                // Nút CTA đặt lịch trực tiếp với Stylist này
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => BookingScreen(
                            preselectedBranchId: s.branchId,
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.calendar_month_rounded, size: 18),
                    label: Text(
                      'ĐẶT LỊCH VỚI ${s.name.toUpperCase()}',
                      style: AppTheme.bodySmall(color: AppTheme.charcoal, fontWeight: FontWeight.w800),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accentGold,
                      foregroundColor: AppTheme.charcoal,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
