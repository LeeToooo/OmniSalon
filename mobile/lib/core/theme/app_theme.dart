import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppTheme {
  // Quản lý trạng thái Sáng / Tối toàn hệ thống (Mặc định ban đầu là Sáng theo yêu cầu)
  static final ValueNotifier<bool> isDarkModeNotifier = ValueNotifier<bool>(false);
  static bool get isDarkMode => isDarkModeNotifier.value;

  static const String _themePrefKey = 'omni_salon_dark_mode';

  static Future<void> setDarkMode(bool value) async {
    isDarkModeNotifier.value = value;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_themePrefKey, value);
    } catch (_) {}
  }

  static Future<void> toggleDarkMode() async {
    await setDarkMode(!isDarkMode);
  }

  static Future<void> initTheme() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      isDarkModeNotifier.value = prefs.getBool(_themePrefKey) ?? false;
    } catch (_) {}
  }

  // Bảng màu sang trọng Editorial Barbershop tự động biến chuyển theo Chế Độ Sáng / Tối
  static Color get bgPrimary => isDarkMode ? const Color(0xFF141413) : const Color(0xFFFAF8F5);       // Nền kem ấm vs Đen than sang
  static Color get surfaceCard => isDarkMode ? const Color(0xFF1C1C1A) : const Color(0xFFFFFFFF);     // Thẻ nền sáng vs Thẻ nền tối
  static Color get surfaceElevated => isDarkMode ? const Color(0xFF242422) : const Color(0xFFF3EFEA); // Nền phụ nổi nhẹ
  
  static const Color charcoal = Color(0xFF141413);        // Đen than sang trọng (luôn giữ màu đen than nguyên bản cho banner, overlay gradient, badge trên ảnh)
  static const Color charcoalLight = Color(0xFF1C1C1A);   // Đen than cho khối phụ
  static const Color charcoalSurface = Color(0xFF242422); // Đen than nổi
  static const Color charcoalBorder = Color(0xFF2A2A28);  // Viền đen than

  static const Color accentGold = Color(0xFFC59B27);      // Vàng đồng trầm nguyên bản
  static const Color accentGoldHover = Color(0xFFA27B1C); // Vàng đồng đậm khi chạm
  static const Color accentGoldLight = Color(0xFFD4AF37); // Vàng sáng điểm xuyết
  static const Color accentGoldSubtle = Color(0x1FC59B27);// Vàng đồng trong suốt 12%

  static Color get borderColor => isDarkMode ? const Color(0x26FFFFFF) : const Color(0x1F141413);     // Viền thích ứng
  static Color get borderColorSubtle => isDarkMode ? const Color(0x14FFFFFF) : const Color(0x0F141413);

  static Color get textPrimary => isDarkMode ? const Color(0xFFFAF8F5) : const Color(0xFF141413);     // Chữ chính
  static Color get textSecondary => isDarkMode ? const Color(0xFFA6A6A0) : const Color(0xFF575752);   // Chữ phụ
  static Color get textMuted => isDarkMode ? const Color(0xFF858580) : const Color(0xFF8E8E8A);       // Chữ chú thích
  static const Color textLight = Color(0xFFFAF8F5);       // Luôn là chữ sáng kem
  static const Color textLightSecondary = Color(0xFFA6A6A0);

  static const Color statusSuccess = Color(0xFF10B981);
  static const Color statusWarning = Color(0xFFF59E0B);
  static const Color statusDanger = Color(0xFFEF4444);

  // Typography Đương đại: Open Sans đồng bộ toàn diện, Tự động thích ứng màu chữ
  static TextStyle headingLarge({Color? color, double fontSize = 28}) {
    return GoogleFonts.openSans(
      fontSize: fontSize,
      fontWeight: FontWeight.w700,
      color: color ?? textPrimary,
      letterSpacing: -0.5,
      height: 1.15,
    );
  }

  static TextStyle headingMedium({Color? color, double fontSize = 22}) {
    return GoogleFonts.openSans(
      fontSize: fontSize,
      fontWeight: FontWeight.w700,
      color: color ?? textPrimary,
      letterSpacing: -0.4,
      height: 1.2,
    );
  }

  static TextStyle headingSmall({Color? color, double fontSize = 18}) {
    return GoogleFonts.openSans(
      fontSize: fontSize,
      fontWeight: FontWeight.w700,
      color: color ?? textPrimary,
      letterSpacing: -0.3,
      height: 1.25,
    );
  }

  static TextStyle bodyLarge({Color? color, FontWeight fontWeight = FontWeight.w400, double? fontSize}) {
    return GoogleFonts.openSans(
      fontSize: fontSize ?? 16,
      fontWeight: fontWeight,
      color: color ?? textPrimary,
      height: 1.5,
    );
  }

  static TextStyle bodyMedium({Color? color, FontWeight fontWeight = FontWeight.w400, double? fontSize}) {
    return GoogleFonts.openSans(
      fontSize: fontSize ?? 14,
      fontWeight: fontWeight,
      color: color ?? textPrimary,
      height: 1.45,
    );
  }

  static TextStyle bodySmall({Color? color, FontWeight fontWeight = FontWeight.w400, double? fontSize}) {
    return GoogleFonts.openSans(
      fontSize: fontSize ?? 12.5,
      fontWeight: fontWeight,
      color: color ?? textSecondary,
      height: 1.4,
    );
  }

  static TextStyle labelUppercase({Color color = accentGold, double fontSize = 11, FontWeight fontWeight = FontWeight.w700}) {
    return GoogleFonts.openSans(
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
      letterSpacing: 1.2,
    );
  }

  // Cấu hình Theme sáng (Light Theme)
  static ThemeData get lightTheme {
    final baseTextTheme = GoogleFonts.openSansTextTheme();

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: const Color(0xFFFAF8F5),
      primaryColor: accentGold,
      canvasColor: const Color(0xFFFFFFFF),
      cardColor: const Color(0xFFFFFFFF),
      dividerColor: const Color(0x1F141413),
      colorScheme: const ColorScheme.light(
        primary: accentGold,
        onPrimary: Color(0xFF141413),
        secondary: accentGoldHover,
        onSecondary: Color(0xFFFFFFFF),
        surface: Color(0xFFFFFFFF),
        onSurface: Color(0xFF141413),
        error: statusDanger,
        onError: Color(0xFFFFFFFF),
      ),
      textTheme: baseTextTheme.copyWith(
        displayLarge: headingLarge(color: const Color(0xFF141413), fontSize: 32),
        displayMedium: headingLarge(color: const Color(0xFF141413), fontSize: 28),
        displaySmall: headingMedium(color: const Color(0xFF141413), fontSize: 24),
        headlineMedium: headingMedium(color: const Color(0xFF141413), fontSize: 20),
        headlineSmall: headingSmall(color: const Color(0xFF141413), fontSize: 18),
        titleLarge: headingSmall(color: const Color(0xFF141413), fontSize: 16),
        titleMedium: bodyLarge(color: const Color(0xFF141413), fontWeight: FontWeight.w600),
        titleSmall: bodyMedium(color: const Color(0xFF141413), fontWeight: FontWeight.w600),
        bodyLarge: bodyLarge(color: const Color(0xFF141413)),
        bodyMedium: bodyMedium(color: const Color(0xFF141413)),
        bodySmall: bodySmall(color: const Color(0xFF575752)),
        labelLarge: bodyMedium(color: const Color(0xFF141413), fontWeight: FontWeight.w700),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: const Color(0xFFFAF8F5),
        foregroundColor: const Color(0xFF141413),
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: headingMedium(color: const Color(0xFF141413), fontSize: 20),
        iconTheme: const IconThemeData(color: Color(0xFF141413), size: 22),
      ),
      cardTheme: CardThemeData(
        color: const Color(0xFFFFFFFF),
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: const BorderSide(color: Color(0x1F141413), width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accentGold,
          foregroundColor: const Color(0xFF141413),
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: GoogleFonts.openSans(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.3,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFF141413),
          side: const BorderSide(color: Color(0x1F141413), width: 1.2),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: GoogleFonts.openSans(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFFFFFFF),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: bodyMedium(color: const Color(0xFF8E8E8A)),
        labelStyle: bodyMedium(color: const Color(0xFF575752)),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0x1F141413), width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0x1F141413), width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: accentGold, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: statusDanger, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: statusDanger, width: 1.5),
        ),
      ),
    );
  }

  // Cấu hình Theme tối (Dark Theme)
  static ThemeData get darkTheme {
    final baseTextTheme = GoogleFonts.openSansTextTheme();

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: const Color(0xFF141413),
      primaryColor: accentGold,
      canvasColor: const Color(0xFF1C1C1A),
      cardColor: const Color(0xFF1C1C1A),
      dividerColor: const Color(0x26FFFFFF),
      colorScheme: const ColorScheme.dark(
        primary: accentGold,
        onPrimary: Color(0xFF141413),
        secondary: accentGoldLight,
        onSecondary: Colors.white,
        surface: Color(0xFF1C1C1A),
        onSurface: Color(0xFFFAF8F5),
        error: statusDanger,
        onError: Colors.white,
      ),
      textTheme: baseTextTheme.copyWith(
        displayLarge: headingLarge(color: const Color(0xFFFAF8F5), fontSize: 32),
        displayMedium: headingLarge(color: const Color(0xFFFAF8F5), fontSize: 28),
        displaySmall: headingMedium(color: const Color(0xFFFAF8F5), fontSize: 24),
        headlineMedium: headingMedium(color: const Color(0xFFFAF8F5), fontSize: 20),
        headlineSmall: headingSmall(color: const Color(0xFFFAF8F5), fontSize: 18),
        titleLarge: headingSmall(color: const Color(0xFFFAF8F5), fontSize: 16),
        titleMedium: bodyLarge(color: const Color(0xFFFAF8F5), fontWeight: FontWeight.w600),
        titleSmall: bodyMedium(color: const Color(0xFFFAF8F5), fontWeight: FontWeight.w600),
        bodyLarge: bodyLarge(color: const Color(0xFFFAF8F5)),
        bodyMedium: bodyMedium(color: const Color(0xFFFAF8F5)),
        bodySmall: bodySmall(color: const Color(0xFFA6A6A0)),
        labelLarge: bodyMedium(color: const Color(0xFFFAF8F5), fontWeight: FontWeight.w700),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: const Color(0xFF141413),
        foregroundColor: const Color(0xFFFAF8F5),
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: headingMedium(color: const Color(0xFFFAF8F5), fontSize: 20),
        iconTheme: const IconThemeData(color: Color(0xFFFAF8F5), size: 22),
      ),
      cardTheme: CardThemeData(
        color: const Color(0xFF1C1C1A),
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: const BorderSide(color: Color(0x26FFFFFF), width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accentGold,
          foregroundColor: const Color(0xFF141413),
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: GoogleFonts.openSans(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.3,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFFFAF8F5),
          side: const BorderSide(color: Color(0x26FFFFFF), width: 1.2),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: GoogleFonts.openSans(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF1C1C1A),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: bodyMedium(color: const Color(0xFF858580)),
        labelStyle: bodyMedium(color: const Color(0xFFA6A6A0)),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0x26FFFFFF), width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0x26FFFFFF), width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: accentGold, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: statusDanger, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: statusDanger, width: 1.5),
        ),
      ),
    );
  }
}
