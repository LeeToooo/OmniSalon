import 'package:omni_salon_mobile/core/auth/auth_service.dart';
import 'package:omni_salon_mobile/core/api/api_service.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';
import 'package:omni_salon_mobile/models/service.dart';
import 'package:omni_salon_mobile/models/branch.dart';
import 'package:omni_salon_mobile/models/stylist.dart';
import 'package:omni_salon_mobile/models/booking.dart';
import 'package:omni_salon_mobile/components/editorial_image.dart';
import 'package:omni_salon_mobile/pages/user/my_bookings_page.dart';
import 'package:omni_salon_mobile/pages/auth/login_page.dart';

class BookingScreen extends StatefulWidget {
  final Branch? initialBranch;
  final String? preselectedBranchId;
  final String? preselectedServiceId;

  const BookingScreen({
    super.key,
    this.initialBranch,
    this.preselectedBranchId,
    this.preselectedServiceId,
  });

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫', decimalDigits: 0);

  int _currentStep = 0;
  bool _isLoading = true;
  bool _isSubmitting = false;

  List<Branch> _branches = [];
  List<SalonService> _services = [];
  List<Stylist> _stylists = [];

  Branch? _selectedBranch;
  final Set<String> _selectedServiceIds = {};
  Stylist? _selectedStylist;
  DateTime _selectedDate = DateTime.now();
  String _selectedTimeSlot = '08:30';

  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _notesController = TextEditingController();

  final _serviceSearchController = TextEditingController();
  String _serviceQuery = '';
  final _stylistSearchController = TextEditingController();
  String _stylistQuery = '';

  String? _lastUserId;
  String _selectedPaymentMethod = 'VietQR';

  List<Map<String, dynamic>> _slotAvailability = [];
  bool _isLoadingSlots = false;

  final List<String> _timeSlots = [
    '08:30', '09:30', '10:30', '11:30',
    '13:30', '14:30', '15:30', '16:30',
    '17:30', '18:30', '19:30', '20:30'
  ];

  @override
  void initState() {
    super.initState();
    _lastUserId = AuthService.currentUser?.id;
    AuthService.userNotifier.addListener(_onAuthUserChanged);
    _initCustomerInfo();
    _loadData();
  }

  void _onAuthUserChanged() {
    final user = AuthService.userNotifier.value;
    final currentId = user?.id;
    if (_lastUserId != currentId) {
      _lastUserId = currentId;
      _initCustomerInfo();
      if (mounted) setState(() {});
    }
  }

  void _initCustomerInfo() {
    final user = AuthService.currentUser;
    if (user != null) {
      _nameController.text = user.fullName;
      _phoneController.text = user.phone;
    } else {
      _nameController.clear();
      _phoneController.clear();
    }
  }

  @override
  void dispose() {
    AuthService.userNotifier.removeListener(_onAuthUserChanged);
    _nameController.dispose();
    _phoneController.dispose();
    _notesController.dispose();
    _serviceSearchController.dispose();
    _stylistSearchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final branches = await ApiService.fetchBranches();
    final services = await ApiService.fetchServices();
    final stylists = await ApiService.fetchStylists();

    if (!mounted) return;
    setState(() {
      _branches = branches;
      _services = services;
      _stylists = stylists;

      if (widget.initialBranch != null) {
        _selectedBranch = widget.initialBranch;
      } else if (widget.preselectedBranchId != null) {
        _selectedBranch = branches.firstWhere(
          (b) => b.id == widget.preselectedBranchId,
          orElse: () => branches.isNotEmpty ? branches.first : null as dynamic,
        );
      } else if (branches.isNotEmpty) {
        _selectedBranch = branches.first;
      }

      if (widget.preselectedServiceId != null && widget.preselectedServiceId!.isNotEmpty) {
        _selectedServiceIds.add(widget.preselectedServiceId!);
      } else if (services.isNotEmpty) {
        _selectedServiceIds.add(services.first.id);
      }

      _isLoading = false;
    });

    _loadAvailableSlots();
  }

  Future<void> _loadAvailableSlots() async {
    setState(() => _isLoadingSlots = true);
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    final stylistId = _selectedStylist?.id ?? '';
    final slots = await ApiService.fetchAvailableSlots(dateStr, stylistId);
    if (!mounted) return;
    setState(() {
      _slotAvailability = slots;
      _isLoadingSlots = false;
      // Nếu ca giờ đang chọn bị kín lịch thì tự động đổi sang ca giờ trống đầu tiên
      final current = _slotAvailability.firstWhere(
        (s) => s['time'] == _selectedTimeSlot,
        orElse: () => <String, dynamic>{'available': true, 'isBooked': false},
      );
      if (current['available'] == false || current['isBooked'] == true) {
        final firstAvail = _slotAvailability.firstWhere(
          (s) => s['available'] == true && s['isBooked'] != true,
          orElse: () => <String, dynamic>{},
        );
        if (firstAvail.isNotEmpty && firstAvail['time'] != null) {
          _selectedTimeSlot = firstAvail['time'] as String;
        }
      }
    });
  }

  int get _totalPrice {
    int total = 0;
    for (final id in _selectedServiceIds) {
      final s = _services.firstWhere((item) => item.id == id, orElse: () => _services.first);
      total += s.price;
    }
    return total;
  }

  int get _totalDuration {
    int dur = 0;
    for (final id in _selectedServiceIds) {
      final s = _services.firstWhere((item) => item.id == id, orElse: () => _services.first);
      dur += s.duration;
    }
    return dur > 0 ? dur : 45;
  }

  Future<void> _submitBooking() async {
    // BẮT BUỘC ĐĂNG NHẬP MỚI CHO ĐẶT LỊCH (Requirement 3)
    if (AuthService.currentUser == null) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Vui lòng đăng nhập tài khoản để đặt lịch hẹn và tích điểm hội viên!',
            style: AppTheme.bodyMedium(color: AppTheme.textLight),
          ),
          backgroundColor: AppTheme.charcoal,
          behavior: SnackBarBehavior.floating,
        ),
      );
      await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
      if (mounted) {
        _initCustomerInfo();
        setState(() {});
      }
      if (AuthService.currentUser == null) {
        return; // Chưa đăng nhập thì chặn không cho tạo lịch hẹn
      }
    }
    if (!mounted) return;

    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Vui lòng nhập họ và tên của quý khách', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
          backgroundColor: AppTheme.statusDanger,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    if (_phoneController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Vui lòng nhập số điện thoại để nhận thông báo lịch hẹn', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
          backgroundColor: AppTheme.statusDanger,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    if (_selectedServiceIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Vui lòng chọn ít nhất 1 dịch vụ chăm sóc tóc', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
          backgroundColor: AppTheme.statusDanger,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    // Kiểm tra tính khả dụng của ca giờ trước khi ghi nhận
    final selectedSlotInfo = _slotAvailability.firstWhere(
      (s) => s['time'] == _selectedTimeSlot,
      orElse: () => <String, dynamic>{'available': true, 'isBooked': false},
    );
    if (selectedSlotInfo['isBooked'] == true || selectedSlotInfo['available'] == false) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Khung giờ $_selectedTimeSlot thợ đã kín lịch! Vui lòng chọn ca khác.', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
          backgroundColor: AppTheme.statusDanger,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final bookingCode = ApiService.generateNextBookingCode();
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);

    final selectedServicesList = _services
        .where((s) => _selectedServiceIds.contains(s.id))
        .map((s) => {'id': s.id, 'name': s.name, 'price': s.price, 'duration': s.duration})
        .toList();

    final firstService = _services.firstWhere(
      (s) => _selectedServiceIds.contains(s.id),
      orElse: () => _services.first,
    );

    final booking = Booking(
      id: bookingCode,
      bookingCode: bookingCode,
      userId: AuthService.currentUser?.id,
      customerName: _nameController.text.trim(),
      customerPhone: _phoneController.text.trim(),
      branchId: _selectedBranch?.id ?? 'CN01',
      branchName: _selectedBranch?.name ?? 'Omni Salon Flagship',
      serviceId: firstService.id,
      serviceName: selectedServicesList.map((e) => e['name']).join(' + '),
      serviceIds: _selectedServiceIds.toList(),
      servicesList: selectedServicesList,
      stylistId: _selectedStylist?.id ?? 'NV02',
      stylistName: _selectedStylist?.name ?? 'Master Barber (Ngẫu nhiên)',
      date: dateStr,
      timeSlot: _selectedTimeSlot,
      durationMinutes: _totalDuration,
      totalPrice: _totalPrice,
      status: 'Confirmed',
      notes: _notesController.text.trim(),
      createdAt: DateTime.now().toIso8601String(),
      paymentMethod: _selectedPaymentMethod,
    );

    final res = await ApiService.createBooking(booking);

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (res['success'] == true) {
      // Làm mới trạng thái ca giờ ngay sau khi đặt
      _loadAvailableSlots();

      // Lấy mã chuẩn CSDL từ backend trả về nếu có (LH...)
      String finalCode = bookingCode;
      if (res['booking'] is Map) {
        final bMap = res['booking'] as Map;
        final innerBooking = bMap['booking'] is Map ? bMap['booking'] : bMap;
        final sCode = innerBooking['bookingCode'] ?? innerBooking['id'] ?? innerBooking['MaLichHen'];
        if (sCode != null && sCode.toString().isNotEmpty) {
          finalCode = sCode.toString();
        }
      }

      final confirmedBooking = Booking(
        id: finalCode,
        bookingCode: finalCode,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        branchId: booking.branchId,
        branchName: booking.branchName,
        serviceId: booking.serviceId,
        serviceName: booking.serviceName,
        serviceIds: booking.serviceIds,
        servicesList: booking.servicesList,
        stylistId: booking.stylistId,
        stylistName: booking.stylistName,
        date: booking.date,
        timeSlot: booking.timeSlot,
        durationMinutes: booking.durationMinutes,
        totalPrice: booking.totalPrice,
        status: booking.status,
        notes: booking.notes,
        createdAt: booking.createdAt,
      );

      _showSuccessDialog(confirmedBooking);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Đặt lịch thất bại. Vui lòng thử lại.', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
          backgroundColor: AppTheme.statusDanger,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _showSuccessDialog(Booking booking) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppTheme.statusSuccess.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded, color: AppTheme.statusSuccess, size: 36),
            ),
            const SizedBox(height: 16),
            Text(
              'Đặt Lịch Thành Công!',
              style: AppTheme.headingSmall(fontSize: 20),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Mã lịch hẹn của bạn:',
              style: AppTheme.bodySmall(color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: AppTheme.surfaceElevated,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.4)),
              ),
              child: Text(
                booking.bookingCode,
                style: AppTheme.headingSmall(fontSize: 18, color: AppTheme.accentGold),
              ),
            ),
            const SizedBox(height: 14),
            Text(
              'Hẹn gặp quý khách vào lúc ${booking.timeSlot} ngày ${booking.date} tại ${booking.branchName}.',
              style: AppTheme.bodySmall(color: AppTheme.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                setState(() => _currentStep = 0);
              },
              child: const Text('HOÀN TẤT & QUAY LẠI'),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            height: 42,
            child: OutlinedButton.icon(
              icon: const Icon(Icons.search_rounded, size: 18, color: AppTheme.accentGold),
              label: const Text(
                'TRA CỨU / XEM LỊCH HẸN NÀY',
                style: TextStyle(color: AppTheme.accentGold, fontWeight: FontWeight.w700, fontSize: 13),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppTheme.accentGold),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () {
                Navigator.of(ctx).pop();
                setState(() => _currentStep = 0);
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const MyBookingsScreen()),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppTheme.bgPrimary,
        body: Center(
          child: CircularProgressIndicator(color: AppTheme.accentGold, strokeWidth: 2),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      body: SafeArea(
        child: Column(
          children: [
            // Header Stepper Indicator
            _buildStepperHeader(),

            // Nội dung theo từng bước
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: _buildCurrentStepContent(),
              ),
            ),

            // Thanh điều hướng tiến/lùi bước phía dưới
            _buildBottomNavControl(),
          ],
        ),
      ),
    );
  }

  Widget _buildStepperHeader() {
    final stepTitles = ['Chi Nhánh', 'Dịch Vụ', 'Thợ Barber', 'Thời Gian', 'Xác Nhận'];
    final canPop = Navigator.of(context).canPop();
    return Container(
      padding: EdgeInsets.fromLTRB(canPop ? 6 : 16, canPop ? 6 : 12, 16, 12),
      decoration: const BoxDecoration(
        color: AppTheme.surfaceCard,
        border: Border(bottom: BorderSide(color: AppTheme.borderColor)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (canPop) ...[
                IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: AppTheme.accentGold),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                  tooltip: 'Trở về',
                  onPressed: () => Navigator.of(context).pop(),
                ),
                const SizedBox(width: 4),
              ],
              Expanded(
                child: Text(
                  'BƯỚC ${_currentStep + 1} / 5: ${stepTitles[_currentStep].toUpperCase()}',
                  style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold),
                ),
              ),
              Text(
                'Tổng: ${currencyFormat.format(_totalPrice)}',
                style: AppTheme.bodySmall(fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: List.generate(5, (index) {
              final isDone = index < _currentStep;
              final isCurrent = index == _currentStep;
              return Expanded(
                child: Container(
                  height: 3.5,
                  margin: EdgeInsets.only(right: index < 4 ? 6 : 0),
                  decoration: BoxDecoration(
                    color: isDone || isCurrent
                        ? AppTheme.accentGold
                        : AppTheme.borderColorSubtle,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildStepBranches();
      case 1:
        return _buildStepServices();
      case 2:
        return _buildStepStylists();
      case 3:
        return _buildStepDateTime();
      case 4:
        return _buildStepConfirm();
      default:
        return const SizedBox.shrink();
    }
  }

  // BƯỚC 1: CHỌN CHI NHÁNH
  Widget _buildStepBranches() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('1. Chọn Chi Nhánh Trải Nghiệm', style: AppTheme.headingSmall(fontSize: 20)),
        const SizedBox(height: 4),
        Text('Vui lòng chọn địa điểm salon thuận tiện nhất cho lịch trình của bạn.', style: AppTheme.bodySmall(color: AppTheme.textSecondary)),
        const SizedBox(height: 16),
        ..._branches.map((b) {
          final isSelected = _selectedBranch?.id == b.id;
          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedBranch = b;
                if (_selectedStylist != null && _selectedStylist!.branchId != b.id) {
                  _selectedStylist = null;
                }
              });
              _loadAvailableSlots();
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: AppTheme.surfaceCard,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isSelected ? AppTheme.accentGold : AppTheme.borderColor,
                  width: isSelected ? 1.5 : 1,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: SizedBox(
                        width: 76,
                        height: 76,
                        child: EditorialImage(imageUrl: b.image, fit: BoxFit.cover),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(b.name, style: AppTheme.headingSmall(fontSize: 16)),
                          const SizedBox(height: 4),
                          Text(b.address, style: AppTheme.bodySmall(color: AppTheme.textSecondary), maxLines: 2),
                          const SizedBox(height: 4),
                          Text('Giờ mở cửa: ${b.hours}', style: AppTheme.bodySmall(fontSize: 11, color: AppTheme.textMuted)),
                        ],
                      ),
                    ),
                    Icon(
                      isSelected ? Icons.check_circle_rounded : Icons.radio_button_off_rounded,
                      color: isSelected ? AppTheme.accentGold : AppTheme.textMuted,
                      size: 22,
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  // BƯỚC 2: CHỌN DỊCH VỤ & COMBO
  Widget _buildStepServices() {
    final query = _serviceQuery.trim().toLowerCase();
    final filtered = _services.where((s) {
      if (query.isEmpty) return true;
      return s.name.toLowerCase().contains(query) ||
          s.description.toLowerCase().contains(query) ||
          s.category.toLowerCase().contains(query);
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('2. Chọn Gói Dịch Vụ', style: AppTheme.headingSmall(fontSize: 20)),
        const SizedBox(height: 4),
        Text('Bạn có thể chọn một hoặc nhiều dịch vụ kết hợp cùng lúc.', style: AppTheme.bodySmall(color: AppTheme.textSecondary)),
        const SizedBox(height: 14),

        // Thanh tìm kiếm dịch vụ
        Container(
          height: 42,
          margin: const EdgeInsets.only(bottom: 14),
          decoration: BoxDecoration(
            color: AppTheme.surfaceCard,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppTheme.borderColor),
          ),
          child: TextField(
            controller: _serviceSearchController,
            onChanged: (val) => setState(() => _serviceQuery = val),
            style: AppTheme.bodyMedium(),
            decoration: InputDecoration(
              hintText: 'Tìm kiếm gói dịch vụ, cắt tóc, uốn, combo...',
              hintStyle: AppTheme.bodySmall(color: AppTheme.textMuted),
              prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppTheme.accentGold),
              suffixIcon: _serviceQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear_rounded, size: 18, color: AppTheme.textSecondary),
                      onPressed: () {
                        _serviceSearchController.clear();
                        setState(() => _serviceQuery = '');
                      },
                    )
                  : null,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
          ),
        ),

        if (filtered.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Center(
              child: Text('Không tìm thấy dịch vụ phù hợp', style: AppTheme.bodyMedium(color: AppTheme.textSecondary)),
            ),
          )
        else
          ...filtered.map((s) {
            final isSelected = _selectedServiceIds.contains(s.id);
            return GestureDetector(
              onTap: () {
                setState(() {
                  if (isSelected) {
                    _selectedServiceIds.remove(s.id);
                  } else {
                    _selectedServiceIds.add(s.id);
                  }
                });
              },
              child: Container(
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.surfaceElevated : AppTheme.surfaceCard,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isSelected ? AppTheme.accentGold : AppTheme.borderColor,
                    width: isSelected ? 1.5 : 1,
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Icon(
                        isSelected ? Icons.check_box_rounded : Icons.check_box_outline_blank_rounded,
                        color: isSelected ? AppTheme.accentGold : AppTheme.textMuted,
                        size: 22,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    s.name,
                                    style: AppTheme.bodyLarge(fontWeight: FontWeight.w700),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (s.isCombo) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                    decoration: BoxDecoration(
                                      color: AppTheme.accentGold.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(3),
                                    ),
                                    child: Text('VIP', style: AppTheme.labelUppercase(fontSize: 8.5, color: AppTheme.accentGold)),
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${s.duration} phút • ${s.description}',
                              style: AppTheme.bodySmall(color: AppTheme.textSecondary),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        currencyFormat.format(s.price),
                        style: AppTheme.headingSmall(fontSize: 15, color: AppTheme.accentGold),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
      ],
    );
  }

  // BƯỚC 3: CHỌN THỢ TẠO MẪU
  Widget _buildStepStylists() {
    final query = _stylistQuery.trim().toLowerCase();
    final selectedBranchId = _selectedBranch?.id ?? '';

    // Lọc chỉ lấy danh sách nhân viên thuộc chi nhánh đã chọn ở Bước 1
    final branchStylists = selectedBranchId.isNotEmpty
        ? _stylists.where((st) => st.branchId.toUpperCase() == selectedBranchId.toUpperCase()).toList()
        : _stylists;
    final listToDisplay = branchStylists.isNotEmpty ? branchStylists : _stylists;

    final filtered = listToDisplay.where((st) {
      if (query.isEmpty) return true;
      return st.name.toLowerCase().contains(query) ||
          st.level.toLowerCase().contains(query);
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('3. Chọn Master Barber', style: AppTheme.headingSmall(fontSize: 20)),
        const SizedBox(height: 4),
        Text(
          _selectedBranch != null
              ? 'Đội ngũ chuyên gia tạo mẫu tại ${_selectedBranch!.name}'
              : 'Chọn thợ barber quen thuộc hoặc để Omni Salon chỉ định thợ tay nghề phù hợp.',
          style: AppTheme.bodySmall(color: AppTheme.textSecondary),
        ),
        const SizedBox(height: 14),

        // Thanh tìm kiếm thợ
        Container(
          height: 42,
          margin: const EdgeInsets.only(bottom: 14),
          decoration: BoxDecoration(
            color: AppTheme.surfaceCard,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppTheme.borderColor),
          ),
          child: TextField(
            controller: _stylistSearchController,
            onChanged: (val) => setState(() => _stylistQuery = val),
            style: AppTheme.bodyMedium(),
            decoration: InputDecoration(
              hintText: 'Tìm kiếm thợ theo tên, cấp bậc...',
              hintStyle: AppTheme.bodySmall(color: AppTheme.textMuted),
              prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppTheme.accentGold),
              suffixIcon: _stylistQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear_rounded, size: 18, color: AppTheme.textSecondary),
                      onPressed: () {
                        _stylistSearchController.clear();
                        setState(() => _stylistQuery = '');
                      },
                    )
                  : null,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
          ),
        ),

        // Tùy chọn bất kỳ (chỉ hiển thị khi không tìm kiếm hoặc tìm kiếm rỗng)
        if (query.isEmpty)
          GestureDetector(
            onTap: () {
              setState(() => _selectedStylist = null);
              _loadAvailableSlots();
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: _selectedStylist == null ? AppTheme.surfaceElevated : AppTheme.surfaceCard,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: _selectedStylist == null ? AppTheme.accentGold : AppTheme.borderColor,
                  width: _selectedStylist == null ? 1.5 : 1,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: AppTheme.accentGold.withValues(alpha: 0.15),
                      child: const Icon(Icons.auto_awesome_rounded, color: AppTheme.accentGold, size: 24),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Omni Tự Động Điều Phối', style: AppTheme.bodyLarge(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 2),
                          Text('Chỉ định Master Barber sẵn sàng phục vụ tốt nhất', style: AppTheme.bodySmall(color: AppTheme.textSecondary)),
                        ],
                      ),
                    ),
                    Icon(
                      _selectedStylist == null ? Icons.check_circle_rounded : Icons.radio_button_off_rounded,
                      color: _selectedStylist == null ? AppTheme.accentGold : AppTheme.textMuted,
                    ),
                  ],
                ),
              ),
            ),
          ),

        if (filtered.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Center(
              child: Text('Không tìm thấy thợ phù hợp', style: AppTheme.bodyMedium(color: AppTheme.textSecondary)),
            ),
          )
        else
          ...filtered.map((st) {
            final isSelected = _selectedStylist?.id == st.id;
            return GestureDetector(
              onTap: () {
                setState(() => _selectedStylist = st);
                _loadAvailableSlots();
              },
              child: Container(
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.surfaceElevated : AppTheme.surfaceCard,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isSelected ? AppTheme.accentGold : AppTheme.borderColor,
                    width: isSelected ? 1.5 : 1,
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: SizedBox(
                          width: 54,
                          height: 54,
                          child: EditorialImage(imageUrl: st.avatar, fit: BoxFit.cover),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(st.name, style: AppTheme.bodyLarge(fontWeight: FontWeight.w700)),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Text(st.level, style: AppTheme.bodySmall(color: AppTheme.accentGold, fontWeight: FontWeight.w600)),
                                const SizedBox(width: 8),
                                const Icon(Icons.star_rounded, size: 14, color: AppTheme.accentGold),
                                Text(st.rating.toStringAsFixed(1), style: AppTheme.bodySmall(fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Icon(
                        isSelected ? Icons.check_circle_rounded : Icons.radio_button_off_rounded,
                        color: isSelected ? AppTheme.accentGold : AppTheme.textMuted,
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
      ],
    );
  }

  // BƯỚC 4: CHỌN NGÀY & KHUNG GIỜ
  Widget _buildStepDateTime() {
    final now = DateTime.now();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('4. Chọn Ngày & Khung Giờ', style: AppTheme.headingSmall(fontSize: 20)),
        const SizedBox(height: 4),
        Text('Thời lượng dự kiến: $_totalDuration phút cho các dịch vụ đã chọn.', style: AppTheme.bodySmall(color: AppTheme.textSecondary)),
        const SizedBox(height: 16),

        // Lịch 7 ngày tiếp theo dạng dải ngang
        Text('CHỌN NGÀY PHỤC VỤ', style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold)),
        const SizedBox(height: 8),
        SizedBox(
          height: 72,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: 7,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final date = now.add(Duration(days: i));
              final isSelected = date.day == _selectedDate.day &&
                  date.month == _selectedDate.month &&
                  date.year == _selectedDate.year;
              final dayName = i == 0 ? 'Hôm nay' : (i == 1 ? 'Ngày mai' : 'T${date.weekday + 1}');

              return GestureDetector(
                onTap: () {
                  setState(() => _selectedDate = date);
                  _loadAvailableSlots();
                },
                child: Container(
                  width: 68,
                  decoration: BoxDecoration(
                    color: isSelected ? AppTheme.charcoal : AppTheme.surfaceCard,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isSelected ? AppTheme.accentGold : AppTheme.borderColor,
                      width: isSelected ? 1.5 : 1,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        dayName,
                        style: AppTheme.bodySmall(
                          fontSize: 11,
                          color: isSelected ? AppTheme.accentGold : AppTheme.textSecondary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${date.day}/${date.month}',
                        style: AppTheme.headingSmall(
                          fontSize: 15,
                          color: isSelected ? AppTheme.textLight : AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 24),

        // Khung giờ hẹn
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('CHỌN KHUNG GIỜ CÒN TRỐNG', style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold)),
            if (_selectedStylist != null)
              Text(
                'Thợ: ${_selectedStylist!.name.split(" ").last}',
                style: AppTheme.bodySmall(fontSize: 11, color: AppTheme.textMuted),
              ),
          ],
        ),
        const SizedBox(height: 10),
        _isLoadingSlots
            ? const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(
                  child: SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(color: AppTheme.accentGold, strokeWidth: 2),
                  ),
                ),
              )
            : Wrap(
                spacing: 10,
                runSpacing: 10,
                children: _timeSlots.map((time) {
                  final slotInfo = _slotAvailability.firstWhere(
                    (s) => s['time'] == time,
                    orElse: () => <String, dynamic>{'available': true, 'isBooked': false, 'isPast': false},
                  );
                  final isBooked = slotInfo['isBooked'] == true;
                  final isPast = slotInfo['isPast'] == true;
                  final isAvailable = slotInfo['available'] == true && !isBooked && !isPast;
                  final isSelected = _selectedTimeSlot == time && isAvailable;

                  return GestureDetector(
                    onTap: isAvailable
                        ? () => setState(() => _selectedTimeSlot = time)
                        : () {
                            final reason = isBooked
                                ? 'Khung giờ $time thợ ${_selectedStylist?.name ?? "được chọn"} đã kín lịch! Vui lòng chọn ca khác.'
                                : 'Khung giờ $time đã trôi qua so với thời gian hiện tại!';
                            ScaffoldMessenger.of(context).hideCurrentSnackBar();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(reason, style: AppTheme.bodyMedium(color: AppTheme.textLight)),
                                backgroundColor: AppTheme.statusDanger,
                                duration: const Duration(seconds: 3),
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppTheme.accentGold
                            : (!isAvailable
                                ? AppTheme.surfaceCard.withValues(alpha: 0.35)
                                : AppTheme.surfaceCard),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: isSelected
                              ? AppTheme.accentGold
                              : (!isAvailable
                                  ? AppTheme.borderColorSubtle
                                  : AppTheme.borderColor),
                        ),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            time,
                            style: AppTheme.bodyMedium(
                              color: isSelected
                                  ? AppTheme.charcoal
                                  : (!isAvailable
                                      ? AppTheme.textMuted
                                      : AppTheme.textPrimary),
                              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                            ).copyWith(
                              decoration: !isAvailable ? TextDecoration.lineThrough : null,
                            ),
                          ),
                          if (!isAvailable) ...[
                            const SizedBox(height: 2),
                            Text(
                              isBooked ? 'Kín' : 'Qua',
                              style: const TextStyle(
                                fontSize: 8.5,
                                color: AppTheme.statusDanger,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
      ],
    );
  }

  // BƯỚC 5: XÁC NHẬN THÔNG TIN & ĐẶT LỊCH
  Widget _buildStepConfirm() {
    final dateFormatted = DateFormat('dd/MM/yyyy').format(_selectedDate);

    // Tự động đồng bộ thông tin tài khoản hiện tại vào form đặt lịch
    final currentUser = AuthService.currentUser;
    if (currentUser != null && (_lastUserId != currentUser.id || _nameController.text.isEmpty)) {
      _lastUserId = currentUser.id;
      _initCustomerInfo();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('5. Xác Nhận Thông Tin Lịch Hẹn', style: AppTheme.headingSmall(fontSize: 20)),
        const SizedBox(height: 4),
        Text('Kiểm tra lại thông tin và xác nhận để thợ barber chuẩn bị phục vụ quý khách chu đáo nhất.', style: AppTheme.bodySmall(color: AppTheme.textSecondary)),
        const SizedBox(height: 18),

        // Thẻ tóm tắt thông tin hẹn
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.surfaceCard,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppTheme.borderColor),
          ),
          child: Column(
            children: [
              _buildConfirmRow('Chi nhánh:', _selectedBranch?.name ?? 'Omni Salon'),
              const Divider(color: AppTheme.borderColorSubtle),
              _buildConfirmRow('Thời gian:', '$_selectedTimeSlot • $dateFormatted'),
              const Divider(color: AppTheme.borderColorSubtle),
              _buildConfirmRow('Thợ Barber:', _selectedStylist?.name ?? 'Master Barber (Ngẫu nhiên)'),
              const Divider(color: AppTheme.borderColorSubtle),
              _buildConfirmRow('Dịch vụ:', '${_selectedServiceIds.length} dịch vụ ($_totalDuration phút)'),
              const Divider(color: AppTheme.borderColorSubtle),
              _buildConfirmRow('Thanh toán:', _selectedPaymentMethod == 'VietQR' ? 'Chuyển khoản VietQR' : 'Thanh toán tại quầy'),
              const Divider(color: AppTheme.borderColorSubtle),
              _buildConfirmRow('Tổng thanh toán:', currencyFormat.format(_totalPrice), isHighlight: true),
            ],
          ),
        ),
        // Thông báo yêu cầu đăng nhập nếu chưa đăng nhập
        if (AuthService.currentUser == null) ...[
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.accentGold.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.35)),
            ),
            child: Row(
              children: [
                const Icon(Icons.lock_outline_rounded, color: AppTheme.accentGold, size: 24),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'CẦN ĐĂNG NHẬP TÀI KHOẢN',
                        style: AppTheme.bodyMedium(fontWeight: FontWeight.w800, color: AppTheme.accentGold),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Đăng nhập để xác nhận lịch hẹn, tích điểm hội viên và quản lý lịch cắt.',
                        style: AppTheme.bodySmall(color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () async {
                    await Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                    if (mounted) {
                      _initCustomerInfo();
                      setState(() {});
                    }
                  },
                  child: const Text('ĐĂNG NHẬP', style: TextStyle(fontWeight: FontWeight.w800, color: AppTheme.accentGold)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Nhập thông tin người đặt
        Text('THÔNG TIN LIÊN HỆ', style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold)),
        const SizedBox(height: 8),

        TextFormField(
          controller: _nameController,
          style: AppTheme.bodyMedium(),
          decoration: const InputDecoration(
            labelText: 'Họ và tên quý khách *',
            prefixIcon: Icon(Icons.person_outline_rounded, size: 20, color: AppTheme.textSecondary),
          ),
        ),
        const SizedBox(height: 12),

        TextFormField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          style: AppTheme.bodyMedium(),
          decoration: const InputDecoration(
            labelText: 'Số điện thoại nhận tin xác nhận *',
            prefixIcon: Icon(Icons.phone_outlined, size: 20, color: AppTheme.textSecondary),
          ),
        ),
        const SizedBox(height: 12),

        TextFormField(
          controller: _notesController,
          maxLines: 2,
          style: AppTheme.bodyMedium(),
          decoration: const InputDecoration(
            labelText: 'Yêu cầu đặc biệt (tùy chọn)',
            hintText: 'Ví dụ: Tỉa tóc layer bay bổng, da đầu nhạy cảm...',
            prefixIcon: Icon(Icons.edit_note_rounded, size: 20, color: AppTheme.textSecondary),
          ),
        ),
        const SizedBox(height: 14),

        // PHƯƠNG THỨC THANH TOÁN (Mục 6: Chọn QR hoặc Tại quầy)
        Text('PHƯƠNG THỨC THANH TOÁN', style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold)),
        const SizedBox(height: 8),

        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedPaymentMethod = 'VietQR'),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  decoration: BoxDecoration(
                    color: _selectedPaymentMethod == 'VietQR'
                        ? AppTheme.accentGold.withValues(alpha: 0.12)
                        : AppTheme.surfaceCard,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: _selectedPaymentMethod == 'VietQR'
                          ? AppTheme.accentGold
                          : AppTheme.borderColor,
                      width: _selectedPaymentMethod == 'VietQR' ? 1.5 : 1.0,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.qr_code_2_rounded,
                        color: _selectedPaymentMethod == 'VietQR'
                            ? AppTheme.accentGold
                            : AppTheme.textSecondary,
                        size: 24,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'VietQR',
                              style: AppTheme.bodyMedium(
                                fontWeight: FontWeight.w800,
                                color: _selectedPaymentMethod == 'VietQR'
                                    ? AppTheme.accentGold
                                    : AppTheme.textPrimary,
                              ),
                            ),
                            Text(
                              'Quét mã QR',
                              style: AppTheme.bodySmall(fontSize: 11, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedPaymentMethod = 'Tại quầy'),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  decoration: BoxDecoration(
                    color: _selectedPaymentMethod == 'Tại quầy'
                        ? AppTheme.accentGold.withValues(alpha: 0.12)
                        : AppTheme.surfaceCard,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: _selectedPaymentMethod == 'Tại quầy'
                          ? AppTheme.accentGold
                          : AppTheme.borderColor,
                      width: _selectedPaymentMethod == 'Tại quầy' ? 1.5 : 1.0,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.storefront_rounded,
                        color: _selectedPaymentMethod == 'Tại quầy'
                            ? AppTheme.accentGold
                            : AppTheme.textSecondary,
                        size: 24,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Tại Quầy',
                              style: AppTheme.bodyMedium(
                                fontWeight: FontWeight.w800,
                                color: _selectedPaymentMethod == 'Tại quầy'
                                    ? AppTheme.accentGold
                                    : AppTheme.textPrimary,
                              ),
                            ),
                            Text(
                              'Thanh toán sau',
                              style: AppTheme.bodySmall(fontSize: 11, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildConfirmRow(String label, String value, {bool isHighlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTheme.bodySmall(color: AppTheme.textSecondary)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: isHighlight
                  ? AppTheme.headingSmall(fontSize: 16, color: AppTheme.accentGold)
                  : AppTheme.bodyMedium(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNavControl() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: const BoxDecoration(
        color: AppTheme.surfaceCard,
        border: Border(top: BorderSide(color: AppTheme.borderColor)),
      ),
      child: Row(
        children: [
          if (_currentStep > 0) ...[
            OutlinedButton(
              onPressed: () => setState(() => _currentStep--),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              child: const Text('← Quay lại'),
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: SizedBox(
              height: 48,
              child: ElevatedButton(
                onPressed: _isSubmitting
                    ? null
                    : () async {
                        if (_currentStep < 4) {
                          setState(() => _currentStep++);
                          if (_currentStep == 3) {
                            _loadAvailableSlots();
                          }
                        } else {
                          // BƯỚC 5: Yêu cầu đăng nhập trước khi xác nhận đặt lịch
                          if (AuthService.currentUser == null) {
                            ScaffoldMessenger.of(context).hideCurrentSnackBar();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Vui lòng đăng nhập tài khoản để xác nhận đặt lịch hẹn!', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
                                backgroundColor: AppTheme.charcoal,
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                            await Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const LoginScreen()),
                            );
                            if (mounted) {
                              _initCustomerInfo();
                              setState(() {});
                            }
                            if (AuthService.currentUser == null) return;
                          }
                          _submitBooking();
                        }
                      },
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.charcoal),
                      )
                    : Text(
                        _currentStep < 4 ? 'TIẾP TỤC BƯỚC TIẾP THEO →' : 'XÁC NHẬN ĐẶT LỊCH HẸN',
                        style: AppTheme.bodyMedium(fontWeight: FontWeight.w800, color: AppTheme.charcoal),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

typedef BookingPage = BookingScreen;
