import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/service.dart';
import '../models/stylist.dart';
import '../models/branch.dart';
import '../models/booking.dart';
import '../services/api_service.dart';

class BookingScreen extends StatefulWidget {
  final String? preselectedServiceId;

  const BookingScreen({super.key, this.preselectedServiceId});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0);

  List<SalonService> services = [];
  List<Stylist> stylists = [];
  List<Branch> branches = [];
  bool isLoading = true;

  // Luồng xổ bước (Cascading Accordion) - Yêu cầu thứ 6
  // Bước 1: Dịch vụ -> Bước 2: Thợ tạo mẫu -> Bước 3: Ngày giờ -> Bước 4: Thông tin & Xác nhận
  SalonService? selectedService;
  Stylist? selectedStylist;
  DateTime selectedDate = DateTime.now().add(const Duration(days: 1));
  String? selectedTimeSlot;
  Branch? selectedBranch;

  final nameController = TextEditingController(text: 'Khách Hàng');
  final phoneController = TextEditingController(text: '0988 123 456');
  final notesController = TextEditingController();

  final List<String> timeSlots = [
    '09:00', '09:45', '10:30', '11:15', '14:00', '14:45', '15:30', '16:15', '17:00', '18:00', '19:00'
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final sList = await ApiService.fetchServices();
    final stList = await ApiService.fetchStylists();
    final bList = await ApiService.fetchBranches();

    setState(() {
      services = sList;
      stylists = stList;
      branches = bList;
      if (bList.isNotEmpty) selectedBranch = bList.first;
      if (widget.preselectedServiceId != null) {
        selectedService = sList.firstWhere(
          (s) => s.id == widget.preselectedServiceId,
          orElse: () => sList.first,
        );
      }
      isLoading = false;
    });
  }

  Future<void> _submitBooking() async {
    if (selectedService == null || selectedStylist == null || selectedTimeSlot == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn đầy đủ Dịch vụ, Thợ tạo mẫu và Giờ hẹn')),
      );
      return;
    }

    final newBooking = Booking(
      id: 'LH-${DateTime.now().millisecondsSinceEpoch}',
      bookingCode: 'LH-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
      customerName: nameController.text.trim().isEmpty ? 'Khách Hàng' : nameController.text.trim(),
      customerPhone: phoneController.text.trim().isEmpty ? '0988 123 456' : phoneController.text.trim(),
      branchId: selectedBranch?.id ?? 'CN01',
      branchName: selectedBranch?.name ?? 'Omni Salon Chi Nhánh 1',
      serviceId: selectedService!.id,
      serviceName: selectedService!.name,
      stylistId: selectedStylist!.id,
      stylistName: selectedStylist!.name,
      date: DateFormat('yyyy-MM-dd').format(selectedDate),
      timeSlot: selectedTimeSlot!,
      totalPrice: selectedService!.price,
      status: 'Confirmed',
      createdAt: DateFormat('yyyy-MM-dd HH:mm:ss').format(DateTime.now()),
    );

    await ApiService.createBooking(newBooking);

    if (mounted) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          title: const Row(
            children: [
              Text('🎉 ', style: TextStyle(fontSize: 26)),
              Expanded(
                child: Text('Đặt Lịch Thành Công!', style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w900)),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Mã vé hẹn: #${newBooking.bookingCode}', style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFFB48312), fontSize: 16)),
              const SizedBox(height: 8),
              Text('Dịch vụ: ${newBooking.serviceName}'),
              Text('Thợ tạo mẫu: ${newBooking.stylistName}'),
              Text('Thời gian: ${newBooking.timeSlot} ngày ${newBooking.date}'),
              Text('Chi nhánh: ${newBooking.branchName}'),
              const Divider(height: 24),
              const Text('Thông tin đã được đồng bộ tức thì sang hệ thống Web Omni Salon.', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
            ],
          ),
          actions: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFB48312),
                foregroundColor: Colors.white,
              ),
              onPressed: () {
                Navigator.of(ctx).pop();
                Navigator.of(context).pop();
              },
              child: const Text('Đóng'),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFFF1F3F6),
        body: Center(child: CircularProgressIndicator(color: Color(0xFFB48312))),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF1F3F6),
      appBar: AppBar(
        title: const Text('Đặt Lịch Chăm Sóc Tóc', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 18)),
        backgroundColor: Colors.white,
        elevation: 1,
        iconTheme: const IconThemeData(color: Color(0xFF0F172A)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ==========================================
            // BƯỚC 1: CHỌN DỊCH VỤ (LUÔN MỞ SẴN)
            // ==========================================
            _buildStepCard(
              stepNumber: '1',
              title: 'CHỌN DỊCH VỤ CHĂM SÓC TÓC',
              isCompleted: selectedService != null,
              child: Column(
                children: services.map((s) {
                  final isSelected = selectedService?.id == s.id;
                  return InkWell(
                    onTap: () {
                      setState(() {
                        selectedService = s;
                        // Tự động xổ xuống Bước 2 nếu chưa chọn thợ
                      });
                    },
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFFFEF3C7) : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected ? const Color(0xFFB48312) : const Color(0xFFE2E8F0),
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              s.image,
                              width: 60,
                              height: 60,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(width: 60, height: 60, color: const Color(0xFFE2E8F0)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(s.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: Color(0xFF0F172A))),
                                const SizedBox(height: 4),
                                Text(s.description, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Text(currencyFormat.format(s.price), style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFBE4D25), fontSize: 14)),
                                    const Spacer(),
                                    Text('⏱️ ${s.duration} phút', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          if (isSelected)
                            const Padding(
                              padding: EdgeInsets.only(left: 8),
                              child: Icon(Icons.check_circle, color: Color(0xFFB48312), size: 24),
                            ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),

            // ==========================================
            // BƯỚC 2: XỔ XUỐNG CHỌN THỢ TẠO MẪU (STYLIST)
            // Khi nhấn chọn 1 dịch vụ ở Bước 1, Bước 2 tự động mở ra
            // ==========================================
            if (selectedService != null) ...[
              const SizedBox(height: 16),
              _buildStepCard(
                stepNumber: '2',
                title: 'CHỌN NGHỆ NHÂN TẠO MẪU TÓC',
                isCompleted: selectedStylist != null,
                child: Column(
                  children: stylists.map((st) {
                    final isSelected = selectedStylist?.id == st.id;
                    return InkWell(
                      onTap: () {
                        setState(() {
                          selectedStylist = st;
                          // Tự động xổ xuống Bước 3
                        });
                      },
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFFFEF3C7) : Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected ? const Color(0xFFB48312) : const Color(0xFFE2E8F0),
                            width: isSelected ? 2 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 26,
                              backgroundImage: NetworkImage(st.avatar),
                              backgroundColor: const Color(0xFFE2E8F0),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(st.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: Color(0xFF0F172A))),
                                  const SizedBox(height: 2),
                                  Text(st.level, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFFB48312))),
                                  const SizedBox(height: 2),
                                  const Text('★ 5.0 (500+ lượt cắt hài lòng)', style: TextStyle(fontSize: 11, color: Color(0xFFD97706))),
                                ],
                              ),
                            ),
                            if (isSelected)
                              const Icon(Icons.check_circle, color: Color(0xFFB48312), size: 24),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],

            // ==========================================
            // BƯỚC 3: XỔ XUỐNG CHỌN NGÀY & GIỜ HẸN
            // Khi nhấn chọn Thợ ở Bước 2, Bước 3 tự động mở ra
            // ==========================================
            if (selectedStylist != null) ...[
              const SizedBox(height: 16),
              _buildStepCard(
                stepNumber: '3',
                title: 'CHỌN NGÀY & KHUNG GIỜ HẸN',
                isCompleted: selectedTimeSlot != null,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Nút chọn ngày
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.calendar_month, color: Color(0xFFB48312)),
                      title: Text(
                        'Ngày hẹn: ${DateFormat('dd/MM/yyyy').format(selectedDate)}',
                        style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                      ),
                      trailing: TextButton(
                        onPressed: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: selectedDate,
                            firstDate: DateTime.now(),
                            lastDate: DateTime.now().add(const Duration(days: 30)),
                          );
                          if (picked != null) setState(() => selectedDate = picked);
                        },
                        child: const Text('Đổi Ngày', style: TextStyle(color: Color(0xFFB48312), fontWeight: FontWeight.w700)),
                      ),
                    ),
                    const Divider(height: 20),
                    const Text('Khung giờ còn trống:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: timeSlots.map((slot) {
                        final isSlotSelected = selectedTimeSlot == slot;
                        return ChoiceChip(
                          label: Text(slot, style: TextStyle(fontWeight: FontWeight.w700, color: isSlotSelected ? Colors.white : const Color(0xFF0F172A))),
                          selected: isSlotSelected,
                          selectedColor: const Color(0xFFB48312),
                          backgroundColor: Colors.white,
                          side: BorderSide(color: isSlotSelected ? const Color(0xFFB48312) : const Color(0xFFCBD5E1)),
                          onSelected: (val) {
                            setState(() {
                              selectedTimeSlot = val ? slot : null;
                            });
                          },
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ],

            // ==========================================
            // BƯỚC 4: XỔ XUỐNG THÔNG TIN KHÁCH & XÁC NHẬN
            // Khi nhấn chọn giờ ở Bước 3, Bước 4 tự động mở ra
            // ==========================================
            if (selectedTimeSlot != null) ...[
              const SizedBox(height: 16),
              _buildStepCard(
                stepNumber: '4',
                title: 'THÔNG TIN KHÁCH HÀNG & XÁC NHẬN ĐẶT LỊCH',
                isCompleted: false,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Chọn chi nhánh
                    DropdownButtonFormField<Branch>(
                      value: selectedBranch,
                      decoration: const InputDecoration(
                        labelText: 'Chi nhánh phục vụ',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                      items: branches.map((b) => DropdownMenuItem(value: b, child: Text(b.name, overflow: TextOverflow.ellipsis))).toList(),
                      onChanged: (val) => setState(() => selectedBranch = val),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: nameController,
                      decoration: const InputDecoration(
                        labelText: 'Họ và tên của bạn',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Số điện thoại liên hệ',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: notesController,
                      decoration: const InputDecoration(
                        labelText: 'Ghi chú cho thợ (tùy chọn)',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Tổng chi phí dịch vụ:', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
                              Text(currencyFormat.format(selectedService!.price), style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFBE4D25), fontSize: 18)),
                            ],
                          ),
                          const SizedBox(height: 4),
                          const Text('Thanh toán sau khi hoàn thành dịch vụ tại salon.', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _submitBooking,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFB48312),
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Xác Nhận Đặt Lịch Hẹn Ngay →', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildStepCard({
    required String stepNumber,
    required String title,
    required bool isCompleted,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 10, offset: Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: isCompleted ? const Color(0xFF059669) : const Color(0xFFB48312),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    isCompleted ? '✓' : stepNumber,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF0F172A), letterSpacing: 0.02),
                ),
              ),
            ],
          ),
          const Divider(height: 20),
          child,
        ],
      ),
    );
  }
}

extension ButtonStyleExtension on ElevatedButton {
  static ButtonStyle styleButtonFor(Color bg, Color fg) {
    return ElevatedButton.styleFrom(
      backgroundColor: bg,
      foregroundColor: fg,
      padding: const EdgeInsets.symmetric(vertical: 14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    );
  }
}
