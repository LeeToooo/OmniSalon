import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';
import 'package:omni_salon_mobile/pages/user/my_bookings_page.dart';

class PaymentSuccessPage extends StatelessWidget {
  final String orderId;
  final num amount;
  final String? transactionCode;
  final String? paidAt;

  const PaymentSuccessPage({
    super.key,
    required this.orderId,
    required this.amount,
    this.transactionCode,
    this.paidAt,
  });

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0);
    final isBooking = orderId.toUpperCase().startsWith('LH');
    final formattedTime = paidAt ?? DateFormat('HH:mm:ss dd/MM/yyyy').format(DateTime.now());

    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        backgroundColor: AppTheme.surfaceCard,
        elevation: 0,
        centerTitle: true,
        automaticallyImplyLeading: false,
        title: Text(
          'Kết Quả Thanh Toán',
          style: TextStyle(
            color: AppTheme.textPrimary,
            fontWeight: FontWeight.w800,
            fontSize: 16,
          ),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Spacer(),
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF10B981).withValues(alpha: 0.15),
                  border: Border.all(color: const Color(0xFF10B981), width: 2),
                ),
                child: const Icon(
                  Icons.check_circle_rounded,
                  color: Color(0xFF10B981),
                  size: 56,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Thanh toán thành công!',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Giao dịch chuyển khoản đã được xác nhận tự động qua cổng Open Banking.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: AppTheme.textSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 24),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.borderColor),
                ),
                child: Column(
                  children: [
                    _buildRow(
                      label: isBooking ? 'Mã lịch hẹn' : 'Mã đơn hàng',
                      value: '#$orderId',
                      isBold: true,
                    ),
                    const Divider(height: 20, color: Color(0xFF292524)),
                    _buildRow(
                      label: 'Số tiền thanh toán',
                      value: currencyFormat.format(amount),
                      valueColor: AppTheme.accentGold,
                      isBold: true,
                    ),
                    const Divider(height: 20, color: Color(0xFF292524)),
                    _buildRow(
                      label: 'Phương thức',
                      value: 'VietQR (PayOS)',
                    ),
                    if (transactionCode != null && transactionCode!.isNotEmpty) ...[
                      const Divider(height: 20, color: Color(0xFF292524)),
                      _buildRow(
                        label: 'Mã tham chiếu',
                        value: transactionCode!,
                      ),
                    ],
                    const Divider(height: 20, color: Color(0xFF292524)),
                    _buildRow(
                      label: 'Thời gian xác nhận',
                      value: formattedTime,
                    ),
                  ],
                ),
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accentGold,
                    foregroundColor: AppTheme.charcoal,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(Icons.receipt_long_rounded, size: 20),
                  label: Text(
                    isBooking ? 'Xem danh sách lịch hẹn' : 'Xem đơn hàng của tôi',
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                  ),
                  onPressed: () {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const MyBookingsScreen()),
                      (route) => route.isFirst,
                    );
                  },
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 46,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.textPrimary,
                    side: BorderSide(color: AppTheme.borderColor),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () {
                    Navigator.of(context).popUntil((route) => route.isFirst);
                  },
                  child: const Text('Về trang chủ', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRow({
    required String label,
    required String value,
    Color? valueColor,
    bool isBold = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: AppTheme.textSecondary,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
            color: valueColor ?? AppTheme.textPrimary,
          ),
        ),
      ],
    );
  }
}
