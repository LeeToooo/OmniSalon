import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../models/service.dart';
import '../models/branch.dart';
import '../models/stylist.dart';
import '../models/booking.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../widgets/editorial_image.dart';

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
  String _selectedTimeSlot = '09:00';

  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _notesController = TextEditingController();

  final List<String> _timeSlots = [
    '09:00', '09:45', '10:30', '11:15', '13:30',
    '14:15', '15:00', '16:00', '17:00', '18:15', '19:30', '20:15'
  ];

  @override
  void initState() {
    super.initState();
    _initCustomerInfo();
    _loadData();
  }

  void _initCustomerInfo() {
    final user = AuthService.currentUser;
    if (user != null) {
      _nameController.text = user.fullName;
      _phoneController.text = user.phone;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _notesController.dispose();
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

    setState(() => _isSubmitting = true);

    final bookingCode = 'OS${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
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
      id: 'BK_${DateTime.now().millisecondsSinceEpoch}',
      bookingCode: bookingCode,
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
    );

    final res = await ApiService.createBooking(booking);

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (res['success'] == true) {
      _showSuccessDialog(booking);
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
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: const BoxDecoration(
        color: AppTheme.surfaceCard,
        border: Border(bottom: BorderSide(color: AppTheme.borderColor)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'BƯỚC ${_currentStep + 1} / 5: ${stepTitles[_currentStep].toUpperCase()}',
                style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold),
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
            onTap: () => setState(() => _selectedBranch = b),
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('2. Chọn Gói Dịch Vụ', style: AppTheme.headingSmall(fontSize: 20)),
        const SizedBox(height: 4),
        Text('Bạn có thể chọn một hoặc nhiều dịch vụ kết hợp cùng lúc.', style: AppTheme.bodySmall(color: AppTheme.textSecondary)),
        const SizedBox(height: 16),
        ..._services.map((s) {
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
                              Text(s.name, style: AppTheme.bodyLarge(fontWeight: FontWeight.w700)),
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
                          Text('${s.duration} phút • ${s.description}', style: AppTheme.bodySmall(color: AppTheme.textSecondary), maxLines: 1),
                        ],
                      ),
                    ),
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('3. Chọn Master Barber', style: AppTheme.headingSmall(fontSize: 20)),
        const SizedBox(height: 4),
        Text('Chọn thợ barber quen thuộc hoặc để Omni Salon chỉ định thợ tay nghề phù hợp.', style: AppTheme.bodySmall(color: AppTheme.textSecondary)),
        const SizedBox(height: 16),

        // Tùy chọn bất kỳ
        GestureDetector(
          onTap: () => setState(() => _selectedStylist = null),
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

        ..._stylists.map((st) {
          final isSelected = _selectedStylist?.id == st.id;
          return GestureDetector(
            onTap: () => setState(() => _selectedStylist = st),
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
                onTap: () => setState(() => _selectedDate = date),
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
        Text('CHỌN KHUNG GIỜ CÒN TRỐNG', style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: _timeSlots.map((time) {
            final isSelected = _selectedTimeSlot == time;
            return GestureDetector(
              onTap: () => setState(() => _selectedTimeSlot = time),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.accentGold : AppTheme.surfaceCard,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: isSelected ? AppTheme.accentGold : AppTheme.borderColor,
                  ),
                ),
                child: Text(
                  time,
                  style: AppTheme.bodyMedium(
                    color: isSelected ? AppTheme.charcoal : AppTheme.textPrimary,
                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  ),
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
              _buildConfirmRow('Tổng thanh toán:', currencyFormat.format(_totalPrice), isHighlight: true),
            ],
          ),
        ),
        const SizedBox(height: 20),

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
                    : () {
                        if (_currentStep < 4) {
                          setState(() => _currentStep++);
                        } else {
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
