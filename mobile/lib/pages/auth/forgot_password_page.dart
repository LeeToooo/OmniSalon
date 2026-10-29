import 'package:omni_salon_mobile/core/auth/auth_service.dart';
import 'package:flutter/material.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _newPasswordController = TextEditingController();

  bool _codeSent = false;
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleSendCode() async {
    final email = _emailController.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Vui lòng nhập địa chỉ email hợp lệ.', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
          backgroundColor: AppTheme.statusDanger,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    final res = await AuthService.forgotPassword(email);
    if (!mounted) return;
    setState(() {
      _isLoading = false;
      if (res['success'] == true) {
        _codeSent = true;
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(res['message'] ?? 'Đã gửi mã khôi phục về email của bạn.', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
        backgroundColor: res['success'] == true ? AppTheme.charcoal : AppTheme.statusDanger,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _handleResetPassword() async {
    final email = _emailController.text.trim();
    final otp = _otpController.text.trim();
    final pass = _newPasswordController.text.trim();

    if (otp.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Vui lòng nhập đủ 6 chữ số mã OTP.', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
          backgroundColor: AppTheme.statusDanger,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    if (pass.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Mật khẩu mới phải có ít nhất 6 ký tự.', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
          backgroundColor: AppTheme.statusDanger,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    final res = await AuthService.resetPasswordWithOtp(email: email, otp: otp, newPassword: pass);
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Đặt lại mật khẩu thành công!', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
          backgroundColor: AppTheme.charcoal,
          behavior: SnackBarBehavior.floating,
        ),
      );
      Navigator.of(context).pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Không thể đặt lại mật khẩu.', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
          backgroundColor: AppTheme.statusDanger,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
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
                'HỖ TRỢ TÀI KHOẢN',
                style: AppTheme.labelUppercase(fontSize: 11, color: AppTheme.accentGold),
              ),
              const SizedBox(height: 6),
              Text(
                'Khôi Phục Mật Khẩu',
                style: AppTheme.headingLarge(fontSize: 28),
              ),
              const SizedBox(height: 8),
              Text(
                'Nhập địa chỉ email đăng ký hội viên của bạn. Hệ thống sẽ gửi mã xác minh 6 số để tiến hành đặt mật khẩu mới.',
                style: AppTheme.bodyMedium(color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 28),

              // Email
              Text('Email đăng ký', style: AppTheme.bodyMedium(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _emailController,
                enabled: !_codeSent,
                keyboardType: TextInputType.emailAddress,
                style: AppTheme.bodyMedium(),
                decoration: const InputDecoration(
                  hintText: 'Nhập email đã đăng ký...',
                  prefixIcon: Icon(Icons.email_outlined, size: 20, color: AppTheme.textSecondary),
                ),
              ),
              const SizedBox(height: 20),

              if (!_codeSent) ...[
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleSendCode,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accentGold,
                      foregroundColor: AppTheme.charcoal,
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.charcoal),
                          )
                        : Text(
                            'GỬI MÃ XÁC NHẬN GMAIL',
                            style: AppTheme.bodyLarge(fontWeight: FontWeight.w700, color: AppTheme.charcoal),
                          ),
                  ),
                ),
              ] else ...[
                // Mã OTP
                Text('Mã xác thực OTP (6 chữ số)', style: AppTheme.bodyMedium(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  style: AppTheme.bodyMedium(),
                  decoration: InputDecoration(
                    hintText: 'Ví dụ: 888999',
                    counterText: '',
                    prefixIcon: const Icon(Icons.pin_outlined, size: 20, color: AppTheme.textSecondary),
                    suffixIcon: TextButton(
                      onPressed: _isLoading ? null : _handleSendCode,
                      child: Text('Gửi lại', style: AppTheme.bodySmall(color: AppTheme.accentGold, fontWeight: FontWeight.w700)),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Mật khẩu mới
                Text('Mật khẩu mới', style: AppTheme.bodyMedium(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _newPasswordController,
                  obscureText: _obscurePassword,
                  style: AppTheme.bodyMedium(),
                  decoration: InputDecoration(
                    hintText: 'Nhập mật khẩu mới...',
                    prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20, color: AppTheme.textSecondary),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        size: 20,
                        color: AppTheme.textSecondary,
                      ),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                ),
                const SizedBox(height: 28),

                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleResetPassword,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accentGold,
                      foregroundColor: AppTheme.charcoal,
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.charcoal),
                          )
                        : Text(
                            'LƯU MẬT KHẨU MỚI',
                            style: AppTheme.bodyLarge(fontWeight: FontWeight.w700, color: AppTheme.charcoal),
                          ),
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

typedef ForgotPasswordPage = ForgotPasswordScreen;
