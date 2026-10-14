import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/product.dart';
import '../models/order.dart';
import '../services/api_service.dart';
import '../widgets/omni_image.dart';
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
    {'id': 'DM01', 'name': 'Sáp & Clay'},
    {'id': 'DM02', 'name': 'Pomade'},
    {'id': 'DM03', 'name': 'Pre-Styling'},
    {'id': 'DM04', 'name': 'Gôm Xịt Tóc'},
    {'id': 'DM05', 'name': 'Dầu Gội & Xả'},
    {'id': 'DM06', 'name': 'Bột Tạo Phồng'},
    {'id': 'DM07', 'name': 'Uốn & Ép Side'},
    {'id': 'DM08', 'name': 'Dưỡng Râu'},
    {'id': 'DM09', 'name': 'Dụng Cụ'},
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

  void _showProductDetails(Product p) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: const Color(0xFFCBD5E1), borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 16),
            OmniImage(
              imageUrl: p.image,
              height: 220,
              width: double.infinity,
              borderRadius: BorderRadius.circular(16),
              fit: BoxFit.contain,
              fallbackIcon: Icons.shopping_bag,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(p.brand, style: const TextStyle(color: Color(0xFFB48312), fontWeight: FontWeight.w800, fontSize: 11)),
                ),
                if (p.hasDiscount) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(p.flashSaleBadge, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11)),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 8),
            Text(p.name, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF0F172A))),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(currencyFormat.format(p.actualPrice), style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFBE4D25), fontSize: 22)),
                if (p.originalPrice > p.actualPrice) ...[
                  const SizedBox(width: 10),
                  Text(currencyFormat.format(p.originalPrice), style: const TextStyle(decoration: TextDecoration.lineThrough, color: Color(0xFF94A3B8), fontSize: 14)),
                ],
              ],
            ),
            const SizedBox(height: 12),
            const Text('Mô tả sản phẩm:', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Color(0xFF0F172A))),
            const SizedBox(height: 4),
            Text(p.description, style: const TextStyle(color: Color(0xFF64748B), fontSize: 13, height: 1.4)),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F172A),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {
                  widget.onAddToCart(OrderItem(
                    productId: p.id,
                    name: p.name,
                    price: p.actualPrice,
                    quantity: 1,
                    image: p.image,
                  ));
                  Navigator.of(ctx).pop();
                  setState(() {});
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Đã thêm ${p.name} vào giỏ hàng!'), duration: const Duration(seconds: 1)),
                  );
                },
                child: const Text('Thêm Vào Giỏ Hàng', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
              ),
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
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
          // 1. THANH TÌM KIẾM SẢN PHẨM
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            color: Colors.white,
            child: TextField(
              controller: searchController,
              onChanged: (_) => _loadProducts(),
              decoration: InputDecoration(
                hintText: 'Tìm kiếm sáp vuốt, pomade, gôm xịt, Reuzel...',
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

          // 2. THANH LỌC DANH MỤC DM01 - DM09
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

          // 3. LƯỚI SẢN PHẨM 2 CỘT
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
                          childAspectRatio: 0.63,
                          crossAxisSpacing: 14,
                          mainAxisSpacing: 14,
                        ),
                        itemCount: products.length,
                        itemBuilder: (context, idx) {
                          final p = products[idx];

                          return InkWell(
                            onTap: () => _showProductDetails(p),
                            borderRadius: BorderRadius.circular(16),
                            child: Container(
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
                                      OmniImage(
                                        imageUrl: p.image,
                                        height: 130,
                                        width: double.infinity,
                                        fit: BoxFit.cover,
                                        borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                                        fallbackIcon: Icons.shopping_bag,
                                      ),
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
                                              child: const Text('Thêm Giỏ', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
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
