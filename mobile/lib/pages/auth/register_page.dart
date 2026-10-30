import 'package:omni_salon_mobile/core/auth/auth_service.dart';
import 'package:flutter/material.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';
import 'package:omni_salon_mobile/pages/auth/login_page.dart';
import 'package:omni_salon_mobile/pages/auth/otp_verification_page.dart';

class RegisterScreen extends StatefulWidget {
  final VoidCallback? onRegisterSuccess;

  const RegisterScreen({super.key, this.onRegisterSuccess});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _birthdayController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _birthdayController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _selectBirthday() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 20, 1, 1),
      firstDate: DateTime(1940),
      lastDate: DateTime(now.year - 10),
      builder: (context, child) {
        return Theme(
          data: ThemeData.light().copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppTheme.accentGold,
              onPrimary: AppTheme.charcoal,
              surface: AppTheme.surfaceCard,
              onSurface: AppTheme.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      final yyyy = picked.year.toString();
      final mm = picked.month.toString().padLeft(2, '0');
      final dd = picked.day.toString().padLeft(2, '0');
      setState(() {
        _birthdayController.text = '$yyyy-$mm-$dd';
      });
    }
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final res = await AuthService.register(
      fullName: _nameController.text.trim(),
      phone: _phoneController.text.trim(),
      email: _emailController.text.trim(),
      birthday: _birthdayController.text.trim().isNotEmpty ? _birthdayController.text.trim() : null,
      password: _passwordController.text.trim(),
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] == true) {
      // Chuẩn bị gửi OTP Gmail, ở chế độ chờ / mock
      await AuthService.sendGmailOtp(_emailController.text.trim());

      if (!mounted) return;

      // Điều hướng tới màn hình OTP Verification, có nút Bỏ qua test nhanh
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => OtpVerificationScreen(
            email: _emailController.text.trim(),
            onVerificationSuccess: () {
              Navigator.of(context).pop(); // Đóng OTP screen
              if (widget.onRegisterSuccess != null) {
                widget.onRegisterSuccess!();
              } else {
                Navigator.of(context).pop(true);
              }
            },
          ),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Đăng ký thất bại.', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
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
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'GIA NHẬP HỘI VIÊN',
                  style: AppTheme.labelUppercase(fontSize: 11, color: AppTheme.accentGold),
                ),
                const SizedBox(height: 6),
                Text(
                  'Tạo Tài Khoản Mới',
                  style: AppTheme.headingLarge(fontSize: 30),
                ),
                const SizedBox(height: 8),
                Text(
                  'Trở thành hội viên Omni Salon để tận hưởng đặc quyền đặt lịch ưu tiên và chính sách bảo hành kiểu tóc 7 ngày.',
                  style: AppTheme.bodyMedium(color: AppTheme.textSecondary),
                ),
                const SizedBox(height: 24),

                // Họ và tên
                Text('Họ và tên quý khách', style: AppTheme.bodyMedium(fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _nameController,
                  textCapitalization: TextCapitalization.words,
                  style: AppTheme.bodyMedium(),
                  decoration: const InputDecoration(
                    hintText: 'Ví dụ: Nguyễn Văn An',
                    prefixIcon: Icon(Icons.person_outline_rounded, size: 20, color: AppTheme.textSecondary),
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Vui lòng nhập họ và tên' : null,
                ),
                const SizedBox(height: 16),

                // Số điện thoại
                Text('Số điện thoại (dùng nhận mã lịch hẹn)', style: AppTheme.bodyMedium(fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  style: AppTheme.bodyMedium(),
                  decoration: const InputDecoration(
                    hintText: 'Ví dụ: 0901 234 567',
                    prefixIcon: Icon(Icons.phone_outlined, size: 20, color: AppTheme.textSecondary),
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Vui lòng nhập số điện thoại';
                    if (v.trim().length < 9) return 'Số điện thoại không hợp lệ';
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Email
                Text('Email (nhận xác nhận & OTP)', style: AppTheme.bodyMedium(fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  style: AppTheme.bodyMedium(),
                  decoration: const InputDecoration(
                    hintText: 'Ví dụ: quyong@gmail.com',
                    prefixIcon: Icon(Icons.email_outlined, size: 20, color: AppTheme.textSecondary),
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Vui lòng nhập email';
                    if (!v.contains('@') || !v.contains('.')) return 'Địa chỉ email không hợp lệ';
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Ngày sinh
                Text('Ngày sinh (nhận ưu đãi sinh nhật)', style: AppTheme.bodyMedium(fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _birthdayController,
                  readOnly: true,
                  onTap: _selectBirthday,
                  style: AppTheme.bodyMedium(),
                  decoration: InputDecoration(
                    hintText: 'Chọn ngày sinh (YYYY-MM-DD)...',
                    prefixIcon: const Icon(Icons.cake_outlined, size: 20, color: AppTheme.textSecondary),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.calendar_month_outlined, size: 20, color: AppTheme.accentGold),
                      onPressed: _selectBirthday,
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Mật khẩu
                Text('Mật khẩu', style: AppTheme.bodyMedium(fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  style: AppTheme.bodyMedium(),
                  decoration: InputDecoration(
                    hintText: 'Tối thiểu 6 ký tự...',
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
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Vui lòng nhập mật khẩu';
                    if (v.trim().length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Nhập lại mật khẩu
                Text('Xác nhận mật khẩu', style: AppTheme.bodyMedium(fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: _obscureConfirm,
                  style: AppTheme.bodyMedium(),
                  decoration: InputDecoration(
                    hintText: 'Nhập lại mật khẩu vừa đặt...',
                    prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20, color: AppTheme.textSecondary),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        size: 20,
                        color: AppTheme.textSecondary,
                      ),
                      onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                    ),
                  ),
                  validator: (v) {
                    if (v != _passwordController.text) return 'Mật khẩu xác nhận không khớp';
                    return null;
                  },
                ),
                const SizedBox(height: 28),

                // Nút Đăng ký chính
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleRegister,
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
                            'TIẾP TỤC & ĐĂNG KÝ',
                            style: AppTheme.bodyLarge(fontWeight: FontWeight.w700, color: AppTheme.charcoal),
                          ),
                  ),
                ),
                const SizedBox(height: 20),

                // Chuyển sang Đăng nhập
                Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Đã có tài khoản? ',
                        style: AppTheme.bodyMedium(color: AppTheme.textSecondary),
                      ),
                      GestureDetector(
                        onTap: () {
                          Navigator.of(context).pushReplacement(
                            MaterialPageRoute(
                              builder: (_) => LoginScreen(onLoginSuccess: widget.onRegisterSuccess),
                            ),
                          );
                        },
                        child: Text(
                          'Đăng nhập tại đây',
                          style: AppTheme.bodyMedium(color: AppTheme.accentGold, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

typedef RegisterPage = RegisterScreen;
