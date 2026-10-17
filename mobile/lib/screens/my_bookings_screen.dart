import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/booking.dart';
import '../models/order.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../widgets/omni_image.dart';
import 'booking_screen.dart';

class MyBookingsScreen extends StatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  State<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends State<MyBookingsScreen> with SingleTickerProviderStateMixin {
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0);
  final searchController = TextEditingController();

  late TabController _tabController;
  List<Booking> bookings = [];
  List<SalonOrder> orders = [];
  bool isLoading = true;
  String currentFilter = 'all';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (mounted) setState(() {});
    });

    if (AuthService.currentUser != null && AuthService.currentUser!.phone.isNotEmpty) {
      searchController.text = AuthService.currentUser!.phone;
    }
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => isLoading = true);
    final q = searchController.text.trim();
    
    // Tải lịch hẹn
    final bList = q.isNotEmpty
        ? await ApiService.lookupBookings(q)
        : await ApiService.fetchBookings();
        
    // Tải đơn hàng
    final oList = await ApiService.fetchOrders();
    
    if (!mounted) return;
    setState(() {
      bookings = bList;
      if (q.isNotEmpty) {
        orders = oList.where((o) =>
          o.orderCode.toLowerCase().contains(q.toLowerCase()) ||
          o.customerPhone.contains(q) ||
          o.customerName.toLowerCase().contains(q.toLowerCase())
        ).toList();
      } else {
        orders = oList;
      }
      isLoading = false;
    });
  }

  void _showQrCheckInModal(Booking b) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1C1917),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Color(0xFFC59B27), width: 1.5),
        ),
        titlePadding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
        contentPadding: const EdgeInsets.all(20),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: Color(0xFF10B981),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: Text(
                'VÉ ĐIỆN TỬ CHECK-IN',
                style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFFAF8F5), fontSize: 16),
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFC59B27).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFC59B27)),
                ),
                child: Text(
                  '#${b.bookingCode}',
                  style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFC59B27), fontSize: 20, letterSpacing: 1),
                ),
              ),
              const SizedBox(height: 14),
              // QR CODE BOX
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 8)],
                ),
                child: Image.network(
                  'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${b.bookingCode}&color=14-14-13',
                  width: 150,
                  height: 150,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => const Icon(Icons.qr_code, size: 100, color: Colors.black),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                'Khách hàng: ${b.customerName}',
                style: const TextStyle(color: Color(0xFFFAF8F5), fontWeight: FontWeight.w800, fontSize: 14),
              ),
              Text(
                'Số điện thoại: ${b.customerPhone}',
                style: const TextStyle(color: Color(0xFFA8A29E), fontSize: 12.5),
              ),
              const Divider(height: 18, color: Color(0xFF2E2C29)),
              _buildTicketRow('Dịch vụ:', b.serviceName),
              _buildTicketRow('Thợ tạo mẫu:', b.stylistName),
              _buildTicketRow('Chi nhánh:', b.branchName),
              _buildTicketRow('Giờ & Ngày:', '${b.timeSlot} • ${b.date}'),
              _buildTicketRow('Tổng thanh toán:', currencyFormat.format(b.totalPrice), isPrice: true),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF141413),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF2E2C29)),
                ),
                child: const Text(
                  'Quý khách vui lòng xuất trình mã QR này tại quầy thu ngân chi nhánh để nhân viên quét xác nhận vào làm dịch vụ nhanh chóng!',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFFA8A29E), fontSize: 11, height: 1.4),
                ),
              ),
            ],
          ),
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFC59B27),
                foregroundColor: const Color(0xFF141413),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Đóng Vé Điện Tử', style: TextStyle(fontWeight: FontWeight.w900)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTicketRow(String label, String value, {bool isPrice = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFFA8A29E), fontSize: 12)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                color: isPrice ? const Color(0xFFC59B27) : const Color(0xFFFAF8F5),
                fontWeight: isPrice ? FontWeight.w900 : FontWeight.w700,
                fontSize: isPrice ? 14 : 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showRescheduleDialog(Booking booking) {
    DateTime newDate = DateTime.tryParse(booking.date) ?? DateTime.now().add(const Duration(days: 1));
    String newTime = booking.timeSlot;

    final timeSlots = ['08:30', '09:15', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:30', '19:30'];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (dialogCtx, setModalState) {
          return AlertDialog(
            backgroundColor: const Color(0xFF1C1917),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
              side: const BorderSide(color: Color(0xFF2E2C29)),
            ),
            title: Text(
              'Đổi Lịch Hẹn #${booking.bookingCode}',
              style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFFAF8F5), fontSize: 18),
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Dịch vụ: ${booking.serviceName}', style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFFAF8F5))),
                  Text('Thợ: ${booking.stylistName}', style: const TextStyle(color: Color(0xFFA8A29E))),
                  const Divider(height: 20, color: Color(0xFF2E2C29)),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.calendar_today, color: Color(0xFFC59B27)),
                    title: Text(
                      'Ngày mới: ${DateFormat('dd/MM/yyyy').format(newDate)}',
                      style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFFAF8F5)),
                    ),
                    trailing: TextButton(
                      onPressed: () async {
                        final picked = await showDatePicker(
                          context: dialogCtx,
                          initialDate: newDate,
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(const Duration(days: 30)),
                        );
                        if (picked != null) {
                          setModalState(() => newDate = picked);
                        }
                      },
                      child: const Text('Chọn Ngày', style: TextStyle(color: Color(0xFFC59B27), fontWeight: FontWeight.w800)),
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text('Chọn khung giờ mới:', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: Color(0xFFA8A29E))),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: timeSlots.map((t) {
                      final isSel = newTime == t;
                      return ChoiceChip(
                        label: Text(
                          t,
                          style: TextStyle(
                            color: isSel ? const Color(0xFF141413) : const Color(0xFFFAF8F5),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        selected: isSel,
                        selectedColor: const Color(0xFFC59B27),
                        backgroundColor: const Color(0xFF141413),
                        side: BorderSide(color: isSel ? const Color(0xFFC59B27) : const Color(0xFF2E2C29)),
                        onSelected: (val) => setModalState(() => newTime = t),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogCtx).pop(),
                child: const Text('Đóng', style: TextStyle(color: Color(0xFFA8A29E))),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFC59B27),
                  foregroundColor: const Color(0xFF141413),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: () async {
                  final dateStr = DateFormat('yyyy-MM-dd').format(newDate);
                  await ApiService.rescheduleBooking(booking.id, dateStr, newTime);
                  if (!dialogCtx.mounted) return;
                  Navigator.of(dialogCtx).pop();
                  _loadData();
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Đã cập nhật giờ hẹn thành công: $newTime ngày $dateStr')),
                  );
                },
                child: const Text('Lưu Đổi Lịch', style: TextStyle(fontWeight: FontWeight.w800)),
              ),
            ],
          );
        },
      ),
    );
  }

  void _confirmCancelBooking(Booking booking) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1C1917),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: Color(0xFF2E2C29)),
        ),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626)),
            SizedBox(width: 8),
            Text('Xác Nhận Hủy Lịch?', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFFAF8F5))),
          ],
        ),
        content: Text(
          'Bạn có chắc chắn muốn hủy lịch hẹn #${booking.bookingCode} vào lúc ${booking.timeSlot} ngày ${booking.date} không?',
          style: const TextStyle(color: Color(0xFFA8A29E)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Không Hủy', style: TextStyle(color: Color(0xFFA8A29E))),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () async {
              await ApiService.cancelBooking(booking.id);
              if (!ctx.mounted) return;
              Navigator.of(ctx).pop();
              _loadData();
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Đã hủy lịch hẹn thành công.')),
              );
            },
            child: const Text('Xác Nhận Hủy', style: TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredBookings = bookings.where((b) {
      if (currentFilter == 'all') return true;
      if (currentFilter == 'active') return !b.isCancelled && !b.isCompleted;
      if (currentFilter == 'cancelled') return b.isCancelled;
      if (currentFilter == 'completed') return b.isCompleted;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF141413),
      appBar: AppBar(
        title: const Text('Tra Cứu & Lịch Hẹn', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFFAF8F5), fontSize: 18)),
        backgroundColor: const Color(0xFF141413),
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFFFAF8F5)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFFC59B27)),
            onPressed: _loadData,
            tooltip: 'Làm mới',
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFFC59B27),
          labelColor: const Color(0xFFC59B27),
          unselectedLabelColor: const Color(0xFFA8A29E),
          labelStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
          tabs: const [
            Tab(text: 'Lịch Hẹn Cắt Tóc (LH)'),
            Tab(text: 'Đơn Hàng Mỹ Phẩm (DH)'),
          ],
        ),
      ),
      body: Column(
        children: [
          // THANH TÌM KIẾM THEO SĐT / MÃ LỊCH HẸN
          Container(
            padding: const EdgeInsets.all(14),
            color: const Color(0xFF171614),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: searchController,
                    onSubmitted: (_) => _loadData(),
                    style: const TextStyle(color: Color(0xFFFAF8F5)),
                    decoration: InputDecoration(
                      hintText: 'Nhập SĐT hoặc Mã (VD: 0988... / LH01 / DH01)',
                      hintStyle: const TextStyle(fontSize: 12.5, color: Color(0xFFA8A29E)),
                      prefixIcon: const Icon(Icons.search, size: 20, color: Color(0xFFC59B27)),
                      suffixIcon: searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 18, color: Color(0xFFA8A29E)),
                              onPressed: () {
                                searchController.clear();
                                _loadData();
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: const Color(0xFF1C1917),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF2E2C29))),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF2E2C29))),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFC59B27))),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFC59B27),
                    foregroundColor: const Color(0xFF141413),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                  onPressed: _loadData,
                  child: const Text('Tra Cứu', style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ],
            ),
          ),

          // TABS CONTENT
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // TAB 1: LỊCH HẸN CẮT TÓC
                _buildBookingsTab(filteredBookings),

                // TAB 2: ĐƠN HÀNG MỸ PHẨM
                _buildOrdersTab(orders),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBookingsTab(List<Booking> filtered) {
    return Column(
      children: [
        // FILTER TABS
        Container(
          color: const Color(0xFF171614),
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildFilterTab('all', 'Tất Cả'),
              _buildFilterTab('active', 'Đang Chờ'),
              _buildFilterTab('completed', 'Hoàn Thành'),
              _buildFilterTab('cancelled', 'Đã Hủy'),
            ],
          ),
        ),
        const Divider(height: 1, color: Color(0xFF2E2C29)),

        Expanded(
          child: isLoading
              ? const Center(child: CircularProgressIndicator(color: Color(0xFFC59B27)))
              : filtered.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.calendar_month_outlined, size: 64, color: Color(0xFFA8A29E)),
                          const SizedBox(height: 12),
                          const Text(
                            'Không tìm thấy lịch hẹn nào.',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFFA8A29E)),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFC59B27),
                              foregroundColor: const Color(0xFF141413),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => const BookingScreen()),
                              );
                            },
                            child: const Text('Đặt Lịch Hẹn Mới', style: TextStyle(fontWeight: FontWeight.w800)),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: filtered.length,
                      itemBuilder: (context, idx) {
                        final b = filtered[idx];
                        final isCancelled = b.isCancelled;
                        final isCompleted = b.isCompleted;

                        Color badgeBg = const Color(0xFF10B981).withValues(alpha: 0.15);
                        Color badgeText = const Color(0xFF10B981);
                        if (isCancelled) {
                          badgeBg = const Color(0xFFEF4444).withValues(alpha: 0.15);
                          badgeText = const Color(0xFFEF4444);
                        } else if (isCompleted) {
                          badgeBg = const Color(0xFF3B82F6).withValues(alpha: 0.15);
                          badgeText = const Color(0xFF60A5FA);
                        }

                        return Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1C1917),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFF2E2C29)),
                            boxShadow: const [BoxShadow(color: Color(0x1F000000), blurRadius: 8, offset: Offset(0, 3))],
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFC59B27).withValues(alpha: 0.15),
                                            borderRadius: BorderRadius.circular(6),
                                            border: Border.all(color: const Color(0xFFC59B27).withValues(alpha: 0.4)),
                                          ),
                                          child: Text(
                                            '#${b.bookingCode}',
                                            style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFC59B27), fontSize: 13),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          b.customerName,
                                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: Color(0xFFFAF8F5)),
                                        ),
                                      ],
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: badgeBg,
                                        borderRadius: BorderRadius.circular(9999),
                                      ),
                                      child: Text(
                                        b.displayStatus,
                                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11.5, color: badgeText),
                                      ),
                                    ),
                                  ],
                                ),
                                const Divider(height: 16, color: Color(0xFF2E2C29)),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    OmniImage(
                                      imageUrl: b.serviceImage,
                                      width: 60,
                                      height: 60,
                                      borderRadius: BorderRadius.circular(10),
                                      fallbackIcon: Icons.content_cut,
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(b.serviceName, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFFFAF8F5))),
                                          const SizedBox(height: 4),
                                          Text('Thợ tạo mẫu: ${b.stylistName}', style: const TextStyle(fontSize: 12.5, color: Color(0xFFA8A29E))),
                                          Text('Giờ hẹn: ${b.timeSlot} • Ngày ${b.date}', style: const TextStyle(fontSize: 12.5, color: Color(0xFFC59B27), fontWeight: FontWeight.w800)),
                                          Text('Chi nhánh: ${b.branchName}', style: const TextStyle(fontSize: 12, color: Color(0xFFA8A29E))),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Chi phí dự kiến:', style: TextStyle(fontSize: 12.5, color: Color(0xFFA8A29E))),
                                    Text(currencyFormat.format(b.totalPrice), style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFC59B27), fontSize: 16)),
                                  ],
                                ),
                                const Divider(height: 20, color: Color(0xFF2E2C29)),
                                Row(
                                  children: [
                                    Expanded(
                                      child: ElevatedButton.icon(
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFFC59B27),
                                          foregroundColor: const Color(0xFF141413),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                          padding: const EdgeInsets.symmetric(vertical: 10),
                                        ),
                                        icon: const Icon(Icons.qr_code_2, size: 18),
                                        label: const Text('Xem Vé QR', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12.5)),
                                        onPressed: () => _showQrCheckInModal(b),
                                      ),
                                    ),
                                    if (!isCancelled && !isCompleted) ...[
                                      const SizedBox(width: 8),
                                      OutlinedButton(
                                        style: OutlinedButton.styleFrom(
                                          side: const BorderSide(color: Color(0xFFC59B27)),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                                        ),
                                        onPressed: () => _showRescheduleDialog(b),
                                        child: const Text('Đổi Giờ', style: TextStyle(color: Color(0xFFC59B27), fontWeight: FontWeight.w800, fontSize: 12)),
                                      ),
                                      const SizedBox(width: 8),
                                      OutlinedButton(
                                        style: OutlinedButton.styleFrom(
                                          side: const BorderSide(color: Color(0xFFDC2626)),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                                        ),
                                        onPressed: () => _confirmCancelBooking(b),
                                        child: const Text('Hủy', style: TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.w800, fontSize: 12)),
                                      ),
                                    ],
                                  ],
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

  Widget _buildOrdersTab(List<SalonOrder> orderList) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFFC59B27)));
    }
    if (orderList.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inventory_2_outlined, size: 64, color: Color(0xFFA8A29E)),
            SizedBox(height: 12),
            Text(
              'Không tìm thấy đơn hàng mỹ phẩm nào.',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFFA8A29E)),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: orderList.length,
      itemBuilder: (context, idx) {
        final o = orderList[idx];
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF1C1917),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF2E2C29)),
            boxShadow: const [BoxShadow(color: Color(0x1F000000), blurRadius: 8, offset: Offset(0, 3))],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFC59B27).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFFC59B27).withValues(alpha: 0.4)),
                    ),
                    child: Text(
                      '#${o.orderCode}',
                      style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFC59B27), fontSize: 13),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(9999),
                    ),
                    child: Text(
                      o.orderStatus,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11.5, color: Color(0xFF10B981)),
                    ),
                  ),
                ],
              ),
              const Divider(height: 16, color: Color(0xFF2E2C29)),
              Text('Người nhận: ${o.customerName} • ${o.customerPhone}', style: const TextStyle(color: Color(0xFFFAF8F5), fontWeight: FontWeight.w700, fontSize: 13)),
              const SizedBox(height: 4),
              Text('Địa chỉ: ${o.shippingAddress}', style: const TextStyle(color: Color(0xFFA8A29E), fontSize: 12)),
              const SizedBox(height: 4),
              Text('Thanh toán: ${o.paymentMethod} (${o.paymentStatus})', style: const TextStyle(color: Color(0xFFA8A29E), fontSize: 12)),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Tổng tiền đơn hàng:', style: TextStyle(color: Color(0xFFA8A29E), fontSize: 12.5)),
                  Text(
                    currencyFormat.format(o.totalAmount),
                    style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFC59B27), fontSize: 16),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildFilterTab(String id, String label) {
    final isSel = currentFilter == id;
    return InkWell(
      onTap: () => setState(() => currentFilter = id),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: isSel ? const Color(0xFFC59B27) : Colors.transparent,
              width: 2.5,
            ),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: isSel ? FontWeight.w900 : FontWeight.w600,
            color: isSel ? const Color(0xFFC59B27) : const Color(0xFFA8A29E),
          ),
        ),
      ),
    );
  }
}
