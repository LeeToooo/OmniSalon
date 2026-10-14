import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/booking.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../widgets/omni_image.dart';
import 'booking_screen.dart';

class MyBookingsScreen extends StatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  State<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends State<MyBookingsScreen> {
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0);
  final searchController = TextEditingController();

  List<Booking> bookings = [];
  bool isLoading = true;
  String currentFilter = 'all';

  @override
  void initState() {
    super.initState();
    if (AuthService.currentUser != null && AuthService.currentUser!.phone.isNotEmpty) {
      searchController.text = AuthService.currentUser!.phone;
    }
    _loadBookings();
  }

  Future<void> _loadBookings() async {
    setState(() => isLoading = true);
    final q = searchController.text.trim();
    final list = q.isNotEmpty
        ? await ApiService.lookupBookings(q)
        : await ApiService.fetchBookings();
    if (!mounted) return;
    setState(() {
      bookings = list;
      isLoading = false;
    });
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
            backgroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
            title: Text(
              'Đổi Lịch Hẹn #${booking.bookingCode}',
              style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 18),
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Dịch vụ: ${booking.serviceName}', style: const TextStyle(fontWeight: FontWeight.w700)),
                  Text('Thợ: ${booking.stylistName}'),
                  const Divider(height: 20),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.calendar_today, color: Color(0xFFB48312)),
                    title: Text(
                      'Ngày mới: ${DateFormat('dd/MM/yyyy').format(newDate)}',
                      style: const TextStyle(fontWeight: FontWeight.w700),
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
                      child: const Text('Chọn Ngày'),
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text('Chọn khung giờ mới:', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: Color(0xFF64748B))),
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
                            color: isSel ? Colors.white : const Color(0xFF0F172A),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        selected: isSel,
                        selectedColor: const Color(0xFFB48312),
                        backgroundColor: Colors.white,
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
                child: const Text('Đóng', style: TextStyle(color: Color(0xFF64748B))),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFB48312),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: () async {
                  final dateStr = DateFormat('yyyy-MM-dd').format(newDate);
                  await ApiService.rescheduleBooking(booking.id, dateStr, newTime);
                  if (!dialogCtx.mounted) return;
                  Navigator.of(dialogCtx).pop();
                  _loadBookings();
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Đã cập nhật giờ hẹn thành công: $newTime ngày $dateStr')),
                  );
                },
                child: const Text('Lưu Đổi Lịch'),
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
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626)),
            SizedBox(width: 8),
            Text('Xác Nhận Hủy Lịch?', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
          ],
        ),
        content: Text(
          'Bạn có chắc chắn muốn hủy lịch hẹn #${booking.bookingCode} vào lúc ${booking.timeSlot} ngày ${booking.date} không?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Không Hủy', style: TextStyle(color: Color(0xFF64748B))),
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
              _loadBookings();
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Đã hủy lịch hẹn trên hệ thống SQL Server.')),
              );
            },
            child: const Text('Xác Nhận Hủy'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = bookings.where((b) {
      if (currentFilter == 'all') return true;
      if (currentFilter == 'active') return !b.isCancelled && !b.isCompleted;
      if (currentFilter == 'cancelled') return b.isCancelled;
      if (currentFilter == 'completed') return b.isCompleted;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F3F6),
      appBar: AppBar(
        title: const Text('Tra Cứu & Lịch Hẹn', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 18)),
        backgroundColor: Colors.white,
        elevation: 1,
        iconTheme: const IconThemeData(color: Color(0xFF0F172A)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadBookings,
            tooltip: 'Làm mới',
          ),
        ],
      ),
      body: Column(
        children: [
          // THANH TÌM KIẾM THEO SĐT / MÃ LỊCH HẸN
          Container(
            padding: const EdgeInsets.all(14),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: searchController,
                    onSubmitted: (_) => _loadBookings(),
                    decoration: InputDecoration(
                      hintText: 'Nhập SĐT hoặc Mã lịch hẹn (VD: 0988... / LH01)',
                      hintStyle: const TextStyle(fontSize: 12.5),
                      prefixIcon: const Icon(Icons.search, size: 20, color: Color(0xFF64748B)),
                      suffixIcon: searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 18),
                              onPressed: () {
                                searchController.clear();
                                _loadBookings();
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFB48312),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                  onPressed: _loadBookings,
                  child: const Text('Tra Cứu', style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ],
            ),
          ),

          // FILTER TABS
          Container(
            color: Colors.white,
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
          const Divider(height: 1),

          // DANH SÁCH LỊCH HẸN
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFFB48312)))
                : filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.calendar_month_outlined, size: 64, color: Color(0xFF94A3B8)),
                            const SizedBox(height: 12),
                            const Text(
                              'Không tìm thấy lịch hẹn nào.',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF64748B)),
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFB48312),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (_) => const BookingScreen()),
                                );
                              },
                              child: const Text('Đặt Lịch Hẹn Mới'),
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

                          Color badgeBg = const Color(0xFFECFDF5);
                          Color badgeText = const Color(0xFF059669);
                          if (isCancelled) {
                            badgeBg = const Color(0xFFFEE2E2);
                            badgeText = const Color(0xFFDC2626);
                          } else if (isCompleted) {
                            badgeBg = const Color(0xFFEFF6FF);
                            badgeText = const Color(0xFF2563EB);
                          }

                          return Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                              boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 8, offset: Offset(0, 3))],
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
                                              color: const Color(0xFFFEF3C7),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              '#${b.bookingCode}',
                                              style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFB48312), fontSize: 13),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            b.customerName,
                                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: Color(0xFF334155)),
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
                                  const Divider(height: 16),
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
                                            Text(b.serviceName, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF0F172A))),
                                            const SizedBox(height: 4),
                                            Text('Thợ tạo mẫu: ${b.stylistName}', style: const TextStyle(fontSize: 12.5, color: Color(0xFF475569))),
                                            Text('Giờ hẹn: ${b.timeSlot} • Ngày ${b.date}', style: const TextStyle(fontSize: 12.5, color: Color(0xFFB48312), fontWeight: FontWeight.w800)),
                                            Text('Chi nhánh: ${b.branchName}', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('Chi phí dự kiến:', style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B))),
                                      Text(currencyFormat.format(b.totalPrice), style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFBE4D25), fontSize: 16)),
                                    ],
                                  ),
                                  if (!isCancelled && !isCompleted) ...[
                                    const Divider(height: 20),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: OutlinedButton(
                                            style: OutlinedButton.styleFrom(
                                              side: const BorderSide(color: Color(0xFFB48312)),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                              padding: const EdgeInsets.symmetric(vertical: 10),
                                            ),
                                            onPressed: () => _showRescheduleDialog(b),
                                            child: const Text('Đổi Lịch Hẹn', style: TextStyle(color: Color(0xFFB48312), fontWeight: FontWeight.w800, fontSize: 12.5)),
                                          ),
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: OutlinedButton(
                                            style: OutlinedButton.styleFrom(
                                              side: const BorderSide(color: Color(0xFFDC2626)),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                              padding: const EdgeInsets.symmetric(vertical: 10),
                                            ),
                                            onPressed: () => _confirmCancelBooking(b),
                                            child: const Text('Hủy Lịch', style: TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.w800, fontSize: 12.5)),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
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
              color: isSel ? const Color(0xFFB48312) : Colors.transparent,
              width: 2.5,
            ),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: isSel ? FontWeight.w900 : FontWeight.w600,
            color: isSel ? const Color(0xFFB48312) : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }
}
