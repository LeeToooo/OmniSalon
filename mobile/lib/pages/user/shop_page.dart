import 'package:omni_salon_mobile/core/api/api_service.dart';
import 'package:omni_salon_mobile/core/auth/auth_service.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';
import 'package:omni_salon_mobile/models/product.dart';
import 'package:omni_salon_mobile/models/order.dart';
import 'package:omni_salon_mobile/components/editorial_image.dart';

class ShopScreen extends StatefulWidget {
  final List<OrderItem> cartItems;
  final Function(OrderItem) onAddToCart;

  const ShopScreen({
    super.key,
    required this.cartItems,
    required this.onAddToCart,
  });

  // Mở modal xem chi tiết sản phẩm và 4 góc nhìn thực tế
  static void showProductDetailModal(
    BuildContext context, {
    required Product product,
    Function(OrderItem)? onAddToCart,
  }) {
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

    final angleBadges = [
      'Góc 1: Chính diện',
      'Góc 2: Nghiêng 45°',
      'Góc 3: Mở nắp / Chất sáp',
      'Góc 4: Mặt sau & Tem'
    ];

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
                  // Khung ảnh sản phẩm chính và nhãn góc nhìn
                  Stack(
                    children: [
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
                      Positioned(
                        top: 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.75),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.4)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.camera_alt_outlined, size: 12, color: AppTheme.accentGold),
                              const SizedBox(width: 4),
                              Text(
                                angleBadges[selectedAngle % angleBadges.length],
                                style: AppTheme.labelUppercase(fontSize: 10, color: AppTheme.accentGold),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
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
                    SizedBox(
                      width: double.infinity,
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
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Đã thêm $quantity x ${product.name} vào giỏ hàng!'),
                              backgroundColor: AppTheme.charcoal,
                              behavior: SnackBarBehavior.floating,
                              duration: const Duration(seconds: 2),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.accentGold,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        child: Text(
                          'Thêm Vào Giỏ • ${currencyFormat.format(product.actualPrice * quantity)}',
                          style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.charcoal),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  const Divider(color: AppTheme.borderColorSubtle),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('ĐÁNH GIÁ SẢN PHẨM', style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold)),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              const Icon(Icons.star_rounded, size: 16, color: Color(0xFFF59E0B)),
                              const SizedBox(width: 4),
                              Text('5.0 / 5.0 (18 đánh giá)', style: AppTheme.bodySmall(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                            ],
                          ),
                        ],
                      ),
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppTheme.accentGold),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        ),
                        icon: const Icon(Icons.edit_note_rounded, size: 16, color: AppTheme.accentGold),
                        label: Text('Viết Đánh Giá', style: AppTheme.bodySmall(fontSize: 11.5, fontWeight: FontWeight.w700, color: AppTheme.accentGold)),
                        onPressed: () {
                          ShopScreen.showWriteReviewDialog(context, product);
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
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
                            Text('Nguyễn Văn Tuấn', style: AppTheme.bodySmall(fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                            Text('2 ngày trước', style: AppTheme.bodySmall(fontSize: 10.5, color: AppTheme.textMuted)),
                          ],
                        ),
                        const SizedBox(height: 2),
                        const Row(
                          children: [
                            Icon(Icons.star_rounded, size: 13, color: Color(0xFFF59E0B)),
                            Icon(Icons.star_rounded, size: 13, color: Color(0xFFF59E0B)),
                            Icon(Icons.star_rounded, size: 13, color: Color(0xFFF59E0B)),
                            Icon(Icons.star_rounded, size: 13, color: Color(0xFFF59E0B)),
                            Icon(Icons.star_rounded, size: 13, color: Color(0xFFF59E0B)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text('Sản phẩm mùi thơm nam tính dễ chịu, độ giữ nếp tự nhiên cực tốt!', style: AppTheme.bodySmall(fontSize: 12, color: AppTheme.textSecondary)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // Dialog gửi đánh giá sản phẩm
  static void showWriteReviewDialog(BuildContext context, Product p) {
    if (!AuthService.isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Quý khách vui lòng đăng nhập để gửi đánh giá sản phẩm!'),
          backgroundColor: AppTheme.statusDanger,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    final commentCtrl = TextEditingController();
    int rating = 5;
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDlgState) => AlertDialog(
          backgroundColor: AppTheme.surfaceCard,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          title: Text('Đánh Giá ' + p.name, style: AppTheme.headingSmall(fontSize: 16)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Chọn số sao:', style: AppTheme.bodySmall(color: AppTheme.textSecondary)),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) => GestureDetector(
                  onTap: () => setDlgState(() => rating = index + 1),
                  child: Icon(
                    index < rating ? Icons.star_rounded : Icons.star_border_rounded,
                    color: const Color(0xFFF59E0B),
                    size: 32,
                  ),
                )),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: commentCtrl,
                style: AppTheme.bodyMedium(),
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Nhận xét về chất sáp, độ giữ nếp, hương thơm...',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('HỦY BỎ'),
            ),
            ElevatedButton(
              onPressed: () async {
                final txt = commentCtrl.text.trim();
                if (txt.isEmpty) return;
                await ApiService.createReview({
                  'productId': p.id,
                  'rating': rating,
                  'comment': txt,
                  'customerName': AuthService.currentUser?.fullName ?? 'Khách Hàng',
                });
                Navigator.of(ctx).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Cảm ơn bạn! Đánh giá đã được ghi nhận thành công.'),
                    backgroundColor: AppTheme.statusSuccess,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accentGold),
              child: const Text('GỬI ĐÁNH GIÁ', style: TextStyle(color: AppTheme.charcoal, fontWeight: FontWeight.bold)),
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
    _categoryScrollController.dispose();
    super.dispose();
  }

  Future<void> _loadProducts() async {
    setState(() => _isLoading = true);
    final list = await ApiService.fetchProducts();
    if (!mounted) return;

    setState(() {
      _allProducts = list.where((p) => !p.isExpired).toList();
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

  bool get _isLookbookMode {
    return _selectedCategory == 'all' &&
        _selectedBrand == 'all' &&
        _searchController.text.trim().isEmpty;
  }

  void _resetToLookbook() {
    setState(() {
      _selectedCategory = 'all';
      _selectedBrand = 'all';
      _searchController.clear();
      _sortOption = 'default';
    });
  }

  void _showProductDetails(Product p) {
    ShopScreen.showProductDetailModal(
      context,
      product: p,
      onAddToCart: widget.onAddToCart,
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

  @override
  Widget build(BuildContext context) {
    final filtered = _getFilteredProducts();

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
                        prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppTheme.textMuted),
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
                          borderSide: const BorderSide(color: AppTheme.borderColor),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: AppTheme.borderColor),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  PopupMenuButton<String>(
                    icon: Container(
                      padding: const EdgeInsets.all(9),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceCard,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.borderColor),
                      ),
                      child: const Icon(Icons.sort_rounded, size: 20, color: AppTheme.accentGold),
                    ),
                    tooltip: 'Sắp xếp sản phẩm',
                    onSelected: (val) {
                      setState(() {
                        _sortOption = val;
                        if (_isLookbookMode && val != 'default') {
                          _selectedCategory = 'all_grid';
                        }
                      });
                    },
                    itemBuilder: (ctx) => const [
                      PopupMenuItem(value: 'default', child: Text('Mặc định')),
                      PopupMenuItem(value: 'price_asc', child: Text('Giá: Thấp đến cao')),
                      PopupMenuItem(value: 'price_desc', child: Text('Giá: Cao đến thấp')),
                      PopupMenuItem(value: 'discount', child: Text('Giảm giá nhiều nhất')),
                    ],
                  ),
                ],
              ),
            ),

            // 2. DANH MỤC NGANG, HORIZONTAL CHIPS
            SizedBox(
              height: 38,
              child: ListView.separated(
                controller: _categoryScrollController,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: _categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, idx) {
                  final cat = _categories[idx];
                  final isSelected = _selectedCategory == cat['id'];
                  return ChoiceChip(
                    label: Text(
                      cat['name']!,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isSelected ? AppTheme.charcoal : AppTheme.textPrimary,
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: AppTheme.accentGold,
                    backgroundColor: AppTheme.surfaceCard,
                    side: BorderSide(
                      color: isSelected ? AppTheme.accentGold : AppTheme.borderColor,
                    ),
                    onSelected: (_) {
                      setState(() {
                        _selectedCategory = cat['id']!;
                        _selectedBrand = 'all';
                      });
                    },
                  );
                },
              ),
            ),
            const SizedBox(height: 6),

            // 3. NỘI DUNG CHÍNH, LOOKBOOK MODE HOẶC FILTERED GRID
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
                      const Icon(Icons.auto_stories_rounded, size: 14, color: AppTheme.accentGold),
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
                      const Icon(Icons.search_off_rounded, size: 48, color: AppTheme.textMuted),
                      const SizedBox(height: 12),
                      Text(
                        'Không tìm thấy sản phẩm nào.',
                        style: AppTheme.bodyMedium(color: AppTheme.textSecondary),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton(
                        onPressed: _resetToLookbook,
                        child: const Text('Xem lại toàn bộ'),
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
