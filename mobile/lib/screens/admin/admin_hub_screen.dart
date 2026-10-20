import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../theme/app_theme.dart';
import '../../models/booking.dart';
import '../../models/service.dart';
import '../../models/stylist.dart';
import '../../models/product.dart';
import '../../models/branch.dart';
import '../../models/admin_models.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/editorial_image.dart';

class AdminHubScreen extends StatefulWidget {
  const AdminHubScreen({super.key});

  @override
  State<AdminHubScreen> createState() => _AdminHubScreenState();
}

class _AdminHubScreenState extends State<AdminHubScreen> with SingleTickerProviderStateMixin {
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫', decimalDigits: 0);

  late TabController _tabController;
  bool _isLoading = true;

  // Dữ liệu quản trị
  Map<String, dynamic> _metrics = {};
  List<Booking> _bookings = [];
  List<StaffMember> _staff = [];
  List<SalonService> _services = [];
  List<InventoryItem> _inventory = [];
  List<FefoLot> _fefoLots = [];
  List<Invoice> _invoices = [];
  List<Branch> _branches = [];
  List<Stylist> _stylists = [];
  List<Product> _products = [];

  // Lọc lịch hẹn
  String _bookingStatusFilter = 'all';
  String _bookingBranchFilter = 'all';

  // State POS Thu ngân tại quầy
  String _posBranchId = 'CN01';
  String? _posStylistId;
  final _posCustomerNameController = TextEditingController(text: 'Khách Cắt Quầy');
  final _posCustomerPhoneController = TextEditingController(text: '0908888999');
  final _posVoucherController = TextEditingController();
  final List<SalonService> _posSelectedServices = [];
  final List<Product> _posSelectedProducts = [];
  String _posPaymentMethod = 'VietQR';
  int _posDiscount = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 7, vsync: this);
    _tabController.addListener(() {
      if (mounted) setState(() {});
    });
    _loadAdminData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _posCustomerNameController.dispose();
    _posCustomerPhoneController.dispose();
    _posVoucherController.dispose();
    super.dispose();
  }

  Future<void> _loadAdminData() async {
    setState(() => _isLoading = true);
    final metrics = await ApiService.fetchAdminMetrics();
    final bookings = await ApiService.fetchBookings();
    final staff = await ApiService.fetchStaffMembers();
    final services = await ApiService.fetchServices();
    final inventory = await ApiService.fetchInventory();
    final fefo = await ApiService.fetchFefoLots();
    final invoices = await ApiService.fetchInvoices();
    final branches = await ApiService.fetchBranches();
    final stylists = await ApiService.fetchStylists();
    final products = await ApiService.fetchProducts();

    if (!mounted) return;
    setState(() {
      _metrics = metrics;
      _bookings = bookings;
      _staff = staff;
      _services = services;
      _inventory = inventory;
      _fefoLots = fefo;
      _invoices = invoices;
      _branches = branches;
      _stylists = stylists;
      _products = products;
      if (stylists.isNotEmpty && _posStylistId == null) {
        _posStylistId = stylists.first.id;
      }
      _isLoading = false;
    });
  }

  // =========================================================================
  // ACTIONS QUẢN LÝ LỊCH HẸN (DISPATCHER)
  // =========================================================================
  Future<void> _changeBookingStatus(Booking b, String newStatus) async {
    final ok = await ApiService.updateBookingStatus(b.id, newStatus);
    if (!mounted) return;
    if (ok) {
      setState(() {
        b.status = newStatus;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Đã cập nhật lịch #${b.bookingCode} sang "$newStatus"', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
          backgroundColor: AppTheme.charcoal,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _showReassignStylistDialog(Booking b) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Text('Đổi Master Stylist phục vụ', style: AppTheme.headingSmall(fontSize: 18)),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: _stylists.length,
            itemBuilder: (context, idx) {
              final sty = _stylists[idx];
              final isCurrent = sty.id == b.stylistId;
              return ListTile(
                leading: CircleAvatar(
                  backgroundImage: NetworkImage(sty.avatar),
                ),
                title: Text(sty.name, style: AppTheme.bodyMedium(fontWeight: FontWeight.w700)),
                subtitle: Text('${sty.level} • ${sty.branchName}', style: AppTheme.bodySmall(color: AppTheme.textSecondary)),
                trailing: isCurrent ? const Icon(Icons.check_circle_rounded, color: AppTheme.accentGold) : null,
                onTap: () async {
                  Navigator.of(ctx).pop();
                  await ApiService.updateBookingStatus(b.id, b.status, stylistId: sty.id, stylistName: sty.name);
                  setState(() {
                    _loadAdminData();
                  });
                },
              );
            },
          ),
        ),
      ),
    );
  }

  // =========================================================================
  // ACTIONS POS THU NGÂN
  // =========================================================================
  int get _posServicesTotal => _posSelectedServices.fold(0, (sum, s) => sum + s.price);
  int get _posProductsTotal => _posSelectedProducts.fold(0, (sum, p) => sum + p.actualPrice);
  int get _posSubtotal => _posServicesTotal + _posProductsTotal;
  int get _posFinalTotal => (_posSubtotal - _posDiscount) > 0 ? (_posSubtotal - _posDiscount) : 0;

  void _applyPosVoucher() {
    final code = _posVoucherController.text.trim().toUpperCase();
    if (code == 'OMNIWELCOME' || code == 'VIP10') {
      setState(() {
        _posDiscount = (_posSubtotal * 0.1).round();
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Áp dụng thành công voucher giảm 10%')),
      );
    } else if (code == 'QUYONG50') {
      setState(() {
        _posDiscount = 50000;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Áp dụng mã QUYONG50: Giảm 50.000₫')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mã voucher không hợp lệ')),
      );
    }
  }

  Future<void> _processPosCheckout() async {
    if (_posSelectedServices.isEmpty && _posSelectedProducts.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn ít nhất 1 dịch vụ hoặc sản phẩm để tính tiền!')),
      );
      return;
    }

    final billData = {
      'customerName': _posCustomerNameController.text.trim().isNotEmpty
          ? _posCustomerNameController.text.trim()
          : 'Khách Cắt Quầy',
      'customerPhone': _posCustomerPhoneController.text.trim(),
      'branchId': _posBranchId,
      'stylistId': _posStylistId,
      'total': _posFinalTotal,
      'paymentMethod': _posPaymentMethod,
      'summary': '${_posSelectedServices.length} Dịch vụ + ${_posSelectedProducts.length} Sản phẩm',
      'services': _posSelectedServices.map((s) => {'id': s.id, 'price': s.price, 'name': s.name}).toList(),
      'products': _posSelectedProducts.map((p) => {
        'id': p.id,
        'quantity': 1,
        'price': p.actualPrice,
        'name': p.name,
      }).toList(),
    };

    final inv = await ApiService.createPosInvoice(billData);
    if (!mounted) return;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle),
              child: const Icon(Icons.check, color: Colors.white, size: 36),
            ),
            const SizedBox(height: 14),
            Text('Thanh Toán Thành Công!', style: AppTheme.headingSmall(fontSize: 20)),
            const SizedBox(height: 6),
            Text('Hóa đơn số: ${inv.invoiceNumber}', style: AppTheme.bodySmall(color: AppTheme.accentGold, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text('Tổng thanh toán: ${currencyFormat.format(inv.total)}', style: AppTheme.headingMedium(fontSize: 18, color: AppTheme.accentGold)),
            const SizedBox(height: 4),
            Text('Phương thức: ${inv.paymentMethod}', style: AppTheme.bodySmall(color: AppTheme.textSecondary)),
            const SizedBox(height: 16),
            if (_posPaymentMethod == 'VietQR') ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Image.network(
                  'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=OMNISALON_POS_${inv.invoiceNumber}_${inv.total}',
                  width: 140,
                  height: 140,
                ),
              ),
              const SizedBox(height: 8),
              Text('Quét mã SePay / VietQR để hoàn tất', style: AppTheme.bodySmall(fontSize: 11, color: AppTheme.textSecondary)),
            ],
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            height: 42,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                setState(() {
                  _posSelectedServices.clear();
                  _posSelectedProducts.clear();
                  _posDiscount = 0;
                  _posVoucherController.clear();
                  _loadAdminData();
                });
              },
              child: const Text('XUẤT HÓA ĐƠN & TẠO ĐƠN MỚI'),
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // GIAO DIỆN CHÍNH (ADMIN PORTAL SHELL)
  // =========================================================================
  @override
  Widget build(BuildContext context) {
    final user = AuthService.currentUser;

    return Scaffold(
      backgroundColor: AppTheme.charcoal,
      appBar: AppBar(
        backgroundColor: AppTheme.charcoal,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: AppTheme.textLight),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Text('OMNISALON ADMIN HUB', style: AppTheme.headingSmall(fontSize: 16, color: AppTheme.textLight)),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppTheme.accentGold.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text('LIVE SQL', style: AppTheme.labelUppercase(fontSize: 8.5, color: AppTheme.accentGold)),
                ),
              ],
            ),
            Text(
              user != null ? '${user.fullName} (${user.role})' : 'Ban Điều Hành & Quản Trị Viên',
              style: AppTheme.bodySmall(fontSize: 11, color: AppTheme.textLightSecondary),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppTheme.accentGold),
            onPressed: _loadAdminData,
            tooltip: 'Đồng bộ dữ liệu SQL Server',
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          indicatorColor: AppTheme.accentGold,
          indicatorWeight: 3,
          labelColor: AppTheme.accentGold,
          unselectedLabelColor: AppTheme.textLightSecondary,
          labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
          tabs: const [
            Tab(icon: Icon(Icons.dashboard_rounded, size: 18), text: 'Tổng quan'),
            Tab(icon: Icon(Icons.calendar_today_rounded, size: 18), text: 'Điều phối lịch'),
            Tab(icon: Icon(Icons.point_of_sale_rounded, size: 18), text: 'POS Thu ngân'),
            Tab(icon: Icon(Icons.content_cut_rounded, size: 18), text: 'Đội ngũ thợ'),
            Tab(icon: Icon(Icons.inventory_2_rounded, size: 18), text: 'Kho & FEFO'),
            Tab(icon: Icon(Icons.format_list_bulleted_rounded, size: 18), text: 'Bảng giá'),
            Tab(icon: Icon(Icons.receipt_long_rounded, size: 18), text: 'Hóa đơn'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.accentGold, strokeWidth: 2))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildOverviewTab(),
                _buildDispatcherTab(),
                _buildPosTab(),
                _buildStaffTab(),
                _buildInventoryTab(),
                _buildCatalogTab(),
                _buildInvoicesTab(),
              ],
            ),
    );
  }

  // =========================================================================
  // 1. TAB TỔNG QUAN (OVERVIEW)
  // =========================================================================
  Widget _buildOverviewTab() {
    final todayRev = _metrics['todayRevenue'] ?? 8450000;
    final todayBookings = _metrics['todayBookings'] ?? 28;
    final staffCount = _metrics['staffOnDuty'] ?? 8;
    final occupancy = _metrics['occupancyRate'] ?? 85.5;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('CHỈ SỐ VẬN HÀNH THỜI GIAN THỰC', style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold)),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _buildKpiCard(
                  title: 'Doanh Thu Ngày',
                  value: currencyFormat.format(todayRev),
                  sub: '+14% so với hôm qua',
                  icon: Icons.payments_outlined,
                  highlight: true,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildKpiCard(
                  title: 'Lịch Hẹn Hôm Nay',
                  value: '$todayBookings Cuộc hẹn',
                  sub: '${_bookings.where((b) => b.status == "Completed").length} Đã hoàn tất',
                  icon: Icons.calendar_month_outlined,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _buildKpiCard(
                  title: 'Thợ Trực Ca',
                  value: '$staffCount Master Barber',
                  sub: '100% Sẵn sàng đón khách',
                  icon: Icons.content_cut_rounded,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildKpiCard(
                  title: 'Tỷ Lệ Ghế Cắt',
                  value: '$occupancy%',
                  sub: 'Hiệu suất khai thác cao',
                  icon: Icons.chair_alt_rounded,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Doanh thu theo từng chi nhánh
          Text('DOANH THU THEO CHI NHÁNH', style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold)),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.charcoalLight,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.charcoalBorder),
            ),
            child: Column(
              children: [
                _buildBranchProgressRow('Omni Q1 - Bến Thành', 0.85, '4.200.000₫ (14 khách)'),
                const Divider(color: AppTheme.charcoalBorder, height: 18),
                _buildBranchProgressRow('Omni Tân Bình - Cộng Hòa', 0.65, '2.850.000₫ (9 khách)'),
                const Divider(color: AppTheme.charcoalBorder, height: 18),
                _buildBranchProgressRow('Omni Bình Thạnh - Điện Biên Phủ', 0.45, '1.400.000₫ (5 khách)'),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Cảnh báo tồn kho FEFO cận hạn
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('CẢNH BÁO TỒN KHO FEFO CẬN HẠN', style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold)),
              Text('${_fefoLots.length} Lô hàng', style: AppTheme.bodySmall(color: AppTheme.accentGold, fontSize: 11)),
            ],
          ),
          const SizedBox(height: 10),
          ..._fefoLots.map((lot) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.charcoalLight,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: lot.daysLeft <= 35 ? AppTheme.statusDanger.withValues(alpha: 0.6) : AppTheme.charcoalBorder),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: (lot.daysLeft <= 35 ? AppTheme.statusDanger : AppTheme.accentGold).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Icon(Icons.warning_amber_rounded, size: 20, color: lot.daysLeft <= 35 ? AppTheme.statusDanger : AppTheme.accentGold),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(lot.productName, style: AppTheme.bodyMedium(color: AppTheme.textLight, fontWeight: FontWeight.w700), maxLines: 1),
                      Text('Lô: ${lot.lotNumber} • Hạn dùng: ${lot.expiryDate} (Còn ${lot.daysLeft} ngày)', style: AppTheme.bodySmall(color: AppTheme.textLightSecondary, fontSize: 11)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.accentGold.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text('-${lot.discountPercent.toInt()}%', style: AppTheme.bodySmall(color: AppTheme.accentGold, fontWeight: FontWeight.w800)),
                ),
              ],
            ),
          )),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildKpiCard({required String title, required String value, required String sub, required IconData icon, bool highlight = false}) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.charcoalLight,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: highlight ? AppTheme.accentGold.withValues(alpha: 0.8) : AppTheme.charcoalBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: AppTheme.bodySmall(color: AppTheme.textLightSecondary, fontSize: 11)),
              Icon(icon, size: 16, color: AppTheme.accentGold),
            ],
          ),
          const SizedBox(height: 8),
          Text(value, style: AppTheme.headingSmall(fontSize: 16, color: highlight ? AppTheme.accentGold : AppTheme.textLight)),
          const SizedBox(height: 3),
          Text(sub, style: AppTheme.bodySmall(color: AppTheme.textLightSecondary, fontSize: 10.5), maxLines: 1),
        ],
      ),
    );
  }

  Widget _buildBranchProgressRow(String name, double percent, String details) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(name, style: AppTheme.bodySmall(color: AppTheme.textLight, fontWeight: FontWeight.w600)),
            Text(details, style: AppTheme.bodySmall(color: AppTheme.accentGold, fontSize: 11, fontWeight: FontWeight.w700)),
          ],
        ),
        const SizedBox(height: 6),
        LinearProgressIndicator(
          value: percent,
          backgroundColor: AppTheme.charcoalSurface,
          valueColor: const AlwaysStoppedAnimation(AppTheme.accentGold),
          minHeight: 6,
          borderRadius: BorderRadius.circular(3),
        ),
      ],
    );
  }

  // =========================================================================
  // 2. TAB ĐIỀU PHỐI LỊCH HẸN (DISPATCHER)
  // =========================================================================
  Widget _buildDispatcherTab() {
    final filtered = _bookings.where((b) {
      if (_bookingStatusFilter != 'all') {
        if (_bookingStatusFilter == 'Waiting' && (b.status == 'Waiting' || b.status == 'In_Progress')) {
          // match
        } else if (b.status != _bookingStatusFilter) {
          return false;
        }
      }
      if (_bookingBranchFilter != 'all' && b.branchId != _bookingBranchFilter) {
        return false;
      }
      return true;
    }).toList();

    return Column(
      children: [
        // Bộ lọc chi nhánh
        Container(
          color: AppTheme.charcoalLight,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Row(
            children: [
              const Icon(Icons.storefront_outlined, size: 16, color: AppTheme.accentGold),
              const SizedBox(width: 8),
              Text('Chi nhánh:', style: AppTheme.bodySmall(color: AppTheme.textLightSecondary, fontSize: 11)),
              const SizedBox(width: 8),
              Expanded(
                child: DropdownButton<String>(
                  value: _bookingBranchFilter,
                  dropdownColor: AppTheme.charcoalLight,
                  isDense: true,
                  underline: const SizedBox(),
                  style: AppTheme.bodySmall(color: AppTheme.textLight, fontWeight: FontWeight.w700),
                  items: [
                    const DropdownMenuItem(value: 'all', child: Text('Tất cả chi nhánh')),
                    ..._branches.map((b) => DropdownMenuItem(value: b.id, child: Text(b.name, overflow: TextOverflow.ellipsis))),
                  ],
                  onChanged: (val) {
                    if (val != null) setState(() => _bookingBranchFilter = val);
                  },
                ),
              ),
            ],
          ),
        ),
        const Divider(color: AppTheme.charcoalBorder, height: 1),

        // Thanh bộ lọc trạng thái nhanh
        Container(
          color: AppTheme.charcoalLight,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildStatusFilterChip('all', 'Tất Cả (${_bookings.length})'),
                const SizedBox(width: 6),
                _buildStatusFilterChip('Confirmed', 'Đã Xác Nhận'),
                const SizedBox(width: 6),
                _buildStatusFilterChip('In_Progress', 'Đang Phục Vụ'),
                const SizedBox(width: 6),
                _buildStatusFilterChip('Completed', 'Hoàn Tất'),
                const SizedBox(width: 6),
                _buildStatusFilterChip('Cancelled', 'Đã Hủy'),
              ],
            ),
          ),
        ),

        // Danh sách thẻ lịch hẹn
        Expanded(
          child: filtered.isEmpty
              ? Center(
                  child: Text('Không có lịch hẹn nào khớp với bộ lọc', style: AppTheme.bodyMedium(color: AppTheme.textLightSecondary)),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(14),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final b = filtered[index];
                    return _buildBookingDispatcherCard(b);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildStatusFilterChip(String key, String label) {
    final isSel = _bookingStatusFilter == key;
    return GestureDetector(
      onTap: () => setState(() => _bookingStatusFilter = key),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSel ? AppTheme.accentGold : AppTheme.charcoalSurface,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: isSel ? AppTheme.accentGold : AppTheme.charcoalBorder),
        ),
        child: Text(
          label,
          style: AppTheme.bodySmall(
            color: isSel ? AppTheme.charcoal : AppTheme.textLightSecondary,
            fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
            fontSize: 11.5,
          ),
        ),
      ),
    );
  }

  Widget _buildBookingDispatcherCard(Booking b) {
    Color statusColor;
    String statusLabel;
    switch (b.status) {
      case 'In_Progress':
        statusColor = const Color(0xFF3B82F6);
        statusLabel = 'Đang Phục Vụ';
        break;
      case 'Completed':
        statusColor = const Color(0xFF10B981);
        statusLabel = 'Hoàn Tất';
        break;
      case 'Cancelled':
        statusColor = AppTheme.statusDanger;
        statusLabel = 'Đã Hủy';
        break;
      default:
        statusColor = AppTheme.accentGold;
        statusLabel = 'Đã Xác Nhận';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.charcoalLight,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.charcoalBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.accentGold.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text('#${b.bookingCode}', style: AppTheme.bodySmall(color: AppTheme.accentGold, fontWeight: FontWeight.w800, fontSize: 11)),
                  ),
                  const SizedBox(width: 8),
                  Text('${b.timeSlot} • ${b.date}', style: AppTheme.bodySmall(color: AppTheme.textLight, fontWeight: FontWeight.w700)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: statusColor),
                ),
                child: Text(statusLabel, style: AppTheme.labelUppercase(fontSize: 9, color: statusColor)),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Tên khách hàng & số điện thoại
          Row(
            children: [
              const Icon(Icons.person_outline_rounded, size: 16, color: AppTheme.textLightSecondary),
              const SizedBox(width: 6),
              Text(b.customerName, style: AppTheme.bodyMedium(color: AppTheme.textLight, fontWeight: FontWeight.w700)),
              const Spacer(),
              Text(b.customerPhone, style: AppTheme.bodySmall(color: AppTheme.textLightSecondary)),
            ],
          ),
          const SizedBox(height: 6),

          // Dịch vụ thực hiện
          Row(
            children: [
              const Icon(Icons.content_cut_rounded, size: 15, color: AppTheme.accentGold),
              const SizedBox(width: 6),
              Expanded(
                child: Text(b.serviceName, style: AppTheme.bodySmall(color: AppTheme.textLight), maxLines: 1, overflow: TextOverflow.ellipsis),
              ),
              Text(currencyFormat.format(b.totalPrice), style: AppTheme.bodySmall(color: AppTheme.accentGold, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 6),

          // Master Stylist & Chi nhánh
          Row(
            children: [
              const Icon(Icons.badge_outlined, size: 15, color: AppTheme.textLightSecondary),
              const SizedBox(width: 6),
              Text('Thợ: ${b.stylistName}', style: AppTheme.bodySmall(color: AppTheme.textLightSecondary)),
              const Spacer(),
              Text(b.branchName, style: AppTheme.bodySmall(color: AppTheme.textLightSecondary, fontSize: 10.5)),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(color: AppTheme.charcoalBorder, height: 1),
          const SizedBox(height: 10),

          // Các nút thao tác điều phối
          Row(
            children: [
              if (b.status == 'Confirmed') ...[
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => _changeBookingStatus(b, 'In_Progress'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF3B82F6),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      minimumSize: Size.zero,
                    ),
                    child: const Text('VÀO GHẾ PHỤC VỤ', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800)),
                  ),
                ),
                const SizedBox(width: 8),
              ],
              if (b.status == 'In_Progress') ...[
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => _changeBookingStatus(b, 'Completed'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      minimumSize: Size.zero,
                    ),
                    child: const Text('HOÀN TẤT DỊCH VỤ', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800)),
                  ),
                ),
                const SizedBox(width: 8),
              ],
              OutlinedButton(
                onPressed: () => _showReassignStylistDialog(b),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.accentGold,
                  side: const BorderSide(color: AppTheme.accentGold),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  minimumSize: Size.zero,
                ),
                child: const Text('ĐỔI THỢ', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
              ),
              if (b.status != 'Cancelled' && b.status != 'Completed') ...[
                const SizedBox(width: 6),
                IconButton(
                  icon: const Icon(Icons.cancel_outlined, color: AppTheme.statusDanger, size: 20),
                  tooltip: 'Hủy lịch hẹn',
                  onPressed: () => _changeBookingStatus(b, 'Cancelled'),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // 3. TAB POS THU NGÂN TẠI QUẦY
  // =========================================================================
  Widget _buildPosTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('THU NGÂN & TẠO ĐƠN TẠI QUẦY', style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold)),
          const SizedBox(height: 12),

          // Thông tin khách & thợ phục vụ
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.charcoalLight,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.charcoalBorder),
            ),
            child: Column(
              children: [
                DropdownButtonFormField<String>(
                  initialValue: _posBranchId,
                  dropdownColor: AppTheme.charcoalLight,
                  style: AppTheme.bodyMedium(color: AppTheme.textLight),
                  decoration: const InputDecoration(
                    labelText: 'Chi Nhánh Phục Vụ',
                    labelStyle: TextStyle(color: AppTheme.textLightSecondary),
                    prefixIcon: Icon(Icons.store_mall_directory_outlined, color: AppTheme.accentGold),
                    isDense: true,
                  ),
                  items: _branches.map((b) => DropdownMenuItem(value: b.id, child: Text(b.name, overflow: TextOverflow.ellipsis))).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _posBranchId = val);
                  },
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _posCustomerNameController,
                  style: AppTheme.bodyMedium(color: AppTheme.textLight),
                  decoration: const InputDecoration(
                    labelText: 'Tên Khách Hàng',
                    labelStyle: TextStyle(color: AppTheme.textLightSecondary),
                    prefixIcon: Icon(Icons.person_rounded, color: AppTheme.accentGold),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _posCustomerPhoneController,
                  style: AppTheme.bodyMedium(color: AppTheme.textLight),
                  decoration: const InputDecoration(
                    labelText: 'Số Điện Thoại Khách',
                    labelStyle: TextStyle(color: AppTheme.textLightSecondary),
                    prefixIcon: Icon(Icons.phone_rounded, color: AppTheme.accentGold),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  initialValue: _posStylistId,
                  dropdownColor: AppTheme.charcoalLight,
                  style: AppTheme.bodyMedium(color: AppTheme.textLight),
                  decoration: const InputDecoration(
                    labelText: 'Thợ Cắt Chính Phục Vụ',
                    labelStyle: TextStyle(color: AppTheme.textLightSecondary),
                    prefixIcon: Icon(Icons.content_cut_rounded, color: AppTheme.accentGold),
                    isDense: true,
                  ),
                  items: _stylists.map((s) => DropdownMenuItem(value: s.id, child: Text(s.name))).toList(),
                  onChanged: (val) => setState(() => _posStylistId = val),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // Chọn dịch vụ thêm vào đơn
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('DỊCH VỤ THỰC HIỆN', style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold)),
              TextButton.icon(
                onPressed: _showAddServiceToPosModal,
                icon: const Icon(Icons.add, size: 16, color: AppTheme.accentGold),
                label: const Text('Thêm Dịch Vụ', style: TextStyle(color: AppTheme.accentGold, fontSize: 12)),
              ),
            ],
          ),
          if (_posSelectedServices.isEmpty)
            Text('Chưa chọn dịch vụ nào', style: AppTheme.bodySmall(color: AppTheme.textLightSecondary))
          else
            ..._posSelectedServices.map((s) => ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.check_circle_rounded, color: AppTheme.accentGold, size: 18),
              title: Text(s.name, style: AppTheme.bodySmall(color: AppTheme.textLight, fontWeight: FontWeight.w600)),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(currencyFormat.format(s.price), style: AppTheme.bodySmall(color: AppTheme.accentGold)),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 16, color: AppTheme.statusDanger),
                    onPressed: () => setState(() => _posSelectedServices.remove(s)),
                  ),
                ],
              ),
            )),
          const SizedBox(height: 14),

          // Chọn mỹ phẩm bán kèm
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('MỸ PHẨM MUA THÊM', style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold)),
              TextButton.icon(
                onPressed: _showAddProductToPosModal,
                icon: const Icon(Icons.add, size: 16, color: AppTheme.accentGold),
                label: const Text('Thêm Sản Phẩm', style: TextStyle(color: AppTheme.accentGold, fontSize: 12)),
              ),
            ],
          ),
          if (_posSelectedProducts.isEmpty)
            Text('Chưa thêm mỹ phẩm nào', style: AppTheme.bodySmall(color: AppTheme.textLightSecondary))
          else
            ..._posSelectedProducts.map((p) => ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.shopping_bag_outlined, color: AppTheme.accentGold, size: 18),
              title: Text(p.name, style: AppTheme.bodySmall(color: AppTheme.textLight, fontWeight: FontWeight.w600)),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(currencyFormat.format(p.actualPrice), style: AppTheme.bodySmall(color: AppTheme.accentGold)),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 16, color: AppTheme.statusDanger),
                    onPressed: () => setState(() => _posSelectedProducts.remove(p)),
                  ),
                ],
              ),
            )),
          const SizedBox(height: 18),

          // Tổng tiền & Voucher
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.charcoalLight,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.charcoalBorder),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _posVoucherController,
                        style: AppTheme.bodySmall(color: AppTheme.textLight),
                        decoration: const InputDecoration(
                          hintText: 'Nhập mã Voucher (VIP10 / QUYONG50)',
                          hintStyle: TextStyle(color: AppTheme.textLightSecondary, fontSize: 12),
                          isDense: true,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: _applyPosVoucher,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.accentGold,
                        foregroundColor: AppTheme.charcoal,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                      child: const Text('Áp Dụng', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800)),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Tạm tính:', style: AppTheme.bodySmall(color: AppTheme.textLightSecondary)),
                    Text(currencyFormat.format(_posSubtotal), style: AppTheme.bodySmall(color: AppTheme.textLight)),
                  ],
                ),
                if (_posDiscount > 0) ...[
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Chiết khấu:', style: AppTheme.bodySmall(color: AppTheme.statusDanger)),
                      Text('-${currencyFormat.format(_posDiscount)}', style: AppTheme.bodySmall(color: AppTheme.statusDanger, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ],
                const Divider(color: AppTheme.charcoalBorder, height: 18),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('TỔNG THANH TOÁN:', style: AppTheme.headingSmall(fontSize: 15, color: AppTheme.textLight)),
                    Text(currencyFormat.format(_posFinalTotal), style: AppTheme.headingMedium(fontSize: 20, color: AppTheme.accentGold)),
                  ],
                ),
                const SizedBox(height: 14),

                // Phương thức thanh toán
                Row(
                  children: [
                    Expanded(
                      child: ChoiceChip(
                        label: const Center(child: Text('VietQR SePay')),
                        selected: _posPaymentMethod == 'VietQR',
                        selectedColor: AppTheme.accentGold,
                        backgroundColor: AppTheme.charcoalSurface,
                        labelStyle: TextStyle(
                          color: _posPaymentMethod == 'VietQR' ? AppTheme.charcoal : AppTheme.textLight,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                        onSelected: (_) => setState(() => _posPaymentMethod = 'VietQR'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ChoiceChip(
                        label: const Center(child: Text('Tiền Mặt')),
                        selected: _posPaymentMethod == 'Cash',
                        selectedColor: AppTheme.accentGold,
                        backgroundColor: AppTheme.charcoalSurface,
                        labelStyle: TextStyle(
                          color: _posPaymentMethod == 'Cash' ? AppTheme.charcoal : AppTheme.textLight,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                        onSelected: (_) => setState(() => _posPaymentMethod = 'Cash'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Nút chốt đơn
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton.icon(
                    onPressed: _processPosCheckout,
                    icon: const Icon(Icons.receipt_long_rounded, size: 20),
                    label: Text(
                      'THANH TOÁN & IN HÓA ĐƠN (${currencyFormat.format(_posFinalTotal)})',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
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

  void _showAddServiceToPosModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.charcoalLight,
      builder: (ctx) => ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _services.length,
        itemBuilder: (context, idx) {
          final s = _services[idx];
          return ListTile(
            title: Text(s.name, style: AppTheme.bodySmall(color: AppTheme.textLight, fontWeight: FontWeight.w700)),
            subtitle: Text('${s.duration} phút • ${s.category}', style: AppTheme.bodySmall(color: AppTheme.textLightSecondary, fontSize: 11)),
            trailing: Text(currencyFormat.format(s.price), style: AppTheme.bodySmall(color: AppTheme.accentGold, fontWeight: FontWeight.w700)),
            onTap: () {
              setState(() => _posSelectedServices.add(s));
              Navigator.of(ctx).pop();
            },
          );
        },
      ),
    );
  }

  void _showAddProductToPosModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.charcoalLight,
      builder: (ctx) => ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _products.length,
        itemBuilder: (context, idx) {
          final p = _products[idx];
          return ListTile(
            title: Text(p.name, style: AppTheme.bodySmall(color: AppTheme.textLight, fontWeight: FontWeight.w700)),
            subtitle: Text(p.brand, style: AppTheme.bodySmall(color: AppTheme.textLightSecondary, fontSize: 11)),
            trailing: Text(currencyFormat.format(p.actualPrice), style: AppTheme.bodySmall(color: AppTheme.accentGold, fontWeight: FontWeight.w700)),
            onTap: () {
              setState(() => _posSelectedProducts.add(p));
              Navigator.of(ctx).pop();
            },
          );
        },
      ),
    );
  }

  // =========================================================================
  // 4. TAB ĐỘI NGŨ NHÂN SỰ & THỢ CẮT (STAFF)
  // =========================================================================
  Widget _buildStaffTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(14),
      itemCount: _staff.length,
      itemBuilder: (context, idx) {
        final st = _staff[idx];
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppTheme.charcoalLight,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppTheme.charcoalBorder),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: st.isOnDuty ? AppTheme.accentGold : AppTheme.charcoalSurface,
                child: Icon(
                  st.role.contains('Quản lý') ? Icons.admin_panel_settings_rounded : Icons.content_cut_rounded,
                  color: st.isOnDuty ? AppTheme.charcoal : AppTheme.textLightSecondary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(st.name, style: AppTheme.bodyMedium(color: AppTheme.textLight, fontWeight: FontWeight.w700)),
                    Text('${st.level} • ${st.branchName}', style: AppTheme.bodySmall(color: AppTheme.accentGold, fontSize: 11)),
                    Text('SĐT: ${st.phone}', style: AppTheme.bodySmall(color: AppTheme.textLightSecondary, fontSize: 11)),
                  ],
                ),
              ),
              Switch(
                value: st.isOnDuty,
                activeThumbColor: AppTheme.accentGold,
                onChanged: (val) async {
                  final newSt = val ? 'Đang làm việc' : 'Tạm nghỉ';
                  await ApiService.updateStaffStatus(st.id, newSt);
                  setState(() => st.status = newSt);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  // =========================================================================
  // 5. TAB KHO HÀNG & HẠN DÙNG FEFO
  // =========================================================================
  Widget _buildInventoryTab() {
    return ListView(
      padding: const EdgeInsets.all(14),
      children: [
        Text('TỒN KHO THEO CHI NHÁNH', style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold)),
        const SizedBox(height: 10),
        ..._inventory.map((item) => Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppTheme.charcoalLight,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: item.isLowStock ? AppTheme.statusDanger : AppTheme.charcoalBorder),
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: SizedBox(
                  width: 44,
                  height: 44,
                  child: EditorialImage(imageUrl: item.image, fit: BoxFit.cover),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.productName, style: AppTheme.bodySmall(color: AppTheme.textLight, fontWeight: FontWeight.w700), maxLines: 1),
                    Text('${item.branchName} • Giá: ${currencyFormat.format(item.price)}', style: AppTheme.bodySmall(color: AppTheme.textLightSecondary, fontSize: 11)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: item.isLowStock ? AppTheme.statusDanger.withValues(alpha: 0.2) : AppTheme.charcoalSurface,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'Tồn: ${item.stock}',
                  style: AppTheme.bodySmall(
                    color: item.isLowStock ? AppTheme.statusDanger : AppTheme.textLight,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
        )),
      ],
    );
  }

  // =========================================================================
  // 6. TAB BẢNG GIÁ DỊCH VỤ (CATALOG)
  // =========================================================================
  Widget _buildCatalogTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(14),
      itemCount: _services.length,
      itemBuilder: (context, idx) {
        final s = _services[idx];
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppTheme.charcoalLight,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppTheme.charcoalBorder),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s.category.toUpperCase(), style: AppTheme.labelUppercase(fontSize: 9, color: AppTheme.accentGold)),
                    const SizedBox(height: 2),
                    Text(s.name, style: AppTheme.bodySmall(color: AppTheme.textLight, fontWeight: FontWeight.w700)),
                    Text('${s.duration} phút • ${s.description}', style: AppTheme.bodySmall(color: AppTheme.textLightSecondary, fontSize: 11), maxLines: 1),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(currencyFormat.format(s.price), style: AppTheme.bodyMedium(color: AppTheme.accentGold, fontWeight: FontWeight.w800)),
                  IconButton(
                    icon: const Icon(Icons.edit_note_rounded, color: AppTheme.textLightSecondary, size: 20),
                    onPressed: () => _showEditServiceDialog(s),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  void _showEditServiceDialog(SalonService s) {
    final priceCtrl = TextEditingController(text: s.price.toString());
    final durCtrl = TextEditingController(text: s.duration.toString());

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Text('Sửa Bảng Giá: ${s.name}', style: AppTheme.headingSmall(fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: priceCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Giá niêm yết (₫)'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: durCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Thời lượng (phút)'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('HỦY')),
          ElevatedButton(
            onPressed: () async {
              final newP = int.tryParse(priceCtrl.text) ?? s.price;
              final newD = int.tryParse(durCtrl.text) ?? s.duration;
              Navigator.of(ctx).pop();
              await ApiService.updateService(s.id, newP, newD);
              if (!mounted) return;
              setState(() => _loadAdminData());
            },
            child: const Text('LƯU THAY ĐỔI'),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // 7. TAB HÓA ĐƠN & KIỂM TOÁN (INVOICES)
  // =========================================================================
  Widget _buildInvoicesTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(14),
      itemCount: _invoices.length,
      itemBuilder: (context, idx) {
        final inv = _invoices[idx];
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppTheme.charcoalLight,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppTheme.charcoalBorder),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.accentGold.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.receipt_rounded, color: AppTheme.accentGold, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(inv.invoiceNumber, style: AppTheme.bodySmall(color: AppTheme.accentGold, fontWeight: FontWeight.w800)),
                        const Spacer(),
                        Text(inv.createdDate, style: AppTheme.bodySmall(color: AppTheme.textLightSecondary, fontSize: 10.5)),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(inv.customerName, style: AppTheme.bodyMedium(color: AppTheme.textLight, fontWeight: FontWeight.w700)),
                    Text('${inv.branchName} • ${inv.paymentMethod}', style: AppTheme.bodySmall(color: AppTheme.textLightSecondary, fontSize: 11)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(currencyFormat.format(inv.total), style: AppTheme.headingSmall(fontSize: 15, color: AppTheme.accentGold)),
            ],
          ),
        );
      },
    );
  }
}
