import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/service.dart';
import '../models/product.dart';
import '../models/branch.dart';
import '../models/order.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../widgets/omni_image.dart';
import '../widgets/auth_modal.dart';
import 'booking_screen.dart';
import 'services_screen.dart';
import 'branches_screen.dart';
import 'shop_screen.dart';
import 'my_bookings_screen.dart';
import 'cart_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0);
  final List<OrderItem> sharedCart = [];

  List<SalonService> featuredServices = [];
  List<Product> featuredProducts = [];
  List<Branch> featuredBranches = [];
  bool isLoading = true;
  bool isConnectedToSql = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => isLoading = true);
    final health = await ApiService.checkHealth();
    final services = await ApiService.fetchServices();
    final products = await ApiService.fetchProducts();
    final branches = await ApiService.fetchBranches();

    if (!mounted) return;
    setState(() {
      isConnectedToSql = health['sqlConnected'] == true || health['status'] == 'healthy';
      featuredServices = services.take(4).toList();
      featuredProducts = products.take(4).toList();
      featuredBranches = branches.take(6).toList();
      isLoading = false;
    });
  }

  void _onAddToCart(OrderItem item) {
    setState(() {
      final existingIndex = sharedCart.indexWhere((i) => i.productId == item.productId);
      if (existingIndex != -1) {
        final ex = sharedCart[existingIndex];
        sharedCart[existingIndex] = OrderItem(
          productId: ex.productId,
          name: ex.name,
          price: ex.price,
          quantity: ex.quantity + item.quantity,
          image: ex.image,
        );
      } else {
        sharedCart.add(item);
      }
    });
  }

  void _showServerConfigDialog() {
    final controller = TextEditingController(text: ApiService.baseUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Row(
          children: [
            Icon(Icons.dns, color: Color(0xFFB48312)),
            SizedBox(width: 8),
            Text(
              'Cấu Hình Máy Chủ SQL',
              style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 16),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Địa chỉ API kết nối SQL Server (Node.js REST Engine):',
              style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Gợi ý cổng máy chủ:\n• Android Emulator: http://10.0.2.2:3000/api\n• Máy tính Windows / Web: http://localhost:3000/api\n• Điện thoại thật (Wi-Fi): http://IP_MAY_TINH:3000/api',
              style: TextStyle(fontSize: 11, color: Color(0xFF64748B), height: 1.4),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Đóng')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFB48312),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () {
              ApiService.setBaseUrl(controller.text.trim());
              Navigator.of(ctx).pop();
              _loadData();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Đã cập nhật máy chủ: ${controller.text.trim()}')),
              );
            },
            child: const Text('Lưu & Kết Nối'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cartCount = sharedCart.fold<int>(0, (sum, i) => sum + i.quantity);

    return Scaffold(
      backgroundColor: const Color(0xFFF1F3F6),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFFB48312), Color(0xFFD97706)]),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('OMNI', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1)),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Omni Salon Barber', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 16)),
                Row(
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: BoxDecoration(
                        color: isConnectedToSql ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      isConnectedToSql ? 'Live SQL Server' : 'Local Standby',
                      style: TextStyle(
                        fontSize: 10,
                        color: isConnectedToSql ? const Color(0xFF059669) : const Color(0xFFD97706),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_ethernet, color: Color(0xFF64748B)),
            tooltip: 'Cài đặt IP Live Server',
            onPressed: _showServerConfigDialog,
          ),
          ValueListenableBuilder<UserModel?>(
            valueListenable: AuthService.userNotifier,
            builder: (context, user, _) {
              if (user != null) {
                return PopupMenuButton<String>(
                  tooltip: 'Tài khoản: ${user.fullName}',
                  icon: CircleAvatar(
                    radius: 14,
                    backgroundColor: const Color(0xFFB48312),
                    child: Text(
                      user.fullName.isNotEmpty ? user.fullName[0].toUpperCase() : 'U',
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                  onSelected: (val) {
                    if (val == 'logout') {
                      AuthService.logout();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Đã đăng xuất tài khoản')),
                      );
                    }
                  },
                  itemBuilder: (ctx) => [
                    PopupMenuItem(
                      enabled: false,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(user.fullName, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                          const SizedBox(height: 2),
                          Text('${user.roleName} • ${user.phone}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                        ],
                      ),
                    ),
                    const PopupMenuDivider(),
                    const PopupMenuItem(
                      value: 'logout',
                      child: Row(
                        children: [
                          Icon(Icons.logout, size: 18, color: Colors.red),
                          SizedBox(width: 8),
                          Text('Đăng Xuất', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ],
                );
              }
              return IconButton(
                icon: const Icon(Icons.account_circle_outlined, color: Color(0xFFB48312)),
                tooltip: 'Đăng Nhập / Đăng Ký',
                onPressed: () => AuthModal.show(context),
              );
            },
          ),
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_bag_outlined, color: Color(0xFF0F172A)),
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => CartScreen(cartItems: sharedCart)),
                  ).then((_) => setState(() {}));
                },
              ),
              if (cartCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Color(0xFFBE4D25),
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                    child: Text(
                      '$cartCount',
                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFB48312)))
          : RefreshIndicator(
              color: const Color(0xFFB48312),
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ==========================================
                    // 0. KHỐI THÀNH VIÊN / ĐĂNG NHẬP ĐỒNG BỘ SQL
                    // ==========================================
                    ValueListenableBuilder<UserModel?>(
                      valueListenable: AuthService.userNotifier,
                      builder: (context, user, _) {
                        if (user != null) {
                          return Container(
                            margin: const EdgeInsets.only(bottom: 14),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                              ),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: const Color(0xFFB48312).withValues(alpha: 0.5)),
                              boxShadow: [
                                BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 6, offset: const Offset(0, 3)),
                              ],
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: const BoxDecoration(
                                    gradient: LinearGradient(colors: [Color(0xFFB48312), Color(0xFFD4AF37)]),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.stars, color: Colors.black, size: 20),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Xin chào, ${user.fullName}!',
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        '${user.roleName} • ${user.phone}',
                                        style: TextStyle(color: Colors.amber.shade300, fontSize: 11.5, fontWeight: FontWeight.w600),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF10B981).withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: const Color(0xFF10B981)),
                                  ),
                                  child: const Text('Live SQL', style: TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.w800)),
                                ),
                              ],
                            ),
                          );
                        }

                        return Container(
                          margin: const EdgeInsets.only(bottom: 14),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 6, offset: const Offset(0, 2)),
                            ],
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEF3C7),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(Icons.person_pin, color: Color(0xFFB48312), size: 24),
                              ),
                              const SizedBox(width: 10),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Tài khoản Khách Hàng', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Color(0xFF0F172A))),
                                    Text('Đăng nhập chung CSDL SQL Server với Web', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                                  ],
                                ),
                              ),
                              ElevatedButton(
                                onPressed: () => AuthModal.show(context),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFB48312),
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                child: const Text('Đăng Nhập', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
                              ),
                            ],
                          ),
                        );
                      },
                    ),

                    // ==========================================
                    // 1. BANNER CHÍNH SANG TRỌNG (HERO CARD)
                    // ==========================================
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: const [BoxShadow(color: Color(0x1F000000), blurRadius: 12, offset: Offset(0, 6))],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0x33B48312),
                              borderRadius: BorderRadius.circular(9999),
                              border: Border.all(color: const Color(0x66B48312)),
                            ),
                            child: const Text(
                              'ĐẲNG CẤP BARBER QUỐC TẾ',
                              style: TextStyle(color: Color(0xFFFBBF24), fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'Omni Salon Barber\nNâng Tầm Phong Cách Phái Mạnh',
                            style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900, height: 1.3),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            '20 chi nhánh toàn quốc • Đội ngũ Master Barber tay kéo vàng • Đồng bộ CSDL trực tiếp.',
                            style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 12.5, height: 1.4),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFB48312),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 11),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                onPressed: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(builder: (_) => const BookingScreen()),
                                  );
                                },
                                child: const Text('Đặt Lịch Ngay', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                              ),
                              const SizedBox(width: 10),
                              OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: Color(0xFFB48312)),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                onPressed: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(builder: (_) => const ServicesScreen()),
                                  );
                                },
                                child: const Text('Xem Bảng Giá', style: TextStyle(color: Color(0xFFFBBF24), fontWeight: FontWeight.w800, fontSize: 13)),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ==========================================
                    // 2. CỤM 4 TIỆN ÍCH NHANH CHUẨN BARBER
                    // ==========================================
                    Row(
                      children: [
                        _buildQuickActionBtn(
                          icon: Icons.calendar_today,
                          label: 'Đặt Lịch',
                          color: const Color(0xFFB48312),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const BookingScreen()),
                            );
                          },
                        ),
                        const SizedBox(width: 8),
                        _buildQuickActionBtn(
                          icon: Icons.content_cut,
                          label: 'Dịch Vụ',
                          color: const Color(0xFFBE4D25),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const ServicesScreen()),
                            );
                          },
                        ),
                        const SizedBox(width: 8),
                        _buildQuickActionBtn(
                          icon: Icons.store_mall_directory_outlined,
                          label: 'Chi Nhánh',
                          color: const Color(0xFF0F172A),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const BranchesScreen()),
                            );
                          },
                        ),
                        const SizedBox(width: 8),
                        _buildQuickActionBtn(
                          icon: Icons.assignment_outlined,
                          label: 'Lịch Hẹn',
                          color: const Color(0xFF059669),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const MyBookingsScreen()),
                            );
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 26),

                    // ==========================================
                    // 3. DỊCH VỤ & COMBO QUÝ TỘC NỔI BẬT
                    // ==========================================
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Dịch Vụ & Combo Tiêu Biểu',
                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17, color: Color(0xFF0F172A)),
                        ),
                        TextButton(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const ServicesScreen()),
                            );
                          },
                          child: const Text('Xem tất cả', style: TextStyle(color: Color(0xFFB48312), fontWeight: FontWeight.w800)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ...featuredServices.map((s) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: s.isCombo ? const Color(0xFFFDE68A) : const Color(0xFFE2E8F0)),
                          boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 6, offset: Offset(0, 2))],
                        ),
                        child: Row(
                          children: [
                            OmniImage(
                              imageUrl: s.image,
                              width: 76,
                              height: 76,
                              fit: BoxFit.cover,
                              borderRadius: BorderRadius.circular(12),
                              fallbackIcon: Icons.content_cut,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    s.name,
                                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5, color: Color(0xFF0F172A)),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    currencyFormat.format(s.price),
                                    style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFBE4D25), fontSize: 14.5),
                                  ),
                                  const SizedBox(height: 2),
                                  Text('Thời lượng: ${s.duration} phút', style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
                                ],
                              ),
                            ),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFB48312),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (_) => BookingScreen(preselectedServiceId: s.id)),
                                );
                              },
                              child: const Text('Đặt Lịch', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                            ),
                          ],
                        ),
                      );
                    }),
                    const SizedBox(height: 20),

                    // ==========================================
                    // 4. HỆ THỐNG 20 CHI NHÁNH
                    // ==========================================
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Hệ Thống 20 Chi Nhánh',
                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17, color: Color(0xFF0F172A)),
                        ),
                        TextButton(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const BranchesScreen()),
                            );
                          },
                          child: const Text('Xem tất cả', style: TextStyle(color: Color(0xFFB48312), fontWeight: FontWeight.w800)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 185,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: featuredBranches.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 12),
                        itemBuilder: (context, idx) {
                          final b = featuredBranches[idx];
                          return InkWell(
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => BookingScreen(preselectedBranchId: b.id)),
                              );
                            },
                            borderRadius: BorderRadius.circular(14),
                            child: Container(
                              width: 170,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  OmniImage(
                                    imageUrl: b.image,
                                    height: 95,
                                    width: double.infinity,
                                    fit: BoxFit.cover,
                                    borderRadius: const BorderRadius.vertical(top: Radius.circular(13)),
                                    fallbackIcon: Icons.storefront,
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(8),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          b.name,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: Color(0xFF0F172A), height: 1.2),
                                        ),
                                        const SizedBox(height: 3),
                                        Text(
                                          b.hours,
                                          style: const TextStyle(fontSize: 10, color: Color(0xFFB48312), fontWeight: FontWeight.w700),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 24),

                    // ==========================================
                    // 5. MỸ PHẨM CHĂM SÓC TÓC CHÍNH HÃNG
                    // ==========================================
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Mỹ Phẩm Bán Chạy & Flash Sale',
                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17, color: Color(0xFF0F172A)),
                        ),
                        TextButton(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => ShopScreen(sharedCart: sharedCart, onAddToCart: _onAddToCart),
                              ),
                            ).then((_) => setState(() {}));
                          },
                          child: const Text('Xem tất cả', style: TextStyle(color: Color(0xFFB48312), fontWeight: FontWeight.w800)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.63,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                      ),
                      itemCount: featuredProducts.length,
                      itemBuilder: (context, idx) {
                        final p = featuredProducts[idx];
                        return Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Stack(
                                children: [
                                  OmniImage(
                                    imageUrl: p.image,
                                    height: 110,
                                    width: double.infinity,
                                    fit: BoxFit.cover,
                                    borderRadius: BorderRadius.circular(10),
                                    fallbackIcon: Icons.shopping_bag,
                                  ),
                                  if (p.hasDiscount)
                                    Positioned(
                                      top: 4,
                                      right: 4,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFEF4444),
                                          borderRadius: BorderRadius.circular(9999),
                                        ),
                                        child: Text(
                                          p.flashSaleBadge,
                                          style: const TextStyle(color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.w900),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(p.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12.5, color: Color(0xFF0F172A))),
                              const Spacer(),
                              Text(currencyFormat.format(p.actualPrice), style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFBE4D25), fontSize: 14)),
                              const SizedBox(height: 6),
                              SizedBox(
                                width: double.infinity,
                                height: 32,
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF0F172A),
                                    foregroundColor: Colors.white,
                                    padding: EdgeInsets.zero,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  onPressed: () {
                                    _onAddToCart(OrderItem(
                                      productId: p.id,
                                      name: p.name,
                                      price: p.actualPrice,
                                      quantity: 1,
                                      image: p.image,
                                    ));
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('Đã thêm ${p.name} vào giỏ hàng!'), duration: const Duration(seconds: 1)),
                                    );
                                  },
                                  child: const Text('Thêm Giỏ', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800)),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 30),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildQuickActionBtn({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: const [BoxShadow(color: Color(0x06000000), blurRadius: 4, offset: Offset(0, 2))],
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 24),
              const SizedBox(height: 4),
              Text(
                label,
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11.5, color: Color(0xFF0F172A)),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
