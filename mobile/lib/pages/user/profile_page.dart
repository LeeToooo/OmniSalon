import 'package:omni_salon_mobile/core/auth/auth_service.dart';
import 'package:flutter/material.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';
import 'package:omni_salon_mobile/pages/auth/login_page.dart';
import 'package:omni_salon_mobile/pages/user/my_bookings_page.dart';
import 'package:omni_salon_mobile/pages/user/branches_page.dart';
import 'package:omni_salon_mobile/pages/user/stylists_page.dart';
import 'package:omni_salon_mobile/pages/admin/admin_portal_page.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
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
          'Hồ Sơ Hội Viên',
          style: AppTheme.headingSmall(fontSize: 18),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Thẻ thông tin khách hàng (Editorial Member Card)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.charcoal,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.35), width: 1.2),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.charcoal.withValues(alpha: 0.15),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
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
                            style: AppTheme.headingMedium(color: AppTheme.charcoal, fontSize: 22),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                isLoggedIn ? user!.fullName : 'Quý Khách Hàng',
                                style: AppTheme.headingSmall(color: AppTheme.textLight, fontSize: 18),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                isLoggedIn
                                    ? (user!.phone.isNotEmpty ? user.phone : user.email)
                                    : 'Chưa đăng nhập tài khoản',
                                style: AppTheme.bodySmall(color: AppTheme.textLightSecondary),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.accentGold.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: AppTheme.accentGold),
                          ),
                          child: Text(
                            isLoggedIn ? 'GOLD VIP' : 'GUEST',
                            style: AppTheme.labelUppercase(fontSize: 9.5, color: AppTheme.accentGold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    const Divider(color: AppTheme.charcoalBorder, height: 1),
                    const SizedBox(height: 14),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStatCol('ĐIỂM THƯỞNG', isLoggedIn ? '450 pts' : '--'),
                        Container(width: 1, height: 26, color: AppTheme.charcoalBorder),
                        _buildStatCol('LỊCH ĐÃ CẮT', isLoggedIn ? '8 Lần' : '--'),
                        Container(width: 1, height: 26, color: AppTheme.charcoalBorder),
                        _buildStatCol('BẢO HÀNH', '7 Ngày'),
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
                            setState(() {});
                          },
                          child: const Text('ĐĂNG NHẬP / ĐĂNG KÝ NGAY'),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              if (isLoggedIn && (user?.role == 'SUPER_ADMIN' || user?.role == 'ADMIN' || user?.role == 'BRANCH_MANAGER' || user?.role == 'Quản trị viên' || user?.role == 'Quản lý' || user?.phone == 'admin')) ...[
                Text(
                  'QUẢN TRỊ VIÊN',
                  style: AppTheme.labelUppercase(fontSize: 11, color: AppTheme.accentGold),
                ),
                const SizedBox(height: 8),
                _buildOptionTile(
                  icon: Icons.admin_panel_settings_outlined,
                  title: 'Trung tâm Quản trị Omni Portal',
                  subtitle: 'Báo cáo doanh thu, duyệt lịch hẹn, kho FEFO & POS',
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const AdminHubScreen()),
                    );
                  },
                ),
                const SizedBox(height: 16),
              ],

              // Danh mục tùy chọn (Settings & Actions)
              Text(
                'TIỆN ÍCH HỘI VIÊN',
                style: AppTheme.labelUppercase(fontSize: 11, color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 8),

              _buildOptionTile(
                icon: Icons.calendar_month_outlined,
                title: 'Lịch hẹn & Đơn hàng của tôi',
                subtitle: 'Tra cứu, mã vé QR check-in hoặc hủy hẹn',
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
                subtitle: 'Khám phá các tay kéo cừ khôi và đặt lịch trực tiếp',
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const StylistsScreen()),
                  );
                },
              ),

              _buildOptionTile(
                icon: Icons.storefront_outlined,
                title: 'Hệ thống 20 chi nhánh Omni Salon',
                subtitle: 'Địa chỉ, số điện thoại & giờ mở cửa đón khách',
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const BranchesScreen()),
                  );
                },
              ),

              _buildOptionTile(
                icon: Icons.auto_awesome_outlined,
                title: 'Bộ sưu tập phom tóc AI của tôi',
                subtitle: 'Xem lại các mẫu tóc 3D đã thử nghiệm và lưu lại',
                onTap: () {
                  _showAiGalleryDialog(context);
                },
              ),

              _buildOptionTile(
                icon: Icons.shield_moon_outlined,
                title: 'Chính sách bảo hành kiểu tóc 7 ngày',
                subtitle: 'Miễn phí 100% chỉnh sửa và gội sấy trong tuần đầu',
                onTap: () {
                  _showWarrantyDialog(context);
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
          style: AppTheme.labelUppercase(fontSize: 9.5, color: AppTheme.textLightSecondary),
        ),
      ],
    );
  }

  Widget _buildOptionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
        leading: Icon(icon, color: AppTheme.accentGold, size: 22),
        title: Text(title, style: AppTheme.bodyMedium(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle, style: AppTheme.bodySmall(color: AppTheme.textSecondary)),
        trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppTheme.textSecondary),
        onTap: onTap,
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
