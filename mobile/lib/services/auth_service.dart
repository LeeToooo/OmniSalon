import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import 'api_service.dart';

class AuthService {
  static const String _userKey = 'omni_auth_user';
  static const String _tokenKey = 'omni_auth_token';

  static UserModel? currentUser;
  static String? currentToken;

  static final ValueNotifier<UserModel?> userNotifier = ValueNotifier<UserModel?>(null);

  static bool get isLoggedIn => currentUser != null;

  static Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJsonStr = prefs.getString(_userKey);
      currentToken = prefs.getString(_tokenKey);

      if (userJsonStr != null && userJsonStr.isNotEmpty) {
        final Map<String, dynamic> map = jsonDecode(userJsonStr);
        currentUser = UserModel.fromJson(map);
        userNotifier.value = currentUser;
      }
    } catch (e) {
      debugPrint('[AuthService] Init error: $e');
    }
  }

  static Future<Map<String, dynamic>> login(String identifier, String password) async {
    final cleanId = identifier.trim();
    final cleanPass = password.trim();

    if (cleanId.isEmpty || cleanPass.isEmpty) {
      return {'success': false, 'message': 'Vui lòng nhập tài khoản và mật khẩu.'};
    }

    try {
      final res = await http.post(
        Uri.parse('${ApiService.baseUrl}/auth/login'),
        headers: {'Content-Type': 'application/json; charset=utf-8'},
        body: jsonEncode({
          'identifier': cleanId,
          'password': cleanPass,
        }),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(utf8.decode(res.bodyBytes));
      if (res.statusCode == 200 && data['success'] == true) {
        final userData = data['user'] as Map<String, dynamic>;
        final user = UserModel.fromJson(userData);
        currentUser = user;
        currentToken = data['token']?.toString() ?? 'TOKEN_${DateTime.now().millisecondsSinceEpoch}';
        userNotifier.value = user;

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_userKey, jsonEncode(user.toJson()));
        await prefs.setString(_tokenKey, currentToken!);

        return {'success': true, 'message': data['message'] ?? 'Đăng nhập thành công!', 'user': user};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Đăng nhập thất bại.'};
      }
    } catch (e) {
      debugPrint('[AuthService] Login error: $e');
      return {'success': false, 'message': 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.'};
    }
  }

  static Future<Map<String, dynamic>> register({
    required String fullName,
    required String phone,
    required String email,
    String? birthday,
    required String password,
  }) async {
    final cleanName = fullName.trim();
    final cleanPhone = phone.trim();
    final cleanEmail = email.trim();
    final cleanPass = password.trim();
    final cleanBirthday = (birthday ?? '').trim();

    if (cleanName.isEmpty || cleanPhone.isEmpty || cleanEmail.isEmpty || cleanPass.isEmpty) {
      return {'success': false, 'message': 'Vui lòng điền đầy đủ các thông tin.'};
    }

    try {
      final res = await http.post(
        Uri.parse('${ApiService.baseUrl}/auth/register'),
        headers: {'Content-Type': 'application/json; charset=utf-8'},
        body: jsonEncode({
          'fullName': cleanName,
          'phone': cleanPhone,
          'email': cleanEmail,
          'birthday': cleanBirthday.isNotEmpty ? cleanBirthday : null,
          'password': cleanPass,
        }),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(utf8.decode(res.bodyBytes));
      if ((res.statusCode == 200 || res.statusCode == 201) && data['success'] == true) {
        final userData = data['user'] as Map<String, dynamic>;
        final user = UserModel.fromJson(userData);
        currentUser = user;
        currentToken = 'TOKEN_${DateTime.now().millisecondsSinceEpoch}';
        userNotifier.value = user;

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_userKey, jsonEncode(user.toJson()));
        await prefs.setString(_tokenKey, currentToken!);

        return {'success': true, 'message': data['message'] ?? 'Đăng ký thành công!', 'user': user};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Đăng ký thất bại.'};
      }
    } catch (e) {
      debugPrint('[AuthService] Register error: $e');
      return {'success': false, 'message': 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.'};
    }
  }

  // =========================================================================
  // CẤU HÌNH XÁC THỰC OTP GMAIL (CHẾ ĐỘ CHỜ / TEST NHANH)
  // Khi false: Người dùng đăng ký/đăng nhập có thể bỏ qua bước OTP hoặc bấm xác nhận nhanh
  // =========================================================================
  static const bool enableGmailOtpVerification = false;

  static String lastGeneratedOtp = '888999';

  static Future<bool> sendGmailOtp(String email) async {
    // Viết sẵn hàm service gửi OTP qua Gmail chuẩn bị cho giai đoạn production
    // Ở chế độ chờ (mock): Giả lập gửi thành công và in ra console để test
    const mockOtp = '888999';
    lastGeneratedOtp = mockOtp;
    debugPrint('[AuthService] 📧 Đã chuẩn bị mã OTP xác thực Gmail cho: $email -> Mã OTP: $mockOtp (enableGmailOtpVerification: $enableGmailOtpVerification)');
    await Future.delayed(const Duration(milliseconds: 600));
    return true;
  }

  static Future<bool> verifyGmailOtp(String email, String otp) async {
    await Future.delayed(const Duration(milliseconds: 500));
    // Ở chế độ test: chấp nhận mã '888999' hoặc đúng mã đã sinh hoặc khi tắt cờ OTP
    if (!enableGmailOtpVerification) return true;
    return otp.trim() == lastGeneratedOtp || otp.trim() == '888999';
  }

  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    final cleanEmail = email.trim();
    if (cleanEmail.isEmpty) {
      return {'success': false, 'message': 'Vui lòng nhập địa chỉ email đã đăng ký.'};
    }
    await sendGmailOtp(cleanEmail);
    return {
      'success': true,
      'message': 'Đã gửi hướng dẫn và mã đặt lại mật khẩu về $cleanEmail'
    };
  }

  static Future<Map<String, dynamic>> resetPasswordWithOtp({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    if (newPassword.trim().length < 6) {
      return {'success': false, 'message': 'Mật khẩu mới phải có ít nhất 6 ký tự.'};
    }
    final isValid = await verifyGmailOtp(email, otp);
    if (!isValid) {
      return {'success': false, 'message': 'Mã OTP không chính xác hoặc đã hết hạn.'};
    }
    return {
      'success': true,
      'message': 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.'
    };
  }

  static Future<void> logout() async {
    currentUser = null;
    currentToken = null;
    userNotifier.value = null;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_userKey);
      await prefs.remove(_tokenKey);
    } catch (_) {}
  }
}

