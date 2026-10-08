import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/product.dart';
import '../models/order.dart';
import '../services/api_service.dart';
import 'cart_screen.dart';

class ShopScreen extends StatefulWidget {
  final List<OrderItem> sharedCart;
  final Function(OrderItem) onAddToCart;

  const ShopScreen({
    super.key,
    required this.sharedCart,
    required this.onAddToCart,
  });

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0);
  final searchController = TextEditingController();

  List<Product> products = [];
  bool isLoading = true;
  String selectedCategory = 'all';

  final categories = [
    {'id': 'all', 'name': 'Tất Cả'},
    {'id': 'DM04', 'name': 'Sáp & Pomade'},
    {'id': 'DM05', 'name': 'Gôm Xịt Tóc'},
    {'id': 'DM01', 'name': 'Dầu Gội & Xả'},
    {'id': 'DM06', 'name': 'Màu Nhuộm'},
  ];

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    setState(() => isLoading = true);
    final list = await ApiService.fetchProducts(
      query: searchController.text.trim(),
      category: selectedCategory,
    );
    setState(() {
      products = list;
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final cartCount = widget.sharedCart.fold<int>(0, (sum, i) => sum + i.quantity);

    return Scaffold(
      backgroundColor: const Color(0xFFF1F3F6),
      appBar: AppBar(
        title: const Text('Cửa Hàng Mỹ Phẩm Tóc', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 18)),
        backgroundColor: Colors.white,
        elevation: 1,
        iconTheme: const IconThemeData(color: Color(0xFF0F172A)),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_bag_outlined),
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => CartScreen(cartItems: widget.sharedCart)),
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
      body: Column(
        children: [
          // ==========================================
          // 1. THANH TÌM KIẾM SẢN PHẨM (CLO 3.5 Rubric - 0.25đ)
          // ==========================================
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            color: Colors.white,
            child: TextField(
              controller: searchController,
              onChanged: (_) => _loadProducts(),
              decoration: InputDecoration(
                hintText: 'Tìm kiếm sản phẩm, sáp vuốt, gôm xịt...',
                prefixIcon: const Icon(Icons.search, color: Color(0xFF64748B)),
                suffixIcon: searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          searchController.clear();
                          _loadProducts();
                        },
                      )
                    : null,
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(9999),
                  borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(9999),
                  borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                ),
              ),
            ),
          ),

          // ==========================================
          // 2. THANH LỌC DANH MỤC
          // ==========================================
          Container(
            height: 48,
            color: Colors.white,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemCount: categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, idx) {
                final cat = categories[idx];
                final isSel = selectedCategory == cat['id'];
                return Center(
                  child: ChoiceChip(
                    label: Text(
                      cat['name']!,
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 12.5,
                        color: isSel ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    selected: isSel,
                    selectedColor: const Color(0xFFB48312),
                    backgroundColor: const Color(0xFFF1F3F6),
                    side: BorderSide(color: isSel ? const Color(0xFFB48312) : const Color(0xFFCBD5E1)),
                    onSelected: (val) {
                      setState(() => selectedCategory = cat['id']!);
                      _loadProducts();
                    },
                  ),
                );
              },
            ),
          ),
          const Divider(height: 1),

          // ==========================================
          // 3. LƯỚI SẢN PHẨM (2 CỘT CÂN ĐỐI)
          // ==========================================
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFFB48312)))
                : products.isEmpty
                    ? Center(
                        child: Text(
                          'Không tìm thấy sản phẩm nào.',
                          style: TextStyle(fontWeight: FontWeight.w700, color: Colors.grey.shade600),
                        ),
                      )
                    : GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.65,
                          crossAxisSpacing: 14,
                          mainAxisSpacing: 14,
                        ),
                        itemCount: products.length,
                        itemBuilder: (context, idx) {
                          final p = products[idx];

                          return Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                              boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 8, offset: Offset(0, 3))],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Ảnh & Huy hiệu Flash Sale
                                Stack(
                                  children: [
                                    ClipRRect(
                                      borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                                      child: Image.network(
                                        p.image,
                                        height: 130,
                                        width: double.infinity,
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, __, ___) => Container(
                                          height: 130,
                                          color: const Color(0xFFF1F3F6),
                                          child: const Icon(Icons.image_not_supported, color: Color(0xFF94A3B8)),
                                        ),
                                      ),
                                    ),
                                    // BẢO MẬT CHÍNH SÁCH CẬN DATE: CHỈ HIỆN ⚡ FLASH SALE
                                    if (p.hasDiscount)
                                      Positioned(
                                        top: 8,
                                        right: 8,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFEF4444),
                                            borderRadius: BorderRadius.circular(9999),
                                          ),
                                          child: Text(
                                            p.flashSaleBadge,
                                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 10),
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                Expanded(
                                  child: Padding(
                                    padding: const EdgeInsets.all(10),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          p.brand,
                                          style: const TextStyle(color: Color(0xFFB48312), fontSize: 10.5, fontWeight: FontWeight.w800),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          p.name,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Color(0xFF0F172A), height: 1.25),
                                        ),
                                        const Spacer(),
                                        Text(
                                          currencyFormat.format(p.actualPrice),
                                          style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFBE4D25), fontSize: 15),
                                        ),
                                        if (p.originalPrice > p.actualPrice)
                                          Text(
                                            currencyFormat.format(p.originalPrice),
                                            style: const TextStyle(decoration: TextDecoration.lineThrough, color: Color(0xFF94A3B8), fontSize: 11),
                                          ),
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
                                              widget.onAddToCart(OrderItem(
                                                productId: p.id,
                                                name: p.name,
                                                price: p.actualPrice,
                                                quantity: 1,
                                                image: p.image,
                                              ));
                                              setState(() {});
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                SnackBar(
                                                  content: Text('Đã thêm ${p.name} vào giỏ hàng!'),
                                                  duration: const Duration(seconds: 1),
                                                ),
                                              );
                                            },
                                            child: const Text('🛒 Thêm Giỏ', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
