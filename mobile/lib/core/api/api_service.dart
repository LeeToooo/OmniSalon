import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:omni_salon_mobile/models/branch.dart';
import 'package:omni_salon_mobile/models/stylist.dart';
import 'package:omni_salon_mobile/models/product.dart';
import 'package:omni_salon_mobile/models/booking.dart';
import 'package:omni_salon_mobile/models/order.dart';
import 'package:omni_salon_mobile/models/admin_models.dart';
import 'package:omni_salon_mobile/models/service.dart';

class ApiService {
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
      return 'assets/images/placeholder_avatar.png';
    }

    final trimmed = rawPath.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      if (trimmed.contains('images.unsplash.com')) {
        return fallback.isNotEmpty
            ? getImageUrl(fallback)
            : 'assets/images/placeholder_avatar.png';
      }
      return Uri.encodeFull(trimmed);
    }

    if (trimmed.startsWith('assets/')) {
      return trimmed;
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
          .timeout(const Duration(seconds: 3));
      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes));
      }
    } catch (_) {}
    return {'status': 'disconnected', 'sqlConnected': false};
  }

  // Lấy danh sách chi nhánh
  static Future<List<Branch>> fetchBranches() async {
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/branches'))
          .timeout(const Duration(seconds: 4));
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
          .timeout(const Duration(seconds: 4));
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
          .timeout(const Duration(seconds: 4));
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
          await http.get(Uri.parse(url)).timeout(const Duration(seconds: 4));
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

  // Lấy khung giờ trống cho lịch hẹn
  static Future<List<Map<String, dynamic>>> fetchAvailableSlots(
      String date, String stylistId) async {
    final defaultSlots = [
      '08:30', '09:30', '10:30', '11:30',
      '13:30', '14:30', '15:30', '16:30',
      '17:30', '18:30', '19:30', '20:30'
    ];

    try {
      final res = await http
          .get(
            Uri.parse(
                '$baseUrl/bookings/available-slots?date=$date&stylistId=$stylistId'),
          )
          .timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data
            .map<Map<String, dynamic>>(
                (e) => Map<String, dynamic>.from(e as Map))
            .toList();
      }
    } catch (e) {
      debugPrint('[ApiService] fetchAvailableSlots error: $e');
    }

    return defaultSlots
        .map<Map<String, dynamic>>((t) => <String, dynamic>{
              'time': t,
              'available': true,
              'isBooked': false
            })
        .toList();
  }

  // Lấy danh sách sản phẩm và tìm kiếm
  static Future<List<Product>> fetchProducts(
      {String query = '', String category = 'all'}) async {
    List<Product> products = [];
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/products'))
          .timeout(const Duration(seconds: 4));
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
          .get(Uri.parse('$baseUrl/bookings'))
          .timeout(const Duration(seconds: 4));
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
          )
          .timeout(const Duration(seconds: 4));
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
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(booking.toJson()),
          )
          .timeout(const Duration(seconds: 5));
      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
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
        } catch (_) {}
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
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'status': newStatus,
              if (stylistId != null) 'stylistId': stylistId,
            }),
          )
          .timeout(const Duration(seconds: 4));
      return res.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] updateBookingStatus error: $e');
      return false;
    }
  }

  // Hủy lịch hẹn
  static Future<bool> cancelBooking(String bookingId,
      {String reason = 'Khách hủy trên app'}) async {
    return updateBookingStatus(bookingId, 'Cancelled');
  }

  // Đổi lịch hẹn
  static Future<bool> rescheduleBooking(
      String bookingId, String newDate, String newTime) async {
    try {
      final res = await http
          .put(
            Uri.parse('$baseUrl/bookings/$bookingId'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(
                {'date': newDate, 'timeSlot': newTime, 'status': 'Confirmed'}),
          )
          .timeout(const Duration(seconds: 4));
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
          .get(Uri.parse('$baseUrl/orders'))
          .timeout(const Duration(seconds: 4));
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

  // Tạo đơn hàng mới
  static Future<String?> createOrder(SalonOrder order) async {
    try {
      final res = await http
          .post(
            Uri.parse('$baseUrl/orders'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(order.toJson()),
          )
          .timeout(const Duration(seconds: 5));

      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        String? serverId;
        if (data is Map) {
          if (data['order'] is Map) {
            serverId = (data['order']['orderCode'] ??
                    data['order']['id'] ??
                    data['order']['MaDonHang'])
                ?.toString();
          } else {
            serverId = (data['orderCode'] ?? data['id'] ?? data['MaDonHang'])
                ?.toString();
          }
        }
        return serverId;
      }
    } catch (e) {
      debugPrint('[ApiService] createOrder error: $e');
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
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'reason': reason}),
          )
          .timeout(const Duration(seconds: 5));
      return res.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] cancelOrder error: $e');
      return false;
    }
  }

  // Gửi đánh giá
  static Future<bool> submitReview({
    String? bookingId,
    String? orderId,
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
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              if (bookingId != null) 'bookingId': bookingId,
              if (orderId != null) 'orderId': orderId,
              'rating': rating,
              'comment': comment,
              if (customerId != null) 'customerId': customerId,
              if (customerName != null) 'customerName': customerName,
              if (customerPhone != null) 'customerPhone': customerPhone,
            }),
          )
          .timeout(const Duration(seconds: 5));
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (e) {
      debugPrint('[ApiService] submitReview error: $e');
      return false;
    }
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
          .timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.map((e) => Map<String, dynamic>.from(e)).toList();
      }
    } catch (e) {
      debugPrint('[ApiService] fetchReviews error: $e');
    }
    return <Map<String, dynamic>>[];
  }

  // Lấy các chỉ số thống kê quản trị thực tế
  static Future<Map<String, dynamic>> fetchAdminMetrics() async {
    try {
      final revFuture = http
          .get(Uri.parse('$baseUrl/analytics/revenue'))
          .timeout(const Duration(seconds: 4));
      final bFuture = http
          .get(Uri.parse('$baseUrl/bookings'))
          .timeout(const Duration(seconds: 4));
      final stFuture = http
          .get(Uri.parse('$baseUrl/stylists'))
          .timeout(const Duration(seconds: 4));

      final results = await Future.wait([revFuture, bFuture, stFuture]);
      final revRes = results[0];
      final bRes = results[1];
      final stRes = results[2];

      int totalRevenue = 0;
      int totalInvoices = 0;
      if (revRes.statusCode == 200) {
        final revData = jsonDecode(utf8.decode(revRes.bodyBytes));
        totalRevenue = (revData['totalRevenue'] as num?)?.toInt() ?? 0;
        totalInvoices = (revData['totalInvoices'] as num?)?.toInt() ?? 0;
      }

      int todayBookings = 0;
      if (bRes.statusCode == 200) {
        final List bData = jsonDecode(utf8.decode(bRes.bodyBytes));
        todayBookings = bData.length;
      }

      int staffOnDuty = 0;
      if (stRes.statusCode == 200) {
        final List stData = jsonDecode(utf8.decode(stRes.bodyBytes));
        staffOnDuty = stData.length;
      }

      return {
        'todayBookings': todayBookings,
        'todayRevenue': totalRevenue,
        'staffOnDuty': staffOnDuty,
        'occupancyRate': staffOnDuty > 0
            ? ((todayBookings / (staffOnDuty * 4)) * 100).clamp(0, 100).toDouble()
            : 0.0,
        'totalInvoices': totalInvoices,
        'branches': <Map<String, dynamic>>[]
      };
    } catch (e) {
      debugPrint('[ApiService] fetchAdminMetrics error: $e');
    }

    return {
      'todayBookings': 0,
      'todayRevenue': 0,
      'staffOnDuty': 0,
      'occupancyRate': 0.0,
      'totalInvoices': 0,
      'branches': <Map<String, dynamic>>[]
    };
  }

  // Lấy dữ liệu tồn kho quản trị
  static Future<List<InventoryItem>> fetchInventory(
      {String branchId = 'all'}) async {
    try {
      final url = branchId != 'all' && branchId.isNotEmpty
          ? '$baseUrl/inventory?branch_id=$branchId'
          : '$baseUrl/inventory';
      final res =
          await http.get(Uri.parse(url)).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data
            .map((j) => InventoryItem.fromJson(j as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('[ApiService] fetchInventory error: $e');
    }
    return <InventoryItem>[];
  }

  // Lấy danh sách lô hàng hạn sử dụng FEFO
  static Future<List<FefoLot>> fetchFefoLots({String? branchId}) async {
    try {
      final url = branchId != null && branchId.isNotEmpty && branchId != 'all'
          ? '$baseUrl/inventory/lots?branch_id=$branchId'
          : '$baseUrl/inventory/lots';
      final res =
          await http.get(Uri.parse(url)).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data
            .map((j) => FefoLot.fromJson(j as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('[ApiService] fetchFefoLots error: $e');
    }
    return <FefoLot>[];
  }

  // Lấy danh sách hóa đơn
  static Future<List<Invoice>> fetchInvoices({String? branchId}) async {
    try {
      final url = branchId != null && branchId.isNotEmpty && branchId != 'all'
          ? '$baseUrl/invoices?branch_id=$branchId'
          : '$baseUrl/invoices';
      final res =
          await http.get(Uri.parse(url)).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data
            .map((j) => Invoice.fromJson(j as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('[ApiService] fetchInvoices error: $e');
    }
    return <Invoice>[];
  }

  // Lấy danh sách nhân sự
  static Future<List<StaffMember>> fetchStaffMembers({String? branchId}) async {
    try {
      final url = branchId != null && branchId.isNotEmpty && branchId != 'all'
          ? '$baseUrl/stylists?branch_id=$branchId'
          : '$baseUrl/stylists';
      final res =
          await http.get(Uri.parse(url)).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data
            .map((j) => StaffMember.fromJson(j as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('[ApiService] fetchStaffMembers error: $e');
    }
    return <StaffMember>[];
  }

  // Cập nhật trạng thái ca trực nhân viên
  static Future<bool> updateStaffStatus(
      String staffId, String newStatus) async {
    try {
      final res = await http
          .put(
            Uri.parse('$baseUrl/stylists/$staffId'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'status': newStatus, 'TrangThai': newStatus}),
          )
          .timeout(const Duration(seconds: 3));
      return res.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] updateStaffStatus error: $e');
      return false;
    }
  }

  // Tạo hóa đơn POS tại quầy
  static Future<Invoice> createPosInvoice(Map<String, dynamic> billData) async {
    final now = DateTime.now();
    final defaultId = 'HD${now.millisecondsSinceEpoch % 100000}';
    Invoice inv = Invoice(
      id: defaultId,
      invoiceNumber: defaultId,
      customerId: billData['customerId'] ?? 'KH_WALK_IN',
      customerName: billData['customerName'] ?? 'Khách Cắt Quầy',
      customerPhone: billData['customerPhone'] ?? '',
      branchId: billData['branchId'] ?? 'CN01',
      branchName: billData['branchName'] ?? 'Omni Salon Q1',
      createdDate: now.toString().substring(0, 19),
      total: billData['total'] ?? 0,
      status: 'Đã thanh toán',
      paymentMethod: billData['paymentMethod'] ?? 'VietQR',
      serviceOrProductName: billData['summary'] ?? 'Dịch vụ Barber & Mỹ phẩm',
    );

    try {
      final res = await http
          .post(
            Uri.parse('$baseUrl/pos/checkout'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(billData),
          )
          .timeout(const Duration(seconds: 4));
      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        if (data['invoice'] != null) {
          final srvInv = data['invoice'];
          return Invoice(
            id: srvInv['id']?.toString() ?? inv.id,
            invoiceNumber: srvInv['invoiceNo']?.toString() ??
                srvInv['id']?.toString() ??
                inv.invoiceNumber,
            customerId: inv.customerId,
            customerName: inv.customerName,
            customerPhone: inv.customerPhone,
            branchId: inv.branchId,
            branchName: inv.branchName,
            createdDate: inv.createdDate,
            total: (srvInv['total'] as num?)?.toInt() ?? inv.total,
            status: 'Đã thanh toán',
            paymentMethod: inv.paymentMethod,
            serviceOrProductName: inv.serviceOrProductName,
          );
        }
      }
    } catch (e) {
      debugPrint('[ApiService] createPosInvoice error: $e');
    }

    return inv;
  }

  // Cập nhật giá dịch vụ
  static Future<bool> updateService(
      String serviceId, int price, int duration) async {
    try {
      final res = await http
          .put(
            Uri.parse('$baseUrl/services/$serviceId'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'price': price, 'duration': duration}),
          )
          .timeout(const Duration(seconds: 3));
      return res.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] updateService error: $e');
      return false;
    }
  }

  // Lấy danh sách khuyến mãi
  static Future<List<Map<String, dynamic>>> fetchPromotions() async {
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/promotions'))
          .timeout(const Duration(seconds: 4));
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
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(reviewData),
          )
          .timeout(const Duration(seconds: 4));
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
          .get(Uri.parse('$baseUrl/notifications'))
          .timeout(const Duration(seconds: 4));
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
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 3));
      return res.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] markNotificationRead error: $e');
      return false;
    }
  }

  // Phân tích ngũ quan và dáng mặt
  static Future<Map<String, dynamic>?> analyzeFace(
      String imageBase64OrUrl) async {
    try {
      final res = await http
          .post(
            Uri.parse('$baseUrl/ai/analyze-face'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'image': imageBase64OrUrl}),
          )
          .timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('[ApiService] analyzeFace error: $e');
    }
    return null;
  }

  // Tiền xử lý ảnh chân dung
  static Future<Map<String, dynamic>?> preprocessCustomerPhoto(
      String imageBase64OrUrl) async {
    try {
      final res = await http
          .post(
            Uri.parse('$baseUrl/ai/preprocess-customer-photo'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'image': imageBase64OrUrl}),
          )
          .timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('[ApiService] preprocessCustomerPhoto error: $e');
    }
    return null;
  }

  // Tạo mẫu kiểu tóc trên ảnh chân dung
  static Future<Map<String, dynamic>?> restyleHair({
    required String imageBase64OrUrl,
    required String hairstyleId,
    required String colorId,
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
            }),
          )
          .timeout(const Duration(seconds: 12));

      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('[ApiService] restyleHair error: $e');
    }
    return null;
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
      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('[ApiService] createPaymentLink error: $e');
    }
    return {'success': false};
  }

  static Future<Map<String, dynamic>> checkPaymentStatus(String orderId) async {
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/payment/check-status/$orderId'))
          .timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('[ApiService] checkPaymentStatus error: $e');
    }
    return {'success': false, 'status': 'PENDING', 'isPaid': false};
  }
}
