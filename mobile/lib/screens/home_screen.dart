import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/service.dart';
import '../models/product.dart';
import '../models/order.dart';
import '../services/api_service.dart';
import 'booking_screen.dart';
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
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final services = await ApiService.fetchServices();
    final products = await ApiService.fetchProducts();

    setState(() {
      featuredServices = services.take(3).toList();
      featuredProducts = products.take(4).toList();
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
        title: const Text('Cấu Hình Live Server', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Địa chỉ IP của Live Server đồng bộ:', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
            const SizedBox(height: 8),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
            ),
            const SizedBox(height: 8),
            const Text('• Android Emulator: http://10.0.2.2:8080/api\n• Máy tính / iOS: http://127.0.0.1:8080/api\n• Điện thoại thật: http://IP_WIFI_CUA_BAN:8080/api', style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Đóng')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFB48312), foregroundColor: Colors.white),
            onPressed: () {
              ApiService.setBaseUrl(controller.text.trim());
              Navigator.of(ctx).pop();
              _loadData();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Đã cập nhật Live Server: ${controller.text.trim()}')),
              );
            },
            child: const Text('Lưu'),
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
                color: const Color(0xFFB48312),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text('OS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14)),
            ),
            const SizedBox(width: 8),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Omni Salon', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 16)),
                Text('Nghệ Thuật Chăm Sóc Tóc', style: TextStyle(fontSize: 10, color: Color(0xFFB48312), fontWeight: FontWeight.w700)),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_ethernet, color: Color(0xFF64748B)),
            tooltip: 'Cài đặt Live Server',
            onPressed: _showServerConfigDialog,
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
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // ==========================================
                  // 1. BANNER CHÍNH (HERO CARD)
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
                            '✨ CHUẨN MỰC TẠO MẪU 5 SAO',
                            style: TextStyle(color: Color(0xFFFBBF24), fontSize: 11, fontWeight: FontWeight.w800),
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Trải Nghiệm Dịch Vụ\nĐẳng Cấp Cùng Omni Salon',
                          style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900, height: 1.3),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Đội ngũ nghệ nhân bậc thầy, phục hồi chuyên sâu và công nghệ AI tạo kiểu tóc độc quyền.',
                          style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 13, height: 1.5),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFB48312),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const BookingScreen()),
                            );
                          },
                          child: const Text('📅 Đặt Lịch Hẹn Ngay →', style: TextStyle(fontWeight: FontWeight.w800)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // ==========================================
                  // 2. CỤM 4 NÚT TIỆN ÍCH NHANH
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
                      const SizedBox(width: 10),
                      _buildQuickActionBtn(
                        icon: Icons.assignment_outlined,
                        label: 'Lịch Của Tôi',
                        color: const Color(0xFF0F172A),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const MyBookingsScreen()),
                          );
                        },
                      ),
                      const SizedBox(width: 10),
                      _buildQuickActionBtn(
                        icon: Icons.storefront_outlined,
                        label: 'Cửa Hàng',
                        color: const Color(0xFFBE4D25),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => ShopScreen(sharedCart: sharedCart, onAddToCart: _onAddToCart),
                            ),
                          ).then((_) => setState(() {}));
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // ==========================================
                  // 3. MENU DỊCH VỤ NỔI BẬT
                  // ==========================================
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Dịch Vụ Tiêu Biểu', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF0F172A))),
                      TextButton(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const BookingScreen()),
                          );
                        },
                        child: const Text('Xem tất cả →', style: TextStyle(color: Color(0xFFB48312), fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ...featuredServices.map((s) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 8, offset: Offset(0, 3))],
                      ),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.network(
                              s.image,
                              width: 72,
                              height: 72,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(width: 72, height: 72, color: const Color(0xFFF1F3F6)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(s.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: Color(0xFF0F172A))),
                                const SizedBox(height: 4),
                                Text(currencyFormat.format(s.price), style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFBE4D25), fontSize: 14)),
                                const SizedBox(height: 2),
                                Text('⏱️ ${s.duration} phút chuẩn mực', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                              ],
                            ),
                          ),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFB48312),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
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
                  // 4. MỸ PHẨM CHÍNH HÃNG & FLASH SALE
                  // ==========================================
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Mỹ Phẩm Chăm Sóc Tóc', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF0F172A))),
                      TextButton(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => ShopScreen(sharedCart: sharedCart, onAddToCart: _onAddToCart),
                            ),
                          ).then((_) => setState(() {}));
                        },
                        child: const Text('Xem tất cả →', style: TextStyle(color: Color(0xFFB48312), fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.72,
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
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(10),
                                  child: Image.network(
                                    p.image,
                                    height: 110,
                                    width: double.infinity,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => Container(height: 110, color: const Color(0xFFF1F3F6)),
                                  ),
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
                                      child: Text(p.flashSaleBadge, style: const TextStyle(color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.w900)),
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
                              height: 30,
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
                                child: const Text('🛒 Thêm Giỏ', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800)),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 40),
                ],
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
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 6, offset: Offset(0, 2))],
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 26),
              const SizedBox(height: 6),
              Text(label, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Color(0xFF0F172A))),
            ],
          ),
        ),
      ),
    );
  }
}
