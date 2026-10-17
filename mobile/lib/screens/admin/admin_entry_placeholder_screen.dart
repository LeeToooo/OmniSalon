import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../services/auth_service.dart';

class AdminEntryPlaceholderScreen extends StatelessWidget {
  const AdminEntryPlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = AuthService.currentUser;
    final isAdminRole = user != null &&
        (user.role == 'ADMIN' ||
            user.role == 'SUPER_ADMIN' ||
            user.role == 'BRANCH_MANAGER' ||
            user.username == 'admin');

    return Scaffold(
      backgroundColor: AppTheme.charcoal,
      appBar: AppBar(
        backgroundColor: AppTheme.charcoal,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: AppTheme.textLight),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Omni Admin Portal',
          style: AppTheme.headingSmall(color: AppTheme.textLight, fontSize: 18),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Badge trạng thái phân hệ
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppTheme.accentGold.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.4)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.shield_outlined, size: 14, color: AppTheme.accentGold),
                    const SizedBox(width: 6),
                    Text(
                      'KHU VỰC QUẢN TRỊ HỆ THỐNG',
                      style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.accentGold),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              Text(
                'Trung Tâm Điều Hành Chuỗi Salon',
                style: AppTheme.headingLarge(fontSize: 26, color: AppTheme.textLight),
              ),
              const SizedBox(height: 8),

              Text(
                'Lối vào phân hệ quản trị dành riêng cho Ban điều hành, Quản lý chi nhánh và Thu ngân chuỗi Omni Salon.',
                style: AppTheme.bodyMedium(color: AppTheme.textLightSecondary),
              ),
              const SizedBox(height: 24),

              // Thông tin tài khoản hiện tại
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.charcoalLight,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isAdminRole ? AppTheme.accentGold : AppTheme.charcoalBorder,
                    width: 1.2,
                  ),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: isAdminRole ? AppTheme.accentGold : AppTheme.charcoalSurface,
                      child: Icon(
                        isAdminRole ? Icons.admin_panel_settings_rounded : Icons.person_rounded,
                        color: isAdminRole ? AppTheme.charcoal : AppTheme.textLightSecondary,
                        size: 26,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.fullName ?? 'Chưa đăng nhập',
                            style: AppTheme.bodyLarge(color: AppTheme.textLight, fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            user != null
                                ? 'Vai trò: ${user.roleName} (${user.role})'
                                : 'Vui lòng đăng nhập bằng tài khoản Quản trị',
                            style: AppTheme.bodySmall(
                              color: isAdminRole ? AppTheme.accentGold : AppTheme.textLightSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Xem trước thống kê vận hành thời gian thực (Preview Dashboard Metrics)
              Text(
                'TỔNG QUAN VẬN HÀNH HÔM NAY',
                style: AppTheme.labelUppercase(fontSize: 11, color: AppTheme.accentGold),
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: _buildMetricCard(
                      title: 'Lịch hẹn hôm nay',
                      value: '28 Cuộc hẹn',
                      sub: '18 Đã hoàn tất • 4 Đang phục vụ',
                      icon: Icons.calendar_today_rounded,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildMetricCard(
                      title: 'Doanh thu ngày',
                      value: '8.450.000 ₫',
                      sub: '+14% so với hôm qua',
                      icon: Icons.payments_outlined,
                      highlightValue: true,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: _buildMetricCard(
                      title: 'Thợ trực ca',
                      value: '8 Master Barber',
                      sub: '100% Đúng giờ',
                      icon: Icons.content_cut_rounded,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildMetricCard(
                      title: 'Cơ sở dữ liệu',
                      value: 'SQL Server',
                      sub: 'Đồng bộ thời gian thực',
                      icon: Icons.storage_rounded,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Banner thông báo tiến độ phát triển
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.charcoalLight,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.charcoalBorder),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.info_outline_rounded, color: AppTheme.accentGold, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Phân hệ Quản trị Chuyên sâu',
                            style: AppTheme.bodyMedium(color: AppTheme.textLight, fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Toàn bộ màn hình quản lý lịch hẹn, điều phối thợ barber, doanh thu báo cáo và kho mỹ phẩm sẽ được triển khai chi tiết ở giai đoạn tiếp theo.',
                            style: AppTheme.bodySmall(color: AppTheme.textLightSecondary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Nút quay lại ứng dụng khách hàng
              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.textLight,
                    side: const BorderSide(color: AppTheme.accentGold, width: 1.2),
                  ),
                  child: Text(
                    '← Quay Lại Ứng Dụng Khách Hàng',
                    style: AppTheme.bodyMedium(color: AppTheme.accentGold, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required String sub,
    required IconData icon,
    bool highlightValue = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.charcoalLight,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.charcoalBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: AppTheme.bodySmall(color: AppTheme.textLightSecondary, fontWeight: FontWeight.w600),
              ),
              Icon(icon, size: 16, color: AppTheme.accentGold),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: AppTheme.headingSmall(
              fontSize: 16,
              color: highlightValue ? AppTheme.accentGold : AppTheme.textLight,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            sub,
            style: AppTheme.bodySmall(fontSize: 11, color: AppTheme.textLightSecondary),
          ),
        ],
      ),
    );
  }
}
