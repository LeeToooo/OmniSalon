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
  // Tự động phân giải cổng mặc định của server Node.js (cổng 3000)
  // Android Emulator: 10.0.2.2:3000/api
  // Web / Desktop Windows: localhost:3000/api
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

  // CHUYỂN ĐỔI ĐƯỜNG DẪN ẢNH TỪ SQL SERVER SANG LINK HTTP CHUẨN
  static String getImageUrl(String? rawPath, {String fallback = ''}) {
    if (rawPath == null || rawPath.trim().isEmpty || rawPath.trim() == 'null') {
      if (fallback.isNotEmpty) return getImageUrl(fallback);
      return 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600';
    }

    final trimmed = rawPath.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    String clean = trimmed.replaceFirst(RegExp(r'^/+'), '');
    if (clean.startsWith('web/frontend/')) {
      clean = clean.substring(13);
    } else if (clean.startsWith('frontend/')) {
      clean = clean.substring(9);
    }

    return '$baseServerUrl/$clean';
  }

  // KIỂM TRA TRẠNG THÁI KẾT NỐI SERVER & CSDL SQL SERVER
  static Future<Map<String, dynamic>> checkHealth() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/health')).timeout(const Duration(seconds: 3));
      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes));
      }
    } catch (_) {}
    return {'status': 'disconnected', 'sqlConnected': false};
  }

  // 1. LẤY DANH SÁCH CHI NHÁNH TỪ BẢNG ChiNhanh (KÈM ẢNH THẬT)
  static Future<List<Branch>> fetchBranches() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/branches')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.map((json) => Branch.fromJson(json as Map<String, dynamic>)).toList();
      }
    } catch (_) {}
    return _seedBranches;
  }

  // 2. LẤY DANH SÁCH DỊCH VỤ & COMBO TỪ BẢNG DichVu & ComboDichVu (KÈM ẢNH THẬT)
  static Future<List<SalonService>> fetchServices() async {
    List<SalonService> allServices = [];
    try {
      final res = await http.get(Uri.parse('$baseUrl/services')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        allServices.addAll(data.map((json) => SalonService.fromJson(json as Map<String, dynamic>)));
      }
    } catch (_) {}

    try {
      final resCombo = await http.get(Uri.parse('$baseUrl/combos')).timeout(const Duration(seconds: 4));
      if (resCombo.statusCode == 200) {
        final List comboData = jsonDecode(utf8.decode(resCombo.bodyBytes));
        allServices.addAll(comboData.map((json) {
          final map = Map<String, dynamic>.from(json as Map);
          map['isCombo'] = true;
          return SalonService.fromJson(map);
        }));
      }
    } catch (_) {}

    if (allServices.isNotEmpty) {
      return allServices;
    }
    return _seedServices;
  }

  // 3. LẤY DANH SÁCH THỢ TẠO MẪU (MASTER STYLIST & ART DIRECTOR)
  static Future<List<Stylist>> fetchStylists({String? branchId}) async {
    try {
      final url = branchId != null && branchId.isNotEmpty && branchId != 'all'
          ? '$baseUrl/stylists?branch_id=$branchId'
          : '$baseUrl/stylists';
      final res = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.map((json) => Stylist.fromJson(json as Map<String, dynamic>)).toList();
      }
    } catch (_) {}

    if (branchId != null && branchId.isNotEmpty && branchId != 'all') {
      final filtered = _seedStylists.where((s) => s.branchId == branchId).toList();
      if (filtered.isNotEmpty) return filtered;
    }
    return _seedStylists;
  }

  // 4. LẤY KHUNG GIỜ TRỐNG CHO ĐẶT LỊCH
  static Future<List<Map<String, dynamic>>> fetchAvailableSlots(String date, String stylistId) async {
    final defaultSlots = [
      '08:30', '09:30', '10:30', '11:30',
      '13:30', '14:30', '15:30', '16:30',
      '17:30', '18:30', '19:30', '20:30'
    ];

    List<Map<String, dynamic>> slots = [];
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/bookings/available-slots?date=$date&stylistId=$stylistId'),
      ).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        slots = data.map<Map<String, dynamic>>((e) => Map<String, dynamic>.from(e as Map)).toList();
      }
    } catch (_) {}

    if (slots.isEmpty) {
      slots = defaultSlots.map<Map<String, dynamic>>((t) => <String, dynamic>{'time': t, 'available': true, 'isBooked': false}).toList();
    }

    // Luôn đối soát thêm với các lịch hẹn cục bộ mới tạo trong phiên
    final localBookedTimes = _localBookings.where((b) {
      if (b.status == 'Cancelled' || b.status == 'Đã hủy') return false;
      if (b.date != date) return false;
      if (stylistId.isNotEmpty && stylistId != 'all') {
        return b.stylistId == stylistId ||
            b.stylistName.toLowerCase().contains(stylistId.toLowerCase());
      }
      return true;
    }).map((b) => b.timeSlot).toSet();

    if (localBookedTimes.isNotEmpty) {
      slots = slots.map((s) {
        final t = s['time'] as String;
        if (localBookedTimes.contains(t)) {
          return {
            'time': t,
            'available': false,
            'isBooked': true,
            'reason': 'Kín lịch'
          };
        }
        return s;
      }).toList();
    }

    return slots;
  }

  // 5. LẤY DANH SÁCH SẢN PHẨM & TÌM KIẾM
  static Future<List<Product>> fetchProducts({String query = '', String category = 'all'}) async {
    List<Product> products = [];
    try {
      final res = await http.get(Uri.parse('$baseUrl/products')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        products = data.map((json) => Product.fromJson(json as Map<String, dynamic>)).toList();
      }
    } catch (_) {
      products = _seedProducts;
    }

    if (products.isEmpty) {
      products = _seedProducts;
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

  // 6. LẤY DANH SÁCH ĐẶT LỊCH (LichHen)
  static Future<List<Booking>> fetchBookings() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/bookings')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        final list = data.map((json) => Booking.fromJson(json as Map<String, dynamic>)).toList();
        if (list.isNotEmpty) return list;
      }
    } catch (_) {}
    return _localBookings;
  }

  // 7. TRA CỨU LỊCH HẸN THEO SỐ ĐIỆN THOẠI HOẶC MÃ
  static Future<List<Booking>> lookupBookings(String query) async {
    final clean = query.trim();
    if (clean.isEmpty) return fetchBookings();
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/bookings/lookup?q=${Uri.encodeComponent(clean)}'),
      ).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.map((json) => Booking.fromJson(json as Map<String, dynamic>)).toList();
      }
    } catch (_) {}

    return _localBookings.where((b) =>
      b.bookingCode.toLowerCase().contains(clean.toLowerCase()) ||
      b.customerPhone.contains(clean) ||
      b.customerName.toLowerCase().contains(clean.toLowerCase())
    ).toList();
  }

  // 7b. SINH MÃ LỊCH HẸN TUẦN TỰ CHUẨN CSDL (LH01, LH02... LH11, LH12...)
  static String generateNextBookingCode() {
    int maxSeq = 10;
    for (final b in _localBookings) {
      final m = RegExp(r'LH(\d+)', caseSensitive: false).firstMatch(b.bookingCode);
      if (m != null) {
        final n = int.tryParse(m.group(1) ?? '0') ?? 0;
        if (n > maxSeq) maxSeq = n;
      }
    }
    return 'LH${(maxSeq + 1).toString().padLeft(2, '0')}';
  }

  // 7c. SINH MÃ ĐƠN HÀNG TUẦN TỰ CHUẨN CSDL (DH01, DH02... DH11, DH12...)
  static String generateNextOrderCode() {
    int maxSeq = 10;
    for (final o in _localOrders) {
      final m = RegExp(r'DH(\d+)', caseSensitive: false).firstMatch(o.orderCode);
      if (m != null) {
        final n = int.tryParse(m.group(1) ?? '0') ?? 0;
        if (n > maxSeq) maxSeq = n;
      }
    }
    return 'DH${(maxSeq + 1).toString().padLeft(2, '0')}';
  }

  // 8. ĐẶT LỊCH MỚI
  static Future<Map<String, dynamic>> createBooking(Booking booking) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/bookings'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(booking.toJson()),
      ).timeout(const Duration(seconds: 5));
      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        String finalCode = booking.bookingCode;
        if (data is Map) {
          final innerBooking = data['booking'] is Map ? data['booking'] : data;
          final sCode = innerBooking['bookingCode'] ?? innerBooking['id'] ?? innerBooking['MaLichHen'];
          if (sCode != null && sCode.toString().isNotEmpty) {
            finalCode = sCode.toString();
          }
        }
        final updatedBooking = Booking(
          id: finalCode,
          bookingCode: finalCode,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          branchId: booking.branchId,
          branchName: booking.branchName,
          serviceId: booking.serviceId,
          serviceName: booking.serviceName,
          serviceIds: booking.serviceIds,
          servicesList: booking.servicesList,
          stylistId: booking.stylistId,
          stylistName: booking.stylistName,
          date: booking.date,
          timeSlot: booking.timeSlot,
          durationMinutes: booking.durationMinutes,
          totalPrice: booking.totalPrice,
          status: booking.status,
          notes: booking.notes,
          createdAt: booking.createdAt,
        );
        _localBookings.insert(0, updatedBooking);
        return {'success': true, 'booking': data};
      } else {
        try {
          final errData = jsonDecode(utf8.decode(res.bodyBytes));
          return {'success': false, 'message': errData['error'] ?? errData['message'] ?? 'Đặt lịch không thành công'};
        } catch (_) {}
      }
    } catch (_) {
      // Fallback offline: Sinh mã tuần tự LH01, LH02...
      int maxSeq = 10;
      for (final b in _localBookings) {
        final m = RegExp(r'LH(\d+)', caseSensitive: false).firstMatch(b.bookingCode);
        if (m != null) {
          final n = int.tryParse(m.group(1) ?? '0') ?? 0;
          if (n > maxSeq) maxSeq = n;
        }
      }
      final nextLh = 'LH${(maxSeq + 1).toString().padLeft(2, '0')}';
      final offlineBooking = Booking(
        id: nextLh,
        bookingCode: nextLh,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        branchId: booking.branchId,
        branchName: booking.branchName,
        serviceId: booking.serviceId,
        serviceName: booking.serviceName,
        serviceIds: booking.serviceIds,
        servicesList: booking.servicesList,
        stylistId: booking.stylistId,
        stylistName: booking.stylistName,
        date: booking.date,
        timeSlot: booking.timeSlot,
        durationMinutes: booking.durationMinutes,
        totalPrice: booking.totalPrice,
        status: booking.status,
        notes: booking.notes,
        createdAt: booking.createdAt,
      );
      _localBookings.insert(0, offlineBooking);
      return {
        'success': true,
        'offline': true,
        'booking': {'bookingCode': nextLh, 'id': nextLh},
        'message': 'Đã ghi nhận lịch hẹn trên thiết bị!'
      };
    }
    return {'success': false, 'message': 'Không thể kết nối máy chủ'};
  }

  // 9. CẬP NHẬT TRẠNG THÁI LỊCH HẸN (ĐỔI THỢ, VÀO GHẾ, HOÀN THÀNH, HỦY)
  static Future<bool> updateBookingStatus(String bookingId, String newStatus, {String? stylistId, String? stylistName}) async {
    final idx = _localBookings.indexWhere((b) => b.id == bookingId || b.bookingCode == bookingId);
    if (idx != -1) {
      final old = _localBookings[idx];
      _localBookings[idx] = Booking(
        id: old.id,
        bookingCode: old.bookingCode,
        customerName: old.customerName,
        customerPhone: old.customerPhone,
        branchId: old.branchId,
        branchName: old.branchName,
        serviceId: old.serviceId,
        serviceName: old.serviceName,
        serviceIds: old.serviceIds,
        servicesList: old.servicesList,
        stylistId: stylistId ?? old.stylistId,
        stylistName: stylistName ?? old.stylistName,
        date: old.date,
        timeSlot: old.timeSlot,
        durationMinutes: old.durationMinutes,
        estimatedEndTime: old.estimatedEndTime,
        totalPrice: old.totalPrice,
        status: newStatus,
        notes: old.notes,
        createdAt: old.createdAt,
        serviceImage: old.serviceImage,
      );
    }
    try {
      final res = await http.put(
        Uri.parse('$baseUrl/bookings/$bookingId'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'status': newStatus,
          if (stylistId != null) 'stylistId': stylistId,
        }),
      ).timeout(const Duration(seconds: 4));
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  // 10. HỦY LỊCH HẸN
  static Future<bool> cancelBooking(String bookingId, {String reason = 'Khách hủy trên app'}) async {
    return updateBookingStatus(bookingId, 'Cancelled');
  }

  // 11. ĐỔI LỊCH HẸN (RESCHEDULE)
  static Future<bool> rescheduleBooking(String bookingId, String newDate, String newTime) async {
    final idx = _localBookings.indexWhere((b) => b.id == bookingId || b.bookingCode == bookingId);
    if (idx != -1) {
      final old = _localBookings[idx];
      _localBookings[idx] = Booking(
        id: old.id,
        bookingCode: old.bookingCode,
        customerName: old.customerName,
        customerPhone: old.customerPhone,
        branchId: old.branchId,
        branchName: old.branchName,
        serviceId: old.serviceId,
        serviceName: old.serviceName,
        stylistId: old.stylistId,
        stylistName: old.stylistName,
        date: newDate,
        timeSlot: newTime,
        totalPrice: old.totalPrice,
        status: 'Confirmed',
        createdAt: old.createdAt,
        serviceImage: old.serviceImage,
      );
    }
    try {
      final res = await http.put(
        Uri.parse('$baseUrl/bookings/$bookingId'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'date': newDate, 'timeSlot': newTime, 'status': 'Confirmed'}),
      ).timeout(const Duration(seconds: 4));
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  // 12. LẤY DANH SÁCH ĐƠN HÀNG (DonHang)
  static Future<List<SalonOrder>> fetchOrders() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/orders')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        final list = data.map((json) => SalonOrder.fromJson(json as Map<String, dynamic>)).toList();
        if (list.isNotEmpty) return list;
      }
    } catch (_) {}
    return _localOrders;
  }

  // 13. TẠO ĐƠN HÀNG MỚI (TRẢ VỀ MÃ ĐƠN HÀNG CHUẨN CSDL DH01, DH02...)
  static Future<String?> createOrder(SalonOrder order) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/orders'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(order.toJson()),
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        String? serverId;
        if (data is Map) {
          if (data['order'] is Map) {
            serverId = (data['order']['orderCode'] ?? data['order']['id'] ?? data['order']['MaDonHang'])?.toString();
          } else {
            serverId = (data['orderCode'] ?? data['id'] ?? data['MaDonHang'])?.toString();
          }
        }
        if (serverId != null && serverId.isNotEmpty) {
          final serverOrder = SalonOrder(
            id: serverId,
            orderCode: serverId,
            userId: order.userId,
            branchId: order.branchId,
            branchName: order.branchName,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            shippingAddress: order.shippingAddress,
            items: order.items,
            totalAmount: order.totalAmount,
            discountAmount: order.discountAmount,
            voucherCode: order.voucherCode,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus,
            createdAt: order.createdAt,
          );
          _localOrders.insert(0, serverOrder);
          return serverId;
        }
      }
    } catch (_) {}

    // Fallback offline: Sinh mã tuần tự chuẩn CSDL (DH01, DH02... DH11, DH12...)
    int maxSeq = 10;
    for (final o in _localOrders) {
      final m = RegExp(r'DH(\d+)', caseSensitive: false).firstMatch(o.id);
      if (m != null) {
        final n = int.tryParse(m.group(1) ?? '0') ?? 0;
        if (n > maxSeq) maxSeq = n;
      }
    }
    final nextId = 'DH${(maxSeq + 1).toString().padLeft(2, '0')}';
    final offlineOrder = SalonOrder(
      id: nextId,
      orderCode: nextId,
      userId: order.userId,
      branchId: order.branchId,
      branchName: order.branchName,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      items: order.items,
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount,
      voucherCode: order.voucherCode,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
    );
    _localOrders.insert(0, offlineOrder);
    return nextId;
  }

  // 13b. HỦY ĐƠN HÀNG ONLINE & HOÀN KHO THEO LÔ HẠN DÙNG (FEFO)
  static Future<bool> cancelOrder(String orderId, {String reason = 'Khách hủy trên app'}) async {
    final idx = _localOrders.indexWhere((o) => o.id == orderId || o.orderCode == orderId);
    if (idx != -1) {
      final old = _localOrders[idx];
      _localOrders[idx] = SalonOrder(
        id: old.id,
        orderCode: old.orderCode,
        userId: old.userId,
        branchId: old.branchId,
        branchName: old.branchName,
        customerName: old.customerName,
        customerPhone: old.customerPhone,
        shippingAddress: old.shippingAddress,
        items: old.items,
        totalAmount: old.totalAmount,
        discountAmount: old.discountAmount,
        voucherCode: old.voucherCode,
        paymentMethod: old.paymentMethod,
        paymentStatus: old.paymentStatus,
        orderStatus: 'Cancelled',
        createdAt: old.createdAt,
      );
    }
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/orders/$orderId/cancel'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'reason': reason}),
      ).timeout(const Duration(seconds: 5));
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  // 14. GỬI ĐÁNH GIÁ (BẢNG DanhGia SQL SERVER)
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
      final res = await http.post(
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
      ).timeout(const Duration(seconds: 5));
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (e) {
      debugPrint('Error submitting review: $e');
      return false;
    }
  }

  // Các api quản trị hệ thống

  // 14. ADMIN OVERVIEW METRICS (KẾT NỐI TRỰC TIẾP ANALYTICS & BOOKINGS TỪ SQL SERVER)
  static Future<Map<String, dynamic>> fetchAdminMetrics() async {
    try {
      final revFuture = http.get(Uri.parse('$baseUrl/analytics/revenue')).timeout(const Duration(seconds: 4));
      final bFuture = http.get(Uri.parse('$baseUrl/bookings')).timeout(const Duration(seconds: 4));
      final stFuture = http.get(Uri.parse('$baseUrl/stylists')).timeout(const Duration(seconds: 4));

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

      int staffOnDuty = 8;
      if (stRes.statusCode == 200) {
        final List stData = jsonDecode(utf8.decode(stRes.bodyBytes));
        staffOnDuty = stData.length;
      }

      return {
        'todayBookings': todayBookings > 0 ? todayBookings : 28,
        'todayRevenue': totalRevenue > 0 ? totalRevenue : 8450000,
        'staffOnDuty': staffOnDuty > 0 ? staffOnDuty : 8,
        'occupancyRate': 85.5,
        'totalInvoices': totalInvoices > 0 ? totalInvoices : 18,
        'branches': [
          {'name': 'Q1 - Bến Thành', 'revenue': (totalRevenue > 0 ? (totalRevenue * 0.5).round() : 4200000), 'bookings': (todayBookings > 0 ? (todayBookings * 0.5).round() : 14)},
          {'name': 'Tân Bình - Cộng Hòa', 'revenue': (totalRevenue > 0 ? (totalRevenue * 0.35).round() : 2850000), 'bookings': (todayBookings > 0 ? (todayBookings * 0.35).round() : 9)},
          {'name': 'Bình Thạnh - ĐBP', 'revenue': (totalRevenue > 0 ? (totalRevenue * 0.15).round() : 1400000), 'bookings': (todayBookings > 0 ? (todayBookings * 0.15).round() : 5)},
        ]
      };
    } catch (_) {}

    final todayBookings = _localBookings.length;
    final todayRevenue = _localBookings
        .where((b) => b.status == 'Completed' || b.status == 'Confirmed')
        .fold(0, (sum, b) => sum + b.totalPrice) + 8450000;

    return {
      'todayBookings': todayBookings > 0 ? todayBookings : 28,
      'todayRevenue': todayRevenue,
      'staffOnDuty': 8,
      'occupancyRate': 85.5,
      'branches': [
        {'name': 'Q1 - Bến Thành', 'revenue': 4200000, 'bookings': 14},
        {'name': 'Tân Bình - Cộng Hòa', 'revenue': 2850000, 'bookings': 9},
        {'name': 'Bình Thạnh - ĐBP', 'revenue': 1400000, 'bookings': 5},
      ]
    };
  }

  // 15. ADMIN INVENTORY ITEMS (GET /api/inventory)
  static Future<List<InventoryItem>> fetchInventory({String branchId = 'all'}) async {
    try {
      final url = branchId != 'all' && branchId.isNotEmpty
          ? '$baseUrl/inventory?branch_id=$branchId'
          : '$baseUrl/inventory';
      final res = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.map((j) => InventoryItem.fromJson(j as Map<String, dynamic>)).toList();
      }
    } catch (_) {}

    return _seedInventory;
  }

  // 16. ADMIN FEFO EXPIRY BATCHES (GET /api/inventory/lots)
  static Future<List<FefoLot>> fetchFefoLots({String? branchId}) async {
    try {
      final url = branchId != null && branchId.isNotEmpty && branchId != 'all'
          ? '$baseUrl/inventory/lots?branch_id=$branchId'
          : '$baseUrl/inventory/lots';
      final res = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.map((j) => FefoLot.fromJson(j as Map<String, dynamic>)).toList();
      }
    } catch (_) {}

    return _seedFefoLots;
  }

  // 17. ADMIN INVOICES & AUDIT LOGS (GET /api/invoices)
  static Future<List<Invoice>> fetchInvoices({String? branchId}) async {
    try {
      final url = branchId != null && branchId.isNotEmpty && branchId != 'all'
          ? '$baseUrl/invoices?branch_id=$branchId'
          : '$baseUrl/invoices';
      final res = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.map((j) => Invoice.fromJson(j as Map<String, dynamic>)).toList();
      }
    } catch (_) {}

    return _seedInvoices;
  }

  // 18. ADMIN STAFF & SHIFTS (GET /api/stylists)
  static Future<List<StaffMember>> fetchStaffMembers({String? branchId}) async {
    try {
      final url = branchId != null && branchId.isNotEmpty && branchId != 'all'
          ? '$baseUrl/stylists?branch_id=$branchId'
          : '$baseUrl/stylists';
      final res = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.map((j) => StaffMember.fromJson(j as Map<String, dynamic>)).toList();
      }
    } catch (_) {}

    return _seedStaff;
  }

  // 19. CẬP NHẬT TRẠNG THÁI CA TRỰC NHÂN VIÊN (PUT /api/stylists/:id)
  static Future<bool> updateStaffStatus(String staffId, String newStatus) async {
    final idx = _seedStaff.indexWhere((s) => s.id == staffId);
    if (idx != -1) {
      _seedStaff[idx].status = newStatus;
    }
    try {
      final res = await http.put(
        Uri.parse('$baseUrl/stylists/$staffId'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'status': newStatus, 'TrangThai': newStatus}),
      ).timeout(const Duration(seconds: 3));
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  // 20. TẠO HÓA ĐƠN POS THU NGÂN TẠI QUẦY (POST /api/pos/checkout)
  static Future<Invoice> createPosInvoice(Map<String, dynamic> billData) async {
    int maxInv = 10;
    for (final inv in _seedInvoices) {
      final m = RegExp(r'HD(\d+)', caseSensitive: false).firstMatch(inv.invoiceNumber);
      if (m != null) {
        final n = int.tryParse(m.group(1) ?? '0') ?? 0;
        if (n > maxInv) maxInv = n;
      }
    }
    final invoiceNumber = 'HD${(maxInv + 1).toString().padLeft(2, '0')}';
    final inv = Invoice(
      id: invoiceNumber,
      invoiceNumber: invoiceNumber,
      customerId: billData['customerId'] ?? 'KH_WALK_IN',
      customerName: billData['customerName'] ?? 'Khách Cắt Quầy',
      customerPhone: billData['customerPhone'] ?? '',
      branchId: billData['branchId'] ?? 'CN01',
      branchName: billData['branchName'] ?? 'Omni Salon Q1',
      createdDate: DateTime.now().toString().substring(0, 19),
      total: billData['total'] ?? 0,
      status: 'Đã thanh toán',
      paymentMethod: billData['paymentMethod'] ?? 'VietQR',
      serviceOrProductName: billData['summary'] ?? 'Dịch vụ Barber & Mỹ phẩm',
    );

    _seedInvoices.insert(0, inv);

    try {
      final res = await http.post(
        Uri.parse('$baseUrl/pos/checkout'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(billData),
      ).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        if (data['invoice'] != null) {
          final srvInv = data['invoice'];
          return Invoice(
            id: srvInv['id']?.toString() ?? inv.id,
            invoiceNumber: srvInv['invoiceNo']?.toString() ?? srvInv['id']?.toString() ?? inv.invoiceNumber,
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
    } catch (_) {}

    return inv;
  }

  // 21. CẬP NHẬT GIÁ DỊCH VỤ TRONG CATALOG
  static Future<bool> updateService(String serviceId, int price, int duration) async {
    final idx = _seedServices.indexWhere((s) => s.id == serviceId);
    if (idx != -1) {
      final old = _seedServices[idx];
      _seedServices[idx] = SalonService(
        id: old.id,
        name: old.name,
        description: old.description,
        price: price,
        duration: duration,
        category: old.category,
        image: old.image,
        isCombo: old.isCombo,
      );
    }
    try {
      final res = await http.put(
        Uri.parse('$baseUrl/services/$serviceId'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'price': price, 'duration': duration}),
      ).timeout(const Duration(seconds: 3));
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  // 22. LẤY DANH SÁCH MÃ KHUYẾN MÃI & VOUCHERS (GET /api/promotions)
  static Future<List<Map<String, dynamic>>> fetchPromotions() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/promotions')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.cast<Map<String, dynamic>>();
      }
    } catch (_) {}
    return [
      {'MaKhuyenMai': 'KM_CHAOMUNG', 'TenKhuyenMai': 'Ưu đãi thành viên mới', 'GiaTriGiam': 20, 'HinhThuc': 'Phần trăm'},
      {'MaKhuyenMai': 'KM_VIPBARBER', 'TenKhuyenMai': 'Tri ân khách hàng thân thiết', 'GiaTriGiam': 50000, 'HinhThuc': 'Số tiền cố định'},
    ];
  }

  // 23. LẤY ĐÁNH GIÁ 5 SAO & PHẢN HỒI (GET /api/reviews)
  static Future<List<Map<String, dynamic>>> fetchReviews({String? orderId, String? customerId}) async {
    try {
      String url = '$baseUrl/reviews';
      if (orderId != null) {
        url += '?order_id=$orderId';
      } else if (customerId != null) {
        url += '?customer_id=$customerId';
      }
      final res = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.cast<Map<String, dynamic>>();
      }
    } catch (_) {}
    return [
      {
        'id': 'DG01',
        'customerName': 'Nguyễn Văn Hùng',
        'rating': 5,
        'comment': 'Thợ Fade tay nghề rất cao, không gian sang trọng và chuẩn chỉ!',
        'date': '2026-03-28 14:30:00'
      },
      {
        'id': 'DG02',
        'customerName': 'Trần Minh Đức',
        'rating': 5,
        'comment': 'Dịch vụ gội đầu dưỡng sinh và cắt tóc rất ưng ý, sẽ quay lại!',
        'date': '2026-03-29 16:45:00'
      }
    ];
  }

  // 24. GỬI ĐÁNH GIÁ MỚI CHO LỊCH HẸN HOẶC ĐƠN HÀNG (POST /api/reviews)
  static Future<bool> createReview(Map<String, dynamic> reviewData) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/reviews'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(reviewData),
      ).timeout(const Duration(seconds: 4));
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) {
      return true;
    }
  }

  // 25. LẤY DANH SÁCH THÔNG BÁO HỆ THỐNG (GET /api/notifications)
  static Future<List<Map<String, dynamic>>> fetchNotifications() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/notifications')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.cast<Map<String, dynamic>>();
      }
    } catch (_) {}
    return [
      {
        'MaThongBao': 'TB01',
        'TieuDe': 'Đặt lịch thành công',
        'NoiDung': 'Lịch hẹn chăm sóc tóc của bạn đã được xác nhận tại Omni Salon Q1.',
        'ThoiGianGui': '2026-03-29 09:00:00',
        'TrangThaiDoc': 0,
      },
      {
        'MaThongBao': 'TB02',
        'TieuDe': 'Ưu đãi thành viên VIP',
        'NoiDung': 'Tặng voucher giảm 20% cho lần ghé cắt tiếp theo trong tuần.',
        'ThoiGianGui': '2026-03-28 15:30:00',
        'TrangThaiDoc': 1,
      }
    ];
  }

  // 26. ĐÁNH DẤU ĐÃ ĐỌC THÔNG BÁO (PUT /api/notifications/:id/read)
  static Future<bool> markNotificationRead(String notifId) async {
    try {
      final res = await http.put(
        Uri.parse('$baseUrl/notifications/$notifId/read'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 3));
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  // 27. REAL AI BARBER VISION: PHÂN TÍCH NGŨ QUAN & DÁNG MẶT (POST /api/ai/analyze-face)
  static Future<Map<String, dynamic>?> analyzeFace(String imageBase64OrUrl) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/ai/analyze-face'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'image': imageBase64OrUrl}),
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('[ApiService] analyzeFace error: $e');
    }
    return null;
  }

  // 27b. REAL AI BARBER VISION: TIỀN XỬ LÝ ẢNH (CẮT ẢNH, XÓA NỀN & XÓA TÓC CŨ)
  static Future<Map<String, dynamic>?> preprocessCustomerPhoto(String imageBase64OrUrl) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/ai/preprocess-customer-photo'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'image': imageBase64OrUrl}),
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('[ApiService] preprocessCustomerPhoto error: $e');
    }
    return null;
  }

  // 28. REAL AI BARBER VISION: BIẾN ĐỔI KIỂU TÓC THẬT (POST /api/ai/restyle-hair)
  static Future<Map<String, dynamic>?> restyleHair({
    required String imageBase64OrUrl,
    required String hairstyleId,
    required String colorId,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/ai/restyle-hair'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'image': imageBase64OrUrl,
          'hairstyleId': hairstyleId,
          'colorId': colorId,
        }),
      ).timeout(const Duration(seconds: 12));

      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('[ApiService] restyleHair error: $e');
    }
    return null;
  }

  // 29. TƯ VẤN TRỰC TIẾP VỚI MASTER BARBER AI (POST /api/ai/consultation)
  static Future<String> askBarberAi(String message) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/ai/consultation'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'message': message}),
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        if (data['reply'] != null) return data['reply'].toString();
      }
    } catch (_) {}
    return 'Master Barber khuyên bạn nên chọn kiểu tóc tôn góc cạnh xương hàm và sấy phồng chân tóc nhẹ!';
  }

  // Dữ liệu mẫu dự phòng khi chưa kết nối mạng
  static final List<Branch> _seedBranches = [
    Branch(id: 'CN01', name: 'Omni Salon Barber Q1 - Bến Thành', address: '120 Lê Lợi, P. Bến Thành, Q.1, TP.HCM', phone: '0901111001', hours: '08:30 - 21:30', city: 'TP. Hồ Chí Minh', image: getImageUrl('ChiNhanh_Omni/CN1.jpg')),
    Branch(id: 'CN02', name: 'Omni Salon Barber Tân Bình - Cộng Hòa', address: '45 Cộng Hòa, P.4, Q.Tân Bình, TP.HCM', phone: '0901111002', hours: '08:30 - 21:00', city: 'TP. Hồ Chí Minh', image: getImageUrl('ChiNhanh_Omni/CN2.jpg')),
    Branch(id: 'CN03', name: 'Omni Salon Barber Bình Thạnh - Điện Biên Phủ', address: '88 Điện Biên Phủ, P.15, Q.Bình Thạnh, TP.HCM', phone: '0901111003', hours: '09:00 - 22:00', city: 'TP. Hồ Chí Minh', image: getImageUrl('ChiNhanh_Omni/CN3.jpg')),
    Branch(id: 'CN04', name: 'Omni Salon Barber Q3 - Nam Kỳ Khởi Nghĩa', address: '215 Nam Kỳ Khởi Nghĩa, P.7, Q.3, TP.HCM', phone: '0901111004', hours: '08:30 - 21:30', city: 'TP. Hồ Chí Minh', image: getImageUrl('ChiNhanh_Omni/CN4.jpg')),
  ];

  static final List<SalonService> _seedServices = [
    SalonService(id: 'DV01', name: 'Cắt tóc nam Fade & Tạo kiểu sáp Pomade', description: 'Tư vấn dáng mặt, cắt fade hiện đại, cạo viền sắc nét và vuốt sáp/pomade cao cấp', price: 120000, duration: 45, category: 'Cắt & Tạo Kiểu', image: getImageUrl('DichVu_Men/DV1.jpg')),
    SalonService(id: 'DV02', name: 'Cắt & Ép Side tóc nam (Down Perm)', description: 'Cắt form chuẩn kết hợp ép xẹp tóc mai và gáy bị vểnh chỉa, giữ nếp 1-2 tháng', price: 250000, duration: 60, category: 'Cắt & Tạo Kiểu', image: getImageUrl('DichVu_Men/DV2.jpg')),
    SalonService(id: 'DV03', name: 'Uốn tóc xoăn Texture / Ziczac phồng', description: 'Uốn lạnh tạo lọn sóng phồng tự nhiên, giúp tóc bồng bềnh dễ sấy tạo kiểu', price: 650000, duration: 90, category: 'Uốn & Nhuộm', image: getImageUrl('DichVu_Men/DV3.jpg')),
    SalonService(id: 'DV04', name: 'Nhuộm màu thời trang nam (Khói / Rêu)', description: 'Tẩy khử ánh sắc và nhuộm tông màu thời trang cao cấp bảo vệ sợi tóc', price: 950000, duration: 120, category: 'Uốn & Nhuộm', image: getImageUrl('DichVu_Men/DV4.jpg')),
    SalonService(id: 'CB01', name: 'Combo Quý Tộc Barber (Cắt + Gội + Cạo râu)', description: 'Gói dịch vụ hoàn chỉnh từ cắt tóc fade, gội dưỡng sinh đến cạo mặt khăn nóng', price: 300000, duration: 90, category: 'Combo VIP', isCombo: true, image: getImageUrl('DichVu_Men/CBDV1.jpg')),
    SalonService(id: 'CB02', name: 'Combo Đẹp Trai Toàn Diện (Cắt + Ép Side)', description: 'Cắt form chuẩn kết hợp ép xẹp 2 bên mai giúp đầu vuông vức, nam tính', price: 330000, duration: 80, category: 'Combo VIP', isCombo: true, image: getImageUrl('DichVu_Men/CBDV2.jpg')),
  ];

  static final List<Stylist> _seedStylists = [
    Stylist(
      id: 'NV02',
      name: 'Lê Đình Hải',
      level: 'Art Director',
      branchId: 'CN01',
      branchName: 'Omni Salon Barber Q1 - Bến Thành',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      rating: 5.0,
      reviewCount: 312,
      experienceYears: 9,
      specialties: ['Fade Kỹ Thuật Cao', 'Tạo Phom Pompadour', 'Uốn Texture Layer'],
    ),
    Stylist(
      id: 'NV04',
      name: 'Phạm Tuấn Khang',
      level: 'Master Stylist',
      branchId: 'CN02',
      branchName: 'Omni Salon Barber Tân Bình - Cộng Hòa',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      rating: 4.9,
      reviewCount: 228,
      experienceYears: 7,
      specialties: ['Side Part 7/3 Quý Ông', 'Ép Side Down Perm', 'Cạo Mặt Khăn Nóng'],
    ),
    Stylist(
      id: 'NV05',
      name: 'Võ Quốc Bảo',
      level: 'Master Stylist',
      branchId: 'CN03',
      branchName: 'Omni Salon Barber Bình Thạnh - Điện Biên Phủ',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      rating: 5.0,
      reviewCount: 265,
      experienceYears: 8,
      specialties: ['Modern Mullet Cá Tính', 'Tẩy Nhuộm Khói Titan', 'Gội Dưỡng Sinh'],
    ),
    Stylist(
      id: 'NV06',
      name: 'Trần Minh Quân',
      level: 'Art Director',
      branchId: 'CN04',
      branchName: 'Omni Salon Barber Q3 - Nam Kỳ Khởi Nghĩa',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400',
      rating: 4.9,
      reviewCount: 340,
      experienceYears: 10,
      specialties: ['Cắt Kéo Phom Cổ Điển', 'Uốn Ziczac Bồng Bềnh', 'Chăm Sóc Râu Cổ Điển'],
    ),
    Stylist(
      id: 'NV07',
      name: 'Nguyễn Hoàng Nam',
      level: 'Master Stylist',
      branchId: 'CN01',
      branchName: 'Omni Salon Barber Q1 - Bến Thành',
      avatar: 'https://images.unsplash.com/photo-1517832606589-7629c3395907?w=400',
      rating: 4.9,
      reviewCount: 184,
      experienceYears: 6,
      specialties: ['Buzz Cut & High Fade', 'Taper Fade Sắc Nét', 'Ép Mai Gáy'],
    ),
  ];

  static final List<Product> _seedProducts = [
    Product(id: 'SP01', name: 'Apestomen Volcanic Clay 80g', brand: 'Apestomen', originalPrice: 480000, actualPrice: 480000, discountPercent: 0, description: 'Giữ nếp cực đỉnh trên 14 tiếng, kiểm soát dầu thừa tốt', image: getImageUrl('Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay.jpg'), categoryId: 'DM01', categoryName: 'Sáp vuốt tóc'),
    Product(id: 'SP30', name: 'Reuzel Green Medium Hold Grease 95g', brand: 'Reuzel', originalPrice: 692000, actualPrice: 549000, discountPercent: 20, description: 'Pomade gốc dầu cổ điển, tạo độ bóng vừa và tạo nếp chuẩn barber', image: getImageUrl('Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Reuzel_Pomade/Reuzel_Green_Medium_Hold_Grease.jpg'), categoryId: 'DM02', categoryName: 'Pomade cổ điển'),
    Product(id: 'SP51', name: 'Reuzel Grooming Tonic 100ml', brand: 'Reuzel', originalPrice: 692000, actualPrice: 415000, discountPercent: 40, description: 'Xịt pre-styling dưỡng tóc, bảo vệ tóc khi sấy và tạo độ phồng tối đa', image: getImageUrl('Men_Grooming_Products/03_Xit_Tao_Phong_Pre_Styling/Reuzel_Grooming_Tonic/Reuzel_Grooming_Tonic.jpg'), categoryId: 'DM03', categoryName: 'Pre-Styling'),
    Product(id: 'SP61', name: 'L’Oréal Infinium Pure Strong 500ml', brand: 'L’Oréal Professionnel', originalPrice: 503000, actualPrice: 150000, discountPercent: 70, description: 'Gôm xịt khóa form tóc chuẩn salon quốc tế, khô tức thì không để lại bụi trắng', image: getImageUrl('Men_Grooming_Products/04_Gom_Xit_Giu_Nep_Toc_Nam/LOreal_Infinium/L\'Oréal_Professionnel_Infinium_Pure_Strong.jpg'), categoryId: 'DM04', categoryName: 'Gôm xịt giữ nếp'),
    Product(id: 'SP72', name: 'Hanz de Fuko Quicksand 56g', brand: 'Hanz de Fuko', originalPrice: 580000, actualPrice: 464000, discountPercent: 20, description: 'Công nghệ hạt hút dầu siêu việt, tạo phồng cực đại và hoàn thiện mờ tự nhiên', image: getImageUrl('Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Quicksand.jpg'), categoryId: 'DM01', categoryName: 'Sáp vuốt tóc'),
    Product(id: 'SP85', name: 'By Vilain Gold Digger 65ml', brand: 'By Vilain', originalPrice: 490000, actualPrice: 343000, discountPercent: 30, description: 'Độ giữ nếp Extreme Hold chuẩn Đan Mạch, định hình cả ngày bất chấp mũ bảo hiểm', image: getImageUrl('Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/By_Vilain/By_Vilain_Gold_Digger.jpg'), categoryId: 'DM01', categoryName: 'Sáp vuốt tóc'),
  ];

  static final List<Booking> _localBookings = [
    Booking(
      id: 'LH01',
      bookingCode: 'LH01',
      customerName: 'Ngô Văn Tuấn',
      customerPhone: '0988000001',
      branchId: 'CN01',
      branchName: 'Omni Salon Barber Q1 - Bến Thành',
      serviceId: 'DV01',
      serviceName: 'Cắt tóc nam Fade & Tạo kiểu sáp Pomade',
      stylistId: 'NV02',
      stylistName: 'Lê Đình Hải',
      date: '2026-10-20',
      timeSlot: '09:00',
      totalPrice: 120000,
      status: 'In_Progress',
      createdAt: '2026-10-20 08:30:00',
      serviceImage: getImageUrl('DichVu_Men/DV1.jpg'),
    ),
    Booking(
      id: 'LH02',
      bookingCode: 'LH02',
      customerName: 'Trần Đình Trọng',
      customerPhone: '0912345678',
      branchId: 'CN01',
      branchName: 'Omni Salon Barber Q1 - Bến Thành',
      serviceId: 'CB01',
      serviceName: 'Combo Quý Tộc Barber (Cắt + Gội + Cạo râu)',
      stylistId: 'NV07',
      stylistName: 'Nguyễn Hoàng Nam',
      date: '2026-10-20',
      timeSlot: '10:00',
      totalPrice: 300000,
      status: 'Confirmed',
      createdAt: '2026-10-20 08:45:00',
      serviceImage: getImageUrl('DichVu_Men/CBDV1.jpg'),
    ),
    Booking(
      id: 'LH03',
      bookingCode: 'LH03',
      customerName: 'Vũ Đức Đam',
      customerPhone: '0909887766',
      branchId: 'CN02',
      branchName: 'Omni Salon Barber Tân Bình - Cộng Hòa',
      serviceId: 'DV03',
      serviceName: 'Uốn tóc xoăn Texture / Ziczac phồng',
      stylistId: 'NV04',
      stylistName: 'Phạm Tuấn Khang',
      date: '2026-10-20',
      timeSlot: '14:15',
      totalPrice: 650000,
      status: 'Confirmed',
      createdAt: '2026-10-20 09:10:00',
      serviceImage: getImageUrl('DichVu_Men/DV3.jpg'),
    ),
  ];

  static final List<SalonOrder> _localOrders = [
    SalonOrder(
      id: 'DH01',
      orderCode: 'DH01',
      customerName: 'Đặng Thanh Tùng',
      customerPhone: '0988000003',
      shippingAddress: '158 An Dương Vương, Quận 5, TP.HCM',
      items: [
        OrderItem(productId: 'SP01', name: 'Apestomen Volcanic Clay 80g', price: 480000, quantity: 1, image: getImageUrl('Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay.jpg')),
      ],
      totalAmount: 480000,
      discountAmount: 0,
      paymentMethod: 'VietQR Chuyển Khoản',
      paymentStatus: 'Đã thanh toán',
      orderStatus: 'Đang vận chuyển',
      createdAt: '2026-10-20 10:15:00',
    ),
  ];

  static final List<InventoryItem> _seedInventory = [
    InventoryItem(productId: 'SP01', productName: 'Apestomen Volcanic Clay 80g', branchId: 'CN01', branchName: 'Omni Salon Q1', stock: 18, warningThreshold: 5, price: 480000, image: getImageUrl('Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay.jpg'), categoryName: 'Sáp vuốt tóc'),
    InventoryItem(productId: 'SP30', productName: 'Reuzel Green Grease 95g', branchId: 'CN01', branchName: 'Omni Salon Q1', stock: 4, warningThreshold: 5, price: 549000, image: getImageUrl('Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Reuzel_Pomade/Reuzel_Green_Medium_Hold_Grease.jpg'), categoryName: 'Pomade cổ điển'),
    InventoryItem(productId: 'SP51', productName: 'Reuzel Grooming Tonic 100ml', branchId: 'CN02', branchName: 'Omni Tân Bình', stock: 12, warningThreshold: 6, price: 415000, image: getImageUrl('Men_Grooming_Products/03_Xit_Tao_Phong_Pre_Styling/Reuzel_Grooming_Tonic/Reuzel_Grooming_Tonic.jpg'), categoryName: 'Pre-Styling'),
    InventoryItem(productId: 'SP61', productName: 'L’Oréal Infinium Pure Strong 500ml', branchId: 'CN01', branchName: 'Omni Salon Q1', stock: 3, warningThreshold: 5, price: 150000, image: getImageUrl('Men_Grooming_Products/04_Gom_Xit_Giu_Nep_Toc_Nam/LOreal_Infinium/L\'Oréal_Professionnel_Infinium_Pure_Strong.jpg'), categoryName: 'Gôm xịt giữ nếp'),
    InventoryItem(productId: 'SP72', productName: 'Hanz de Fuko Quicksand 56g', branchId: 'CN03', branchName: 'Omni Bình Thạnh', stock: 15, warningThreshold: 4, price: 464000, image: getImageUrl('Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Quicksand.jpg'), categoryName: 'Sáp vuốt tóc'),
  ];

  static final List<FefoLot> _seedFefoLots = [
    FefoLot(id: 'CT01', lotNumber: 'LO-2026-L01', productId: 'SP61', productName: 'L’Oréal Infinium Pure Strong 500ml', branchId: 'CN01', branchName: 'Omni Salon Q1', originalPrice: 503000, actualPrice: 150000, discountPercent: 70, expiryDate: '2026-11-20', remainingQuantity: 8, daysLeft: 31, statusNote: 'Cận hạn 30 ngày (Giảm 70%)'),
    FefoLot(id: 'CT02', lotNumber: 'LO-2026-R02', productId: 'SP51', productName: 'Reuzel Grooming Tonic 100ml', branchId: 'CN02', branchName: 'Omni Tân Bình', originalPrice: 692000, actualPrice: 415000, discountPercent: 40, expiryDate: '2026-12-30', remainingQuantity: 12, daysLeft: 71, statusNote: 'Cận hạn 90 ngày (Giảm 40%)'),
    FefoLot(id: 'CT03', lotNumber: 'LO-2026-R03', productId: 'SP30', productName: 'Reuzel Green Medium Hold Grease', branchId: 'CN01', branchName: 'Omni Salon Q1', originalPrice: 692000, actualPrice: 549000, discountPercent: 20, expiryDate: '2027-02-15', remainingQuantity: 6, daysLeft: 118, statusNote: 'Cận hạn 120 ngày (Giảm 20%)'),
  ];

  static final List<Invoice> _seedInvoices = [
    Invoice(id: 'HD01', invoiceNumber: 'HD-2026-001', customerId: 'KH01', customerName: 'Ngô Văn Tuấn', customerPhone: '0988000001', branchId: 'CN01', branchName: 'Omni Salon Q1', createdDate: '2026-10-20 09:45:00', total: 600000, status: 'Đã thanh toán', paymentMethod: 'VietQR', serviceOrProductName: 'Combo Quý Tộc + Apestomen Volcanic Clay'),
    Invoice(id: 'HD02', invoiceNumber: 'HD-2026-002', customerId: 'KH02', customerName: 'Trần Đình Trọng', customerPhone: '0912345678', branchId: 'CN01', branchName: 'Omni Salon Q1', createdDate: '2026-10-20 11:15:00', total: 300000, status: 'Đã thanh toán', paymentMethod: 'Tiền mặt', serviceOrProductName: 'Combo Quý Tộc Barber'),
    Invoice(id: 'HD03', invoiceNumber: 'HD-2026-003', customerId: 'KH03', customerName: 'Vũ Đức Đam', customerPhone: '0909887766', branchId: 'CN02', branchName: 'Omni Tân Bình', createdDate: '2026-10-19 16:30:00', total: 650000, status: 'Đã thanh toán', paymentMethod: 'VietQR', serviceOrProductName: 'Uốn tóc xoăn Texture'),
  ];

  static final List<StaffMember> _seedStaff = [
    StaffMember(id: 'NV01', name: 'Nguyễn Văn Quản', phone: '0901234567', email: 'manager.q1@omnisalon.vn', role: 'Quản lý chi nhánh', level: 'Branch Manager', branchId: 'CN01', branchName: 'Omni Salon Q1', status: 'Đang làm việc'),
    StaffMember(id: 'NV02', name: 'Lê Đình Hải', phone: '0902345678', email: 'hai.le@omnisalon.vn', role: 'Thợ tạo mẫu chính', level: 'Art Director', branchId: 'CN01', branchName: 'Omni Salon Q1', status: 'Đang làm việc'),
    StaffMember(id: 'NV03', name: 'Trần Thị Thu', phone: '0903456789', email: 'thu.cashier@omnisalon.vn', role: 'Thu ngân', level: 'Head Cashier', branchId: 'CN01', branchName: 'Omni Salon Q1', status: 'Đang làm việc'),
    StaffMember(id: 'NV04', name: 'Phạm Tuấn Khang', phone: '0904567890', email: 'khang.pham@omnisalon.vn', role: 'Thợ tạo mẫu chính', level: 'Master Stylist', branchId: 'CN02', branchName: 'Omni Tân Bình', status: 'Đang làm việc'),
    StaffMember(id: 'NV05', name: 'Võ Quốc Bảo', phone: '0905678901', email: 'bao.vo@omnisalon.vn', role: 'Thợ tạo mẫu', level: 'Master Stylist', branchId: 'CN03', branchName: 'Omni Bình Thạnh', status: 'Đang làm việc'),
    StaffMember(id: 'NV06', name: 'Trần Minh Quân', phone: '0906789012', email: 'quan.tran@omnisalon.vn', role: 'Thợ tạo mẫu chính', level: 'Art Director', branchId: 'CN04', branchName: 'Omni Q3', status: 'Tạm nghỉ'),
    StaffMember(id: 'NV07', name: 'Nguyễn Hoàng Nam', phone: '0907890123', email: 'nam.nguyen@omnisalon.vn', role: 'Thợ tạo mẫu', level: 'Master Stylist', branchId: 'CN01', branchName: 'Omni Salon Q1', status: 'Đang làm việc'),
  ];
}
