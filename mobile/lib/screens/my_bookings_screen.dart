import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/booking.dart';
import '../services/api_service.dart';

class MyBookingsScreen extends StatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  State<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends State<MyBookingsScreen> {
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0);
  List<Booking> bookings = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBookings();
  }

  Future<void> _loadBookings() async {
    setState(() => isLoading = true);
    final list = await ApiService.fetchBookings();
    setState(() {
      bookings = list;
      isLoading = false;
    });
  }

  // Chức năng: ĐỔI LỊCH HẸN (CLO 3.5 Rubric - 0.25đ)
  void _showRescheduleDialog(Booking booking) {
    DateTime newDate = DateTime.tryParse(booking.date) ?? DateTime.now().add(const Duration(days: 1));
    String newTime = booking.timeSlot;

    final timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:30'];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          return AlertDialog(
            backgroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
            title: Text('Đổi Lịch Hẹn #${booking.bookingCode}', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 18)),
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
                    title: Text('Ngày mới: ${DateFormat('dd/MM/yyyy').format(newDate)}', style: const TextStyle(fontWeight: FontWeight.w700)),
                    trailing: TextButton(
                      onPressed: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: newDate,
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(const Duration(days: 30)),
                        );
                        if (picked != null) {
                          setModalState(() => newDate = picked);
                        }
                      },
                      child: const Text('Chọn'),
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
                        label: Text(t, style: TextStyle(color: isSel ? Colors.white : const Color(0xFF0F172A), fontWeight: FontWeight.w700)),
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
                onPressed: () => Navigator.of(ctx).pop(),
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
                  Navigator.of(ctx).pop();
                  _loadBookings();
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Đã đổi lịch hẹn thành công sang $newTime ngày $dateStr')),
                    );
                  }
                },
                child: const Text('Lưu Đổi Lịch'),
              ),
            ],
          );
        },
      ),
    );
  }

  // Chức năng: HỦY LỊCH HẸN (CLO 3.5 Rubric - 0.25đ)
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
        content: Text('Bạn có chắc chắn muốn hủy vé hẹn #${booking.bookingCode} vào lúc ${booking.timeSlot} ngày ${booking.date} không?'),
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
              Navigator.of(ctx).pop();
              _loadBookings();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Đã hủy lịch hẹn thành công.')),
                );
              }
            },
            child: const Text('Xác Nhận Hủy'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F3F6),
      appBar: AppBar(
        title: const Text('Lịch Hẹn Của Tôi', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 18)),
        backgroundColor: Colors.white,
        elevation: 1,
        iconTheme: const IconThemeData(color: Color(0xFF0F172A)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadBookings,
            tooltip: 'Làm mới danh sách',
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFB48312)))
          : bookings.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.calendar_month_outlined, size: 64, color: Color(0xFF94A3B8)),
                      const SizedBox(height: 12),
                      const Text('Bạn chưa có lịch hẹn nào.', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFB48312),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text('Đặt Lịch Ngay'),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: bookings.length,
                  itemBuilder: (context, idx) {
                    final b = bookings[idx];
                    final isCancelled = b.isCancelled;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 8, offset: Offset(0, 3))],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('#${b.bookingCode}', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFB48312), fontSize: 16)),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: isCancelled ? const Color(0xFFFEE2E2) : const Color(0xFFECFDF5),
                                  borderRadius: BorderRadius.circular(9999),
                                ),
                                child: Text(
                                  isCancelled ? 'Đã Hủy' : 'Đã Xác Nhận',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 12,
                                    color: isCancelled ? const Color(0xFFDC2626) : const Color(0xFF059669),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const Divider(height: 16),
                          Text(b.serviceName, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF0F172A))),
                          const SizedBox(height: 6),
                          Text('💈 Thợ tạo mẫu: ${b.stylistName}', style: const TextStyle(fontSize: 14, color: Color(0xFF334155))),
                          Text('⏱️ Thời gian: ${b.timeSlot} ngày ${b.date}', style: const TextStyle(fontSize: 14, color: Color(0xFF334155), fontWeight: FontWeight.w600)),
                          Text('📍 Chi nhánh: ${b.branchName}', style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Chi phí dự kiến:', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                              Text(currencyFormat.format(b.totalPrice), style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFBE4D25), fontSize: 16)),
                            ],
                          ),
                          if (!isCancelled) ...[
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
                                    child: const Text('🔄 Đổi Lịch Hẹn', style: TextStyle(color: Color(0xFFB48312), fontWeight: FontWeight.w800)),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: OutlinedButton(
                                    style: OutlinedButton.styleFrom(
                                      side: const BorderSide(color: Color(0xFFDC2626)),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                      padding: const EdgeInsets.symmetric(vertical: 10),
                                    ),
                                    onPressed: () => _confirmCancelBooking(b),
                                    child: const Text('✕ Hủy Lịch', style: TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.w800)),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}
