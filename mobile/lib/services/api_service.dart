import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/branch.dart';
import '../models/service.dart';
import '../models/stylist.dart';
import '../models/product.dart';
import '../models/booking.dart';
import '../models/order.dart';

class ApiService {
  // Tự động phân giải cổng mặc định của server Node.js (cổng 3000)
  // Android Emulator: 10.0.2.2:3000/api
  // Web / Desktop Windows: localhost:3000/api
  // Thiết bị thật qua WiFi: Người dùng có thể chỉnh sửa IP ngay trong dialog
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

  // URL gốc của máy chủ để truy xuất các tệp hình ảnh tĩnh (ví dụ: http://localhost:3000)
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

    // Tải thêm Combo dịch vụ nếu có
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

  // 3. LẤY DANH SÁCH THỢ TẠO MẪU TỪ BẢNG NhanVien
  static Future<List<Stylist>> fetchStylists({String? branchId}) async {
    try {
      final url = branchId != null && branchId.isNotEmpty
          ? '$baseUrl/stylists?branch_id=$branchId'
          : '$baseUrl/stylists';
      final res = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.map((json) => Stylist.fromJson(json as Map<String, dynamic>)).toList();
      }
    } catch (_) {}

    if (branchId != null && branchId.isNotEmpty) {
      final filtered = _seedStylists.where((s) => s.branchId == branchId).toList();
      if (filtered.isNotEmpty) return filtered;
    }
    return _seedStylists;
  }

  // 4. LẤY KHUNG GIỜ TRỐNG CHO ĐẶT LỊCH
  static Future<List<Map<String, dynamic>>> fetchAvailableSlots(String date, String stylistId) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/bookings/available-slots?date=$date&stylistId=$stylistId'),
      ).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.cast<Map<String, dynamic>>();
      }
    } catch (_) {}

    // Fallback slots
    final defaultSlots = [
      '08:30', '09:15', '10:00', '10:45', '11:30',
      '14:00', '14:45', '15:30', '16:15', '17:00',
      '18:00', '18:45', '19:30', '20:15'
    ];
    return defaultSlots.map((t) => {'time': t, 'available': true}).toList();
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

    // Lọc local nếu mất mạng
    return _localBookings.where((b) =>
      b.bookingCode.toLowerCase().contains(clean.toLowerCase()) ||
      b.customerPhone.contains(clean) ||
      b.customerName.toLowerCase().contains(clean.toLowerCase())
    ).toList();
  }

  // 8. ĐẶT LỊCH MỚI (LƯU TRỰC TIẾP VÀO BẢNG LichHen & ChiTietLichHen)
  static Future<Map<String, dynamic>> createBooking(Booking booking) async {
    _localBookings.insert(0, booking);
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/bookings'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(booking.toJson()),
      ).timeout(const Duration(seconds: 5));
      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        return {'success': true, 'booking': data};
      } else {
        try {
          final errData = jsonDecode(utf8.decode(res.bodyBytes));
          return {'success': false, 'message': errData['error'] ?? errData['message'] ?? 'Đặt lịch không thành công'};
        } catch (_) {}
      }
    } catch (e) {
      // Lưu offline tạm thời
      return {'success': true, 'offline': true, 'message': 'Đã ghi nhận lịch hẹn trên thiết bị!'};
    }
    return {'success': false, 'message': 'Không thể kết nối máy chủ'};
  }

  // 9. ĐỔI LỊCH HẸN (RESCHEDULE)
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

  // 10. HỦY LỊCH HẸN
  static Future<bool> cancelBooking(String bookingId, {String reason = 'Khách hủy trên app'}) async {
    for (final b in _localBookings) {
      if (b.id == bookingId || b.bookingCode == bookingId) {
        b.status = 'Cancelled';
      }
    }
    try {
      final res = await http.delete(
        Uri.parse('$baseUrl/bookings/$bookingId'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'reason': reason}),
      ).timeout(const Duration(seconds: 4));
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  // 11. LẤY DANH SÁCH ĐƠN HÀNG (DonHang)
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

  // 12. TẠO ĐƠN HÀNG MỚI (LƯU TRỰC TIẾP VÀO BẢNG DonHang & ChiTietDonHang)
  static Future<bool> createOrder(SalonOrder order) async {
    _localOrders.insert(0, order);
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/orders'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(order.toJson()),
      ).timeout(const Duration(seconds: 5));
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) {
      return true;
    }
  }

  // DỮ LIỆU DỰ PHÒNG NGOẠI TUYẾN CHUẨN ĐỒNG BỘ VỚI SQL SERVER
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
    Stylist(id: 'NV02', name: 'Lê Đình Hải', level: 'Master Barber', branchId: 'CN01', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', rating: 5.0),
    Stylist(id: 'NV04', name: 'Phạm Tuấn Khang', level: 'Thợ Tạo Mẫu Chính', branchId: 'CN02', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300', rating: 4.9),
    Stylist(id: 'NV05', name: 'Võ Quốc Bảo', level: 'Nghệ Nhân Tạo Mẫu', branchId: 'CN03', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300', rating: 5.0),
  ];

  static final List<Product> _seedProducts = [
    Product(id: 'SP01', name: 'Apestomen Volcanic Clay 80g', brand: 'Apestomen', originalPrice: 480000, actualPrice: 480000, discountPercent: 0, description: 'Giữ nếp cực đỉnh trên 14 tiếng, kiểm soát dầu thừa tốt', image: getImageUrl('Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay.jpg'), categoryId: 'DM01', categoryName: 'Sáp vuốt tóc'),
    Product(id: 'SP30', name: 'Reuzel Green Medium Hold Grease 95g', brand: 'Reuzel', originalPrice: 692000, actualPrice: 549000, discountPercent: 20, description: 'Pomade gốc dầu cổ điển, tạo độ bóng vừa và tạo nếp chuẩn barber', image: getImageUrl('Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Reuzel_Pomade/Reuzel_Green_Medium_Hold_Grease.jpg'), categoryId: 'DM02', categoryName: 'Pomade cổ điển'),
    Product(id: 'SP51', name: 'Reuzel Grooming Tonic 100ml', brand: 'Reuzel', originalPrice: 692000, actualPrice: 415000, discountPercent: 40, description: 'Xịt pre-styling dưỡng tóc, bảo vệ tóc khi sấy và tạo độ phồng tối đa', image: getImageUrl('Men_Grooming_Products/03_Xit_Tao_Phong_Pre_Styling/Reuzel_Grooming_Tonic/Reuzel_Grooming_Tonic.jpg'), categoryId: 'DM03', categoryName: 'Pre-Styling'),
    Product(id: 'SP61', name: 'L’Oréal Infinium Pure Strong 500ml', brand: 'L’Oréal Professionnel', originalPrice: 503000, actualPrice: 150000, discountPercent: 70, description: 'Gôm xịt khóa form tóc chuẩn salon quốc tế, khô tức thì không để lại bụi trắng', image: getImageUrl('Men_Grooming_Products/04_Gom_Xit_Giu_Nep_Toc_Nam/LOreal_Infinium/L\'Oréal_Professionnel_Infinium_Pure_Strong.jpg'), categoryId: 'DM04', categoryName: 'Gôm xịt giữ nếp'),
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
      date: '2026-10-15',
      timeSlot: '09:00',
      totalPrice: 120000,
      status: 'Confirmed',
      createdAt: '2026-10-14 08:30:00',
      serviceImage: getImageUrl('DichVu_Men/DV1.jpg'),
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
      createdAt: '2026-10-14 10:15:00',
    ),
  ];
}
