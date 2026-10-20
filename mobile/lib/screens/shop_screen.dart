import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../models/product.dart';
import '../models/order.dart';
import '../services/api_service.dart';
import '../widgets/editorial_image.dart';

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
  String _sortOption = 'default'; // 'default', 'price_asc', 'price_desc', 'discount'

  final _categories = [
    {'id': 'all', 'name': 'Tất Cả'},
    {'id': 'DM01', 'name': 'Sáp & Clay'},
    {'id': 'DM02', 'name': 'Pomade'},
    {'id': 'DM03', 'name': 'Pre-Styling'},
    {'id': 'DM04', 'name': 'Gôm Xịt Tóc'},
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

    List<Product> sortedList = List.from(list);
    if (_sortOption == 'price_asc') {
      sortedList.sort((a, b) => a.actualPrice.compareTo(b.actualPrice));
    } else if (_sortOption == 'price_desc') {
      sortedList.sort((a, b) => b.actualPrice.compareTo(a.actualPrice));
    } else if (_sortOption == 'discount') {
      sortedList.sort((a, b) => b.discountPercent.compareTo(a.discountPercent));
    }

    setState(() {
      _products = sortedList;
      _isLoading = false;
    });
  }

  void _showProductDetails(Product p) {
    int quantity = 1;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: SingleChildScrollView(
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
                        style: AppTheme.headingSmall(fontSize: 20, color: AppTheme.accentGold),
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
                            color: AppTheme.statusDanger.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '-${p.discountPercent}% FLASH SALE',
                            style: AppTheme.labelUppercase(fontSize: 9, color: AppTheme.statusDanger),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    p.description,
                    style: AppTheme.bodySmall(color: AppTheme.textSecondary, fontSize: 13),
                  ),
                  const SizedBox(height: 14),

                  // Đảm bảo hàng chính hãng
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceElevated,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.borderColor),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.verified_rounded, color: AppTheme.accentGold, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('100% Chính Hãng Nhập Khẩu', style: AppTheme.bodySmall(fontWeight: FontWeight.w700)),
                              Text('Bảo hành đổi trả 1-1 nếu phát hiện hàng giả, nhái.', style: AppTheme.bodySmall(fontSize: 10.5, color: AppTheme.textSecondary)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Bộ điều chỉnh số lượng
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Số lượng mua:', style: AppTheme.bodyMedium(fontWeight: FontWeight.w600)),
                      Container(
                        decoration: BoxDecoration(
                          color: AppTheme.surfaceElevated,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: AppTheme.borderColor),
                        ),
                        child: Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove, size: 16),
                              onPressed: () {
                                if (quantity > 1) {
                                  setModalState(() => quantity--);
                                }
                              },
                            ),
                            Text('$quantity', style: AppTheme.bodyMedium(fontWeight: FontWeight.w700)),
                            IconButton(
                              icon: const Icon(Icons.add, size: 16),
                              onPressed: () {
                                setModalState(() => quantity++);
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),

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
                            quantity: quantity,
                            image: p.image,
                          ),
                        );
                        Navigator.of(ctx).pop();
                      },
                      icon: const Icon(Icons.add_shopping_cart_rounded, size: 18, color: AppTheme.charcoal),
                      label: Text(
                        'THÊM VÀO GIỎ HÀNG (${currencyFormat.format(p.actualPrice * quantity)})',
                        style: AppTheme.bodyMedium(fontWeight: FontWeight.w800, color: AppTheme.charcoal),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
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
            // Header & Search Box
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 10),
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
                            'OMNI APPAREL & GROOMING',
                            style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Mỹ Phẩm & Phụ Kiện',
                            style: AppTheme.headingLarge(fontSize: 26),
                          ),
                        ],
                      ),
                      // Dropdown Sắp xếp
                      PopupMenuButton<String>(
                        icon: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceCard,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: AppTheme.borderColor),
                          ),
                          child: const Icon(Icons.sort_rounded, size: 20, color: AppTheme.accentGold),
                        ),
                        color: AppTheme.surfaceCard,
                        onSelected: (val) {
                          setState(() => _sortOption = val);
                          _loadProducts();
                        },
                        itemBuilder: (ctx) => [
                          const PopupMenuItem(value: 'default', child: Text('Mặc định')),
                          const PopupMenuItem(value: 'price_asc', child: Text('Giá: Thấp đến Cao')),
                          const PopupMenuItem(value: 'price_desc', child: Text('Giá: Cao đến Thấp')),
                          const PopupMenuItem(value: 'discount', child: Text('Flash Sale giảm sâu')),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Search input
                  TextField(
                    controller: _searchController,
                    onSubmitted: (_) => _loadProducts(),
                    decoration: InputDecoration(
                      hintText: 'Tìm kiếm mỹ phẩm, sáp, gôm, xịt phồng...',
                      prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.accentGold, size: 20),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 18),
                              onPressed: () {
                                _searchController.clear();
                                _loadProducts();
                              },
                            )
                          : null,
                    ),
                  ),
                ],
              ),
            ),

            // Category Chips
            SizedBox(
              height: 42,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 20),
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
            const SizedBox(height: 8),

            // Lưới sản phẩm
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
                            childAspectRatio: 0.65,
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
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    p.brand.toUpperCase(),
                    style: AppTheme.labelUppercase(fontSize: 9, color: AppTheme.accentGold),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    p.name,
                    style: AppTheme.headingSmall(fontSize: 13.5),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        currencyFormat.format(p.actualPrice),
                        style: AppTheme.headingSmall(fontSize: 14, color: AppTheme.accentGold),
                      ),
                      if (p.discountPercent > 0) ...[
                        const SizedBox(width: 4),
                        Text(
                          currencyFormat.format(p.originalPrice),
                          style: AppTheme.bodySmall(fontSize: 10, color: AppTheme.textMuted).copyWith(decoration: TextDecoration.lineThrough),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    height: 32,
                    child: OutlinedButton(
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
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppTheme.accentGold),
                        padding: EdgeInsets.zero,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                      ),
                      child: Text(
                        'Thêm Vào Giỏ',
                        style: AppTheme.bodySmall(color: AppTheme.accentGold, fontWeight: FontWeight.w700),
                      ),
                    ),
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
