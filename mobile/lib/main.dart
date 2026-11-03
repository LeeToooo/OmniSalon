import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';
import 'package:omni_salon_mobile/core/auth/auth_service.dart';
import 'package:omni_salon_mobile/components/main_scaffold.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await initializeDateFormatting('vi', null);
  } catch (e) {
    debugPrint('DateFormatting init error: $e');
  }
  await AuthService.init();
  await AppTheme.initTheme();
  runApp(const OmniSalonApp());
}

class OmniSalonApp extends StatelessWidget {
  const OmniSalonApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: AppTheme.isDarkModeNotifier,
      builder: (context, isDark, _) {
        return MaterialApp(
          title: 'Omni Salon Authentic Barber',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: isDark ? ThemeMode.dark : ThemeMode.light,
          scrollBehavior: const MaterialScrollBehavior().copyWith(
            dragDevices: {
              PointerDeviceKind.mouse,
              PointerDeviceKind.touch,
              PointerDeviceKind.trackpad,
              PointerDeviceKind.stylus,
            },
          ),
          home: const MainScaffold(),
        );
      },
    );
  }
}
