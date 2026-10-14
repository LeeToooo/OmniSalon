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
      return {'success': false, 'message': 'Không thể kết nối đến máy chủ SQL Server ($e). Vui lòng kiểm tra server.bat đã bật.'};
    }
  }

  static Future<Map<String, dynamic>> register({
    required String fullName,
    required String phone,
    required String email,
    required String password,
  }) async {
    final cleanName = fullName.trim();
    final cleanPhone = phone.trim();
    final cleanEmail = email.trim();
    final cleanPass = password.trim();

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
      return {'success': false, 'message': 'Không thể kết nối đến máy chủ SQL Server ($e).'};
    }
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
