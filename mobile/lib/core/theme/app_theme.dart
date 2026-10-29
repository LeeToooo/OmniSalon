import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Bảng màu sang trọng Editorial Barbershop (Đồng bộ với bản Web Omni Salon)
  static const Color bgPrimary = Color(0xFFFAF8F5);       // Nền kem ấm đặc trưng
  static const Color surfaceCard = Color(0xFFFFFFFF);     // Thẻ nền sáng tinh tế
  static const Color surfaceElevated = Color(0xFFF3EFEA); // Nền phụ nổi nhẹ
  
  static const Color charcoal = Color(0xFF141413);        // Đen than sang trọng
  static const Color charcoalLight = Color(0xFF1C1C1A);   // Đen than cho khối phụ
  static const Color charcoalSurface = Color(0xFF242422); // Đen than nổi
  static const Color charcoalBorder = Color(0xFF2A2A28);  // Viền đen than

  static const Color accentGold = Color(0xFFC59B27);      // Vàng đồng trầm nguyên bản
  static const Color accentGoldHover = Color(0xFFA27B1C); // Vàng đồng đậm khi chạm
  static const Color accentGoldLight = Color(0xFFD4AF37); // Vàng sáng điểm xuyết
  static const Color accentGoldSubtle = Color(0x1FC59B27);// Vàng đồng trong suốt 12%

  static const Color borderColor = Color(0x1F141413);     // Viền mỏng 12% đen trên nền sáng
  static const Color borderColorSubtle = Color(0x0F141413);// Viền mỏng 6%

  static const Color textPrimary = Color(0xFF141413);     // Chữ đen than đậm nét
  static const Color textSecondary = Color(0xFF575752);   // Chữ phụ xám chì
  static const Color textMuted = Color(0xFF8E8E8A);       // Chữ chú thích
  static const Color textLight = Color(0xFFFAF8F5);       // Chữ sáng kem trên nền tối
  static const Color textLightSecondary = Color(0xFFA6A6A0);

  static const Color statusSuccess = Color(0xFF10B981);
  static const Color statusWarning = Color(0xFFF59E0B);
  static const Color statusDanger = Color(0xFFEF4444);

  // Typography Đương đại: Open Sans đồng bộ toàn diện (Giống phiên bản Web Omni Salon)
  static TextStyle headingLarge({Color color = textPrimary, double fontSize = 28}) {
    return GoogleFonts.openSans(
      fontSize: fontSize,
      fontWeight: FontWeight.w700,
      color: color,
      letterSpacing: -0.5,
      height: 1.15,
    );
  }

  static TextStyle headingMedium({Color color = textPrimary, double fontSize = 22}) {
    return GoogleFonts.openSans(
      fontSize: fontSize,
      fontWeight: FontWeight.w700,
      color: color,
      letterSpacing: -0.4,
      height: 1.2,
    );
  }

  static TextStyle headingSmall({Color color = textPrimary, double fontSize = 18}) {
    return GoogleFonts.openSans(
      fontSize: fontSize,
      fontWeight: FontWeight.w700,
      color: color,
      letterSpacing: -0.3,
      height: 1.25,
    );
  }

  static TextStyle bodyLarge({Color color = textPrimary, FontWeight fontWeight = FontWeight.w400, double? fontSize}) {
    return GoogleFonts.openSans(
      fontSize: fontSize ?? 16,
      fontWeight: fontWeight,
      color: color,
      height: 1.5,
    );
  }

  static TextStyle bodyMedium({Color color = textPrimary, FontWeight fontWeight = FontWeight.w400, double? fontSize}) {
    return GoogleFonts.openSans(
      fontSize: fontSize ?? 14,
      fontWeight: fontWeight,
      color: color,
      height: 1.45,
    );
  }

  static TextStyle bodySmall({Color color = textSecondary, FontWeight fontWeight = FontWeight.w400, double? fontSize}) {
    return GoogleFonts.openSans(
      fontSize: fontSize ?? 12.5,
      fontWeight: fontWeight,
      color: color,
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

  // Cấu hình Theme sáng (Mặc định cho Omni Salon)
  static ThemeData get lightTheme {
    final baseTextTheme = GoogleFonts.openSansTextTheme();

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: bgPrimary,
      primaryColor: accentGold,
      canvasColor: surfaceCard,
      cardColor: surfaceCard,
      dividerColor: borderColor,
      colorScheme: const ColorScheme.light(
        primary: accentGold,
        onPrimary: charcoal,
        secondary: accentGoldHover,
        onSecondary: surfaceCard,
        surface: surfaceCard,
        onSurface: textPrimary,
        error: statusDanger,
        onError: surfaceCard,
      ),
      textTheme: baseTextTheme.copyWith(
        displayLarge: headingLarge(color: textPrimary, fontSize: 32),
        displayMedium: headingLarge(color: textPrimary, fontSize: 28),
        displaySmall: headingMedium(color: textPrimary, fontSize: 24),
        headlineMedium: headingMedium(color: textPrimary, fontSize: 20),
        headlineSmall: headingSmall(color: textPrimary, fontSize: 18),
        titleLarge: headingSmall(color: textPrimary, fontSize: 16),
        titleMedium: bodyLarge(color: textPrimary, fontWeight: FontWeight.w600),
        titleSmall: bodyMedium(color: textPrimary, fontWeight: FontWeight.w600),
        bodyLarge: bodyLarge(color: textPrimary),
        bodyMedium: bodyMedium(color: textPrimary),
        bodySmall: bodySmall(color: textSecondary),
        labelLarge: bodyMedium(color: textPrimary, fontWeight: FontWeight.w700),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: bgPrimary,
        foregroundColor: textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: headingMedium(color: textPrimary, fontSize: 20),
        iconTheme: const IconThemeData(color: textPrimary, size: 22),
      ),
      cardTheme: CardThemeData(
        color: surfaceCard,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: const BorderSide(color: borderColor, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accentGold,
          foregroundColor: charcoal,
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
          foregroundColor: textPrimary,
          side: const BorderSide(color: borderColor, width: 1.2),
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
        fillColor: surfaceCard,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: bodyMedium(color: textMuted),
        labelStyle: bodyMedium(color: textSecondary),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: borderColor, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: borderColor, width: 1),
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
