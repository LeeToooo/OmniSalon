import 'package:omni_salon_mobile/core/auth/auth_service.dart';
import 'package:flutter/material.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';
import 'package:omni_salon_mobile/pages/auth/register_page.dart';
import 'package:omni_salon_mobile/pages/auth/forgot_password_page.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback? onLoginSuccess;

  const LoginScreen({super.key, this.onLoginSuccess});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _obscurePassword = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final res = await AuthService.login(
      _identifierController.text.trim(),
      _passwordController.text.trim(),
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            res['message'] ?? 'Đăng nhập thành công!',
            style: AppTheme.bodyMedium(color: AppTheme.textLight),
          ),
          backgroundColor: AppTheme.charcoal,
          behavior: SnackBarBehavior.floating,
        ),
      );
      if (widget.onLoginSuccess != null) {
        widget.onLoginSuccess!();
      }
      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            res['message'] ?? 'Đăng nhập thất bại. Vui lòng thử lại.',
            style: AppTheme.bodyMedium(color: AppTheme.textLight),
          ),
          backgroundColor: AppTheme.statusDanger,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _fillSampleAccount(String user, String pass) {
    _identifierController.text = user;
    _passwordController.text = pass;
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
                // Tag nhận diện thương hiệu
                Text(
                  'OMNI SALON AUTHENTIC',
                  style: AppTheme.labelUppercase(fontSize: 11, color: AppTheme.accentGold),
                ),
                const SizedBox(height: 6),

                // Tiêu đề Playfair Display
                Text(
                  'Đăng Nhập Hội Viên',
                  style: AppTheme.headingLarge(fontSize: 30),
                ),
                const SizedBox(height: 8),

                Text(
                  'Đăng nhập để đặt lịch hẹn ưu tiên, tích lũy điểm và theo dõi các kiểu tóc đã cắt tại Omni Salon.',
                  style: AppTheme.bodyMedium(color: AppTheme.textSecondary),
                ),
                const SizedBox(height: 28),

                // Ô nhập Số điện thoại / Email / Tên đăng nhập
                Text(
                  'Số điện thoại hoặc Email',
                  style: AppTheme.bodyMedium(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _identifierController,
                  keyboardType: TextInputType.emailAddress,
                  style: AppTheme.bodyMedium(),
                  decoration: const InputDecoration(
                    hintText: 'Nhập số điện thoại hoặc email...',
                    prefixIcon: Icon(Icons.person_outline_rounded, size: 20, color: AppTheme.textSecondary),
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) {
                      return 'Vui lòng nhập số điện thoại hoặc email';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 18),

                // Ô nhập Mật khẩu
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Mật khẩu',
                      style: AppTheme.bodyMedium(fontWeight: FontWeight.w600),
                    ),
                    GestureDetector(
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const ForgotPasswordScreen()),
                        );
                      },
                      child: Text(
                        'Quên mật khẩu?',
                        style: AppTheme.bodySmall(color: AppTheme.accentGold, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  style: AppTheme.bodyMedium(),
                  decoration: InputDecoration(
                    hintText: 'Nhập mật khẩu...',
                    prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20, color: AppTheme.textSecondary),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        size: 20,
                        color: AppTheme.textSecondary,
                      ),
                      onPressed: () {
                        setState(() => _obscurePassword = !_obscurePassword);
                      },
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) {
                      return 'Vui lòng nhập mật khẩu';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 28),

                // Nút Đăng nhập chính
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleLogin,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accentGold,
                      foregroundColor: AppTheme.charcoal,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.charcoal),
                          )
                        : Text(
                            'ĐĂNG NHẬP NGAY',
                            style: AppTheme.bodyLarge(fontWeight: FontWeight.w700, color: AppTheme.charcoal),
                          ),
                  ),
                ),
                const SizedBox(height: 20),

                // Chuyển sang màn hình Đăng ký
                Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Chưa có tài khoản hội viên? ',
                        style: AppTheme.bodyMedium(color: AppTheme.textSecondary),
                      ),
                      GestureDetector(
                        onTap: () {
                          Navigator.of(context).pushReplacement(
                            MaterialPageRoute(
                              builder: (_) => RegisterScreen(onRegisterSuccess: widget.onLoginSuccess),
                            ),
                          );
                        },
                        child: Text(
                          'Đăng ký ngay',
                          style: AppTheme.bodyMedium(color: AppTheme.accentGold, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Tài khoản thử nghiệm nhanh, Tiện ích hỗ trợ thẩm định và kiểm thử
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceElevated,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.borderColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.flash_on_rounded, size: 16, color: AppTheme.accentGold),
                          const SizedBox(width: 6),
                          Text(
                            'TÀI KHOẢN MẪU ĐỂ TEST NHANH:',
                            style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          ActionChip(
                            label: const Text('Khách hàng: 0901111222'),
                            labelStyle: AppTheme.bodySmall(color: AppTheme.textPrimary, fontWeight: FontWeight.w600),
                            backgroundColor: AppTheme.surfaceCard,
                            side: const BorderSide(color: AppTheme.borderColor),
                            onPressed: () => _fillSampleAccount('0901111222', '123456'),
                          ),
                          ActionChip(
                            label: const Text('Khách VIP: 0988000001'),
                            labelStyle: AppTheme.bodySmall(color: AppTheme.textPrimary, fontWeight: FontWeight.w600),
                            backgroundColor: AppTheme.surfaceCard,
                            side: const BorderSide(color: AppTheme.borderColor),
                            onPressed: () => _fillSampleAccount('0988000001', '123456'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

typedef LoginPage = LoginScreen;
