import 'package:flutter/material.dart';
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
  final _regEmailCtrl = TextEditingController();
  final _regPassCtrl = TextEditingController();

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
    _regEmailCtrl.dispose();
    _regPassCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final ident = _loginIdentCtrl.text.trim();
    final pass = _loginPassCtrl.text.trim();

    if (ident.isEmpty || pass.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập tài khoản và mật khẩu'), backgroundColor: Colors.red),
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
        SnackBar(content: Text(res['message']?.toString() ?? 'Đăng nhập thất bại'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _handleRegister() async {
    final name = _regNameCtrl.text.trim();
    final phone = _regPhoneCtrl.text.trim();
    final email = _regEmailCtrl.text.trim();
    final pass = _regPassCtrl.text.trim();

    if (name.isEmpty || phone.isEmpty || email.isEmpty || pass.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng điền đủ tất cả thông tin đăng ký'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => isLoading = true);
    final res = await AuthService.register(
      fullName: name,
      phone: phone,
      email: email,
      password: pass,
    );
    if (!mounted) return;
    setState(() => isLoading = false);

    if (res['success'] == true) {
      Navigator.pop(context);
      widget.onSuccess?.call();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Đăng ký thành công! Chào mừng ${AuthService.currentUser?.fullName}'),
          backgroundColor: const Color(0xFF16A34A),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res['message']?.toString() ?? 'Đăng ký thất bại'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      padding: EdgeInsets.only(bottom: bottomInset),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Thanh kéo drag handle
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),

              // Tiêu đề & Logo
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [Color(0xFFB48312), Color(0xFFD4AF37)]),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text('OMNI', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 13)),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    isRegister ? 'Đăng Ký Thành Viên' : 'Đăng Nhập OmniSalon',
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: Color(0xFF0F172A)),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.grey),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                isRegister
                    ? 'Tạo tài khoản lưu trực tiếp vào CSDL SQL Server QL_SALONTOC'
                    : 'Đăng nhập chung CSDL SQL Server với bản Web',
                style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 16),

              // Segment tab chuyển đổi Đăng Nhập / Đăng Ký
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => isRegister = false),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: !isRegister ? Colors.white : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: !isRegister ? [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 4)] : [],
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            'Đăng Nhập',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 13.5,
                              color: !isRegister ? const Color(0xFFB48312) : const Color(0xFF64748B),
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
                            color: isRegister ? Colors.white : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: isRegister ? [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 4)] : [],
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            'Đăng Ký Mới',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 13.5,
                              color: isRegister ? const Color(0xFFB48312) : const Color(0xFF64748B),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              if (!isRegister) ...[
                // --- FORM ĐĂNG NHẬP ---
                TextField(
                  controller: _loginIdentCtrl,
                  decoration: InputDecoration(
                    labelText: 'Tài khoản / SĐT / Email',
                    hintText: 'VD: admin hoặc 0988000001',
                    prefixIcon: const Icon(Icons.person_outline, color: Color(0xFFB48312)),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _loginPassCtrl,
                  obscureText: obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Mật khẩu',
                    hintText: 'Nhập mật khẩu',
                    prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFFB48312)),
                    suffixIcon: IconButton(
                      icon: Icon(obscurePassword ? Icons.visibility_off : Icons.visibility, color: Colors.grey),
                      onPressed: () => setState(() => obscurePassword = !obscurePassword),
                    ),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                  ),
                ),
                const SizedBox(height: 10),
                // Gợi ý tài khoản demo
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFFDE68A)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, size: 16, color: Color(0xFFB45309)),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Tài khoản Admin: admin / admin123\nKhách hàng mẫu: user_KH01 / kh123 (hoặc SĐT của bạn)',
                          style: TextStyle(fontSize: 11, color: Colors.amber.shade900, height: 1.3),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: isLoading ? null : _handleLogin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFB48312),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: isLoading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('ĐĂNG NHẬP NGAY', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                ),
              ] else ...[
                // --- FORM ĐĂNG KÝ ---
                TextField(
                  controller: _regNameCtrl,
                  decoration: InputDecoration(
                    labelText: 'Họ và Tên Khách Hàng',
                    hintText: 'Nguyễn Văn Tuấn',
                    prefixIcon: const Icon(Icons.badge_outlined, color: Color(0xFFB48312)),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _regPhoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    labelText: 'Số Điện Thoại',
                    hintText: '0988000001',
                    prefixIcon: const Icon(Icons.phone_outlined, color: Color(0xFFB48312)),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _regEmailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    labelText: 'Địa chỉ Email',
                    hintText: 'tuan.nguyen@gmail.com',
                    prefixIcon: const Icon(Icons.email_outlined, color: Color(0xFFB48312)),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _regPassCtrl,
                  obscureText: obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Mật Khẩu Đăng Ký',
                    hintText: 'Tối thiểu 6 ký tự',
                    prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFFB48312)),
                    suffixIcon: IconButton(
                      icon: Icon(obscurePassword ? Icons.visibility_off : Icons.visibility, color: Colors.grey),
                      onPressed: () => setState(() => obscurePassword = !obscurePassword),
                    ),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: isLoading ? null : _handleRegister,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F172A),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: isLoading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('TẠO TÀI KHOẢN & LƯU VÀO SQL', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
