import 'package:omni_salon_mobile/core/auth/auth_service.dart';
import 'package:omni_salon_mobile/core/api/api_service.dart';
import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';
import 'package:omni_salon_mobile/models/order.dart';
import 'package:omni_salon_mobile/models/branch.dart';
import 'package:omni_salon_mobile/pages/user/home_page.dart';
import 'package:omni_salon_mobile/pages/user/services_page.dart';
import 'package:omni_salon_mobile/pages/user/booking_page.dart';
import 'package:omni_salon_mobile/pages/user/shop_page.dart';
import 'package:omni_salon_mobile/pages/user/cart_page.dart';
import 'package:omni_salon_mobile/pages/user/profile_page.dart';
import 'package:omni_salon_mobile/pages/user/ai_studio_page.dart';

class MainScaffold extends StatefulWidget {
  final int initialIndex;

  const MainScaffold({super.key, this.initialIndex = 0});

  static MainScaffoldState? of(BuildContext context) {
    return context.findAncestorStateOfType<MainScaffoldState>();
  }

  @override
  State<MainScaffold> createState() => MainScaffoldState();
}

class MainScaffoldState extends State<MainScaffold> {
  late int _currentIndex;
  final List<OrderItem> _sharedCart = [];
  Branch? _selectedBranch;
  Branch? get selectedBranch => _selectedBranch;
  String? _lastUserId;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _lastUserId = AuthService.currentUser?.id;
    _loadCartForUser(_lastUserId);
    AuthService.userNotifier.addListener(_onAuthChanged);
    _loadBranches();
  }

  Future<void> _saveCartForUser(String? userId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = 'omni_cart_${userId ?? "guest"}';
      final jsonList = _sharedCart.map((i) => i.toJson()).toList();
      await prefs.setString(key, jsonEncode(jsonList));
    } catch (_) {}
  }

  Future<void> _loadCartForUser(String? userId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = 'omni_cart_${userId ?? "guest"}';
      final raw = prefs.getString(key);
      if (raw != null && raw.isNotEmpty) {
        final List list = jsonDecode(raw);
        _sharedCart.clear();
        for (var item in list) {
          _sharedCart.add(OrderItem.fromJson(Map<String, dynamic>.from(item)));
        }
      } else {
        _sharedCart.clear();
      }
    } catch (_) {
      _sharedCart.clear();
    }
    if (mounted) setState(() {});
  }

  void _onAuthChanged() async {
    final currentUser = AuthService.userNotifier.value;
    final currentId = currentUser?.id;
    if (_lastUserId != currentId) {
      await _saveCartForUser(_lastUserId);
      _lastUserId = currentId;
      await _loadCartForUser(currentId);
    }
    if (mounted) setState(() {});
  }

  void clearCart() {
    setState(() {
      _sharedCart.clear();
    });
    _saveCartForUser(AuthService.currentUser?.id);
  }

  @override
  void dispose() {
    AuthService.userNotifier.removeListener(_onAuthChanged);
    super.dispose();
  }

  Future<void> _loadBranches() async {
    final list = await ApiService.fetchBranches();
    if (!mounted) return;
    setState(() {
      if (list.isNotEmpty && _selectedBranch == null) {
        _selectedBranch = list.first;
      }
    });
  }

  void switchTab(int index) {
    if (index >= 0 && index <= 4) {
      setState(() => _currentIndex = index);
    }
  }

  void addToCart(OrderItem item) {
    setState(() {
      final idx = _sharedCart.indexWhere((i) => i.productId == item.productId);
      if (idx != -1) {
        final ex = _sharedCart[idx];
        _sharedCart[idx] = OrderItem(
          productId: ex.productId,
          name: ex.name,
          price: ex.price,
          quantity: ex.quantity + item.quantity,
          image: ex.image,
        );
      } else {
        _sharedCart.add(item);
      }
    });
    _saveCartForUser(AuthService.currentUser?.id);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đã thêm "${item.name}" vào giỏ hàng!', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
        backgroundColor: AppTheme.charcoal,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  int get cartCount => _sharedCart.fold(0, (sum, i) => sum + i.quantity);


  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeScreen(
        onNavigateToTab: switchTab,
        selectedBranch: _selectedBranch,
      ),
      ServicesScreen(
        onNavigateToBooking: (serviceId) {
          switchTab(2); // Chuyển sang Tab Đặt lịch
        },
      ),
      BookingScreen(
        initialBranch: _selectedBranch,
      ),
      const AiStylingScreen(),
      ShopScreen(
        cartItems: _sharedCart,
        onAddToCart: addToCart,
      ),
    ];

    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        titleSpacing: 16,
        backgroundColor: AppTheme.bgPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'OMNI SALON',
              style: AppTheme.headingSmall(fontSize: 18, color: AppTheme.textPrimary),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(
                color: AppTheme.accentGold.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(3),
              ),
              child: Text(
                'BARBER',
                style: AppTheme.labelUppercase(fontSize: 8.5, color: AppTheme.accentGold),
              ),
            ),
          ],
        ),
        actions: [
          // Nút Giỏ hàng
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_bag_outlined, size: 23, color: AppTheme.textPrimary),
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => CartScreen(
                        cart: _sharedCart,
                        onUpdateCart: () {
                          _saveCartForUser(AuthService.currentUser?.id);
                          setState(() {});
                        },
                        onNavigateToShop: () => switchTab(4),
                      ),
                    ),
                  );
                },
              ),
              if (cartCount > 0)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: AppTheme.accentGold,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    child: Text(
                      '$cartCount',
                      style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w900, color: AppTheme.charcoal),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),

          // Nút Profile avatar -> Mở ProfileScreen (Hồ sơ hội viên)
          Padding(
            padding: const EdgeInsets.only(right: 14, left: 2),
            child: GestureDetector(
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const ProfileScreen()),
                );
              },
              child: ValueListenableBuilder(
                valueListenable: AuthService.userNotifier,
                builder: (context, user, _) {
                  return CircleAvatar(
                    radius: 17,
                    backgroundColor: AppTheme.charcoal,
                    child: user != null && user.fullName.isNotEmpty
                        ? Text(
                            user.fullName.substring(0, 1).toUpperCase(),
                            style: AppTheme.bodySmall(color: AppTheme.accentGold, fontWeight: FontWeight.w800),
                          )
                        : const Icon(Icons.person_outline_rounded, size: 18, color: AppTheme.accentGold),
                  );
                },
              ),
            ),
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppTheme.charcoal,
          border: Border(top: BorderSide(color: AppTheme.charcoalBorder, width: 1)),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(0, Icons.home_outlined, Icons.home_rounded, 'Trang chủ'),
                _buildNavItem(1, Icons.content_cut_outlined, Icons.content_cut_rounded, 'Dịch vụ'),
                _buildCenterBookingButton(),
                _buildNavItem(3, Icons.auto_awesome_outlined, Icons.auto_awesome_rounded, 'AI Tạo kiểu'),
                _buildNavItem(4, Icons.storefront_outlined, Icons.storefront_rounded, 'Cửa hàng'),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData outlineIcon, IconData filledIcon, String label) {
    final isSelected = _currentIndex == index;
    final color = isSelected ? AppTheme.accentGold : AppTheme.textLightSecondary;

    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => switchTab(index),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(isSelected ? filledIcon : outlineIcon, color: color, size: 22),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: color,
              ),
              maxLines: 1,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCenterBookingButton() {
    final isSelected = _currentIndex == 2;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => switchTab(2),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppTheme.accentGold,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppTheme.accentGold.withValues(alpha: 0.35),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: const Icon(
              Icons.calendar_month_rounded,
              color: AppTheme.charcoal,
              size: 24,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            'Đặt lịch',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: isSelected ? AppTheme.accentGold : AppTheme.textLight,
            ),
          ),
        ],
      ),
    );
  }
}
