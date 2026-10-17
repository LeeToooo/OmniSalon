import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../models/product.dart';
import '../models/order.dart';
import '../services/api_service.dart';
import '../widgets/editorial_image.dart';
import 'cart_screen.dart';

class ShopScreen extends StatefulWidget {
  final List<OrderItem> cartItems;
  final Function(OrderItem) onAddToCart;

  const ShopScreen({
    super.key,
    required this.cartItems,
    required this.onAddToCart,
  });

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫', decimalDigits: 0);
  final _searchController = TextEditingController();

  List<Product> _products = [];
  bool _isLoading = true;
  String _selectedCategory = 'all';

  final _categories = [
    {'id': 'all', 'name': 'Tất Cả'},
    {'id': 'DM01', 'name': 'Sáp & Clay'},
    {'id': 'DM02', 'name': 'Pomade'},
    {'id': 'DM03', 'name': 'Pre-Styling'},
    {'id': 'DM05', 'name': 'Dầu Gội & Xả'},
    {'id': 'DM06', 'name': 'Bột Tạo Phồng'},
    {'id': 'DM08', 'name': 'Dưỡng Râu'},
  ];

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadProducts() async {
    setState(() => _isLoading = true);
    final list = await ApiService.fetchProducts(
      query: _searchController.text.trim(),
      category: _selectedCategory,
    );
    if (!mounted) return;
    setState(() {
      _products = list;
      _isLoading = false;
    });
  }

  void _showProductDetails(Product p) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(color: AppTheme.borderColor, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: SizedBox(
                  height: 200,
                  width: double.infinity,
                  child: EditorialImage(imageUrl: p.image, fit: BoxFit.contain),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                p.brand.toUpperCase(),
                style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.accentGold),
              ),
              const SizedBox(height: 4),
              Text(
                p.name,
                style: AppTheme.headingSmall(fontSize: 18),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Text(
                    currencyFormat.format(p.actualPrice),
                    style: AppTheme.headingSmall(fontSize: 18, color: AppTheme.accentGold),
                  ),
                  if (p.discountPercent > 0) ...[
                    const SizedBox(width: 8),
                    Text(
                      currencyFormat.format(p.originalPrice),
                      style: AppTheme.bodySmall(
                        fontSize: 13,
                        color: AppTheme.textMuted,
                      ).copyWith(decoration: TextDecoration.lineThrough),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.statusDanger.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '-${p.discountPercent}%',
                        style: AppTheme.labelUppercase(fontSize: 9, color: AppTheme.statusDanger),
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 12),
              Text(
                p.description,
                style: AppTheme.bodySmall(color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: () {
                    widget.onAddToCart(
                      OrderItem(
                        productId: p.id,
                        name: p.name,
                        price: p.actualPrice,
                        quantity: 1,
                        image: p.image,
                      ),
                    );
                    Navigator.of(ctx).pop();
                  },
                  icon: const Icon(Icons.add_shopping_cart_rounded, size: 18, color: AppTheme.charcoal),
                  label: Text('THÊM VÀO GIỎ HÀNG', style: AppTheme.bodyMedium(fontWeight: FontWeight.w700, color: AppTheme.charcoal)),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      body: SafeArea(
        child: Column(
          children: [
            // Thanh tiêu đề & Ô tìm kiếm
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'MỸ PHẨM CHÍNH HÃNG',
                            style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            'Cửa Hàng Quý Ông',
                            style: AppTheme.headingLarge(fontSize: 26),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.shopping_bag_outlined, color: AppTheme.textPrimary, size: 24),
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => CartScreen(
                                cart: widget.cartItems,
                                onUpdateCart: () => setState(() {}),
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Ô tìm kiếm sản phẩm
                  TextFormField(
                    controller: _searchController,
                    style: AppTheme.bodyMedium(),
                    decoration: InputDecoration(
                      hintText: 'Tìm kiếm sáp, pomade, dầu gội...',
                      prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppTheme.textSecondary),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded, size: 18),
                              onPressed: () {
                                _searchController.clear();
                                _loadProducts();
                              },
                            )
                          : null,
                    ),
                    onFieldSubmitted: (_) => _loadProducts(),
                  ),
                ],
              ),
            ),

            // Danh mục sản phẩm (Filter Chips)
            SizedBox(
              height: 44,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                scrollDirection: Axis.horizontal,
                itemCount: _categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, idx) {
                  final cat = _categories[idx];
                  final isSelected = _selectedCategory == cat['id'];
                  return ChoiceChip(
                    label: Text(
                      cat['name']!,
                      style: AppTheme.bodySmall(
                        color: isSelected ? AppTheme.charcoal : AppTheme.textPrimary,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: AppTheme.accentGold,
                    backgroundColor: AppTheme.surfaceCard,
                    side: BorderSide(color: isSelected ? AppTheme.accentGold : AppTheme.borderColor),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                    onSelected: (_) {
                      setState(() => _selectedCategory = cat['id']!);
                      _loadProducts();
                    },
                  );
                },
              ),
            ),
            const SizedBox(height: 6),

            // Lưới sản phẩm chuẩn Editorial
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppTheme.accentGold, strokeWidth: 2))
                  : _products.isEmpty
                      ? Center(
                          child: Text(
                            'Không tìm thấy sản phẩm nào.',
                            style: AppTheme.bodyMedium(color: AppTheme.textSecondary),
                          ),
                        )
                      : GridView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.68,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                          ),
                          itemCount: _products.length,
                          itemBuilder: (context, index) {
                            final p = _products[index];
                            return _buildProductCard(p);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductCard(Product p) {
    return GestureDetector(
      onTap: () => _showProductDetails(p),
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.surfaceCard,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppTheme.borderColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Ảnh sản phẩm với bộ lọc màu ấm
            Expanded(
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(9)),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    EditorialImage(
                      imageUrl: p.image,
                      fit: BoxFit.cover,
                    ),
                    if (p.discountPercent > 0)
                      Positioned(
                        top: 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.charcoal,
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: AppTheme.accentGold, width: 0.8),
                          ),
                          child: Text(
                            '-${p.discountPercent}%',
                            style: AppTheme.labelUppercase(fontSize: 8.5, color: AppTheme.accentGold),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),

            // Thông tin sản phẩm
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    p.brand.toUpperCase(),
                    style: AppTheme.labelUppercase(fontSize: 9, color: AppTheme.accentGold),
                    maxLines: 1,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    p.name,
                    style: AppTheme.bodySmall(fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            currencyFormat.format(p.actualPrice),
                            style: AppTheme.headingSmall(fontSize: 14, color: AppTheme.accentGold),
                          ),
                          if (p.discountPercent > 0)
                            Text(
                              currencyFormat.format(p.originalPrice),
                              style: AppTheme.bodySmall(fontSize: 10, color: AppTheme.textMuted)
                                  .copyWith(decoration: TextDecoration.lineThrough),
                            ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.add_shopping_cart_rounded, size: 18, color: AppTheme.charcoal),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        tooltip: 'Thêm vào giỏ',
                        onPressed: () {
                          widget.onAddToCart(
                            OrderItem(
                              productId: p.id,
                              name: p.name,
                              price: p.actualPrice,
                              quantity: 1,
                              image: p.image,
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
