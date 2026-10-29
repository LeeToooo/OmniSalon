import 'package:omni_salon_mobile/core/auth/auth_service.dart';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';

class OtpVerificationScreen extends StatefulWidget {
  final String email;
  final VoidCallback onVerificationSuccess;

  const OtpVerificationScreen({
    super.key,
    required this.email,
    required this.onVerificationSuccess,
  });

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  int _resendCountdown = 60;
  Timer? _timer;
  bool _isVerifying = false;
  bool _isResending = false;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  void _startCountdown() {
    setState(() => _resendCountdown = 60);
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_resendCountdown > 0) {
        setState(() => _resendCountdown--);
      } else {
        t.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  String get _currentOtp => _controllers.map((c) => c.text).join();

  Future<void> _handleVerify({bool bypass = false}) async {
    if (!bypass) {
      final code = _currentOtp;
      if (code.length < 6) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Vui lòng nhập đủ 6 chữ số mã xác thực OTP.', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
            backgroundColor: AppTheme.statusDanger,
            behavior: SnackBarBehavior.floating,
          ),
        );
        return;
      }
    }

    setState(() => _isVerifying = true);

    final isValid = bypass ? true : await AuthService.verifyGmailOtp(widget.email, _currentOtp);

    if (!mounted) return;
    setState(() => _isVerifying = false);

    if (isValid) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Xác thực tài khoản thành công!', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
          backgroundColor: AppTheme.charcoal,
          behavior: SnackBarBehavior.floating,
        ),
      );
      widget.onVerificationSuccess();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Mã OTP không đúng hoặc đã hết hạn. Hãy thử lại.', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
          backgroundColor: AppTheme.statusDanger,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _handleResend() async {
    if (_resendCountdown > 0 || _isResending) return;

    setState(() => _isResending = true);
    await AuthService.sendGmailOtp(widget.email);
    if (!mounted) return;
    setState(() => _isResending = false);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đã gửi lại mã OTP về ${widget.email}', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
        backgroundColor: AppTheme.charcoal,
        behavior: SnackBarBehavior.floating,
      ),
    );
    _startCountdown();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'BẢO MẬT & XÁC THỰC',
                style: AppTheme.labelUppercase(fontSize: 11, color: AppTheme.accentGold),
              ),
              const SizedBox(height: 6),
              Text(
                'Nhập Mã OTP Gmail',
                style: AppTheme.headingLarge(fontSize: 28),
              ),
              const SizedBox(height: 8),
              RichText(
                text: TextSpan(
                  style: AppTheme.bodyMedium(color: AppTheme.textSecondary),
                  children: [
                    const TextSpan(text: 'Mã xác thực gồm 6 chữ số đã được gửi đến địa chỉ email: '),
                    TextSpan(
                      text: widget.email,
                      style: AppTheme.bodyMedium(color: AppTheme.textPrimary, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // 6 Ô nhập OTP
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(6, (index) {
                  return SizedBox(
                    width: 44,
                    height: 52,
                    child: TextFormField(
                      controller: _controllers[index],
                      focusNode: _focusNodes[index],
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.center,
                      maxLength: 1,
                      style: AppTheme.headingMedium(fontSize: 20, color: AppTheme.textPrimary),
                      decoration: InputDecoration(
                        counterText: '',
                        filled: true,
                        fillColor: AppTheme.surfaceCard,
                        contentPadding: EdgeInsets.zero,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: AppTheme.borderColor),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: AppTheme.accentGold, width: 2),
                        ),
                      ),
                      onChanged: (value) {
                        if (value.isNotEmpty && index < 5) {
                          _focusNodes[index + 1].requestFocus();
                        } else if (value.isEmpty && index > 0) {
                          _focusNodes[index - 1].requestFocus();
                        }
                        if (_currentOtp.length == 6) {
                          _handleVerify();
                        }
                      },
                    ),
                  );
                }),
              ),
              const SizedBox(height: 24),

              // Bộ đếm ngược gửi lại mã
              Center(
                child: _resendCountdown > 0
                    ? Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.timer_outlined, size: 16, color: AppTheme.textSecondary),
                          const SizedBox(width: 6),
                          Text(
                            'Gửi lại mã sau $_resendCountdown giây',
                            style: AppTheme.bodySmall(color: AppTheme.textSecondary),
                          ),
                        ],
                      )
                    : TextButton.icon(
                        onPressed: _isResending ? null : _handleResend,
                        icon: const Icon(Icons.refresh_rounded, size: 18, color: AppTheme.accentGold),
                        label: Text(
                          'Gửi lại mã xác thực',
                          style: AppTheme.bodyMedium(color: AppTheme.accentGold, fontWeight: FontWeight.w700),
                        ),
                      ),
              ),
              const SizedBox(height: 32),

              // Nút xác thực chính
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isVerifying ? null : () => _handleVerify(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accentGold,
                    foregroundColor: AppTheme.charcoal,
                  ),
                  child: _isVerifying
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.charcoal),
                        )
                      : Text(
                          'XÁC NHẬN MÃ OTP',
                          style: AppTheme.bodyLarge(fontWeight: FontWeight.w700, color: AppTheme.charcoal),
                        ),
                ),
              ),
              const SizedBox(height: 16),

              // =========================================================
              // CHẾ ĐỘ CHỜ / TEST NHANH (Khi enableGmailOtpVerification = false)
              // =========================================================
              if (!AuthService.enableGmailOtpVerification) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceElevated,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.3)),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.verified_user_outlined, size: 16, color: AppTheme.accentGold),
                          const SizedBox(width: 6),
                          Text(
                            'CHẾ ĐỘ KIỂM THỬ (CHƯA BẬT GỬI MAIL THẬT)',
                            style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.accentGold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        height: 44,
                        child: OutlinedButton.icon(
                          onPressed: () => _handleVerify(bypass: true),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppTheme.accentGold, width: 1.5),
                            backgroundColor: AppTheme.surfaceCard,
                          ),
                          icon: const Icon(Icons.bolt_rounded, color: AppTheme.accentGold, size: 18),
                          label: Text(
                            'Bỏ qua / Xác nhận nhanh (Chế độ Test)',
                            style: AppTheme.bodyMedium(color: AppTheme.accentGold, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

typedef OtpVerificationPage = OtpVerificationScreen;
