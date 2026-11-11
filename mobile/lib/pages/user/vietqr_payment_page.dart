import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';
import 'package:omni_salon_mobile/core/api/api_service.dart';
import 'package:omni_salon_mobile/pages/user/payment_success_page.dart';

class VietQrPaymentPage extends StatefulWidget {
  final String orderId;
  final num amount;
  final String? description;

  const VietQrPaymentPage({
    super.key,
    required this.orderId,
    required this.amount,
    this.description,
  });

  @override
  State<VietQrPaymentPage> createState() => _VietQrPaymentPageState();
}

class _VietQrPaymentPageState extends State<VietQrPaymentPage> {
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0);

  Timer? _pollingTimer;
  Timer? _countdownTimer;

  bool _isLoading = true;
  bool _isCheckingManual = false;
  bool _isExpired = false;
  String? _errorMessage;

  String _qrCodeUrl = '';
  String _accountNumber = '0900000000';
  String _accountName = 'OMNISALON ENTERPRISE';
  final String _bankName = 'MBBank (Ngân hàng Quân Đội)';
  String _transferContent = '';
  num _finalAmount = 0;
  int? _payosOrderCode;

  int _remainingSeconds = 900; // 15 phút

  @override
  void initState() {
    super.initState();
    _finalAmount = widget.amount;
    _transferContent = widget.description ?? 'THANHTOAN ${widget.orderId}';
    _initPaymentSession();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _countdownTimer?.cancel();
    super.dispose();
  }

  Future<void> _initPaymentSession() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _isExpired = false;
      _remainingSeconds = 900;
    });

    final res = await ApiService.createPaymentLink(
      orderId: widget.orderId,
      amount: widget.amount.toInt(),
      description: widget.description,
    );

    if (!mounted) return;

    if (res['success'] == true) {
      setState(() {
        _isLoading = false;
        _qrCodeUrl = res['qrCode']?.toString() ?? '';
        _accountNumber = res['accountNumber']?.toString() ?? '0900000000';
        _accountName = res['accountName']?.toString() ?? 'OMNISALON ENTERPRISE';
        _finalAmount = (res['amount'] as num?) ?? widget.amount;
        _transferContent = res['description']?.toString() ?? 'THANHTOAN ${widget.orderId}';
        _payosOrderCode = res['orderCode'] as int?;
      });

      _startCountdownTimer();
      _startStatusPolling();
    } else {
      setState(() {
        _isLoading = false;
        _errorMessage = res['message']?.toString() ?? 'Không thể khởi tạo liên kết thanh toán PayOS.';
      });
    }
  }

  void _startCountdownTimer() {
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_remainingSeconds <= 1) {
        timer.cancel();
        _pollingTimer?.cancel();
        setState(() {
          _remainingSeconds = 0;
          _isExpired = true;
        });
      } else {
        setState(() {
          _remainingSeconds--;
        });
      }
    });
  }

  void _startStatusPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      if (!mounted) {
        timer.cancel();
        return;
      }

      final check = await ApiService.checkPaymentStatus(widget.orderId);
      if (!mounted) return;

      final isPaid = check['status'] == 'PAID' || check['isPaid'] == true;
      if (isPaid) {
        timer.cancel();
        _countdownTimer?.cancel();
        _navigateToSuccess(
          transactionCode: check['transactionCode']?.toString(),
          paidAt: check['paidAt']?.toString(),
        );
      }
    });
  }

  Future<void> _manualCheckPayment() async {
    if (_isCheckingManual || _isExpired) return;

    setState(() => _isCheckingManual = true);

    try {
      final check = await ApiService.checkPaymentStatus(widget.orderId);
      if (!mounted) return;

      final isPaid = check['status'] == 'PAID' || check['isPaid'] == true;
      if (isPaid) {
        _pollingTimer?.cancel();
        _countdownTimer?.cancel();
        _navigateToSuccess(
          transactionCode: check['transactionCode']?.toString(),
          paidAt: check['paidAt']?.toString(),
        );
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Chưa ghi nhận tiền vào tài khoản. Hệ thống vẫn đang tiếp tục kiểm tra...'),
          backgroundColor: Color(0xFF44403C),
          duration: Duration(seconds: 3),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isCheckingManual = false);
      }
    }
  }

  void _navigateToSuccess({String? transactionCode, String? paidAt}) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => PaymentSuccessPage(
          orderId: widget.orderId,
          amount: _finalAmount,
          transactionCode: transactionCode,
          paidAt: paidAt,
        ),
      ),
    );
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đã sao chép $label: $text'),
        backgroundColor: const Color(0xFF10B981),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  String _formatRemainingTime() {
    final minutes = _remainingSeconds ~/ 60;
    final seconds = _remainingSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final isBooking = widget.orderId.toUpperCase().startsWith('LH');

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final nav = Navigator.of(context);
        final shouldLeave = await _showConfirmLeaveDialog();
        if (shouldLeave == true && mounted) {
          nav.pop();
        }
      },
      child: Scaffold(
        backgroundColor: AppTheme.bgPrimary,
        appBar: AppBar(
          backgroundColor: AppTheme.surfaceCard,
          elevation: 0,
          leading: IconButton(
            icon: Icon(Icons.close_rounded, color: AppTheme.textPrimary),
            onPressed: () async {
              final nav = Navigator.of(context);
              final shouldLeave = await _showConfirmLeaveDialog();
              if (shouldLeave == true && mounted) {
                nav.pop();
              }
            },
          ),
          centerTitle: true,
          title: Text(
            isBooking ? 'Thanh toán lịch hẹn' : 'Thanh toán đơn hàng',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppTheme.textPrimary,
            ),
          ),
        ),
        body: SafeArea(
          child: _isLoading
              ? _buildLoadingState()
              : _errorMessage != null
                  ? _buildErrorState()
                  : _buildPaymentContent(),
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 38,
            height: 38,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              color: AppTheme.accentGold,
            ),
          ),
          const SizedBox(height: 18),
          Text(
            'Đang kết nối cổng thanh toán PayOS...',
            style: TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Tạo mã QR thanh toán chuẩn VietQR tự động',
            style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 48),
            const SizedBox(height: 14),
            Text(
              'Không thể tạo phiên thanh toán',
              style: TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage ?? 'Đã có lỗi xảy ra trong quá trình xử lý.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.accentGold,
                foregroundColor: AppTheme.charcoal,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Thử Lại', style: TextStyle(fontWeight: FontWeight.w800)),
              onPressed: _initPaymentSession,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: _isExpired
                  ? const Color(0xFFEF4444).withValues(alpha: 0.15)
                  : AppTheme.surfaceCard,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: _isExpired ? const Color(0xFFEF4444) : AppTheme.borderColor,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _isExpired ? Icons.timer_off_rounded : Icons.timer_outlined,
                  size: 16,
                  color: _isExpired ? const Color(0xFFEF4444) : AppTheme.accentGold,
                ),
                const SizedBox(width: 8),
                Text(
                  _isExpired
                      ? 'Phiên thanh toán đã hết hạn'
                      : 'Hết hạn sau: ${_formatRemainingTime()}',
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w800,
                    color: _isExpired ? const Color(0xFFEF4444) : AppTheme.accentGold,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          if (_isExpired) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFEF4444)),
              ),
              child: Column(
                children: [
                  const Text(
                    'Thời gian thanh toán đã kết thúc. Vui lòng thử lại để tạo phiên giao dịch mới.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Color(0xFFEF4444), fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFEF4444),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: _initPaymentSession,
                    child: const Text('Tạo Phiên Mới', style: TextStyle(fontWeight: FontWeight.w800)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.3),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.network(
                    _qrCodeUrl,
                    width: 220,
                    height: 220,
                    fit: BoxFit.contain,
                    errorBuilder: (ctx, err, stack) {
                      final fallbackUrl =
                          'https://api.vietqr.io/image/970422-0900000000-compact.jpg?amount=${_finalAmount.toInt()}&addInfo=${Uri.encodeComponent(_transferContent)}&accountName=OMNISALON%20ENTERPRISE';
                      return Image.network(fallbackUrl, width: 220, height: 220);
                    },
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Quét bằng ứng dụng Ngân hàng hoặc Ví điện tử',
                  style: TextStyle(
                    fontSize: 11.5,
                    color: Colors.grey.shade700,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.surfaceCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.borderColor),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Thông tin chuyển khoản thủ công',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                _buildCopyableField(
                  label: 'Ngân hàng thụ hưởng',
                  value: _bankName,
                  canCopy: false,
                ),
                const Divider(height: 18, color: Color(0xFF292524)),
                _buildCopyableField(
                  label: 'Số tài khoản nhận',
                  value: _accountNumber,
                  onCopy: () => _copyToClipboard(_accountNumber, 'Số tài khoản'),
                ),
                const Divider(height: 18, color: Color(0xFF292524)),
                _buildCopyableField(
                  label: 'Chủ tài khoản',
                  value: _accountName,
                  canCopy: false,
                ),
                const Divider(height: 18, color: Color(0xFF292524)),
                _buildCopyableField(
                  label: 'Số tiền thanh toán',
                  value: currencyFormat.format(_finalAmount),
                  valueColor: AppTheme.accentGold,
                  onCopy: () => _copyToClipboard(_finalAmount.toInt().toString(), 'Số tiền'),
                ),
                const Divider(height: 18, color: Color(0xFF292524)),
                _buildCopyableField(
                  label: 'Nội dung chuyển khoản (bắt buộc)',
                  value: _transferContent,
                  highlight: true,
                  onCopy: () => _copyToClipboard(_transferContent, 'Nội dung chuyển khoản'),
                ),
                if (_payosOrderCode != null) ...[
                  const Divider(height: 18, color: Color(0xFF292524)),
                  _buildCopyableField(
                    label: 'Mã giao dịch PayOS',
                    value: '#$_payosOrderCode',
                    canCopy: false,
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 14),

          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.surfaceElevated,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.borderColor),
            ),
            child: Row(
              children: [
                const Icon(Icons.bolt_rounded, color: AppTheme.accentGold, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Hệ thống tự động xác nhận ngay khi tài khoản ghi nhận số dư (thường trong 1-5 giây). Vui lòng không tắt ứng dụng.',
                    style: TextStyle(
                      color: AppTheme.textSecondary,
                      fontSize: 11.5,
                      height: 1.35,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.accentGold,
                foregroundColor: AppTheme.charcoal,
                disabledBackgroundColor: AppTheme.accentGold.withValues(alpha: 0.5),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: (_isCheckingManual || _isExpired) ? null : _manualCheckPayment,
              icon: _isCheckingManual
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.charcoal),
                    )
                  : const Icon(Icons.sync_rounded, size: 20),
              label: Text(
                _isCheckingManual ? 'Đang kiểm tra...' : 'Kiểm tra giao dịch',
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildCopyableField({
    required String label,
    required String value,
    Color? valueColor,
    bool highlight = false,
    bool canCopy = true,
    VoidCallback? onCopy,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 11.5,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                value,
                style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w800,
                  color: highlight
                      ? const Color(0xFFF59E0B)
                      : (valueColor ?? AppTheme.textPrimary),
                ),
              ),
            ],
          ),
        ),
        if (canCopy && onCopy != null)
          InkWell(
            onTap: onCopy,
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppTheme.surfaceElevated,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.borderColor),
              ),
              child: const Row(
                children: [
                  Icon(Icons.copy_rounded, size: 14, color: AppTheme.accentGold),
                  SizedBox(width: 4),
                  Text(
                    'Sao chép',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.accentGold,
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Future<bool?> _showConfirmLeaveDialog() {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: AppTheme.borderColor),
        ),
        title: Text(
          'Rời khỏi trang thanh toán?',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            color: AppTheme.textPrimary,
            fontSize: 16,
          ),
        ),
        content: Text(
          'Giao dịch thanh toán chưa hoàn tất. Bạn có muốn tạm dừng và kiểm tra lại sau không?',
          style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text('Ở Lại', style: TextStyle(color: AppTheme.textSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Rời Khỏi', style: TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }
}
