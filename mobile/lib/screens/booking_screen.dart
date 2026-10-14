import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/service.dart';
import '../models/stylist.dart';
import '../models/branch.dart';
import '../models/booking.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../widgets/omni_image.dart';
import 'my_bookings_screen.dart';

class BookingScreen extends StatefulWidget {
  final String? preselectedServiceId;
  final String? preselectedBranchId;

  const BookingScreen({
    super.key,
    this.preselectedServiceId,
    this.preselectedBranchId,
  });

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0);

  List<Branch> branches = [];
  List<SalonService> services = [];
  List<Stylist> stylists = [];
  List<Map<String, dynamic>> timeSlots = [];

  bool isLoading = true;
  bool isLoadingSlots = false;
  bool isSubmitting = false;

  // Luồng đặt lịch 5 bước chuẩn Web
  Branch? selectedBranch;
  SalonService? selectedService;
  Stylist? selectedStylist;
  DateTime selectedDate = DateTime.now();
  String? selectedTimeSlot;

  String serviceCategoryFilter = 'all';

  final nameController = TextEditingController(text: AuthService.currentUser?.fullName ?? 'Khách Hàng Omni');
  final phoneController = TextEditingController(text: AuthService.currentUser?.phone ?? '0988 123 456');
  final notesController = TextEditingController();

  String _formatSelectedDate(DateTime date) {
    try {
      return DateFormat('dd/MM/yyyy (EEEE)', 'vi').format(date);
    } catch (_) {
      return DateFormat('dd/MM/yyyy').format(date);
    }
  }

  @override
  void initState() {
    super.initState();
    if (AuthService.currentUser != null) {
      nameController.text = AuthService.currentUser!.fullName;
      phoneController.text = AuthService.currentUser!.phone;
    }
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    setState(() => isLoading = true);
    final bList = await ApiService.fetchBranches();
    final sList = await ApiService.fetchServices();

    Branch? initBranch;
    if (widget.preselectedBranchId != null) {
      initBranch = bList.firstWhere(
        (b) => b.id == widget.preselectedBranchId,
        orElse: () => bList.isNotEmpty ? bList.first : _defaultBranch,
      );
    } else if (bList.isNotEmpty) {
      initBranch = bList.first;
    }

    SalonService? initService;
    if (widget.preselectedServiceId != null) {
      initService = sList.firstWhere(
        (s) => s.id == widget.preselectedServiceId,
        orElse: () => sList.first,
      );
    }

    final stList = await ApiService.fetchStylists(branchId: initBranch?.id);

    setState(() {
      branches = bList;
      services = sList;
      selectedBranch = initBranch;
      selectedService = initService;
      stylists = stList;
      if (stList.isNotEmpty) selectedStylist = stList.first;
      isLoading = false;
    });

    _refreshTimeSlots();
  }

  Future<void> _onBranchSelected(Branch branch) async {
    setState(() {
      selectedBranch = branch;
      selectedStylist = null;
    });
    final stList = await ApiService.fetchStylists(branchId: branch.id);
    setState(() {
      stylists = stList;
      if (stList.isNotEmpty) selectedStylist = stList.first;
    });
    _refreshTimeSlots();
  }

  Future<void> _refreshTimeSlots() async {
    if (selectedStylist == null) return;
    setState(() => isLoadingSlots = true);
    final dateStr = DateFormat('yyyy-MM-dd').format(selectedDate);
    final slots = await ApiService.fetchAvailableSlots(dateStr, selectedStylist!.id);
    setState(() {
      timeSlots = slots;
      if (selectedTimeSlot != null) {
        final found = slots.firstWhere((s) => s['time'] == selectedTimeSlot && s['available'] == true, orElse: () => {});
        if (found.isEmpty) selectedTimeSlot = null;
      }
      isLoadingSlots = false;
    });
  }

  Future<void> _submitBooking() async {
    if (selectedBranch == null) {
      _showToast('Vui lòng chọn Chi nhánh làm đẹp!');
      return;
    }
    if (selectedService == null) {
      _showToast('Vui lòng chọn Dịch vụ hoặc Combo chăm sóc tóc!');
      return;
    }
    if (selectedStylist == null) {
      _showToast('Vui lòng chọn Thợ tạo mẫu tóc!');
      return;
    }
    if (selectedTimeSlot == null) {
      _showToast('Vui lòng chọn Khung giờ hẹn!');
      return;
    }

    final name = nameController.text.trim();
    final phone = phoneController.text.trim();
    if (name.isEmpty || phone.isEmpty) {
      _showToast('Vui lòng nhập Họ tên và Số điện thoại!');
      return;
    }

    setState(() => isSubmitting = true);

    final dateStr = DateFormat('yyyy-MM-dd').format(selectedDate);
    final bookingCode = 'LH${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';

    final newBooking = Booking(
      id: bookingCode,
      bookingCode: bookingCode,
      customerName: name,
      customerPhone: phone,
      branchId: selectedBranch!.id,
      branchName: selectedBranch!.name,
      serviceId: selectedService!.id,
      serviceName: selectedService!.name,
      stylistId: selectedStylist!.id,
      stylistName: selectedStylist!.name,
      date: dateStr,
      timeSlot: selectedTimeSlot!,
      totalPrice: selectedService!.price,
      status: 'Confirmed',
      createdAt: DateFormat('yyyy-MM-dd HH:mm:ss').format(DateTime.now()),
      serviceImage: selectedService!.image,
    );

    final result = await ApiService.createBooking(newBooking);
    setState(() => isSubmitting = false);

    if (!mounted) return;

    if (result['success'] == true) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          title: const Row(
            children: [
              Icon(Icons.check_circle, color: Color(0xFF16A34A), size: 28),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Đặt Lịch Thành Công!',
                  style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w900),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFB48312)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.confirmation_number_outlined, color: Color(0xFFB48312)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Mã Lịch Hẹn: #${newBooking.bookingCode}',
                        style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFB48312), fontSize: 15),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Text('• Chi nhánh: ${newBooking.branchName}', style: const TextStyle(fontSize: 13, color: Color(0xFF334155))),
              Text('• Dịch vụ: ${newBooking.serviceName}', style: const TextStyle(fontSize: 13, color: Color(0xFF334155), fontWeight: FontWeight.w700)),
              Text('• Thợ tạo mẫu: ${newBooking.stylistName}', style: const TextStyle(fontSize: 13, color: Color(0xFF334155))),
              Text('• Thời gian: ${newBooking.timeSlot} ngày ${DateFormat('dd/MM/yyyy').format(selectedDate)}', style: const TextStyle(fontSize: 13, color: Color(0xFFB48312), fontWeight: FontWeight.w800)),
              Text('• Chi phí dự kiến: ${currencyFormat.format(newBooking.totalPrice)}', style: const TextStyle(fontSize: 13, color: Color(0xFFBE4D25), fontWeight: FontWeight.w900)),
              const Divider(height: 20),
              const Text(
                'Lịch hẹn của bạn đã được ghi nhận trực tiếp vào cơ sở dữ liệu SQL Server. Bạn có thể tra cứu và quản lý bất kỳ lúc nào!',
                style: TextStyle(fontSize: 12, color: Color(0xFF64748B), height: 1.4),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const MyBookingsScreen()),
                );
              },
              child: const Text('Xem Lịch Của Tôi'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFB48312),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () {
                Navigator.of(ctx).pop();
                Navigator.of(context).pop();
              },
              child: const Text('Hoàn Tất'),
            ),
          ],
        ),
      );
    } else {
      _showToast(result['message'] ?? 'Đặt lịch thất bại, vui lòng thử lại');
    }
  }

  void _showToast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: const Color(0xFF0F172A)),
    );
  }

  static final Branch _defaultBranch = Branch(
    id: 'CN01',
    name: 'Omni Salon Barber Q1 - Bến Thành',
    address: '120 Lê Lợi, Bến Thành, Quận 1, TP.HCM',
    phone: '0901 111 001',
    hours: '08:30 - 21:30',
    city: 'TP. Hồ Chí Minh',
    image: 'ChiNhanh_Omni/CN1.jpg',
  );

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFFF1F3F6),
        body: Center(child: CircularProgressIndicator(color: Color(0xFFB48312))),
      );
    }

    final filteredServices = services.where((s) {
      if (serviceCategoryFilter == 'all') return true;
      if (serviceCategoryFilter == 'Combo VIP') return s.isCombo;
      return s.category == serviceCategoryFilter;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F3F6),
      appBar: AppBar(
        title: const Text(
          'Đặt Lịch Chăm Sóc Tóc',
          style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 18),
        ),
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
            // BƯỚC 1: CHỌN CHI NHÁNH
            // ==========================================
            _buildStepShell(
              stepNumber: '1',
              title: 'CHỌN CHI NHÁNH SALON',
              subtitle: selectedBranch != null ? selectedBranch!.name : 'Chọn 1 trong 20 chi nhánh của Omni Salon',
              isCompleted: selectedBranch != null,
              child: Column(
                children: [
                  SizedBox(
                    height: 120,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: branches.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 10),
                      itemBuilder: (context, idx) {
                        final b = branches[idx];
                        final isSel = selectedBranch?.id == b.id;
                        return InkWell(
                          onTap: () => _onBranchSelected(b),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            width: 220,
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: isSel ? const Color(0xFFFEF3C7) : Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isSel ? const Color(0xFFB48312) : const Color(0xFFE2E8F0),
                                width: isSel ? 2 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                OmniImage(
                                  imageUrl: b.image,
                                  width: 60,
                                  height: double.infinity,
                                  fit: BoxFit.cover,
                                  borderRadius: BorderRadius.circular(8),
                                  fallbackIcon: Icons.storefront,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        b.name,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12.5, color: Color(0xFF0F172A)),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        b.hours,
                                        style: const TextStyle(fontSize: 10.5, color: Color(0xFFB48312), fontWeight: FontWeight.w700),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // ==========================================
            // BƯỚC 2: CHỌN DỊCH VỤ HOẶC COMBO QUÝ TỘC
            // ==========================================
            _buildStepShell(
              stepNumber: '2',
              title: 'CHỌN DỊCH VỤ HOẶC COMBO',
              subtitle: selectedService != null ? '${selectedService!.name} (${currencyFormat.format(selectedService!.price)})' : 'Chọn gói dịch vụ quý khách mong muốn',
              isCompleted: selectedService != null,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Filter Chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildCatFilterChip('all', 'Tất Cả'),
                        _buildCatFilterChip('Combo VIP', 'Combo Quý Tộc'),
                        _buildCatFilterChip('Cắt & Tạo Kiểu', 'Cắt & Tạo Kiểu'),
                        _buildCatFilterChip('Uốn & Nhuộm', 'Uốn & Nhuộm'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...filteredServices.map((s) {
                    final isSel = selectedService?.id == s.id;
                    return InkWell(
                      onTap: () => setState(() => selectedService = s),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isSel ? const Color(0xFFFEF3C7) : Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSel ? const Color(0xFFB48312) : const Color(0xFFE2E8F0),
                            width: isSel ? 2 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            OmniImage(
                              imageUrl: s.image,
                              width: 65,
                              height: 65,
                              fit: BoxFit.cover,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    s.name,
                                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Color(0xFF0F172A)),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Text(
                                        currencyFormat.format(s.price),
                                        style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFBE4D25), fontSize: 13.5),
                                      ),
                                      const Spacer(),
                                      Text('Thời lượng: ${s.duration} phút', style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            if (isSel)
                              const Padding(
                                padding: EdgeInsets.only(left: 8),
                                child: Icon(Icons.check_circle, color: Color(0xFFB48312), size: 22),
                              ),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // ==========================================
            // BƯỚC 3: CHỌN THỢ TẠO MẪU (STYLIST)
            // ==========================================
            _buildStepShell(
              stepNumber: '3',
              title: 'CHỌN NGHỆ NHÂN TẠO MẪU TÓC',
              subtitle: selectedStylist != null ? selectedStylist!.name : 'Chọn thợ kéo vàng phục vụ bạn',
              isCompleted: selectedStylist != null,
              child: Column(
                children: stylists.map((st) {
                  final isSel = selectedStylist?.id == st.id;
                  return InkWell(
                    onTap: () {
                      setState(() => selectedStylist = st);
                      _refreshTimeSlots();
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isSel ? const Color(0xFFFEF3C7) : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSel ? const Color(0xFFB48312) : const Color(0xFFE2E8F0),
                          width: isSel ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          OmniImage(
                            imageUrl: st.avatar,
                            width: 50,
                            height: 50,
                            borderRadius: BorderRadius.circular(25),
                            fallbackIcon: Icons.person,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(st.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5, color: Color(0xFF0F172A))),
                                const SizedBox(height: 2),
                                Text(st.level, style: const TextStyle(fontSize: 11.5, color: Color(0xFFB48312), fontWeight: FontWeight.w700)),
                                const Text('Đánh giá: 5.0 (500+ lượt cắt)', style: TextStyle(fontSize: 10.5, color: Color(0xFFD97706), fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ),
                          if (isSel)
                            const Icon(Icons.check_circle, color: Color(0xFFB48312), size: 22),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 16),

            // ==========================================
            // BƯỚC 4: CHỌN NGÀY & KHUNG GIỜ HẸN
            // ==========================================
            _buildStepShell(
              stepNumber: '4',
              title: 'CHỌN NGÀY & KHUNG GIỜ HẸN',
              subtitle: selectedTimeSlot != null ? '$selectedTimeSlot ngày ${DateFormat('dd/MM/yyyy').format(selectedDate)}' : 'Kiểm tra slot trống thời gian thực',
              isCompleted: selectedTimeSlot != null,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Chọn ngày
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.calendar_month, color: Color(0xFFB48312), size: 20),
                            const SizedBox(width: 8),
                            Text(
                              'Ngày: ${_formatSelectedDate(selectedDate)}',
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5, color: Color(0xFF0F172A)),
                            ),
                          ],
                        ),
                        TextButton(
                          onPressed: () async {
                            final picked = await showDatePicker(
                              context: context,
                              initialDate: selectedDate,
                              firstDate: DateTime.now(),
                              lastDate: DateTime.now().add(const Duration(days: 30)),
                            );
                            if (picked != null) {
                              setState(() => selectedDate = picked);
                              _refreshTimeSlots();
                            }
                          },
                          child: const Text('Đổi Ngày', style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFFB48312))),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  const Text('Chọn khung giờ còn trống:', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
                  const SizedBox(height: 8),
                  if (isLoadingSlots)
                    const Center(child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(color: Color(0xFFB48312))))
                  else
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: timeSlots.map((slot) {
                        final time = slot['time'] as String;
                        final isAvailable = slot['available'] == true;
                        final isSelected = selectedTimeSlot == time;

                        return ChoiceChip(
                          label: Text(
                            time,
                            style: TextStyle(
                              color: !isAvailable
                                  ? const Color(0xFF94A3B8)
                                  : (isSelected ? Colors.white : const Color(0xFF0F172A)),
                              fontWeight: FontWeight.w800,
                              fontSize: 12.5,
                            ),
                          ),
                          selected: isSelected,
                          selectedColor: const Color(0xFFB48312),
                          backgroundColor: isAvailable ? Colors.white : const Color(0xFFF1F5F9),
                          side: BorderSide(
                            color: !isAvailable
                                ? const Color(0xFFE2E8F0)
                                : (isSelected ? const Color(0xFFB48312) : const Color(0xFFCBD5E1)),
                          ),
                          onSelected: isAvailable ? (_) => setState(() => selectedTimeSlot = time) : null,
                        );
                      }).toList(),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // ==========================================
            // BƯỚC 5: THÔNG TIN KHÁCH HÀNG & XÁC NHẬN
            // ==========================================
            _buildStepShell(
              stepNumber: '5',
              title: 'THÔNG TIN KHÁCH HÀNG & XÁC NHẬN',
              subtitle: 'Điền thông tin để hoàn tất vé hẹn',
              isCompleted: false,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: nameController,
                    decoration: const InputDecoration(
                      labelText: 'Họ và tên khách hàng *',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Số điện thoại liên hệ *',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: notesController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Ghi chú đặc biệt (tùy chọn)',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // TỔNG KẾT
                  if (selectedService != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Tổng chi phí dịch vụ:', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                              Text(
                                currencyFormat.format(selectedService!.price),
                                style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFBE4D25), fontSize: 17),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          const Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Thanh toán:', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                              Text('Thanh toán tại quầy Salon sau khi cắt', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF059669))),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFB48312),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: isSubmitting ? null : _submitBooking,
                    child: Center(
                      child: isSubmitting
                          ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text(
                              'XÁC NHẬN ĐẶT LỊCH',
                              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                            ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildCatFilterChip(String id, String label) {
    final isSel = serviceCategoryFilter == id;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: ChoiceChip(
        label: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: isSel ? Colors.white : const Color(0xFF334155))),
        selected: isSel,
        selectedColor: const Color(0xFFB48312),
        backgroundColor: const Color(0xFFF1F5F9),
        onSelected: (_) => setState(() => serviceCategoryFilter = id),
      ),
    );
  }

  Widget _buildStepShell({
    required String stepNumber,
    required String title,
    required String subtitle,
    required bool isCompleted,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [BoxShadow(color: Color(0x06000000), blurRadius: 6, offset: Offset(0, 2))],
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
                  color: isCompleted ? const Color(0xFFB48312) : const Color(0xFF0F172A),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    stepNumber,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF0F172A))),
                    Text(subtitle, style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B)), maxLines: 1, overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
            ],
          ),
          const Divider(height: 22),
          child,
        ],
      ),
    );
  }
}
