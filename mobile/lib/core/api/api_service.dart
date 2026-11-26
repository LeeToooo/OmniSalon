import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:omni_salon_mobile/core/auth/auth_service.dart';
import 'package:omni_salon_mobile/models/branch.dart';
import 'package:omni_salon_mobile/models/stylist.dart';
import 'package:omni_salon_mobile/models/product.dart';
import 'package:omni_salon_mobile/models/booking.dart';
import 'package:omni_salon_mobile/models/order.dart';
import 'package:omni_salon_mobile/models/service.dart';

class ApiService {
  static Map<String, String> _authHeaders({bool jsonContent = true}) {
    final token = AuthService.currentToken;
    return {
      if (jsonContent) 'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }
  static String get defaultBaseUrl {
    if (kIsWeb) return 'http://localhost:3000/api';
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3000/api';
    }
    return 'http://127.0.0.1:3000/api';
  }

  static String baseUrl = defaultBaseUrl;

  static void setBaseUrl(String url) {
    var clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'http://$clean';
    }
    if (!clean.endsWith('/api')) {
      clean = clean.endsWith('/') ? '${clean}api' : '$clean/api';
    }
    baseUrl = clean;
  }

  static String get baseServerUrl {
    return baseUrl.replaceAll(RegExp(r'/api/?$'), '');
  }

  // Chuyển đổi đường dẫn ảnh sang link http chuẩn hoặc asset placeholder nội bộ
  static String getImageUrl(String? rawPath, {String fallback = ''}) {
    if (rawPath == null || rawPath.trim().isEmpty || rawPath.trim() == 'null') {
      if (fallback.isNotEmpty) return getImageUrl(fallback);
      return '$baseServerUrl/DataPicture/ChanDungTho/Tho1.jpg';
    }

    final trimmed = rawPath.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      if (trimmed.contains('images.unsplash.com')) {
        return fallback.isNotEmpty
            ? getImageUrl(fallback)
            : '$baseServerUrl/DataPicture/ChanDungTho/Tho1.jpg';
      }
      return Uri.encodeFull(trimmed);
    }

    String clean =
        trimmed.replaceAll('\\', '/').replaceFirst(RegExp(r'^/+'), '');
    if (clean.startsWith('web/frontend/')) {
      clean = clean.substring(13);
    } else if (clean.startsWith('frontend/')) {
      clean = clean.substring(9);
    }

    final fullUrl = '$baseServerUrl/$clean';
    return Uri.encodeFull(fullUrl);
  }

  // Kiểm tra trạng thái kết nối server và cơ sở dữ liệu
  static Future<Map<String, dynamic>> checkHealth() async {
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/health'))
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes));
      }
    } catch (e) {
      debugPrint('[ApiService] checkHealth failed: $e');
    }
    return {'status': 'disconnected', 'sqlConnected': false};
  }

  // Lấy danh sách chi nhánh
  static Future<List<Branch>> fetchBranches() async {
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/branches'))
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data
            .map((json) => Branch.fromJson(json as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('[ApiService] fetchBranches error: $e');
    }
    return <Branch>[];
  }

  // Lấy danh sách dịch vụ và combo
  static Future<List<SalonService>> fetchServices() async {
    List<SalonService> allServices = [];
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/services'))
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        allServices.addAll(data.map(
            (json) => SalonService.fromJson(json as Map<String, dynamic>)));
      }
    } catch (e) {
      debugPrint('[ApiService] fetchServices error: $e');
    }

    try {
      final resCombo = await http
          .get(Uri.parse('$baseUrl/combos'))
          .timeout(const Duration(seconds: 10));
      if (resCombo.statusCode == 200) {
        final List comboData = jsonDecode(utf8.decode(resCombo.bodyBytes));
        allServices.addAll(comboData.map((json) {
          final map = Map<String, dynamic>.from(json as Map);
          map['isCombo'] = true;
          return SalonService.fromJson(map);
        }));
      }
    } catch (e) {
      debugPrint('[ApiService] fetchCombos error: $e');
    }

    return allServices;
  }

  // Lấy danh sách thợ tạo mẫu / stylist
  static Future<List<Stylist>> fetchStylists({String? branchId}) async {
    try {
      final url = branchId != null && branchId.isNotEmpty && branchId != 'all'
          ? '$baseUrl/stylists?branch_id=$branchId'
          : '$baseUrl/stylists';
      final res =
          await http.get(Uri.parse(url)).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data
            .map((json) => Stylist.fromJson(json as Map<String, dynamic>))
            .where((s) {
          final levelLower = s.level.toLowerCase();
          final roleLower = s.role.toLowerCase();
          if (roleLower.contains('thu ngân') ||
              roleLower.contains('cashier') ||
              roleLower.contains('kế toán') ||
              levelLower.contains('thu ngân') ||
              levelLower == 'nhân viên') {
            return false;
          }
          return true;
        }).toList();
      }
    } catch (e) {
      debugPrint('[ApiService] fetchStylists error: $e');
    }
    return <Stylist>[];
  }

  // Lấy khung giờ trống cho lịch hẹn (không dùng slot giả khi mất kết nối)
  static Future<List<Map<String, dynamic>>> fetchAvailableSlots(
      String date, String stylistId,
      {int duration = 45}) async {
    final res = await http
        .get(
          Uri.parse(
              '$baseUrl/bookings/available-slots?date=$date&stylistId=${Uri.encodeComponent(stylistId)}&duration=$duration'),
        )
        .timeout(const Duration(seconds: 10));
    if (res.statusCode == 200) {
      final List data = jsonDecode(utf8.decode(res.bodyBytes));
      return data
          .map<Map<String, dynamic>>(
              (e) => Map<String, dynamic>.from(e as Map))
          .toList();
    }
    throw Exception('Không thể tải khung giờ trống (HTTP ${res.statusCode})');
  }

  // Lấy danh sách sản phẩm và tìm kiếm
  static Future<List<Product>> fetchProducts(
      {String query = '', String category = 'all'}) async {
    List<Product> products = [];
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/products'))
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        products = data
            .map((json) => Product.fromJson(json as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('[ApiService] fetchProducts error: $e');
    }

    return products.where((p) {
      if (p.isExpired) return false;
      if (category != 'all' && p.categoryId != category) return false;
      if (query.isNotEmpty) {
        final q = query.toLowerCase();
        final match = p.name.toLowerCase().contains(q) ||
            p.brand.toLowerCase().contains(q) ||
            p.description.toLowerCase().contains(q);
        if (!match) return false;
      }
      return true;
    }).toList();
  }

  // Lấy danh sách lịch hẹn
  static Future<List<Booking>> fetchBookings() async {
    try {
      final res = await http
          .get(
            Uri.parse('$baseUrl/bookings'),
            headers: _authHeaders(jsonContent: false),
          )
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data
            .map((json) => Booking.fromJson(json as Map<String, dynamic>))
            .toList()
          ..sort((a, b) {
            final numA =
                int.tryParse(a.bookingCode.replaceAll(RegExp(r'\D'), '')) ?? 0;
            final numB =
                int.tryParse(b.bookingCode.replaceAll(RegExp(r'\D'), '')) ?? 0;
            if (numA != numB) return numB.compareTo(numA);
            final dComp = b.date.compareTo(a.date);
            if (dComp != 0) return dComp;
            return b.timeSlot.compareTo(a.timeSlot);
          });
      }
    } catch (e) {
      debugPrint('[ApiService] fetchBookings error: $e');
    }
    return <Booking>[];
  }

  // Tra cứu lịch hẹn theo số điện thoại hoặc mã
  static Future<List<Booking>> lookupBookings(String query) async {
    final clean = query.trim();
    if (clean.isEmpty) return fetchBookings();
    try {
      final res = await http
          .get(
            Uri.parse(
                '$baseUrl/bookings/lookup?q=${Uri.encodeComponent(clean)}'),
            headers: _authHeaders(jsonContent: false),
          )
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data
            .map((json) => Booking.fromJson(json as Map<String, dynamic>))
            .toList()
          ..sort((a, b) {
            final numA =
                int.tryParse(a.bookingCode.replaceAll(RegExp(r'\D'), '')) ?? 0;
            final numB =
                int.tryParse(b.bookingCode.replaceAll(RegExp(r'\D'), '')) ?? 0;
            if (numA != numB) return numB.compareTo(numA);
            final dComp = b.date.compareTo(a.date);
            if (dComp != 0) return dComp;
            return b.timeSlot.compareTo(a.timeSlot);
          });
      }
    } catch (e) {
      debugPrint('[ApiService] lookupBookings error: $e');
    }
    return <Booking>[];
  }

  // Sinh mã lịch hẹn tuần tự
  static String generateNextBookingCode() {
    final now = DateTime.now();
    final randomSuffix =
        (now.millisecondsSinceEpoch % 1000).toString().padLeft(3, '0');
    return 'LH${now.minute}${now.second}$randomSuffix';
  }

  // Sinh mã đơn hàng tuần tự
  static String generateNextOrderCode() {
    final now = DateTime.now();
    final randomSuffix =
        (now.millisecondsSinceEpoch % 1000).toString().padLeft(3, '0');
    return 'DH${now.minute}${now.second}$randomSuffix';
  }

  // Đặt lịch mới
  static Future<Map<String, dynamic>> createBooking(Booking booking) async {
    try {
      final res = await http
          .post(
            Uri.parse('$baseUrl/bookings'),
            headers: _authHeaders(),
            body: jsonEncode(booking.toJson()),
          )
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        if (data is Map && data['success'] == false) {
          return {
            'success': false,
            'message': (data['error'] ?? data['message'] ?? 'Đặt lịch không thành công').toString(),
          };
        }
        String finalCode = booking.bookingCode;
        if (data is Map) {
          final innerBooking = data['booking'] is Map ? data['booking'] : data;
          final sCode = innerBooking['bookingCode'] ??
              innerBooking['id'] ??
              innerBooking['MaLichHen'];
          if (sCode != null && sCode.toString().isNotEmpty) {
            finalCode = sCode.toString();
          }
        }
        return {'success': true, 'booking': data, 'bookingCode': finalCode};
      } else {
        try {
          final errData = jsonDecode(utf8.decode(res.bodyBytes));
          return {
            'success': false,
            'message': errData['error'] ??
                errData['message'] ??
                'Đặt lịch không thành công'
          };
        } catch (e) {
          debugPrint('[ApiService] createBooking error parse failed: $e');
        }
      }
    } catch (e) {
      debugPrint('[ApiService] createBooking error: $e');
    }
    return {'success': false, 'message': 'Không thể kết nối máy chủ'};
  }

  // Cập nhật trạng thái lịch hẹn
  static Future<bool> updateBookingStatus(String bookingId, String newStatus,
      {String? stylistId, String? stylistName}) async {
    try {
      final res = await http
          .put(
            Uri.parse('$baseUrl/bookings/$bookingId'),
            headers: _authHeaders(),
            body: jsonEncode({
              'status': newStatus,
              if (stylistId != null) 'stylistId': stylistId,
            }),
          )
          .timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] updateBookingStatus error: $e');
      return false;
    }
  }

  // Hủy lịch hẹn (gửi kèm lý do hủy về backend)
  static Future<bool> cancelBooking(String bookingId,
      {String reason = 'Khách hủy trên app'}) async {
    try {
      final res = await http
          .put(
            Uri.parse('$baseUrl/bookings/$bookingId/cancel'),
            headers: _authHeaders(),
            body: jsonEncode({
              'status': 'Cancelled',
              'reason': reason,
              'cancellationReason': reason,
            }),
          )
          .timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] cancelBooking error: $e');
      return false;
    }
  }

  // Đổi lịch hẹn (không gửi status='Confirmed' để backend chạy đúng nhánh reschedule)
  static Future<bool> rescheduleBooking(
      String bookingId, String newDate, String newTime,
      {int? duration}) async {
    try {
      final res = await http
          .put(
            Uri.parse('$baseUrl/bookings/$bookingId'),
            headers: _authHeaders(),
            body: jsonEncode({
              'date': newDate,
              'timeSlot': newTime,
              if (duration != null) 'duration': duration,
            }),
          )
          .timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] rescheduleBooking error: $e');
      return false;
    }
  }

  // Lấy danh sách đơn hàng
  static Future<List<SalonOrder>> fetchOrders() async {
    try {
      final res = await http
          .get(
            Uri.parse('$baseUrl/orders'),
            headers: _authHeaders(jsonContent: false),
          )
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data
            .map((json) => SalonOrder.fromJson(json as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('[ApiService] fetchOrders error: $e');
    }
    return <SalonOrder>[];
  }

  // Tạo đơn hàng mới (trả đầy đủ kết quả & thông báo lỗi từ server)
  static Future<Map<String, dynamic>> createOrderDetailed(
      SalonOrder order) async {
    try {
      final res = await http
          .post(
            Uri.parse('$baseUrl/orders'),
            headers: _authHeaders(),
            body: jsonEncode(order.toJson()),
          )
          .timeout(const Duration(seconds: 10));

      final bodyText = utf8.decode(res.bodyBytes);
      final data = bodyText.isNotEmpty ? jsonDecode(bodyText) : null;
      if (res.statusCode == 200 || res.statusCode == 201) {
        if (data is Map && data['success'] == false) {
          return {
            'success': false,
            'message': (data['error'] ?? data['message'] ?? 'Đặt hàng thất bại.').toString(),
          };
        }
        String? serverId;
        num? totalAmt;
        if (data is Map) {
          if (data['order'] is Map) {
            serverId = (data['order']['orderCode'] ??
                    data['order']['id'] ??
                    data['order']['MaDonHang'])
                ?.toString();
            totalAmt = data['order']['totalAmount'] as num?;
          } else {
            serverId = (data['orderCode'] ?? data['id'] ?? data['MaDonHang'])
                ?.toString();
            totalAmt = data['totalAmount'] as num?;
          }
        }
        return {
          'success': serverId != null && serverId.isNotEmpty,
          'orderCode': serverId,
          'totalAmount': totalAmt ?? order.totalAmount,
          'message': 'Đặt hàng thành công!',
        };
      }
      final errMsg = (data is Map)
          ? (data['error'] ?? data['message'] ?? 'Đặt hàng thất bại.')
          : 'Đặt hàng thất bại (HTTP ${res.statusCode}).';
      return {'success': false, 'message': errMsg.toString()};
    } catch (e) {
      debugPrint('[ApiService] createOrderDetailed error: $e');
      return {'success': false, 'message': 'Không thể kết nối máy chủ để đặt hàng.'};
    }
  }

  // Tạo đơn hàng mới
  static Future<String?> createOrder(SalonOrder order) async {
    final res = await createOrderDetailed(order);
    if (res['success'] == true) {
      return res['orderCode']?.toString();
    }
    return null;
  }

  // Hủy đơn hàng
  static Future<bool> cancelOrder(String orderId,
      {String reason = 'Khách hủy trên app'}) async {
    try {
      final res = await http
          .post(
            Uri.parse('$baseUrl/orders/$orderId/cancel'),
            headers: _authHeaders(),
            body: jsonEncode({'reason': reason}),
          )
          .timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] cancelOrder error: $e');
      return false;
    }
  }

  // Gửi đánh giá kèm message phản hồi từ backend
  static Future<Map<String, dynamic>> submitReviewDetailed({
    String? bookingId,
    String? orderId,
    String? productId,
    String? serviceId,
    required int rating,
    required String comment,
    String? customerId,
    String? customerName,
    String? customerPhone,
  }) async {
    try {
      final res = await http
          .post(
            Uri.parse('$baseUrl/reviews'),
            headers: _authHeaders(),
            body: jsonEncode({
              if (bookingId != null && bookingId.isNotEmpty) 'bookingId': bookingId,
              if (orderId != null && orderId.isNotEmpty) 'orderId': orderId,
              if (productId != null && productId.isNotEmpty) 'productId': productId,
              if (serviceId != null && serviceId.isNotEmpty) 'serviceId': serviceId,
              'rating': rating,
              'comment': comment,
              if (customerId != null) 'customerId': customerId,
              if (customerName != null) 'customerName': customerName,
              if (customerPhone != null) 'customerPhone': customerPhone,
            }),
          )
          .timeout(const Duration(seconds: 10));
      final bodyText = utf8.decode(res.bodyBytes);
      final data = bodyText.isNotEmpty ? jsonDecode(bodyText) : null;
      if (res.statusCode == 200 || res.statusCode == 201) {
        return {
          'success': data is Map ? (data['success'] != false) : true,
          'message': (data is Map ? data['message'] : null)?.toString() ?? 'Gửi đánh giá thành công!',
        };
      }
      return {
        'success': false,
        'message': (data is Map ? (data['message'] ?? data['error']) : null)?.toString() ??
            'Không thể gửi đánh giá (HTTP ${res.statusCode}).',
      };
    } catch (e) {
      debugPrint('[ApiService] submitReviewDetailed error: $e');
      return {'success': false, 'message': 'Lỗi kết nối máy chủ khi gửi đánh giá.'};
    }
  }

  // Gửi đánh giá
  static Future<bool> submitReview({
    String? bookingId,
    String? orderId,
    String? productId,
    String? serviceId,
    required int rating,
    required String comment,
    String? customerId,
    String? customerName,
    String? customerPhone,
  }) async {
    final res = await submitReviewDetailed(
      bookingId: bookingId,
      orderId: orderId,
      productId: productId,
      serviceId: serviceId,
      rating: rating,
      comment: comment,
      customerId: customerId,
      customerName: customerName,
      customerPhone: customerPhone,
    );
    return res['success'] == true;
  }

  // Lấy đánh giá thực tế từ backend
  static Future<List<Map<String, dynamic>>> fetchReviews({
    String? productId,
    String? serviceId,
    String? bookingId,
    String? orderId,
    String? customerId,
  }) async {
    try {
      final params = <String>[];
      if (productId != null && productId.isNotEmpty) {
        params.add('productId=$productId');
      }
      if (serviceId != null && serviceId.isNotEmpty) {
        params.add('serviceId=$serviceId');
      }
      if (bookingId != null && bookingId.isNotEmpty) {
        params.add('bookingId=$bookingId');
      }
      if (orderId != null && orderId.isNotEmpty) {
        params.add('orderId=$orderId');
      }
      if (customerId != null && customerId.isNotEmpty) {
        params.add('customerId=$customerId');
      }
      final queryStr = params.isNotEmpty ? '?${params.join('&')}' : '';
      final res = await http
          .get(Uri.parse('$baseUrl/reviews$queryStr'))
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.map((e) => Map<String, dynamic>.from(e)).toList();
      }
    } catch (e) {
      debugPrint('[ApiService] fetchReviews error: $e');
    }
    return <Map<String, dynamic>>[];
  }

  // Lấy danh sách khuyến mãi
  static Future<List<Map<String, dynamic>>> fetchPromotions() async {
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/promotions'))
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.cast<Map<String, dynamic>>();
      }
    } catch (e) {
      debugPrint('[ApiService] fetchPromotions error: $e');
    }
    return <Map<String, dynamic>>[];
  }

  // Gửi đánh giá
  static Future<bool> createReview(Map<String, dynamic> reviewData) async {
    try {
      final res = await http
          .post(
            Uri.parse('$baseUrl/reviews'),
            headers: _authHeaders(),
            body: jsonEncode(reviewData),
          )
          .timeout(const Duration(seconds: 10));
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (e) {
      debugPrint('[ApiService] createReview error: $e');
      return false;
    }
  }

  // Lấy danh sách thông báo
  static Future<List<Map<String, dynamic>>> fetchNotifications() async {
    try {
      final res = await http
          .get(
            Uri.parse('$baseUrl/notifications'),
            headers: _authHeaders(jsonContent: false),
          )
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.cast<Map<String, dynamic>>();
      }
    } catch (e) {
      debugPrint('[ApiService] fetchNotifications error: $e');
    }
    return <Map<String, dynamic>>[];
  }

  // Đánh dấu đã đọc thông báo
  static Future<bool> markNotificationRead(String notifId) async {
    try {
      final res = await http.put(
        Uri.parse('$baseUrl/notifications/$notifId/read'),
        headers: _authHeaders(),
      ).timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] markNotificationRead error: $e');
      return false;
    }
  }

  // Lấy danh mục 12 phom tóc mẫu và bảng màu nhuộm từ server
  static Future<Map<String, dynamic>?> fetchAiHairstyles() async {
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/ai/hairstyles'))
          .timeout(const Duration(seconds: 15));
      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('[ApiService] fetchAiHairstyles error: $e');
    }
    return null;
  }

  // Phân tích ngũ quan và dáng mặt
  static Map<String, dynamic> _tryDecodeJsonMap(http.Response res, String tag) {
    try {
      return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    } catch (e) {
      debugPrint('[ApiService] $tag JSON parse failed: $e');
      return {};
    }
  }

  // Phân tích dáng mặt từ ảnh chân dung
  static Future<Map<String, dynamic>> analyzeFace(
      String imageBase64OrUrl) async {
    try {
      final res = await http
          .post(
            Uri.parse('$baseUrl/ai/analyze-face'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'image': imageBase64OrUrl}),
          )
          .timeout(const Duration(seconds: 40));

      final decoded = _tryDecodeJsonMap(res, 'analyzeFace');
      if (res.statusCode == 200) {
        return decoded;
      }
      return {
        ...decoded,
        'success': false,
        'statusCode': res.statusCode,
        'message': decoded['message'] ??
            decoded['error'] ??
            'Máy chủ phân tích khuôn mặt trả về lỗi (${res.statusCode}).',
      };
    } catch (e) {
      debugPrint('[ApiService] analyzeFace error: $e');
      return {
        'success': false,
        'message': 'Lỗi kết nối máy chủ phân tích khuôn mặt: $e',
      };
    }
  }

  // Tạo mẫu kiểu tóc trên ảnh chân dung
  static Future<Map<String, dynamic>> restyleHair({
    required String imageBase64OrUrl,
    required String hairstyleId,
    required String colorId,
    String volume = 'standard',
    String finish = 'matte',
    String? customPrompt,
  }) async {
    try {
      final res = await http
          .post(
            Uri.parse('$baseUrl/ai/restyle-hair'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'image': imageBase64OrUrl,
              'hairstyleId': hairstyleId,
              'colorId': colorId,
              'volume': volume,
              'finish': finish,
              if (customPrompt != null && customPrompt.trim().isNotEmpty)
                'customPrompt': customPrompt.trim(),
              'preserveBackground': true,
              'balanceLighting': true,
              'smoothSkin': true,
            }),
          )
          .timeout(const Duration(seconds: 60));

      final decoded = _tryDecodeJsonMap(res, 'restyleHair');
      if (res.statusCode == 200) {
        return decoded;
      }
      return {
        ...decoded,
        'success': false,
        'statusCode': res.statusCode,
        'message': decoded['message'] ??
            decoded['error'] ??
            'Máy chủ AI trả về mã lỗi (${res.statusCode}).',
      };
    } catch (e) {
      debugPrint('[ApiService] restyleHair error: $e');
      return {
        'success': false,
        'message': 'Lỗi kết nối máy chủ AI: $e',
      };
    }
  }

  static Future<Map<String, dynamic>> createPaymentLink({
    required String orderId,
    required int amount,
    String? description,
  }) async {
    try {
      final res = await http
          .post(
            Uri.parse('$baseUrl/payment/create-payment-link'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'orderId': orderId,
              'amount': amount,
              'description': description ?? 'THANHTOAN $orderId',
            }),
          )
          .timeout(const Duration(seconds: 8));
      final decoded = res.bodyBytes.isNotEmpty
          ? jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>
          : <String, dynamic>{};
      if (res.statusCode == 200) {
        return decoded;
      }
      return {
        'success': false,
        'message': decoded['message']?.toString() ??
            'Cổng thanh toán chưa sẵn sàng (HTTP ${res.statusCode}).',
      };
    } catch (e) {
      debugPrint('[ApiService] createPaymentLink error: $e');
    }
    return {'success': false, 'message': 'Không thể kết nối máy chủ thanh toán.'};
  }

  static Future<Map<String, dynamic>> checkPaymentStatus(String orderId) async {
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/payment/check-status/$orderId'))
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('[ApiService] checkPaymentStatus error: $e');
    }
    return {'success': false, 'status': 'PENDING', 'isPaid': false};
  }

  static String _removeVietnameseDiacritics(String input) {
    const src = 'àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬĐÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ';
    const dst = 'aaaaaaaaaaaaaaaaadeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyAAAAAAAAAAAAAAAAADEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYY';
    final buf = StringBuffer();
    for (int i = 0; i < input.length; i++) {
      final ch = input[i];
      final idx = src.indexOf(ch);
      buf.write(idx >= 0 ? dst[idx] : ch);
    }
    return buf.toString();
  }

  static String getVietQrImageUrl({
    String bankBin = '970422',
    String accountNo = '0925898974',
    required int amount,
    required String description,
  }) {
    final cleanDesc = _removeVietnameseDiacritics(description)
        .replaceAll(RegExp(r'[^A-Za-z0-9\s]'), '')
        .trim()
        .toUpperCase();
    const f00 = '000201';
    const f01 = '010212';
    const sub00 = '0010A000000727';
    final sub01Inner = '0006${bankBin}01${accountNo.length.toString().padLeft(2, '0')}$accountNo';
    final sub01 = '01${sub01Inner.length.toString().padLeft(2, '0')}$sub01Inner';
    const sub02 = '0208QRIBFTTA';
    final f38Inner = sub00 + sub01 + sub02;
    final f38 = '38${f38Inner.length.toString().padLeft(2, '0')}$f38Inner';
    const f53 = '5303704';
    final amtStr = amount.toString();
    final f54 = '54${amtStr.length.toString().padLeft(2, '0')}$amtStr';
    const f58 = '5802VN';
    final sub6208 = '08${cleanDesc.length.toString().padLeft(2, '0')}$cleanDesc';
    final f62 = '62${sub6208.length.toString().padLeft(2, '0')}$sub6208';
    final raw = '$f00$f01$f38$f53$f54$f58${f62}6304';

    int crc = 0xFFFF;
    for (int i = 0; i < raw.length; i++) {
      crc ^= (raw.codeUnitAt(i) << 8);
      for (int j = 0; j < 8; j++) {
        if ((crc & 0x8000) != 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    final crcHex = crc.toRadixString(16).toUpperCase().padLeft(4, '0');
    final emvco = raw + crcHex;

    return 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data=${Uri.encodeComponent(emvco)}';
  }
}
