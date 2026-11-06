import 'package:omni_salon_mobile/core/api/api_service.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';
import 'package:omni_salon_mobile/models/product.dart';
import 'package:omni_salon_mobile/models/order.dart';
import 'package:omni_salon_mobile/components/editorial_image.dart';
import 'package:omni_salon_mobile/components/main_scaffold.dart';
import 'package:omni_salon_mobile/pages/user/cart_page.dart';

class ShopScreen extends StatefulWidget {
  final List<OrderItem> cartItems;
  final Function(OrderItem) onAddToCart;

  const ShopScreen({
    super.key,
    required this.cartItems,
    required this.onAddToCart,
  });

  static List<Product> cachedProducts = [];

  static List<Product> getRelatedProducts(Product current, List<Product> all) {
    if (all.isEmpty) return [];

    final currentLower = (current.name + ' ' + current.description).toLowerCase();
    final currentBrand = current.brand.trim().toLowerCase();

    final keywordGroups = [
      ['sáp', 'clay', 'wax', 'paste', 'matte'],
      ['pomade', 'grease', 'pomad'],
      ['pre-styling', 'tonic', 'spray', 'muối biển', 'sea salt'],
      ['gôm', 'keo xịt', 'hair spray', 'freeze'],
      ['dầu gội', 'dầu xả', 'shampoo', 'conditioner'],
      ['tinh dầu', 'oil', 'dưỡng', 'serum'],
      ['lược', 'comb', 'brush'],
    ];

    final otherProducts = all.where((p) => p.id != current.id && !p.isExpired).toList();

    final scored = otherProducts.map((p) {
      int score = 0;
      final pBrand = p.brand.trim().toLowerCase();
      final pLower = (p.name + ' ' + p.description).toLowerCase();

      // 1. Cùng thương hiệu: +10 điểm
      if (pBrand.isNotEmpty && pBrand == currentBrand) {
        score += 10;
      }

      // 2. Cùng danh mục: +8 điểm
      if (p.categoryId == current.categoryId) {
        score += 8;
      }

      // 3. Cùng nhóm công dụng/chất liệu tóc: +7 điểm
      for (final group in keywordGroups) {
        final currentHas = group.any((kw) => currentLower.contains(kw));
        final pHas = group.any((kw) => pLower.contains(kw));
        if (currentHas && pHas) {
          score += 7;
          break;
        }
      }

      return MapEntry(p, score);
    }).toList();

    scored.sort((a, b) {
      if (b.value != a.value) return b.value.compareTo(a.value);
      return b.key.discountPercent.compareTo(a.key.discountPercent);
    });

    final topList = scored.where((e) => e.value > 0).map((e) => e.key).take(6).toList();
    if (topList.length < 4) {
      for (final item in otherProducts) {
        if (!topList.contains(item)) {
          topList.add(item);
          if (topList.length >= 4) break;
        }
      }
    }
    return topList;
  }

  // Mở modal xem chi tiết sản phẩm
  static void showProductDetailModal(
    BuildContext context, {
    required Product product,
    Function(OrderItem)? onAddToCart,
    List<Product>? allProducts,
  }) {
    if (allProducts != null && allProducts.isNotEmpty) {
      cachedProducts = allProducts;
    }
    final effectiveCatalog = cachedProducts.isNotEmpty
        ? cachedProducts
        : (allProducts != null && allProducts.isNotEmpty
            ? allProducts
            : ApiService.seedProducts);

    final relatedProducts = getRelatedProducts(product, effectiveCatalog);
    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫', decimalDigits: 0);
    int quantity = 1;
    int selectedAngle = 0;

    final List<String> angleImages = product.image.contains('_01.jpg')
        ? [
            product.image,
            product.image.replaceAll('_01.jpg', '_02.jpg'),
            product.image.replaceAll('_01.jpg', '_03.jpg'),
            product.image.replaceAll('_01.jpg', '_04.jpg'),
          ]
        : [product.image];



    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => SafeArea(
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(ctx).size.height * 0.90,
            ),
            child: SingleChildScrollView(
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
                  // Khung ảnh sản phẩm chính
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      color: AppTheme.charcoal,
                      height: 220,
                      width: double.infinity,
                      child: EditorialImage(
                        imageUrl: angleImages[selectedAngle % angleImages.length],
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                  // 4 Thumbnail góc nhìn sản phẩm
                  if (angleImages.length > 1) ...[
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(angleImages.length, (idx) {
                        final isSel = selectedAngle == idx;
                        return GestureDetector(
                          onTap: () => setModalState(() => selectedAngle = idx),
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            padding: const EdgeInsets.all(2),
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: isSel ? AppTheme.accentGold : AppTheme.borderColor,
                                width: isSel ? 2 : 1,
                              ),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: SizedBox(
                                width: 50,
                                height: 50,
                                child: EditorialImage(imageUrl: angleImages[idx], fit: BoxFit.cover),
                              ),
                            ),
                          ),
                        );
                      }),
                    ),
                  ],
                  const SizedBox(height: 16),
                  Text(
                    product.brand.toUpperCase(),
                    style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.accentGold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    product.name,
                    style: AppTheme.headingSmall(fontSize: 18),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text(
                        currencyFormat.format(product.actualPrice),
                        style: AppTheme.headingSmall(fontSize: 20, color: AppTheme.accentGold),
                      ),
                      if (product.discountPercent > 0) ...[
                        const SizedBox(width: 8),
                        Text(
                          currencyFormat.format(product.originalPrice),
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
                            '-${product.discountPercent}% FLASH SALE',
                            style: AppTheme.labelUppercase(fontSize: 9, color: AppTheme.statusDanger),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    product.description.isNotEmpty ? product.description : 'Sản phẩm tạo kiểu cao cấp chính hãng từ Omni Salon, giữ nếp lâu dài và an toàn cho da đầu.',
                    style: AppTheme.bodySmall(color: AppTheme.textSecondary, fontSize: 13),
                  ),
                  if (onAddToCart != null) ...[
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Text('Số lượng:', style: AppTheme.bodyMedium(fontWeight: FontWeight.w600)),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.remove_circle_outline, color: AppTheme.accentGold),
                          onPressed: () {
                            if (quantity > 1) {
                              setModalState(() => quantity--);
                            }
                          },
                        ),
                        Text('$quantity', style: AppTheme.headingSmall(fontSize: 16)),
                        IconButton(
                          icon: const Icon(Icons.add_circle_outline, color: AppTheme.accentGold),
                          onPressed: () {
                            setModalState(() => quantity++);
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        // Nút Thêm vào Giỏ hàng chuẩn phong cách Shopee (Icon Salon)
                        InkWell(
                          onTap: () {
                            onAddToCart(OrderItem(
                              productId: product.id,
                              name: product.name,
                              price: product.actualPrice,
                              quantity: quantity,
                              image: product.image,
                            ));
                            Navigator.of(context).pop();
                          },
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            height: 48,
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceElevated,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.6), width: 1.2),
                            ),
                            child: const Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.shopping_bag_outlined, color: AppTheme.accentGold, size: 20),
                                SizedBox(height: 2),
                                Text(
                                  'Thêm vào Giỏ hàng',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.accentGold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        // Nút Mua ngay (Nổi bật, chuyển ngay đến Giỏ hàng / Thanh toán)
                        Expanded(
                          child: SizedBox(
                            height: 48,
                            child: ElevatedButton(
                              onPressed: () {
                                onAddToCart(OrderItem(
                                  productId: product.id,
                                  name: product.name,
                                  price: product.actualPrice,
                                  quantity: quantity,
                                  image: product.image,
                                ));
                                Navigator.of(context).pop();
                                if (MainScaffold.of(context) != null) {
                                  MainScaffold.of(context)!.openCart();
                                } else {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => CartScreen(
                                        cart: [
                                          OrderItem(
                                            productId: product.id,
                                            name: product.name,
                                            price: product.actualPrice,
                                            quantity: quantity,
                                            image: product.image,
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.accentGold,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                padding: EdgeInsets.zero,
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    'Mua ngay',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 14,
                                      color: AppTheme.charcoal,
                                    ),
                                  ),
                                  Text(
                                    currencyFormat.format(product.actualPrice * quantity),
                                    style: TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 11.5,
                                      color: AppTheme.charcoal,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 20),
                  Divider(color: AppTheme.borderColorSubtle),
                  const SizedBox(height: 12),
                  FutureBuilder<List<Map<String, dynamic>>>(
                    future: ApiService.fetchReviews(productId: product.id),
                    builder: (context, snapshot) {
                      final reviews = snapshot.data ?? [];
                      final count = reviews.length;
                      double avg = 5.0;
                      if (count > 0) {
                        final total = reviews.fold<int>(0, (sum, r) => sum + (int.tryParse(r['rating']?.toString() ?? '5') ?? 5));
                        avg = total / count;
                      }
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('ĐÁNH GIÁ SẢN PHẨM', style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold)),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              const Icon(Icons.star_rounded, size: 16, color: Color(0xFFF59E0B)),
                              const SizedBox(width: 4),
                              Text(
                                count > 0
                                    ? '${avg.toStringAsFixed(1)} / 5.0 ($count đánh giá)'
                                    : 'Chưa có đánh giá',
                                style: AppTheme.bodySmall(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          if (snapshot.connectionState == ConnectionState.waiting)
                            const Center(
                              child: Padding(
                                padding: EdgeInsets.all(12),
                                child: SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.accentGold),
                                ),
                              ),
                            )
                          else if (reviews.isEmpty)
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppTheme.surfaceElevated,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppTheme.borderColorSubtle),
                              ),
                              child: Text(
                                'Chưa có đánh giá nào cho sản phẩm này. Hãy đặt mua và chia sẻ cảm nhận của bạn nhé!',
                                style: AppTheme.bodySmall(fontSize: 12, color: AppTheme.textSecondary),
                              ),
                            )
                          else
                            ...reviews.take(3).map((r) {
                              final stars = int.tryParse(r['rating']?.toString() ?? '5') ?? 5;
                              final dateStr = (r['date'] ?? '').toString();
                              final shortDate = dateStr.length >= 10 ? dateStr.substring(0, 10) : dateStr;
                              return Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppTheme.surfaceElevated,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: AppTheme.borderColorSubtle),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          r['customerName'] ?? 'Khách Hàng',
                                          style: AppTheme.bodySmall(fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                                        ),
                                        Text(
                                          shortDate.isNotEmpty ? shortDate : 'Gần đây',
                                          style: AppTheme.bodySmall(fontSize: 10.5, color: AppTheme.textMuted),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 2),
                                    Row(
                                      children: List.generate(
                                        5,
                                        (idx) => Icon(
                                          Icons.star_rounded,
                                          size: 13,
                                          color: idx < stars ? const Color(0xFFF59E0B) : AppTheme.borderColor,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      r['comment'] ?? '',
                                      style: AppTheme.bodySmall(fontSize: 12, color: AppTheme.textSecondary),
                                    ),
                                  ],
                                ),
                              );
                            }),
                        ],
                      );
                    },
                  ),
                  // -------------------------------------------------------------
                  // PHẦN "CÓ THỂ BẠN CŨNG THÍCH" - CHUẨN SHOPEE
                  // -------------------------------------------------------------
                  if (relatedProducts.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(child: Container(height: 1, color: AppTheme.borderColorSubtle)),
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: 14),
                          child: Text(
                            'Có thể bạn cũng thích',
                            style: TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.textPrimary,
                              letterSpacing: 0.2,
                            ),
                          ),
                        ),
                        Expanded(child: Container(height: 1, color: AppTheme.borderColorSubtle)),
                      ],
                    ),
                    const SizedBox(height: 14),
                    for (int i = 0; i < relatedProducts.length; i += 2) ...[
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: _buildShopeeItem(
                              ctx: ctx,
                              context: context,
                              p: relatedProducts[i],
                              currencyFormat: currencyFormat,
                              onAddToCart: onAddToCart,
                              effectiveCatalog: effectiveCatalog,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: (i + 1 < relatedProducts.length)
                                ? _buildShopeeItem(
                                    ctx: ctx,
                                    context: context,
                                    p: relatedProducts[i + 1],
                                    currencyFormat: currencyFormat,
                                    onAddToCart: onAddToCart,
                                    effectiveCatalog: effectiveCatalog,
                                  )
                                : const SizedBox.shrink(),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                    ],
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  static Widget _buildShopeeItem({
    required BuildContext ctx,
    required BuildContext context,
    required Product p,
    required NumberFormat currencyFormat,
    Function(OrderItem)? onAddToCart,
    required List<Product> effectiveCatalog,
  }) {
    return GestureDetector(
      onTap: () {
        Navigator.of(ctx).pop();
        ShopScreen.showProductDetailModal(
          context,
          product: p,
          onAddToCart: onAddToCart,
          allProducts: effectiveCatalog,
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.surfaceCard,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppTheme.borderColorSubtle),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0A000000),
              blurRadius: 4,
              offset: Offset(0, 2),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Ảnh sản phẩm vuông + Badge giảm giá Shopee
            Stack(
              children: [
                AspectRatio(
                  aspectRatio: 1.0,
                  child: Container(
                    color: AppTheme.surfaceElevated,
                    child: EditorialImage(
                      imageUrl: p.image,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                if (p.discountPercent > 0)
                  Positioned(
                    top: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                      decoration: const BoxDecoration(
                        color: Color(0xFFEE4D2D), // Shopee coral red
                        borderRadius: BorderRadius.only(
                          bottomLeft: Radius.circular(6),
                        ),
                      ),
                      child: Text(
                        '-${p.discountPercent}%',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9.5,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),
              ],
            ),

            // 2. Thông tin sản phẩm Shopee style
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Thương hiệu
                  Text(
                    p.brand.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 9.5,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.accentGold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),

                  // Tên sản phẩm
                  Text(
                    p.name,
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                      height: 1.2,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),

                  // Giá bán màu vàng như trên cửa hàng
                  Text(
                    currencyFormat.format(p.actualPrice),
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.accentGold,
                    ),
                  ),
                  const SizedBox(height: 4),

                  // Đánh giá sao & Số lượng đã bán
                  Row(
                    children: [
                      Icon(Icons.star_rounded, size: 12, color: Color(0xFFF59E0B)),
                      SizedBox(width: 2),
                      Text(
                        '4.9',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                      ),
                      SizedBox(width: 4),
                      Text(
                        '• 100+ đã bán',
                        style: TextStyle(fontSize: 9.5, color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),

                  // Địa chỉ giao hàng Shopee style
                  Row(
                    children: [
                      Icon(Icons.bolt_rounded, size: 11, color: Color(0xFF00BFA5)),
                      SizedBox(width: 2),
                      Expanded(
                        child: Text(
                          'Hỏa tốc • TP. Hồ Chí Minh',
                          style: TextStyle(fontSize: 8.5, color: AppTheme.textSecondary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
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


  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫', decimalDigits: 0);
  final _searchController = TextEditingController();
  final _categoryScrollController = ScrollController();

  List<Product> _allProducts = [];
  bool _isLoading = true;
  String _selectedCategory = 'all';
  String _selectedBrand = 'all';
  double? _minPrice;
  double? _maxPrice;
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
    AppTheme.isDarkModeNotifier.addListener(_onThemeChanged);
    _loadProducts();
  }

  void _onThemeChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    AppTheme.isDarkModeNotifier.removeListener(_onThemeChanged);
    _searchController.dispose();
    _categoryScrollController.dispose();
    super.dispose();
  }

  Future<void> _loadProducts() async {
    setState(() => _isLoading = true);
    final list = await ApiService.fetchProducts();
    if (!mounted) return;

    setState(() {
      _allProducts = list.where((p) => !p.isExpired).toList();
      ShopScreen.cachedProducts = _allProducts;
      _isLoading = false;
    });
  }

  List<Product> _getFilteredProducts() {
    final query = _searchController.text.trim().toLowerCase();
    return _allProducts.where((p) {
      // 1. Lọc theo tìm kiếm
      if (query.isNotEmpty) {
        final matchName = p.name.toLowerCase().contains(query);
        final matchBrand = p.brand.toLowerCase().contains(query);
        final matchDesc = p.description.toLowerCase().contains(query);
        if (!matchName && !matchBrand && !matchDesc) return false;
      }

      // 2. Lọc theo danh mục
      if (_selectedCategory != 'all') {
        if (_selectedCategory == 'bestsellers') {
          if (p.discountPercent == 0 && !p.name.toLowerCase().contains('volcanic') && !p.name.toLowerCase().contains('claymation')) {
            return false;
          }
        } else if (p.categoryId != _selectedCategory) {
          return false;
        }
      }

      // 3. Lọc theo thương hiệu
      if (_selectedBrand != 'all') {
        if (!p.brand.toLowerCase().contains(_selectedBrand.toLowerCase()) &&
            !p.name.toLowerCase().contains(_selectedBrand.toLowerCase())) {
          return false;
        }
      }

      // 4. Lọc theo khoảng giá (Shopee style)
      if (_minPrice != null && _minPrice! > 0) {
        if (p.actualPrice < _minPrice!) return false;
      }
      if (_maxPrice != null && _maxPrice! > 0) {
        if (p.actualPrice > _maxPrice!) return false;
      }

      // 5. Lọc sản phẩm đang giảm giá khi chọn 'discount'
      if (_sortOption == 'discount') {
        if (!p.hasDiscount && p.discountPercent <= 0 && p.actualPrice >= p.originalPrice) {
          return false;
        }
      }

      return true;
    }).toList()
      ..sort((a, b) {
        if (_sortOption == 'price_asc') {
          return a.actualPrice.compareTo(b.actualPrice);
        } else if (_sortOption == 'price_desc') {
          return b.actualPrice.compareTo(a.actualPrice);
        } else if (_sortOption == 'discount') {
          return b.discountPercent.compareTo(a.discountPercent);
        }
        return 0;
      });
  }

  bool get _hasActiveFilters {
    return _selectedCategory != 'all' ||
        _selectedBrand != 'all' ||
        _minPrice != null ||
        _maxPrice != null ||
        _sortOption != 'default';
  }

  bool get _isLookbookMode {
    return !_hasActiveFilters &&
        _sortOption == 'default' &&
        _searchController.text.trim().isEmpty;
  }

  void _resetToLookbook() {
    setState(() {
      _selectedCategory = 'all';
      _selectedBrand = 'all';
      _minPrice = null;
      _maxPrice = null;
      _searchController.clear();
      _sortOption = 'default';
    });
  }

  void _showProductDetails(Product p) {
    ShopScreen.showProductDetailModal(
      context,
      product: p,
      onAddToCart: widget.onAddToCart,
      allProducts: _allProducts,
    );
  }

  void _quickAddToCart(Product p) {
    widget.onAddToCart(OrderItem(
      productId: p.id,
      name: p.name,
      price: p.actualPrice,
      quantity: 1,
      image: p.image,
    ));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đã thêm ${p.name} vào giỏ hàng!'),
        backgroundColor: AppTheme.charcoal,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  List<Map<String, String>> get _availableBrands {
    final list = <Map<String, String>>[
      {'id': 'all', 'name': 'Tất Cả'},
      {'id': 'apestomen', 'name': 'Apestomen'},
      {'id': 'hanz', 'name': 'Hanz de Fuko'},
      {'id': 'blumaan', 'name': 'BluMaan'},
      {'id': 'reuzel', 'name': 'Reuzel Pomade'},
      {'id': 'kevin', 'name': 'Kevin Murphy'},
      {'id': 'uppercut', 'name': 'Uppercut Deluxe'},
    ];

    final existingIds = list.map((e) => e['id']!.toLowerCase()).toSet();
    for (final p in _allProducts) {
      final b = p.brand.trim();
      if (b.isNotEmpty && !existingIds.contains(b.toLowerCase())) {
        existingIds.add(b.toLowerCase());
        list.add({'id': b.toLowerCase(), 'name': b});
      }
    }
    return list;
  }

  void _showShopeeFilterModal() {
    String tempCategory = _selectedCategory;
    String tempBrand = _selectedBrand;
    String tempSort = _sortOption;
    final minController = TextEditingController(
      text: _minPrice != null && _minPrice! > 0 ? _minPrice!.toInt().toString() : '',
    );
    final maxController = TextEditingController(
      text: _maxPrice != null && _maxPrice! > 0 ? _maxPrice!.toInt().toString() : '',
    );
    int activeTabIndex = 0; // 0: Theo Danh Mục, 1: Thương Hiệu, 2: Khoảng Giá, 3: Sắp Xếp

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final brandList = _availableBrands;
            final hasPriceFilter = minController.text.trim().isNotEmpty || maxController.text.trim().isNotEmpty;

            return Container(
              height: MediaQuery.of(context).size.height * 0.82,
              decoration: BoxDecoration(
                color: AppTheme.surfaceCard,
                borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
              ),
              child: Column(
                children: [
                  // 1. Header: "Tùy chọn tìm kiếm" + Close Button
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 14, 12, 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const SizedBox(width: 32),
                        Text(
                          'Tùy chọn tìm kiếm',
                          style: AppTheme.headingSmall(fontSize: 17),
                        ),
                        IconButton(
                          icon: Icon(Icons.close_rounded, size: 22, color: AppTheme.textSecondary),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                          onPressed: () => Navigator.of(ctx).pop(),
                        ),
                      ],
                    ),
                  ),
                  Divider(color: AppTheme.borderColorSubtle, height: 1),

                  // 2. Nội dung 2 cột Shopee
                  Expanded(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Cột Trái: Sidebar Menu (Theo Danh Mục / Thương Hiệu / Khoảng Giá / Sắp Xếp)
                        Container(
                          width: 125,
                          decoration: BoxDecoration(
                            color: AppTheme.bgPrimary,
                            border: Border(right: BorderSide(color: AppTheme.borderColorSubtle)),
                          ),
                          child: ListView(
                            padding: EdgeInsets.zero,
                            children: [
                              _buildSidebarTab(
                                title: 'Theo Danh Mục',
                                isActive: activeTabIndex == 0,
                                hasSelection: tempCategory != 'all',
                                onTap: () => setModalState(() => activeTabIndex = 0),
                              ),
                              _buildSidebarTab(
                                title: 'Thương Hiệu',
                                isActive: activeTabIndex == 1,
                                hasSelection: tempBrand != 'all',
                                onTap: () => setModalState(() => activeTabIndex = 1),
                              ),
                              _buildSidebarTab(
                                title: 'Khoảng Giá',
                                isActive: activeTabIndex == 2,
                                hasSelection: hasPriceFilter,
                                onTap: () => setModalState(() => activeTabIndex = 2),
                              ),
                              _buildSidebarTab(
                                title: 'Sắp Xếp Giá',
                                isActive: activeTabIndex == 3,
                                hasSelection: tempSort != 'default',
                                onTap: () => setModalState(() => activeTabIndex = 3),
                              ),
                            ],
                          ),
                        ),

                        // Cột Phải: Lưới lựa chọn tương ứng
                        Expanded(
                          child: SingleChildScrollView(
                            padding: const EdgeInsets.all(16),
                            child: activeTabIndex == 0
                                ? _buildCategoryOptions(
                                    tempCategory: tempCategory,
                                    onSelect: (catId) => setModalState(() => tempCategory = catId),
                                  )
                                : activeTabIndex == 1
                                    ? _buildBrandOptions(
                                        brandList: brandList,
                                        tempBrand: tempBrand,
                                        onSelect: (brandId) => setModalState(() => tempBrand = brandId),
                                      )
                                    : activeTabIndex == 2
                                        ? _buildPriceRangeOptions(
                                            minController: minController,
                                            maxController: maxController,
                                            setModalState: setModalState,
                                          )
                                        : _buildSortOptions(
                                            tempSort: tempSort,
                                            onSelect: (sortId) => setModalState(() => tempSort = sortId),
                                          ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  Divider(color: AppTheme.borderColorSubtle, height: 1),

                  // 3. Footer: Nút [Thiết lập lại] và [Áp dụng]
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                    child: Row(
                      children: [
                        // Nút Thiết lập lại
                        Expanded(
                          flex: 2,
                          child: SizedBox(
                            height: 44,
                            child: OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                side: BorderSide(color: AppTheme.borderColor),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              onPressed: () {
                                setModalState(() {
                                  tempCategory = 'all';
                                  tempBrand = 'all';
                                  tempSort = 'default';
                                  minController.clear();
                                  maxController.clear();
                                });
                              },
                              child: Text(
                                'Thiết lập lại',
                                style: AppTheme.bodyMedium(color: AppTheme.textPrimary, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Nút Áp dụng (Tìm kiếm)
                        Expanded(
                          flex: 3,
                          child: SizedBox(
                            height: 44,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.accentGold,
                                foregroundColor: AppTheme.charcoal,
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              onPressed: () {
                                final pMin = double.tryParse(minController.text.replaceAll(RegExp(r'[^0-9]'), ''));
                                final pMax = double.tryParse(maxController.text.replaceAll(RegExp(r'[^0-9]'), ''));

                                setState(() {
                                  _selectedCategory = tempCategory;
                                  _selectedBrand = tempBrand;
                                  _sortOption = tempSort;
                                  _minPrice = pMin != null && pMin > 0 ? pMin : null;
                                  _maxPrice = pMax != null && pMax > 0 ? pMax : null;
                                });
                                Navigator.of(ctx).pop();
                              },
                              child: Text(
                                'Áp dụng',
                                style: AppTheme.bodyMedium(color: AppTheme.charcoal, fontWeight: FontWeight.w800),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildSidebarTab({
    required String title,
    required bool isActive,
    required bool hasSelection,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 16),
        decoration: BoxDecoration(
          color: isActive ? AppTheme.surfaceCard : Colors.transparent,
          border: Border(
            left: BorderSide(
              color: isActive ? AppTheme.accentGold : Colors.transparent,
              width: 3.5,
            ),
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                  color: isActive ? AppTheme.accentGold : AppTheme.textSecondary,
                ),
              ),
            ),
            if (hasSelection)
              Container(
                width: 6,
                height: 6,
                decoration: const BoxDecoration(
                  color: AppTheme.accentGold,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryOptions({
    required String tempCategory,
    required ValueChanged<String> onSelect,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Theo Danh Mục',
          style: AppTheme.headingSmall(fontSize: 15),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _categories.map((cat) {
            final isSelected = tempCategory == cat['id'];
            return GestureDetector(
              onTap: () => onSelect(cat['id']!),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppTheme.accentGold.withValues(alpha: 0.15)
                      : AppTheme.surfaceElevated,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: isSelected ? AppTheme.accentGold : AppTheme.borderColor,
                    width: isSelected ? 1.5 : 1,
                  ),
                ),
                child: Text(
                  cat['name']!,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: isSelected ? AppTheme.accentGold : AppTheme.textPrimary,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildBrandOptions({
    required List<Map<String, String>> brandList,
    required String tempBrand,
    required ValueChanged<String> onSelect,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Thương Hiệu',
          style: AppTheme.headingSmall(fontSize: 15),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: brandList.map((b) {
            final isSelected = tempBrand == b['id'];
            return GestureDetector(
              onTap: () => onSelect(b['id']!),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppTheme.accentGold.withValues(alpha: 0.15)
                      : AppTheme.surfaceElevated,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: isSelected ? AppTheme.accentGold : AppTheme.borderColor,
                    width: isSelected ? 1.5 : 1,
                  ),
                ),
                child: Text(
                  b['name']!,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: isSelected ? AppTheme.accentGold : AppTheme.textPrimary,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildPriceRangeOptions({
    required TextEditingController minController,
    required TextEditingController maxController,
    required StateSetter setModalState,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Khoảng Giá (₫)',
              style: AppTheme.headingSmall(fontSize: 15),
            ),
            if (minController.text.isNotEmpty || maxController.text.isNotEmpty)
              GestureDetector(
                onTap: () {
                  setModalState(() {
                    minController.clear();
                    maxController.clear();
                  });
                },
                child: Text('Xóa giá', style: AppTheme.bodySmall(color: AppTheme.accentGold, fontWeight: FontWeight.w600)),
              ),
          ],
        ),
        const SizedBox(height: 12),
        // 2 Ô nhập TỐI THIỂU - TỐI ĐA chuẩn Shopee
        Row(
          children: [
            Expanded(
              child: Container(
                height: 42,
                decoration: BoxDecoration(
                  color: AppTheme.surfaceElevated,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.borderColor),
                ),
                child: TextField(
                  controller: minController,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  style: AppTheme.bodyMedium(fontWeight: FontWeight.w700),
                  decoration: InputDecoration(
                    hintText: 'TỐI THIỂU',
                    hintStyle: AppTheme.bodySmall(color: AppTheme.textMuted, fontSize: 11),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Text('—', style: TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
            ),
            Expanded(
              child: Container(
                height: 42,
                decoration: BoxDecoration(
                  color: AppTheme.surfaceElevated,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.borderColor),
                ),
                child: TextField(
                  controller: maxController,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  style: AppTheme.bodyMedium(fontWeight: FontWeight.w700),
                  decoration: InputDecoration(
                    hintText: 'TỐI ĐA',
                    hintStyle: AppTheme.bodySmall(color: AppTheme.textMuted, fontSize: 11),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),
        Text(
          'Gợi Ý Khoảng Giá Phổ Biến',
          style: AppTheme.bodySmall(color: AppTheme.textSecondary, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _buildQuickPriceChip('Dưới 200k', 0, 200000, minController, maxController, setModalState),
            _buildQuickPriceChip('200k - 500k', 200000, 500000, minController, maxController, setModalState),
            _buildQuickPriceChip('500k - 800k', 500000, 800000, minController, maxController, setModalState),
            _buildQuickPriceChip('Trên 800k', 800000, 0, minController, maxController, setModalState),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickPriceChip(
    String label,
    int min,
    int max,
    TextEditingController minController,
    TextEditingController maxController,
    StateSetter setModalState,
  ) {
    final curMin = int.tryParse(minController.text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
    final curMax = int.tryParse(maxController.text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
    final isSelected = (min == 0 ? curMin == 0 : curMin == min) && (max == 0 ? curMax == 0 : curMax == max);

    return GestureDetector(
      onTap: () {
        setModalState(() {
          if (isSelected) {
            minController.clear();
            maxController.clear();
          } else {
            minController.text = min > 0 ? min.toString() : '';
            maxController.text = max > 0 ? max.toString() : '';
          }
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.accentGold.withValues(alpha: 0.15)
              : AppTheme.surfaceElevated,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: isSelected ? AppTheme.accentGold : AppTheme.borderColor,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? AppTheme.accentGold : AppTheme.textPrimary,
          ),
        ),
      ),
    );
  }

  Widget _buildSortOptions({
    required String tempSort,
    required ValueChanged<String> onSelect,
  }) {
    final sortItems = [
      {'id': 'default', 'name': 'Mặc định'},
      {'id': 'discount', 'name': 'Đang giảm giá'},
      {'id': 'price_asc', 'name': 'Giá: Thấp đến cao'},
      {'id': 'price_desc', 'name': 'Giá: Cao đến thấp'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Sắp Xếp Giá & Khuyến Mãi',
          style: AppTheme.headingSmall(fontSize: 15),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: sortItems.map((item) {
            final isSelected = tempSort == item['id'];
            return GestureDetector(
              onTap: () => onSelect(item['id']!),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppTheme.accentGold.withValues(alpha: 0.15)
                      : AppTheme.surfaceElevated,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: isSelected ? AppTheme.accentGold : AppTheme.borderColor,
                    width: isSelected ? 1.5 : 1,
                  ),
                ),
                child: Text(
                  item['name']!,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: isSelected ? AppTheme.accentGold : AppTheme.textPrimary,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _getFilteredProducts();

    return ValueListenableBuilder<bool>(
      valueListenable: AppTheme.isDarkModeNotifier,
      builder: (context, isDark, _) {
        return Scaffold(
          backgroundColor: AppTheme.bgPrimary,
          body: SafeArea(
        child: Column(
          children: [
            // 1. THANH TÌM KIẾM & BỘ LỌC
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      onChanged: (val) => setState(() {}),
                      decoration: InputDecoration(
                        hintText: 'Tìm sáp, pomade, gôm xịt...',
                        prefixIcon: Icon(Icons.search_rounded, size: 20, color: AppTheme.textMuted),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear_rounded, size: 18),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() {});
                                },
                              )
                            : null,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        isDense: true,
                        filled: true,
                        fillColor: AppTheme.surfaceCard,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(color: AppTheme.borderColor),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(color: AppTheme.borderColor),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Nút Bộ Lọc Tiệm Cắt Tóc (Kiểu Shopee)
                  GestureDetector(
                    onTap: _showShopeeFilterModal,
                    child: Container(
                      height: 42,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: _hasActiveFilters
                            ? AppTheme.accentGold.withValues(alpha: 0.18)
                            : AppTheme.surfaceCard,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: _hasActiveFilters ? AppTheme.accentGold : AppTheme.borderColor,
                          width: _hasActiveFilters ? 1.5 : 1,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.content_cut_rounded,
                            size: 16,
                            color: AppTheme.accentGold,
                          ),
                          const SizedBox(width: 5),
                          Text(
                            'Lọc',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: _hasActiveFilters ? AppTheme.accentGold : AppTheme.textPrimary,
                            ),
                          ),
                          if (_hasActiveFilters) ...[
                            const SizedBox(width: 5),
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: AppTheme.accentGold,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 2),

            // 2. NỘI DUNG CHÍNH, LOOKBOOK MODE HOẶC FILTERED GRID
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppTheme.accentGold, strokeWidth: 2))
                  : _isLookbookMode
                      ? _buildLookbookView()
                      : _buildFilteredGridView(filtered),
            ),
          ],
        ),
      ),
    );
      },
    );
  }

  // =========================================================================
  // CHẾ ĐỘ LOOKBOOK ẢNH 1: CÁC DÒNG SẢN PHẨM & BENTO BANNERS NGHỆ THUẬT
  // =========================================================================
  Widget _buildLookbookView() {
    bool contains(String text, String query) => text.toLowerCase().contains(query.toLowerCase());

    // 1. Nhóm sản phẩm theo thương hiệu
    final bestSellers = _allProducts.where((p) =>
        p.discountPercent > 0 ||
        contains(p.name, 'volcanic') ||
        contains(p.name, 'claymation') ||
        contains(p.name, 'rough rider')).take(6).toList();

    final apestomen = _allProducts.where((p) =>
        contains(p.brand, 'apestomen') ||
        contains(p.name, 'apestomen') ||
        contains(p.name, 'volcanic') ||
        contains(p.name, 'nitro')).take(6).toList();

    final hanz = _allProducts.where((p) =>
        contains(p.brand, 'hanz') ||
        contains(p.name, 'claymation') ||
        contains(p.name, 'quicksand') ||
        contains(p.name, 'gravity')).take(6).toList();

    final blumaan = _allProducts.where((p) =>
        contains(p.brand, 'blumaan') ||
        contains(p.name, 'cavalier') ||
        contains(p.name, 'monarch') ||
        contains(p.name, 'meraki')).take(6).toList();

    final reuzel = _allProducts.where((p) =>
        contains(p.brand, 'reuzel') ||
        contains(p.name, 'reuzel')).take(6).toList();

    final kevinUppercut = _allProducts.where((p) =>
        contains(p.brand, 'kevin') ||
        contains(p.brand, 'uppercut') ||
        contains(p.name, 'rough rider') ||
        contains(p.name, 'night rider')).take(6).toList();

    return RefreshIndicator(
      color: AppTheme.accentGold,
      backgroundColor: AppTheme.surfaceCard,
      onRefresh: _loadProducts,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 30),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Dòng 1: Top Bán Chạy Nhất
            if (bestSellers.isNotEmpty)
              _buildShowcaseSection(
                eyebrow: 'OMNI SIGNATURE GROOMING',
                title: 'Sản Phẩm Bán Chạy Nhất',
                products: bestSellers,
                onViewAll: () => setState(() => _selectedCategory = 'bestsellers'),
              ),

            // Bento Promo Banner 1, Chuẩn Lookbook 3 ô
            _buildBentoPromoBanner1(),

            // Dòng 2: Apestomen Singapore
            if (apestomen.isNotEmpty)
              _buildShowcaseSection(
                eyebrow: 'SINGAPORE GROOMING CRAFT',
                title: 'Apestomen Official',
                products: apestomen,
                onViewAll: () => setState(() => _selectedBrand = 'apestomen'),
              ),

            // Dòng 3: Hanz de Fuko California
            if (hanz.isNotEmpty)
              _buildShowcaseSection(
                eyebrow: 'CALIFORNIA CONTEMPORARY',
                title: 'Hanz de Fuko USA',
                products: hanz,
                onViewAll: () => setState(() => _selectedBrand = 'hanz'),
              ),

            // Bento Promo Banner 2
            _buildBentoPromoBanner2(),

            // Dòng 4: Blumaan USA
            if (blumaan.isNotEmpty)
              _buildShowcaseSection(
                eyebrow: 'PREMIUM NATURAL STYLING',
                title: 'Blumaan Hair Care',
                products: blumaan,
                onViewAll: () => setState(() => _selectedBrand = 'blumaan'),
              ),

            // Dòng 5: Reuzel Pomade Hà Lan
            if (reuzel.isNotEmpty)
              _buildShowcaseSection(
                eyebrow: 'ROTTERDAM BARBERSHOP LEGEND',
                title: 'Reuzel Pomade Hà Lan',
                products: reuzel,
                onViewAll: () => setState(() => _selectedBrand = 'reuzel'),
              ),

            // Dòng 6: Kevin Murphy & Uppercut
            if (kevinUppercut.isNotEmpty)
              _buildShowcaseSection(
                eyebrow: 'AUSTRALIAN PROFESSIONAL',
                title: 'Kevin Murphy & Uppercut',
                products: kevinUppercut,
                onViewAll: () => setState(() => _selectedBrand = 'kevin'),
              ),
          ],
        ),
      ),
    );
  }

  // =========================================================================
  // KHỐI SHOWCASE DÒNG SẢN PHẨM TRƯỢT NGANG, SLIDER
  // =========================================================================
  Widget _buildShowcaseSection({
    required String eyebrow,
    required String title,
    required List<Product> products,
    required VoidCallback onViewAll,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    eyebrow,
                    style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.accentGold),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    title,
                    style: AppTheme.headingSmall(fontSize: 18),
                  ),
                ],
              ),
              GestureDetector(
                onTap: onViewAll,
                child: Text(
                  'Xem tất cả →',
                  style: AppTheme.bodySmall(color: AppTheme.accentGold, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 250,
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            itemCount: products.length,
            itemBuilder: (context, idx) {
              final p = products[idx];
              return _buildProductCard(p, width: 155);
            },
          ),
        ),
      ],
    );
  }

  // =========================================================================
  // BENTO BANNERS NGHỆ THUẬT, CHUẨN ẢNH 1 LOOKBOOK
  // =========================================================================
  Widget _buildBentoPromoBanner1() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 6),
      child: Column(
        children: [
          // Banner Lớn: Pomade Quý Ông
          GestureDetector(
            onTap: () => setState(() => _selectedCategory = 'DM02'),
            child: Container(
              height: 150,
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.borderColor),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(11),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    const EditorialImage(
                      imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=80',
                      fit: BoxFit.cover,
                    ),
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                          colors: [
                            AppTheme.charcoal.withValues(alpha: 0.88),
                            AppTheme.charcoal.withValues(alpha: 0.3),
                          ],
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppTheme.accentGold.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.5)),
                            ),
                            child: Text(
                              'BỘ SƯU TẬP QUÝ ÔNG',
                              style: AppTheme.labelUppercase(fontSize: 8.5, color: AppTheme.accentGold),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Pomade Cao Cấp',
                            style: AppTheme.headingSmall(fontSize: 20, color: AppTheme.textLight),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Gốc dầu & gốc nước cho độ bóng lịch lãm.',
                            style: AppTheme.bodySmall(fontSize: 11.5, color: AppTheme.textLightSecondary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          // Hai Banner Nhỏ Chia Đôi: Clay & Fiber + Flash Sale
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _selectedCategory = 'DM01'),
                  child: Container(
                    height: 110,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.borderColor),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(11),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          const EditorialImage(
                            imageUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80',
                            fit: BoxFit.cover,
                          ),
                          Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  AppTheme.charcoal.withValues(alpha: 0.3),
                                  AppTheme.charcoal.withValues(alpha: 0.85),
                                ],
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                Text(
                                  'Clay & Fiber',
                                  style: AppTheme.headingSmall(fontSize: 15, color: AppTheme.textLight),
                                ),
                                Text(
                                  'Mờ tự nhiên & phồng dày',
                                  style: AppTheme.bodySmall(fontSize: 10, color: AppTheme.textLightSecondary),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _sortOption = 'discount'),
                  child: Container(
                    height: 110,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.borderColor),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(11),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          const EditorialImage(
                            imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
                            fit: BoxFit.cover,
                          ),
                          Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  AppTheme.charcoal.withValues(alpha: 0.3),
                                  AppTheme.charcoal.withValues(alpha: 0.88),
                                ],
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppTheme.statusDanger,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text('HOT DEAL', style: AppTheme.labelUppercase(fontSize: 8, color: Colors.white)),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  'Đang Giảm Giá',
                                  style: AppTheme.headingSmall(fontSize: 15, color: AppTheme.textLight),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBentoPromoBanner2() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 6),
      child: GestureDetector(
        onTap: () => setState(() => _selectedCategory = 'DM08'),
        child: Container(
          height: 130,
          width: double.infinity,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.borderColor),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(11),
            child: Stack(
              fit: StackFit.expand,
              children: [
                const EditorialImage(
                  imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&q=80',
                  fit: BoxFit.cover,
                ),
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                      colors: [
                        AppTheme.charcoal.withValues(alpha: 0.9),
                        AppTheme.charcoal.withValues(alpha: 0.4),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'CHĂM SÓC RÂU & DƯỠNG THỂ TRUYỀN THỐNG',
                        style: AppTheme.labelUppercase(fontSize: 8.5, color: AppTheme.accentGold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Shaving & Beard Grooming',
                        style: AppTheme.headingSmall(fontSize: 18, color: AppTheme.textLight),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Khăn nóng, kem cạo bọt mịn & dầu dưỡng da sau cạo.',
                        style: AppTheme.bodySmall(fontSize: 11, color: AppTheme.textLightSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // =========================================================================
  // CHẾ ĐỘ BỘ LỌC, FILTERED GRID VIEW
  // =========================================================================
  Widget _buildFilteredGridView(List<Product> filtered) {
    return Column(
      children: [
        // Thanh thông tin bộ lọc & nút quay lại Lookbook
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Hiển thị: ${filtered.length} sản phẩm',
                  style: AppTheme.bodySmall(color: AppTheme.textSecondary, fontWeight: FontWeight.w600),
                ),
              ),
              GestureDetector(
                onTap: _resetToLookbook,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceCard,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppTheme.accentGold),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.filter_alt_off_rounded, size: 14, color: AppTheme.accentGold),
                      const SizedBox(width: 4),
                      Text(
                        'Xóa bộ lọc',
                        style: AppTheme.labelUppercase(fontSize: 9.5, color: AppTheme.accentGold),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: filtered.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.search_off_rounded, size: 48, color: AppTheme.textMuted),
                      const SizedBox(height: 12),
                      Text(
                        'Không tìm thấy sản phẩm nào.',
                        style: AppTheme.bodyMedium(color: AppTheme.textSecondary),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton(
                        onPressed: _resetToLookbook,
                        child: const Text('Xóa bộ lọc'),
                      ),
                    ],
                  ),
                )
              : GridView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.65,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final p = filtered[index];
                    return _buildProductCard(p);
                  },
                ),
        ),
      ],
    );
  }

  // =========================================================================
  // THẺ SẢN PHẨM DÙNG CHUNG, CHO CẢ GRID & SLIDER
  // =========================================================================
  Widget _buildProductCard(Product p, {double? width}) {
    return GestureDetector(
      onTap: () => _showProductDetails(p),
      child: Container(
        width: width,
        margin: width != null ? const EdgeInsets.only(right: 12) : EdgeInsets.zero,
        decoration: BoxDecoration(
          color: AppTheme.surfaceCard,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppTheme.borderColor),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
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
                    style: AppTheme.labelUppercase(fontSize: 8.5, color: AppTheme.accentGold),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    p.name,
                    style: AppTheme.headingSmall(fontSize: 13),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        currencyFormat.format(p.actualPrice),
                        style: AppTheme.headingSmall(fontSize: 13.5, color: AppTheme.accentGold),
                      ),
                      if (p.discountPercent > 0) ...[
                        const SizedBox(width: 4),
                        Text(
                          currencyFormat.format(p.originalPrice),
                          style: AppTheme.bodySmall(fontSize: 10, color: AppTheme.textMuted).copyWith(
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    height: 28,
                    child: OutlinedButton(
                      onPressed: () => _quickAddToCart(p),
                      style: OutlinedButton.styleFrom(
                        padding: EdgeInsets.zero,
                        side: const BorderSide(color: AppTheme.accentGold, width: 1),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                      child: const Text(
                        '+ Thêm',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.accentGold),
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
