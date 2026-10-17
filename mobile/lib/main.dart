import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'theme/app_theme.dart';
import 'services/auth_service.dart';
import 'screens/main_scaffold.dart';

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
      title: 'Omni Salon Authentic Barber',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const MainScaffold(),
    );
  }
}
