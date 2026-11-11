import 'package:omni_salon_mobile/core/api/api_service.dart';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:omni_salon_mobile/models/user.dart';

class AuthService {
  static const String _userKey = 'omni_auth_user';
  static const String _tokenKey = 'omni_auth_token';

  static UserModel? currentUser;
  static String? currentToken;

  static final ValueNotifier<UserModel?> userNotifier =
      ValueNotifier<UserModel?>(null);

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

  static Future<Map<String, dynamic>> login(
      String identifier, String password) async {
    final cleanId = identifier.trim();
    final cleanPass = password.trim();

    if (cleanId.isEmpty || cleanPass.isEmpty) {
      return {
        'success': false,
        'message': 'Vui lòng nhập tài khoản và mật khẩu.'
      };
    }

    try {
      final res = await http
          .post(
            Uri.parse('${ApiService.baseUrl}/auth/login'),
            headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: jsonEncode({
              'identifier': cleanId,
              'password': cleanPass,
            }),
          )
          .timeout(const Duration(seconds: 10));

      final data = jsonDecode(utf8.decode(res.bodyBytes));
      if (res.statusCode == 200 && data['success'] == true) {
        final userData = data['user'] as Map<String, dynamic>;
        final user = UserModel.fromJson(userData);
        currentUser = user;
        currentToken = data['token']?.toString() ??
            'TOKEN_${DateTime.now().millisecondsSinceEpoch}';
        userNotifier.value = user;

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_userKey, jsonEncode(user.toJson()));
        await prefs.setString(_tokenKey, currentToken!);

        return {
          'success': true,
          'message': data['message'] ?? 'Đăng nhập thành công!',
          'user': user
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Đăng nhập thất bại.'
        };
      }
    } catch (e) {
      debugPrint('[AuthService] Login error: $e');
      return {
        'success': false,
        'message':
            'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.'
      };
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
    String? normalizedBirthday;
    if (cleanBirthday.isNotEmpty) {
      if (cleanBirthday.contains('/')) {
        final p = cleanBirthday.split('/');
        if (p.length == 3) {
          int y = int.tryParse(p[2]) ?? 2000;
          if (y < 100) y = y <= 30 ? 2000 + y : 1900 + y;
          final m = p[1].padLeft(2, '0');
          final d = p[0].padLeft(2, '0');
          normalizedBirthday = '$y-$m-$d';
        } else {
          normalizedBirthday = cleanBirthday;
        }
      } else {
        normalizedBirthday = cleanBirthday;
      }
    }

    if (cleanName.isEmpty ||
        cleanPhone.isEmpty ||
        cleanEmail.isEmpty ||
        cleanPass.isEmpty) {
      return {
        'success': false,
        'message': 'Vui lòng điền đầy đủ các thông tin.'
      };
    }

    try {
      final res = await http
          .post(
            Uri.parse('${ApiService.baseUrl}/auth/register'),
            headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: jsonEncode({
              'fullName': cleanName,
              'phone': cleanPhone,
              'email': cleanEmail,
              'birthday': normalizedBirthday,
              'password': cleanPass,
            }),
          )
          .timeout(const Duration(seconds: 20));

      final data = jsonDecode(utf8.decode(res.bodyBytes));
      if ((res.statusCode == 200 || res.statusCode == 201) &&
          data['success'] == true) {
        final userData = data['user'] as Map<String, dynamic>;
        final user = UserModel.fromJson(userData);
        currentUser = user;
        currentToken = data['token']?.toString() ??
            'TOKEN_${DateTime.now().millisecondsSinceEpoch}';
        userNotifier.value = user;

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_userKey, jsonEncode(user.toJson()));
        await prefs.setString(_tokenKey, currentToken!);

        return {
          'success': true,
          'message': data['message'] ?? 'Đăng ký thành công!',
          'user': user
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Đăng ký thất bại.'
        };
      }
    } catch (e) {
      debugPrint('[AuthService] Register error: $e');
      return {
        'success': false,
        'message':
            'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.'
      };
    }
  }

  static Future<bool> sendGmailOtp(String email) async {
    final cleanEmail = email.trim();
    debugPrint(
        '[AuthService] Gửi mã OTP xác thực Gmail đến địa chỉ thực tế: nonamenood0809@gmail.com (Tài khoản: $cleanEmail)');
    try {
      final res = await http
          .post(
            Uri.parse('${ApiService.baseUrl}/auth/send-otp'),
            headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: jsonEncode({
              'email': cleanEmail,
              'purpose': 'VERIFY_ACCOUNT',
            }),
          )
          .timeout(const Duration(seconds: 10));

      final data = jsonDecode(utf8.decode(res.bodyBytes));
      return res.statusCode == 200 && data['success'] == true;
    } catch (e) {
      debugPrint('[AuthService] Send OTP error: $e');
      return false;
    }
  }

  static Future<bool> verifyGmailOtp(String email, String otp) async {
    final cleanEmail = email.trim();
    final cleanOtp = otp.trim();
    debugPrint(
        '[AuthService] Xác thực mã OTP qua backend cho nonamenood0809@gmail.com (Tài khoản: $cleanEmail)');
    try {
      final res = await http
          .post(
            Uri.parse('${ApiService.baseUrl}/auth/verify-otp'),
            headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: jsonEncode({
              'email': cleanEmail,
              'otp': cleanOtp,
              'purpose': 'VERIFY_ACCOUNT',
            }),
          )
          .timeout(const Duration(seconds: 10));

      final data = jsonDecode(utf8.decode(res.bodyBytes));
      return res.statusCode == 200 && data['success'] == true;
    } catch (e) {
      debugPrint('[AuthService] Verify OTP error: $e');
      return false;
    }
  }

  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    final cleanEmail = email.trim();
    if (cleanEmail.isEmpty) {
      return {
        'success': false,
        'message': 'Vui lòng nhập địa chỉ email đã đăng ký.'
      };
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
    final cleanEmail = email.trim();
    final cleanOtp = otp.trim();
    final cleanPass = newPassword.trim();

    if (cleanPass.length < 6) {
      return {
        'success': false,
        'message': 'Mật khẩu mới phải có ít nhất 6 ký tự.'
      };
    }
    final isValid = await verifyGmailOtp(cleanEmail, cleanOtp);
    if (!isValid) {
      return {
        'success': false,
        'message': 'Mã OTP không chính xác hoặc đã hết hạn.'
      };
    }
    try {
      final res = await http
          .post(
            Uri.parse('${ApiService.baseUrl}/auth/reset-password'),
            headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: jsonEncode({
              'email': cleanEmail,
              'otp': cleanOtp,
              'newPassword': cleanPass,
            }),
          )
          .timeout(const Duration(seconds: 8));

      final data = jsonDecode(utf8.decode(res.bodyBytes));
      if (res.statusCode == 200 && data['success'] == true) {
        return {
          'success': true,
          'message': data['message'] ?? 'Đặt lại mật khẩu thành công!'
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Đặt lại mật khẩu thất bại.'
        };
      }
    } catch (e) {
      debugPrint('[AuthService] Reset password error: $e');
      return {
        'success': false,
        'message': 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'
      };
    }
  }

  static Future<Map<String, dynamic>> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    if (currentUser == null) {
      return {
        'success': false,
        'message': 'Vui lòng đăng nhập để đổi mật khẩu.'
      };
    }
    final cleanOld = oldPassword.trim();
    final cleanNew = newPassword.trim();

    if (cleanOld.isEmpty || cleanNew.isEmpty) {
      return {
        'success': false,
        'message': 'Vui lòng điền đầy đủ mật khẩu hiện tại và mật khẩu mới.'
      };
    }
    if (cleanNew.length < 6) {
      return {
        'success': false,
        'message': 'Mật khẩu mới phải có ít nhất 6 ký tự.'
      };
    }
    if (cleanOld == cleanNew) {
      return {
        'success': false,
        'message': 'Mật khẩu mới không được trùng với mật khẩu hiện tại.'
      };
    }

    try {
      final res = await http
          .post(
            Uri.parse('${ApiService.baseUrl}/auth/change-password'),
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              if (currentToken != null) 'Authorization': 'Bearer $currentToken',
            },
            body: jsonEncode({
              'userId': currentUser!.id,
              'username': currentUser!.username,
              'phone': currentUser!.phone,
              'oldPassword': cleanOld,
              'newPassword': cleanNew,
            }),
          )
          .timeout(const Duration(seconds: 8));

      final data = jsonDecode(utf8.decode(res.bodyBytes));
      return {
        'success': data['success'] == true,
        'message': data['message'] ??
            (data['success'] == true
                ? 'Đổi mật khẩu thành công'
                : 'Đổi mật khẩu thất bại.'),
      };
    } catch (e) {
      debugPrint('[AuthService] Change password error: $e');
      return {
        'success': false,
        'message': 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'
      };
    }
  }

  static Future<Map<String, dynamic>> updateProfile({
    required String fullName,
    required String phone,
    String? email,
    String? birthday,
  }) async {
    if (currentUser == null) {
      return {'success': false, 'message': 'Chưa đăng nhập'};
    }
    final updatedUser = UserModel(
      id: currentUser!.id,
      maKhachHang: currentUser!.maKhachHang,
      maNhanVien: currentUser!.maNhanVien,
      username: currentUser!.username,
      fullName:
          fullName.trim().isNotEmpty ? fullName.trim() : currentUser!.fullName,
      phone: phone.trim().isNotEmpty ? phone.trim() : currentUser!.phone,
      email: (email != null && email.trim().isNotEmpty)
          ? email.trim()
          : currentUser!.email,
      birthday: birthday ?? currentUser!.birthday,
      role: currentUser!.role,
      roleName: currentUser!.roleName,
    );
    currentUser = updatedUser;
    userNotifier.value = updatedUser;

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_userKey, jsonEncode(updatedUser.toJson()));
      await http
          .put(
            Uri.parse('${ApiService.baseUrl}/auth/profile'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'userId': updatedUser.id,
              'fullName': updatedUser.fullName,
              'phone': updatedUser.phone,
              'email': updatedUser.email,
              'birthday': birthday,
            }),
          )
          .timeout(const Duration(seconds: 4));
    } catch (_) {}

    return {
      'success': true,
      'message': 'Cập nhật thông tin thành công!',
      'user': updatedUser
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
