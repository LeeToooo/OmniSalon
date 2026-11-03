import 'package:omni_salon_mobile/core/theme/app_theme.dart';
import 'package:omni_salon_mobile/core/auth/auth_service.dart';
import 'package:omni_salon_mobile/core/api/api_service.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:omni_salon_mobile/models/booking.dart';
import 'package:omni_salon_mobile/models/order.dart';
import 'package:omni_salon_mobile/components/omni_image.dart';
import 'package:omni_salon_mobile/pages/user/booking_page.dart';
import 'package:omni_salon_mobile/pages/auth/login_page.dart';

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
      final user = AuthService.currentUser!;
      final isStaffOrAdmin = user.role.toUpperCase() == 'ADMIN' ||
          user.role.toUpperCase() == 'STAFF' ||
          user.role.toUpperCase() == 'QUANLY';
      if (isStaffOrAdmin) {
        searchController.text = user.phone;
      }
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
    final user = AuthService.currentUser;
    if (user == null) {
      if (mounted) {
        setState(() {
          bookings = [];
          orders = [];
          isLoading = false;
        });
      }
      return;
    }

    setState(() => isLoading = true);
    final role = user.role.toUpperCase();
    final isStaffOrAdmin = role == 'ADMIN' || role == 'STAFF' || role == 'QUANLY';
    final userPhone = user.phone.trim().replaceAll(RegExp(r'\D'), '');
    final userId = user.id.trim();
    final q = searchController.text.trim();

    // 1. TẢI LỊCH HẸN
    List<Booking> fetchedBookings = [];
    if (isStaffOrAdmin) {
      fetchedBookings = q.isNotEmpty
          ? await ApiService.lookupBookings(q)
          : await ApiService.fetchBookings();
    } else {
      // Bảo mật riêng tư: Khách hàng chỉ xem lịch của chính mình
      final queryParam = user.phone.trim().isNotEmpty ? user.phone.trim() : userId;
      final rawList = await ApiService.lookupBookings(queryParam);
      fetchedBookings = rawList.where((b) {
        final bPhone = b.customerPhone.replaceAll(RegExp(r'\D'), '');
        final matchPhone = userPhone.isNotEmpty && bPhone.isNotEmpty && (
          bPhone == userPhone ||
          (userPhone.length >= 9 && bPhone.length >= 9 && bPhone.endsWith(userPhone.substring(userPhone.length - 9)))
        );
        final matchUserId = (b.userId != null && b.userId!.isNotEmpty && (b.userId == userId || b.userId == user.maKhachHang));
        return matchPhone || matchUserId;
      }).toList();

      if (q.isNotEmpty) {
        final qLower = q.toLowerCase();
        fetchedBookings = fetchedBookings.where((b) =>
          b.bookingCode.toLowerCase().contains(qLower) ||
          b.serviceName.toLowerCase().contains(qLower) ||
          b.stylistName.toLowerCase().contains(qLower) ||
          b.branchName.toLowerCase().contains(qLower)
        ).toList();
      }
    }

    // 2. TẢI ĐƠN HÀNG MỸ PHẨM
    List<SalonOrder> fetchedOrders = await ApiService.fetchOrders();
    if (!isStaffOrAdmin) {
      // BẢO MẬT BẮT BUỘC: Khách hàng thường TUYỆT ĐỐI CHỈ xem đơn hàng của chính mình
      final isMyOrder = (SalonOrder o) {
        final oPhone = o.customerPhone.replaceAll(RegExp(r'\D'), '');
        final matchPhone = userPhone.isNotEmpty && oPhone.isNotEmpty && (
          oPhone == userPhone ||
          (userPhone.length >= 9 && oPhone.length >= 9 && oPhone.endsWith(userPhone.substring(userPhone.length - 9)))
        );
        final matchUserId = (o.userId != null && o.userId!.isNotEmpty && (
          o.userId == userId ||
          (user.maKhachHang != null && user.maKhachHang!.isNotEmpty && o.userId == user.maKhachHang)
        ));
        return matchPhone || matchUserId;
      };

      // 1. Luôn luôn lọc để CHỈ giữ lại đơn hàng của chính tài khoản này
      fetchedOrders = fetchedOrders.where(isMyOrder).toList();

      // 2. Nếu người dùng có nhập từ khóa tìm kiếm (q), chỉ tìm kiếm TRONG CÁC ĐƠN HÀNG CỦA CHÍNH MÌNH
      if (q.isNotEmpty) {
        final qClean = q.replaceAll('#', '').trim().toLowerCase();
        fetchedOrders = fetchedOrders.where((o) =>
          o.orderCode.replaceAll('#', '').toLowerCase().contains(qClean) ||
          o.id.replaceAll('#', '').toLowerCase().contains(qClean) ||
          o.items.any((it) => it.name.toLowerCase().contains(qClean)) ||
          o.paymentStatus.toLowerCase().contains(qClean) ||
          o.orderStatus.toLowerCase().contains(qClean)
        ).toList();
      }
    } else if (q.isNotEmpty) {
      // Quản lý hoặc Nhân viên: Cho phép tra cứu đơn hàng toàn hệ thống
      final qLower = q.replaceAll('#', '').trim().toLowerCase();
      fetchedOrders = fetchedOrders.where((o) =>
        o.orderCode.toLowerCase().contains(qLower) ||
        o.id.toLowerCase().contains(qLower) ||
        o.customerPhone.contains(q) ||
        o.customerName.toLowerCase().contains(qLower)
      ).toList();
    }
    // Sắp xếp lịch hẹn từ mới nhất đến cũ nhất từ trên xuống dưới
    fetchedBookings.sort((a, b) {
      final numA = int.tryParse(a.bookingCode.replaceAll(RegExp(r'\D'), '')) ?? 0;
      final numB = int.tryParse(b.bookingCode.replaceAll(RegExp(r'\D'), '')) ?? 0;
      if (numA != numB) return numB.compareTo(numA);
      final dComp = b.date.compareTo(a.date);
      if (dComp != 0) return dComp;
      return b.timeSlot.compareTo(a.timeSlot);
    });

    fetchedOrders.sort((a, b) {
      final numA = int.tryParse(a.orderCode.replaceAll(RegExp(r'\D'), '')) ?? 0;
      final numB = int.tryParse(b.orderCode.replaceAll(RegExp(r'\D'), '')) ?? 0;
      if (numA != numB) return numB.compareTo(numA);
      return b.createdAt.compareTo(a.createdAt);
    });

    if (!mounted) return;
    setState(() {
      bookings = fetchedBookings;
      orders = fetchedOrders;
      isLoading = false;
    });
  }

  void _showQrCheckInModal(Booking b) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppTheme.accentGold, width: 1.5),
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
            Expanded(
              child: Text(
                'VÉ ĐIỆN TỬ CHECK-IN',
                style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textPrimary, fontSize: 16),
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
                  color: AppTheme.accentGold.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.accentGold),
                ),
                child: Text(
                  '#${b.bookingCode}',
                  style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.accentGold, fontSize: 20, letterSpacing: 1),
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
                style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.w800, fontSize: 14),
              ),
              Text(
                'Số điện thoại: ${b.customerPhone}',
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 12.5),
              ),
              Divider(height: 18, color: AppTheme.borderColor),
              _buildTicketRow('Dịch vụ:', b.serviceName),
              _buildTicketRow('Thợ tạo mẫu:', b.stylistName),
              _buildTicketRow('Chi nhánh:', b.branchName),
              _buildTicketRow('Giờ & Ngày:', '${b.timeSlot} • ${b.date}'),
              _buildTicketRow('Tổng thanh toán:', currencyFormat.format(b.totalPrice), isPrice: true),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceElevated,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.borderColor),
                ),
                child: Text(
                  'Quý khách vui lòng xuất trình mã QR này tại quầy thu ngân chi nhánh để nhân viên quét xác nhận vào làm dịch vụ nhanh chóng!',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 11, height: 1.4),
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
                backgroundColor: AppTheme.accentGold,
                foregroundColor: AppTheme.charcoal,
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
          Text(label, style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                color: isPrice ? AppTheme.accentGold : const Color(0xFFFAF8F5),
                fontWeight: isPrice ? FontWeight.w900 : FontWeight.w700,
                fontSize: isPrice ? 14 : 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _getStarLabel(int rating) {
    switch (rating) {
      case 1:
        return '★ Rất không hài lòng';
      case 2:
        return '★★ Chưa hài lòng';
      case 3:
        return '★★★ Bình thường';
      case 4:
        return '★★★★ Hài lòng';
      case 5:
      default:
        return '★★★★★ Rất xuất sắc & hài lòng!';
    }
  }

  void _showBookingPaymentModal(Booking b) {
    final vietQrUrl = 'https://api.vietqr.io/image/970422-0900000000-compact.jpg?amount=${b.totalPrice}&addInfo=${Uri.encodeComponent('THANHTOAN ${b.bookingCode}')}&accountName=OMNISALON%20ENTERPRISE';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: AppTheme.accentGold, width: 1.5),
        ),
        titlePadding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
        contentPadding: const EdgeInsets.all(20),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: AppTheme.accentGold,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.qr_code_scanner_rounded, color: AppTheme.charcoal, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'THANH TOÁN VIETQR #${b.bookingCode}',
                style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textPrimary, fontSize: 16),
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 8)],
                ),
                child: Image.network(
                  vietQrUrl,
                  width: 180,
                  height: 180,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => Image.network(
                    'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${Uri.encodeComponent('OMNISALON-BOOKING-${b.bookingCode}')}',
                    width: 180,
                    height: 180,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF0284C7).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text('VIETQR 24/7 CHUYỂN NHANH NAPAS', style: TextStyle(color: Color(0xFF38BDF8), fontSize: 11, fontWeight: FontWeight.w800)),
              ),
              const SizedBox(height: 12),
              _buildTicketRow('Ngân hàng:', 'MBBank (Quân Đội)'),
              _buildTicketRow('Số tài khoản:', '0900000000'),
              _buildTicketRow('Chủ tài khoản:', 'OMNISALON ENTERPRISE'),
              _buildTicketRow('Nội dung CK:', 'THANHTOAN ${b.bookingCode}'),
              _buildTicketRow('Số tiền:', currencyFormat.format(b.totalPrice), isPrice: true),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceElevated,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.borderColor),
                ),
                child: Text(
                  'Quét mã VietQR bằng ứng dụng ngân hàng bất kỳ để thanh toán tức thì.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('Đóng', style: TextStyle(color: AppTheme.textSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.accentGold,
              foregroundColor: AppTheme.charcoal,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () {
              Navigator.of(ctx).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Đã xác nhận thanh toán VietQR cho lịch hẹn #${b.bookingCode}!'),
                  backgroundColor: const Color(0xFF10B981),
                ),
              );
            },
            child: const Text('Đã Chuyển Khoản', style: TextStyle(fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }

  void _showOrderPaymentModal(SalonOrder o) {
    final vietQrUrl = 'https://api.vietqr.io/image/970422-0900000000-compact.jpg?amount=${o.totalAmount}&addInfo=${Uri.encodeComponent('DONHANG ${o.orderCode}')}&accountName=OMNISALON%20ENTERPRISE';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: AppTheme.accentGold, width: 1.5),
        ),
        titlePadding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
        contentPadding: const EdgeInsets.all(20),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: AppTheme.accentGold,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.qr_code_scanner_rounded, color: AppTheme.charcoal, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'THANH TOÁN ĐƠN HÀNG #${o.orderCode}',
                style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textPrimary, fontSize: 16),
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 8)],
                ),
                child: Image.network(
                  vietQrUrl,
                  width: 180,
                  height: 180,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => Image.network(
                    'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${Uri.encodeComponent('OMNISALON-ORDER-${o.orderCode}')}',
                    width: 180,
                    height: 180,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF0284C7).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text('VIETQR 24/7 CHUYỂN NHANH NAPAS', style: TextStyle(color: Color(0xFF38BDF8), fontSize: 11, fontWeight: FontWeight.w800)),
              ),
              const SizedBox(height: 12),
              _buildTicketRow('Ngân hàng:', 'MBBank (Quân Đội)'),
              _buildTicketRow('Số tài khoản:', '0900000000'),
              _buildTicketRow('Chủ tài khoản:', 'OMNISALON ENTERPRISE'),
              _buildTicketRow('Nội dung CK:', 'DONHANG ${o.orderCode}'),
              _buildTicketRow('Tổng tiền:', currencyFormat.format(o.totalAmount), isPrice: true),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceElevated,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.borderColor),
                ),
                child: Text(
                  'Quét mã VietQR bằng ứng dụng ngân hàng bất kỳ để thanh toán tức thì.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('Đóng', style: TextStyle(color: AppTheme.textSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.accentGold,
              foregroundColor: AppTheme.charcoal,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () {
              Navigator.of(ctx).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Đã ghi nhận thanh toán VietQR cho đơn hàng #${o.orderCode}!'),
                  backgroundColor: const Color(0xFF10B981),
                ),
              );
            },
            child: const Text('Đã Chuyển Khoản', style: TextStyle(fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }

  void _showBookingRatingDialog(Booking b) {
    int rating = 5;
    final commentCtrl = TextEditingController(text: 'Dịch vụ cắt tóc và tạo kiểu rất đẹp, thợ chu đáo!');
    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppTheme.surfaceCard,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
            side: BorderSide(color: AppTheme.borderColor),
          ),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 24),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Đánh Giá Lịch Hẹn #${b.bookingCode}',
                      style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textPrimary, fontSize: 16),
                    ),
                    Text(
                      '${b.serviceName} • Barber ${b.stylistName}',
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Mức độ hài lòng của bạn:',
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 13, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (index) {
                    final star = index + 1;
                    return IconButton(
                      icon: Icon(
                        star <= rating ? Icons.star_rounded : Icons.star_border_rounded,
                        color: star <= rating ? const Color(0xFFF59E0B) : const Color(0xFF57534E),
                        size: 32,
                      ),
                      onPressed: () => setDialogState(() => rating = star),
                    );
                  }),
                ),
                Text(
                  _getStarLabel(rating),
                  style: const TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.w800, fontSize: 13),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: commentCtrl,
                  maxLines: 3,
                  style: TextStyle(color: AppTheme.textPrimary, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Nhận xét về tay nghề thợ cắt, không gian phục vụ...',
                    hintStyle: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                    filled: true,
                    fillColor: AppTheme.surfaceElevated,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(color: AppTheme.borderColor),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(color: AppTheme.borderColor),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: AppTheme.accentGold),
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogCtx).pop(),
              child: Text('Hủy Bỏ', style: TextStyle(color: AppTheme.textSecondary)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.accentGold,
                foregroundColor: AppTheme.charcoal,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: isSubmitting
                  ? null
                  : () async {
                      setDialogState(() => isSubmitting = true);
                      final user = AuthService.currentUser;
                      await ApiService.submitReview(
                        bookingId: b.bookingCode,
                        rating: rating,
                        comment: commentCtrl.text.trim().isEmpty ? 'Dịch vụ rất tốt!' : commentCtrl.text.trim(),
                        customerId: user?.id,
                        customerName: user?.fullName ?? b.customerName,
                        customerPhone: user?.phone ?? b.customerPhone,
                      );
                      if (!dialogCtx.mounted) return;
                      Navigator.of(dialogCtx).pop();
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Cảm ơn quý khách đã gửi đánh giá cho lịch hẹn #${b.bookingCode}!'),
                          backgroundColor: const Color(0xFF10B981),
                        ),
                      );
                    },
              child: Text(
                isSubmitting ? 'Đang gửi...' : 'Gửi Đánh Giá Ngay',
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmCancelOrder(SalonOrder o) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: AppTheme.borderColor),
        ),
        title: Text(
          'Hủy Đơn Hàng #${o.orderCode}?',
          style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textPrimary, fontSize: 16),
        ),
        content: Text(
          'Bạn có chắc chắn muốn hủy đơn hàng này? Số lượng sản phẩm sẽ được tự động hoàn lại kho khả dụng.',
          style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('Giữ Lại Đơn', style: TextStyle(color: AppTheme.textSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () async {
              Navigator.of(ctx).pop();
              final ok = await ApiService.cancelOrder(o.orderCode);
              if (ok) {
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Đã hủy đơn hàng #${o.orderCode} và hoàn kho thành công!'),
                    backgroundColor: const Color(0xFF10B981),
                  ),
                );
                _loadData();
              }
            },
            child: const Text('Xác Nhận Hủy', style: TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }

  void _showOrderRatingDialog(SalonOrder o) {
    int rating = 5;
    final commentCtrl = TextEditingController(text: 'Sản phẩm mỹ phẩm chính hãng, đóng gói cẩn thận!');
    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppTheme.surfaceCard,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
            side: BorderSide(color: AppTheme.borderColor),
          ),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 24),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Đánh Giá Đơn Hàng #${o.orderCode}',
                      style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textPrimary, fontSize: 16),
                    ),
                    Text(
                      'Người nhận: ${o.customerName}',
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Mức độ hài lòng của bạn:',
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 13, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (index) {
                    final star = index + 1;
                    return IconButton(
                      icon: Icon(
                        star <= rating ? Icons.star_rounded : Icons.star_border_rounded,
                        color: star <= rating ? const Color(0xFFF59E0B) : const Color(0xFF57534E),
                        size: 32,
                      ),
                      onPressed: () => setDialogState(() => rating = star),
                    );
                  }),
                ),
                Text(
                  _getStarLabel(rating),
                  style: const TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.w800, fontSize: 13),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: commentCtrl,
                  maxLines: 3,
                  style: TextStyle(color: AppTheme.textPrimary, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Nhận xét về chất lượng sản phẩm mỹ phẩm, bao bì...',
                    hintStyle: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                    filled: true,
                    fillColor: AppTheme.surfaceElevated,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(color: AppTheme.borderColor),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(color: AppTheme.borderColor),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: AppTheme.accentGold),
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogCtx).pop(),
              child: Text('Hủy Bỏ', style: TextStyle(color: AppTheme.textSecondary)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.accentGold,
                foregroundColor: AppTheme.charcoal,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: isSubmitting
                  ? null
                  : () async {
                      setDialogState(() => isSubmitting = true);
                      final user = AuthService.currentUser;
                      await ApiService.submitReview(
                        orderId: o.orderCode,
                        rating: rating,
                        comment: commentCtrl.text.trim().isEmpty ? 'Sản phẩm rất tốt!' : commentCtrl.text.trim(),
                        customerId: user?.id,
                        customerName: user?.fullName ?? o.customerName,
                        customerPhone: user?.phone ?? o.customerPhone,
                      );
                      if (!dialogCtx.mounted) return;
                      Navigator.of(dialogCtx).pop();
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Cảm ơn quý khách đã gửi đánh giá cho đơn hàng #${o.orderCode}!'),
                          backgroundColor: const Color(0xFF10B981),
                        ),
                      );
                    },
              child: Text(
                isSubmitting ? 'Đang gửi...' : 'Gửi Đánh Giá Ngay',
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmCancelBooking(Booking booking) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: AppTheme.borderColor),
        ),
        title: Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626)),
            SizedBox(width: 8),
            Text('Xác Nhận Hủy Lịch?', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textPrimary)),
          ],
        ),
        content: Text(
          'Bạn có chắc chắn muốn hủy lịch hẹn #${booking.bookingCode} vào lúc ${booking.timeSlot} ngày ${booking.date} không?',
          style: TextStyle(color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('Không Hủy', style: TextStyle(color: AppTheme.textSecondary)),
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
    final filteredBookings = (bookings.where((b) {
      if (currentFilter == 'all') return true;
      if (currentFilter == 'active') return !b.isCancelled && !b.isCompleted;
      if (currentFilter == 'cancelled') return b.isCancelled;
      if (currentFilter == 'completed') return b.isCompleted;
      return true;
    }).toList())
      ..sort((a, b) {
        final numA = int.tryParse(a.bookingCode.replaceAll(RegExp(r'\D'), '')) ?? 0;
        final numB = int.tryParse(b.bookingCode.replaceAll(RegExp(r'\D'), '')) ?? 0;
        if (numA != numB) return numB.compareTo(numA);
        final dComp = b.date.compareTo(a.date);
        if (dComp != 0) return dComp;
        return b.timeSlot.compareTo(a.timeSlot);
      });

    final user = AuthService.currentUser;
    if (user == null) {
      return Scaffold(
        backgroundColor: AppTheme.bgPrimary,
        appBar: AppBar(
          title: Text('Lịch Hẹn & Đơn Hàng', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textPrimary, fontSize: 18)),
          backgroundColor: AppTheme.bgPrimary,
          elevation: 0,
          iconTheme: IconThemeData(color: AppTheme.textPrimary),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: AppTheme.accentGold.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                    border: Border.all(color: AppTheme.accentGold, width: 1.5),
                  ),
                  child: const Icon(Icons.lock_person_outlined, size: 36, color: AppTheme.accentGold),
                ),
                const SizedBox(height: 20),
                Text(
                  'Yêu Cầu Đăng Nhập',
                  style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textPrimary, fontSize: 20),
                ),
                const SizedBox(height: 10),
                Text(
                  'Quý khách vui lòng đăng nhập tài khoản để tra cứu lịch hẹn và xem chi tiết các đơn hàng mỹ phẩm của riêng mình.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 13.5, height: 1.5),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accentGold,
                      foregroundColor: AppTheme.charcoal,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: () async {
                      await Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const LoginScreen()),
                      );
                      if (mounted) {
                        setState(() {});
                        _loadData();
                      }
                    },
                    child: const Text('ĐĂNG NHẬP / ĐĂNG KÝ NGAY', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final isStaffOrAdmin = user.role.toUpperCase() == 'ADMIN' ||
        user.role.toUpperCase() == 'STAFF' ||
        user.role.toUpperCase() == 'QUANLY';

    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        title: Text(
          isStaffOrAdmin ? 'Tra Cứu & Lịch Hẹn' : 'Lịch Hẹn & Đơn Hàng Của Tôi',
          style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textPrimary, fontSize: 18),
        ),
        backgroundColor: AppTheme.bgPrimary,
        elevation: 0,
        iconTheme: IconThemeData(color: AppTheme.textPrimary),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppTheme.accentGold),
            onPressed: _loadData,
            tooltip: 'Làm mới',
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.accentGold,
          labelColor: AppTheme.accentGold,
          unselectedLabelColor: AppTheme.textSecondary,
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
            color: AppTheme.bgPrimary,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: searchController,
                    onSubmitted: (_) => _loadData(),
                    style: TextStyle(color: AppTheme.textPrimary),
                    decoration: InputDecoration(
                      hintText: isStaffOrAdmin
                          ? 'Nhập SĐT hoặc Mã (VD: 0988... / LH01 / DH01)'
                          : 'Tìm theo mã #LH, dịch vụ hoặc sản phẩm...',
                      hintStyle: TextStyle(fontSize: 12.5, color: AppTheme.textSecondary),
                      prefixIcon: const Icon(Icons.search, size: 20, color: AppTheme.accentGold),
                      suffixIcon: searchController.text.isNotEmpty
                          ? IconButton(
                              icon: Icon(Icons.clear, size: 18, color: AppTheme.textSecondary),
                              onPressed: () {
                                searchController.clear();
                                _loadData();
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: AppTheme.surfaceCard,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppTheme.borderColor)),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppTheme.borderColor)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.accentGold)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accentGold,
                    foregroundColor: AppTheme.charcoal,
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
          color: AppTheme.bgPrimary,
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
        Divider(height: 1, color: AppTheme.borderColor),

        Expanded(
          child: isLoading
              ? const Center(child: CircularProgressIndicator(color: AppTheme.accentGold))
              : filtered.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.calendar_month_outlined, size: 64, color: AppTheme.textSecondary),
                          const SizedBox(height: 12),
                          Text(
                            'Không tìm thấy lịch hẹn nào.',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textSecondary),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.accentGold,
                              foregroundColor: AppTheme.charcoal,
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
                            color: AppTheme.surfaceCard,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppTheme.borderColor),
                            boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 8, offset: Offset(0, 2))],
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
                                            color: AppTheme.accentGold.withValues(alpha: 0.15),
                                            borderRadius: BorderRadius.circular(6),
                                            border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.4)),
                                          ),
                                          child: Text(
                                            '#${b.bookingCode}',
                                            style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.accentGold, fontSize: 13),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          b.customerName,
                                          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppTheme.textPrimary),
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
                                Divider(height: 16, color: AppTheme.borderColor),
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
                                          Text(b.serviceName, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppTheme.textPrimary)),
                                          const SizedBox(height: 4),
                                          Text('Thợ tạo mẫu: ${b.stylistName}', style: TextStyle(fontSize: 12.5, color: AppTheme.textSecondary)),
                                          Text('Giờ hẹn: ${b.timeSlot} • Ngày ${b.date}', style: const TextStyle(fontSize: 12.5, color: AppTheme.accentGold, fontWeight: FontWeight.w800)),
                                          Text('Chi nhánh: ${b.branchName}', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('Chi phí dự kiến:', style: TextStyle(fontSize: 12.5, color: AppTheme.textSecondary)),
                                    Text(currencyFormat.format(b.totalPrice), style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.accentGold, fontSize: 16)),
                                  ],
                                ),
                                Divider(height: 20, color: AppTheme.borderColor),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    OutlinedButton.icon(
                                      style: OutlinedButton.styleFrom(
                                        side: const BorderSide(color: AppTheme.accentGold),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                      ),
                                      icon: const Icon(Icons.qr_code_2, size: 16, color: AppTheme.accentGold),
                                      label: const Text('Xem Vé QR', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: AppTheme.accentGold)),
                                      onPressed: () => _showQrCheckInModal(b),
                                    ),
                                    ElevatedButton.icon(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppTheme.accentGold,
                                        foregroundColor: AppTheme.charcoal,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                      ),
                                      icon: const Icon(Icons.payment_rounded, size: 16),
                                      label: const Text('Thanh Toán Ngay', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                                      onPressed: () => _showBookingPaymentModal(b),
                                    ),
                                    if (!isCancelled)
                                      OutlinedButton.icon(
                                        style: OutlinedButton.styleFrom(
                                          side: BorderSide(color: AppTheme.borderColor),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                        ),
                                        icon: const Icon(Icons.star_rate_rounded, size: 16, color: Color(0xFFF59E0B)),
                                        label: Text('Đánh Giá', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: AppTheme.textPrimary)),
                                        onPressed: () => _showBookingRatingDialog(b),
                                      ),
                                    if (!isCancelled && !isCompleted)
                                      OutlinedButton(
                                        style: OutlinedButton.styleFrom(
                                          side: const BorderSide(color: Color(0xFFDC2626)),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                        ),
                                        onPressed: () => _confirmCancelBooking(b),
                                        child: const Text('Hủy', style: TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.w800, fontSize: 12)),
                                      ),
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
      return const Center(child: CircularProgressIndicator(color: AppTheme.accentGold));
    }
    if (orderList.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inventory_2_outlined, size: 64, color: AppTheme.textSecondary),
            SizedBox(height: 12),
            Text(
              'Không tìm thấy đơn hàng mỹ phẩm nào.',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textSecondary),
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
        final isCancelled = o.orderStatus.toLowerCase().contains('hủy') || o.orderStatus.toLowerCase() == 'cancelled';
        final isPaid = o.paymentStatus.toLowerCase().contains('đã thanh toán') || o.paymentStatus.toLowerCase() == 'paid';
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.surfaceCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.borderColor),
            boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 8, offset: Offset(0, 2))],
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
                      color: AppTheme.accentGold.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.4)),
                    ),
                    child: Text(
                      '#' + o.orderCode,
                      style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.accentGold, fontSize: 13),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isCancelled ? const Color(0xFFEF4444).withValues(alpha: 0.15) : const Color(0xFF10B981).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(9999),
                    ),
                    child: Text(
                      o.orderStatus,
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11.5, color: isCancelled ? const Color(0xFFEF4444) : const Color(0xFF10B981)),
                    ),
                  ),
                ],
              ),
              Divider(height: 16, color: AppTheme.borderColor),
              Text('Người nhận: ' + o.customerName + ' • ' + o.customerPhone, style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.w700, fontSize: 13)),
              const SizedBox(height: 4),
              Text('Địa chỉ: ' + o.shippingAddress, style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
              const SizedBox(height: 4),
              Text('Thanh toán: ' + o.paymentMethod + ' (' + o.paymentStatus + ')', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Tổng tiền đơn hàng:', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12.5)),
                  Text(
                    currencyFormat.format(o.totalAmount),
                    style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.accentGold, fontSize: 16),
                  ),
                ],
              ),
              Divider(height: 18, color: AppTheme.borderColor),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (!isCancelled && !isPaid)
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.accentGold,
                        foregroundColor: AppTheme.charcoal,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      icon: const Icon(Icons.payment_rounded, size: 16),
                      label: const Text('Thanh Toán Ngay', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                      onPressed: () => _showOrderPaymentModal(o),
                    ),
                  if (!isCancelled)
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: AppTheme.borderColor),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      icon: const Icon(Icons.star_rate_rounded, size: 16, color: Color(0xFFF59E0B)),
                      label: Text('Đánh Giá', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: AppTheme.textPrimary)),
                      onPressed: () => _showOrderRatingDialog(o),
                    ),
                  if (!isCancelled)
                    OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFFDC2626)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      onPressed: () => _confirmCancelOrder(o),
                      child: const Text('Hủy Đơn', style: TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.w800, fontSize: 12)),
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
              color: isSel ? AppTheme.accentGold : Colors.transparent,
              width: 2.5,
            ),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: isSel ? FontWeight.w900 : FontWeight.w600,
            color: isSel ? AppTheme.accentGold : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }
}

typedef MyBookingsPage = MyBookingsScreen;
