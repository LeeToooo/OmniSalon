import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/auth_service.dart';

class AuthModal extends StatefulWidget {
  final VoidCallback? onSuccess;
  final bool initialRegister;

  const AuthModal({super.key, this.onSuccess, this.initialRegister = false});

  static Future<void> show(BuildContext context, {VoidCallback? onSuccess, bool initialRegister = false}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => AuthModal(onSuccess: onSuccess, initialRegister: initialRegister),
    );
  }

  @override
  State<AuthModal> createState() => _AuthModalState();
}

class _AuthModalState extends State<AuthModal> {
  late bool isRegister;
  bool isLoading = false;
  bool obscurePassword = true;

  // Controllers
  final _loginIdentCtrl = TextEditingController();
  final _loginPassCtrl = TextEditingController();

  final _regNameCtrl = TextEditingController();
  final _regPhoneCtrl = TextEditingController();
  final _regBirthdayCtrl = TextEditingController();
  final _regEmailCtrl = TextEditingController();
  final _regPassCtrl = TextEditingController();

  DateTime? _selectedBirthday;

  @override
  void initState() {
    super.initState();
    isRegister = widget.initialRegister;
  }

  @override
  void dispose() {
    _loginIdentCtrl.dispose();
    _loginPassCtrl.dispose();
    _regNameCtrl.dispose();
    _regPhoneCtrl.dispose();
    _regBirthdayCtrl.dispose();
    _regEmailCtrl.dispose();
    _regPassCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickBirthday() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedBirthday ?? DateTime(2000, 1, 1),
      firstDate: DateTime(1940),
      lastDate: DateTime(now.year - 5),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFFC59B27),
              onPrimary: Color(0xFF141413),
              surface: Color(0xFF1C1917),
              onSurface: Color(0xFFFAF8F5),
            ),
            dialogTheme: const DialogThemeData(
              backgroundColor: Color(0xFF1C1917),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _selectedBirthday = picked;
        _regBirthdayCtrl.text = DateFormat('yyyy-MM-dd').format(picked);
      });
    }
  }

  Future<void> _handleLogin() async {
    final ident = _loginIdentCtrl.text.trim();
    final pass = _loginPassCtrl.text.trim();

    if (ident.isEmpty || pass.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng nhập tài khoản và mật khẩu'),
          backgroundColor: Color(0xFFDC2626),
        ),
      );
      return;
    }

    setState(() => isLoading = true);
    final res = await AuthService.login(ident, pass);
    if (!mounted) return;
    setState(() => isLoading = false);

    if (res['success'] == true) {
      Navigator.pop(context);
      widget.onSuccess?.call();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Chào mừng ${AuthService.currentUser?.fullName}! (${AuthService.currentUser?.roleName})'),
          backgroundColor: const Color(0xFF16A34A),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message']?.toString() ?? 'Đăng nhập thất bại'),
          backgroundColor: const Color(0xFFDC2626),
        ),
      );
    }
  }

  Future<void> _handleRegister() async {
    final name = _regNameCtrl.text.trim();
    final phone = _regPhoneCtrl.text.trim();
    final birthday = _regBirthdayCtrl.text.trim();
    final email = _regEmailCtrl.text.trim();
    final pass = _regPassCtrl.text.trim();

    if (name.isEmpty) {
      _showError('Vui lòng nhập họ và tên khách hàng');
      return;
    }
    if (phone.isEmpty || !RegExp(r'^[0-9]{9,11}$').hasMatch(phone)) {
      _showError('Số điện thoại không hợp lệ (9-11 chữ số)');
      return;
    }
    if (birthday.isEmpty) {
      _showError('Vui lòng chọn ngày sinh của bạn');
      return;
    }
    if (email.isEmpty || !email.contains('@')) {
      _showError('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    if (pass.length < 6) {
      _showError('Mật khẩu tối thiểu 6 ký tự');
      return;
    }

    setState(() => isLoading = true);
    final res = await AuthService.register(
      fullName: name,
      phone: phone,
      email: email,
      birthday: birthday,
      password: pass,
    );
    if (!mounted) return;
    setState(() => isLoading = false);

    if (res['success'] == true) {
      Navigator.pop(context);
      widget.onSuccess?.call();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Đăng ký tài khoản thành viên thành công! Ngày sinh: $birthday'),
          backgroundColor: const Color(0xFF16A34A),
        ),
      );
    } else {
      _showError(res['message']?.toString() ?? 'Đăng ký thất bại');
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: const Color(0xFFDC2626)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF1C1917),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: Color(0xFFC59B27), width: 1.5)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: bottomInset + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header title
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isRegister ? 'ĐĂNG KÝ MỚI' : 'ĐĂNG NHẬP THÀNH VIÊN',
                      style: const TextStyle(
                        color: Color(0xFFC59B27),
                        fontWeight: FontWeight.w900,
                        fontSize: 18,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isRegister
                          ? 'Đăng ký tài khoản thành viên để nhận ngay 100 điểm thưởng'
                          : 'Đăng nhập để đặt lịch, tích điểm và nhận ưu đãi độc quyền',
                      style: const TextStyle(color: Color(0xFFA8A29E), fontSize: 11.5),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Color(0xFFA8A29E)),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Switch tab login / register
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFF141413),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF2A2724)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => isRegister = false),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: !isRegister ? const Color(0xFFC59B27) : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          'Đăng Nhập',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            color: !isRegister ? const Color(0xFF141413) : const Color(0xFFA8A29E),
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => isRegister = true),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: isRegister ? const Color(0xFFC59B27) : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          'Đăng Ký Mới',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            color: isRegister ? const Color(0xFF141413) : const Color(0xFFA8A29E),
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            if (!isRegister) ...[
              // LOGIN FORM
              _buildFieldLabel('TÀI KHOẢN (SỐ ĐIỆN THOẠI HOẶC EMAIL):'),
              _buildInputField(
                controller: _loginIdentCtrl,
                hintText: '0908123456 hoặc email@gmail.com',
                prefixIcon: Icons.account_circle_outlined,
              ),
              const SizedBox(height: 14),

              _buildFieldLabel('MẬT KHẨU:'),
              _buildInputField(
                controller: _loginPassCtrl,
                hintText: 'Nhập mật khẩu',
                prefixIcon: Icons.lock_outline,
                obscureText: obscurePassword,
                suffixIcon: IconButton(
                  icon: Icon(
                    obscurePassword ? Icons.visibility_off : Icons.visibility,
                    color: const Color(0xFFA8A29E),
                    size: 18,
                  ),
                  onPressed: () => setState(() => obscurePassword = !obscurePassword),
                ),
              ),
              const SizedBox(height: 22),

              ElevatedButton(
                onPressed: isLoading ? null : _handleLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFC59B27),
                  foregroundColor: const Color(0xFF141413),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: isLoading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF141413)))
                    : const Text(
                        'ĐĂNG NHẬP NGAY →',
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 0.5),
                      ),
              ),
            ] else ...[
              // REGISTER FORM
              _buildFieldLabel('HỌ VÀ TÊN KHÁCH HÀNG:'),
              _buildInputField(
                controller: _regNameCtrl,
                hintText: 'Nguyễn Văn A',
                prefixIcon: Icons.person_outline,
              ),
              const SizedBox(height: 12),

              _buildFieldLabel('SỐ ĐIỆN THOẠI:'),
              _buildInputField(
                controller: _regPhoneCtrl,
                hintText: '0908123456',
                prefixIcon: Icons.phone_outlined,
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 12),

              // NGÀY SINH (Đồng bộ với yêu cầu SQL không hardcode 2001)
              _buildFieldLabel('NGÀY SINH:'),
              GestureDetector(
                onTap: _pickBirthday,
                child: AbsorbPointer(
                  child: _buildInputField(
                    controller: _regBirthdayCtrl,
                    hintText: 'Chọn ngày sinh (VD: 1998-05-20)',
                    prefixIcon: Icons.cake_outlined,
                    suffixIcon: const Icon(Icons.calendar_today, color: Color(0xFFC59B27), size: 18),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              _buildFieldLabel('GMAIL XÁC THỰC:'),
              _buildInputField(
                controller: _regEmailCtrl,
                hintText: 'khachhang@gmail.com',
                prefixIcon: Icons.mail_outline,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 12),

              _buildFieldLabel('MẬT KHẨU KHỞI TẠO:'),
              _buildInputField(
                controller: _regPassCtrl,
                hintText: 'Tối thiểu 6 ký tự',
                prefixIcon: Icons.lock_outline,
                obscureText: obscurePassword,
                suffixIcon: IconButton(
                  icon: Icon(
                    obscurePassword ? Icons.visibility_off : Icons.visibility,
                    color: const Color(0xFFA8A29E),
                    size: 18,
                  ),
                  onPressed: () => setState(() => obscurePassword = !obscurePassword),
                ),
              ),
              const SizedBox(height: 22),

              ElevatedButton(
                onPressed: isLoading ? null : _handleRegister,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFC59B27),
                  foregroundColor: const Color(0xFF141413),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: isLoading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF141413)))
                    : const Text(
                        'TẠO TÀI KHOẢN THÀNH VIÊN →',
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 0.5),
                      ),
              ),
            ],
            const SizedBox(height: 14),

            Center(
              child: Text(
                isRegister
                    ? 'Đăng ký tài khoản để tích điểm đổi quà và lưu giữ bộ sưu tập tóc!'
                    : 'Omni Salon Barber — Chuẩn mực dịch vụ phái mạnh đương đại.',
                style: const TextStyle(fontSize: 11, color: Color(0xFFA8A29E)),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFieldLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 5),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: Color(0xFFA8A29E),
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String hintText,
    required IconData prefixIcon,
    bool obscureText = false,
    Widget? suffixIcon,
    TextInputType? keyboardType,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF141413),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF2E2C29)),
      ),
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        keyboardType: keyboardType,
        style: const TextStyle(color: Color(0xFFFAF8F5), fontSize: 13.5, fontWeight: FontWeight.w600),
        decoration: InputDecoration(
          hintText: hintText,
          hintStyle: const TextStyle(color: Color(0xFF57534E), fontSize: 13),
          prefixIcon: Icon(prefixIcon, color: const Color(0xFFC59B27), size: 18),
          suffixIcon: suffixIcon,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        ),
      ),
    );
  }
}
