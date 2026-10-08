import 'package:flutter/material.dart';
import 'models/order.dart';
import 'screens/home_screen.dart';
import 'screens/booking_screen.dart';
import 'screens/shop_screen.dart';
import 'screens/my_bookings_screen.dart';

void main() {
  runApp(const OmniSalonApp());
}

class OmniSalonApp extends StatelessWidget {
  const OmniSalonApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Omni Salon',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF1F3F6), // Sáng nhẹ, không chói mắt (Yêu cầu 2)
        primaryColor: const Color(0xFFB48312), // Vàng kim Champagne
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFB48312),
          surface: Colors.white,
          background: const Color(0xFFF1F3F6),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Color(0xFF0F172A),
          elevation: 0.5,
          centerTitle: false,
        ),
        fontFamily: 'Inter',
      ),
      home: const MainNavigationShell(),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;
  final List<OrderItem> _sharedCart = [];

  void _addToCart(OrderItem item) {
    setState(() {
      final existingIndex = _sharedCart.indexWhere((i) => i.productId == item.productId);
      if (existingIndex != -1) {
        final ex = _sharedCart[existingIndex];
        _sharedCart[existingIndex] = OrderItem(
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
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      const HomeScreen(),
      const BookingScreen(),
      ShopScreen(sharedCart: _sharedCart, onAddToCart: _addToCart),
      const MyBookingsScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        backgroundColor: Colors.white,
        indicatorColor: const Color(0xFFFEF3C7),
        elevation: 3,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home, color: Color(0xFFB48312)),
            label: 'Trang Chủ',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_today_outlined),
            selectedIcon: Icon(Icons.calendar_today, color: Color(0xFFB48312)),
            label: 'Đặt Lịch',
          ),
          NavigationDestination(
            icon: Icon(Icons.storefront_outlined),
            selectedIcon: Icon(Icons.storefront, color: Color(0xFFB48312)),
            label: 'Cửa Hàng',
          ),
          NavigationDestination(
            icon: Icon(Icons.assignment_outlined),
            selectedIcon: Icon(Icons.assignment, color: Color(0xFFB48312)),
            label: 'Lịch Của Tôi',
          ),
        ],
      ),
    );
  }
}
