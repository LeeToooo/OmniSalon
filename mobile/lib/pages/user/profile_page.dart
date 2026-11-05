import 'package:omni_salon_mobile/core/auth/auth_service.dart';
import 'package:flutter/material.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';
import 'package:omni_salon_mobile/pages/auth/login_page.dart';
import 'package:omni_salon_mobile/pages/user/my_bookings_page.dart';
import 'package:omni_salon_mobile/pages/user/branches_page.dart';
import 'package:omni_salon_mobile/pages/user/stylists_page.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    AuthService.userNotifier.addListener(_onAuthChanged);
    AppTheme.isDarkModeNotifier.addListener(_onThemeChanged);
  }

  @override
  void dispose() {
    AuthService.userNotifier.removeListener(_onAuthChanged);
    AppTheme.isDarkModeNotifier.removeListener(_onThemeChanged);
    super.dispose();
  }

  void _onThemeChanged() {
    if (mounted) setState(() {});
  }

  void _onAuthChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService.currentUser;
    final isLoggedIn = AuthService.isLoggedIn;

    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Trang cá nhân',
          style: AppTheme.headingSmall(fontSize: 18),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Thẻ thông tin khách hàng, Editorial Member Card (Phiên bản màu sáng tinh tế)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.45), width: 1.2),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.accentGold.withValues(alpha: 0.12),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                    BoxShadow(
                      color: AppTheme.charcoal.withValues(alpha: 0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 28,
                          backgroundColor: AppTheme.accentGold,
                          child: Text(
                            isLoggedIn && user!.fullName.isNotEmpty
                                ? user.fullName.substring(0, 1).toUpperCase()
                                : 'OS',
                            style: AppTheme.headingMedium(color: Colors.white, fontSize: 22),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            isLoggedIn ? user!.fullName : 'Quý Khách Hàng',
                            style: AppTheme.headingSmall(color: AppTheme.textPrimary, fontSize: 18),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.accentGold.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: AppTheme.accentGold),
                          ),
                          child: Text(
                            isLoggedIn ? 'Khách hàng' : 'GUEST',
                            style: AppTheme.labelUppercase(fontSize: 9.5, color: AppTheme.accentGold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    Divider(color: AppTheme.borderColor, height: 1),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatCol('LỊCH ĐÃ CẮT', isLoggedIn ? '8 Lần' : '--'),
                        ),
                        Container(width: 1, height: 26, color: AppTheme.borderColor),
                        Expanded(
                          child: _buildStatCol('BẢO HÀNH', '7 Ngày'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              if (!isLoggedIn) ...[
                // Banner nhắc nhở đăng nhập
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceCard,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.borderColor),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'Đăng nhập để xem lịch hẹn và tích điểm',
                        style: AppTheme.bodyMedium(fontWeight: FontWeight.w700),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        height: 44,
                        child: ElevatedButton(
                          onPressed: () async {
                            await Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const LoginScreen()),
                            );
                            if (mounted) setState(() {});
                          },
                          child: const Text('ĐĂNG NHẬP / ĐĂNG KÝ NGAY'),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],



              // Mục Chuyển Đổi Giao Diện Sáng / Tối (Theme Mode Switch)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceCard,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.borderColor),
                ),
                child: Row(
                  children: [
                    // Icon Sáng / Tối
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: AppTheme.isDarkMode
                            ? AppTheme.accentGold.withValues(alpha: 0.2)
                            : const Color(0xFFF59E0B).withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppTheme.isDarkMode ? AppTheme.accentGold : const Color(0xFFF59E0B).withValues(alpha: 0.4),
                          width: 1.2,
                        ),
                      ),
                      child: Icon(
                        AppTheme.isDarkMode ? Icons.dark_mode_rounded : Icons.light_mode_rounded,
                        size: 20,
                        color: AppTheme.isDarkMode ? AppTheme.accentGold : const Color(0xFFD97706),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Text(
                        AppTheme.isDarkMode ? 'Chế độ tối (Dark Mode)' : 'Chế độ sáng (Light Mode)',
                        style: AppTheme.bodyMedium(fontWeight: FontWeight.w700),
                      ),
                    ),
                    // Nút gạt chuyển đổi (Switch) đồng bộ chuẩn xác với Hình 2
                    GestureDetector(
                      onTap: () {
                        AppTheme.toggleDarkMode();
                        setState(() {});
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        curve: Curves.easeInOut,
                        width: 54,
                        height: 32,
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(18),
                          color: AppTheme.isDarkMode
                              ? AppTheme.accentGold
                              : const Color(0xFFD1D5DB), // Màu xám nhạt như hình 2 khi tắt
                        ),
                        child: AnimatedAlign(
                          duration: const Duration(milliseconds: 250),
                          curve: Curves.easeInOut,
                          alignment: AppTheme.isDarkMode ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            width: 26,
                            height: 26,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white,
                              boxShadow: [
                                BoxShadow(
                                  color: Color(0x33000000),
                                  blurRadius: 4,
                                  offset: Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Center(
                              child: Icon(
                                AppTheme.isDarkMode ? Icons.nightlight_round : Icons.wb_sunny_rounded,
                                size: 13,
                                color: AppTheme.isDarkMode ? AppTheme.accentGoldHover : const Color(0xFFF59E0B),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Danh mục tùy chọn, Settings & Actions

              _buildOptionTile(
                icon: Icons.calendar_month_outlined,
                title: 'Lịch hẹn & Đơn hàng của tôi',
                onTap: () async {
                  if (AuthService.currentUser == null) {
                    ScaffoldMessenger.of(context).hideCurrentSnackBar();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Vui lòng đăng nhập để xem lịch hẹn và đơn hàng của bạn!', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
                        backgroundColor: AppTheme.charcoal,
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                    await Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                    if (mounted) setState(() {});
                    if (AuthService.currentUser == null) return;
                  }
                  if (!context.mounted) return;
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const MyBookingsScreen()),
                  );
                },
              ),

              _buildOptionTile(
                icon: Icons.content_cut_outlined,
                title: 'Đội ngũ Master Stylist & Art Director',
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const StylistsScreen()),
                  );
                },
              ),

              _buildOptionTile(
                icon: Icons.storefront_outlined,
                title: 'Hệ thống 20 chi nhánh Omni Salon',
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const BranchesScreen()),
                  );
                },
              ),

              _buildOptionTile(
                icon: Icons.auto_awesome_outlined,
                title: 'Bộ sưu tập phom tóc AI của tôi',
                onTap: () {
                  _showAiGalleryDialog(context);
                },
              ),

              _buildOptionTile(
                icon: Icons.shield_moon_outlined,
                title: 'Chính sách bảo hành kiểu tóc 7 ngày',
                onTap: () {
                  _showWarrantyDialog(context);
                },
              ),

              _buildOptionTile(
                icon: Icons.lock_reset_rounded,
                title: 'Đổi mật khẩu tài khoản',
                onTap: () async {
                  if (AuthService.currentUser == null) {
                    ScaffoldMessenger.of(context).hideCurrentSnackBar();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Vui lòng đăng nhập để đổi mật khẩu tài khoản của bạn!', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
                        backgroundColor: AppTheme.charcoal,
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                    await Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                    if (mounted) setState(() {});
                    if (AuthService.currentUser == null) return;
                  }
                  if (!context.mounted) return;
                  _showChangePasswordModal(context);
                },
              ),
              const SizedBox(height: 20),

              // Đăng xuất
              if (isLoggedIn) ...[
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      await AuthService.logout();
                      setState(() {});
                      if (!context.mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Đã đăng xuất tài khoản.', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
                          backgroundColor: AppTheme.charcoal,
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    },
                    icon: const Icon(Icons.logout_rounded, size: 18, color: AppTheme.statusDanger),
                    label: Text(
                      'ĐĂNG XUẤT TÀI KHOẢN',
                      style: AppTheme.bodyMedium(color: AppTheme.statusDanger, fontWeight: FontWeight.w700),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppTheme.statusDanger, width: 1),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCol(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: AppTheme.headingSmall(fontSize: 16, color: AppTheme.accentGold),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: AppTheme.labelUppercase(fontSize: 9.5, color: AppTheme.textSecondary),
        ),
      ],
    );
  }

  Widget _buildOptionTile({
    required IconData icon,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: AppTheme.surfaceCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(color: AppTheme.borderColor),
        ),
        clipBehavior: Clip.antiAlias,
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
          leading: Icon(icon, color: AppTheme.accentGold, size: 22),
          title: Text(title, style: AppTheme.bodyMedium(fontWeight: FontWeight.w600)),
          subtitle: subtitle != null ? Text(subtitle, style: AppTheme.bodySmall(color: AppTheme.textSecondary)) : null,
          trailing: Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppTheme.textSecondary),
          onTap: onTap,
        ),
      ),
    );
  }

  void _showChangePasswordModal(BuildContext context) {
    final oldPassCtrl = TextEditingController();
    final newPassCtrl = TextEditingController();
    final confirmPassCtrl = TextEditingController();

    bool obscureOld = true;
    bool obscureNew = true;
    bool obscureConfirm = true;
    bool isLoading = false;
    String? errorMessage;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModal) {
          return SafeArea(
            child: Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 14,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 36,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppTheme.borderColor,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppTheme.accentGold.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.lock_reset_rounded, color: AppTheme.accentGold, size: 20),
                            ),
                            const SizedBox(width: 10),
                            Text('Đổi Mật Khẩu', style: AppTheme.headingSmall(fontSize: 18)),
                          ],
                        ),
                        IconButton(
                          icon: Icon(Icons.close_rounded, size: 20, color: AppTheme.textSecondary),
                          onPressed: () => Navigator.of(ctx).pop(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Cập nhật mật khẩu mới cho tài khoản. Mật khẩu được lưu trữ an toàn trong CSDL.',
                      style: AppTheme.bodySmall(color: AppTheme.textSecondary),
                    ),
                    const SizedBox(height: 16),

                    if (errorMessage != null) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppTheme.statusDanger.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppTheme.statusDanger.withValues(alpha: 0.4)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline_rounded, size: 16, color: AppTheme.statusDanger),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                errorMessage!,
                                style: AppTheme.bodySmall(color: AppTheme.statusDanger, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],

                    Text('MẬT KHẨU HIỆN TẠI', style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.textSecondary)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: oldPassCtrl,
                      obscureText: obscureOld,
                      decoration: InputDecoration(
                        hintText: 'Nhập mật khẩu đang dùng',
                        prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20, color: AppTheme.accentGold),
                        suffixIcon: IconButton(
                          icon: Icon(obscureOld ? Icons.visibility_off_rounded : Icons.visibility_rounded, size: 18, color: AppTheme.textSecondary),
                          onPressed: () => setModal(() => obscureOld = !obscureOld),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    Text('MẬT KHẨU MỚI', style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.textSecondary)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: newPassCtrl,
                      obscureText: obscureNew,
                      decoration: InputDecoration(
                        hintText: 'Tối thiểu 6 ký tự',
                        prefixIcon: const Icon(Icons.lock_reset_rounded, size: 20, color: AppTheme.accentGold),
                        suffixIcon: IconButton(
                          icon: Icon(obscureNew ? Icons.visibility_off_rounded : Icons.visibility_rounded, size: 18, color: AppTheme.textSecondary),
                          onPressed: () => setModal(() => obscureNew = !obscureNew),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    Text('XÁC NHẬN MẬT KHẨU MỚI', style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.textSecondary)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: confirmPassCtrl,
                      obscureText: obscureConfirm,
                      decoration: InputDecoration(
                        hintText: 'Nhập lại mật khẩu mới',
                        prefixIcon: const Icon(Icons.verified_user_outlined, size: 20, color: AppTheme.accentGold),
                        suffixIcon: IconButton(
                          icon: Icon(obscureConfirm ? Icons.visibility_off_rounded : Icons.visibility_rounded, size: 18, color: AppTheme.textSecondary),
                          onPressed: () => setModal(() => obscureConfirm = !obscureConfirm),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: isLoading
                            ? null
                            : () async {
                                final oldP = oldPassCtrl.text.trim();
                                final newP = newPassCtrl.text.trim();
                                final confirmP = confirmPassCtrl.text.trim();

                                if (oldP.isEmpty) {
                                  setModal(() => errorMessage = 'Vui lòng nhập mật khẩu hiện tại.');
                                  return;
                                }
                                if (newP.length < 6) {
                                  setModal(() => errorMessage = 'Mật khẩu mới phải có tối thiểu 6 ký tự.');
                                  return;
                                }
                                if (newP != confirmP) {
                                  setModal(() => errorMessage = 'Xác nhận mật khẩu mới không trùng khớp.');
                                  return;
                                }
                                if (oldP == newP) {
                                  setModal(() => errorMessage = 'Mật khẩu mới không được trùng với mật khẩu hiện tại.');
                                  return;
                                }

                                setModal(() {
                                  isLoading = true;
                                  errorMessage = null;
                                });

                                final res = await AuthService.changePassword(
                                  oldPassword: oldP,
                                  newPassword: newP,
                                );

                                if (res['success'] == true) {
                                  if (ctx.mounted) {
                                    Navigator.of(ctx).pop();
                                  }
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).hideCurrentSnackBar();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                          res['message'] ?? 'Đổi mật khẩu thành công! Mật khẩu mới đã được lưu vào hệ thống.',
                                          style: AppTheme.bodyMedium(color: Colors.white, fontWeight: FontWeight.w600),
                                        ),
                                        backgroundColor: const Color(0xFF16A34A),
                                        behavior: SnackBarBehavior.floating,
                                      ),
                                    );
                                  }
                                } else {
                                  setModal(() {
                                    isLoading = false;
                                    errorMessage = res['message'] ?? 'Đổi mật khẩu thất bại.';
                                  });
                                }
                              },
                        child: isLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Text('XÁC NHẬN ĐỔI MẬT KHẨU'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _showWarrantyDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Text('Chính Sách Bảo Hành Kiểu Tóc 7 Ngày', style: AppTheme.headingSmall(fontSize: 18)),
        content: Text(
          'Trong vòng 7 ngày kể từ khi sử dụng dịch vụ tại bất kỳ chi nhánh nào của Omni Salon, nếu bạn cảm thấy phom tóc chưa ưng ý hoặc cần tỉa gọn lại, hãy mang mã đặt lịch đến để được Master Barber hỗ trợ hoàn toàn miễn phí.',
          style: AppTheme.bodyMedium(color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('ĐÃ HIỂU', style: AppTheme.bodyMedium(color: AppTheme.accentGold, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  void _showAiGalleryDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Row(
          children: [
            const Icon(Icons.auto_awesome_rounded, color: AppTheme.accentGold, size: 20),
            const SizedBox(width: 8),
            Text('Bộ Sưu Tập AI Studio', style: AppTheme.headingSmall(fontSize: 18)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Các phom tóc 3D bạn đã thử nghiệm bằng AI Neural Engine được lưu trữ tại đây để bạn tiện trao đổi với Master Stylist khi đến salon.',
              style: AppTheme.bodySmall(color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.surfaceElevated,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.borderColor),
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: Image.network(
                      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=120&q=80',
                      width: 50,
                      height: 50,
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Layer Texture Tự Nhiên', style: AppTheme.bodySmall(fontWeight: FontWeight.w700)),
                        Text('Tông màu: Đen Tự Nhiên • Độ dài: 8cm', style: AppTheme.bodySmall(fontSize: 11, color: AppTheme.textSecondary)),
                      ],
                    ),
                  ),
                  const Icon(Icons.check_circle_rounded, color: AppTheme.accentGold, size: 18),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('ĐÓNG', style: AppTheme.bodyMedium(color: AppTheme.accentGold, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}

typedef ProfilePage = ProfileScreen;
