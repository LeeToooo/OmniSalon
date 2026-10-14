import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'models/order.dart';
import 'services/auth_service.dart';
import 'screens/home_screen.dart';
import 'screens/services_screen.dart';
import 'screens/booking_screen.dart';
import 'screens/shop_screen.dart';
import 'screens/my_bookings_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await initializeDateFormatting('vi', null);
  } catch (e) {
    debugPrint('DateFormatting init error: $e');
  }
  await AuthService.init();
  runApp(const OmniSalonApp());
}

class OmniSalonApp extends StatelessWidget {
  const OmniSalonApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Omni Salon Barber',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF1F3F6),
        primaryColor: const Color(0xFFB48312),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFB48312),
          surface: Colors.white,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Color(0xFF0F172A),
          elevation: 0.5,
          centerTitle: false,
        ),
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
      const ServicesScreen(),
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
        height: 65,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home, color: Color(0xFFB48312)),
            label: 'Trang Chủ',
          ),
          NavigationDestination(
            icon: Icon(Icons.content_cut_outlined),
            selectedIcon: Icon(Icons.content_cut, color: Color(0xFFB48312)),
            label: 'Dịch Vụ',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            selectedIcon: Icon(Icons.calendar_month, color: Color(0xFFB48312)),
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
            label: 'Lịch Hẹn',
          ),
        ],
      ),
    );
  }
}
