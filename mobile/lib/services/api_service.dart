import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/branch.dart';
import '../models/service.dart';
import '../models/stylist.dart';
import '../models/product.dart';
import '../models/booking.dart';
import '../models/order.dart';

class ApiService {
  // Địa chỉ Live REST API Server (chạy song song với Web)
  // Khi chạy trên Android Emulator: đổi thành http://10.0.2.2:8080/api
  // Khi chạy trên Windows/Web/iOS: dùng http://127.0.0.1:8080/api hoặc http://localhost:8080/api
  static String baseUrl = 'http://127.0.0.1:8080/api';

  static void setBaseUrl(String url) {
    baseUrl = url;
  }

  // 1. LẤY DANH SÁCH CHI NHÁNH
  static Future<List<Branch>> fetchBranches() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/branches')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.map((json) => Branch.fromJson(json)).toList();
      }
    } catch (_) {}
    return _seedBranches;
  }

  // 2. LẤY DANH SÁCH DỊCH VỤ
  static Future<List<SalonService>> fetchServices() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/services')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.map((json) => SalonService.fromJson(json)).toList();
      }
    } catch (_) {}
    return _seedServices;
  }

  // 3. LẤY DANH SÁCH THỢ TẠO MẪU
  static Future<List<Stylist>> fetchStylists() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/stylists')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.map((json) => Stylist.fromJson(json)).toList();
      }
    } catch (_) {}
    return _seedStylists;
  }

  // 4. LẤY DANH SÁCH SẢN PHẨM & TÌM KIẾM
  static Future<List<Product>> fetchProducts({String query = '', String category = 'all'}) async {
    List<Product> products = [];
    try {
      final res = await http.get(Uri.parse('$baseUrl/products')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        products = data.map((json) => Product.fromJson(json)).toList();
      }
    } catch (_) {
      products = _seedProducts;
    }

    // Lọc bỏ hàng hết hạn (<= 0 ngày), lọc từ khóa và danh mục
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

  // 5. LẤY DANH SÁCH ĐẶT LỊCH
  static Future<List<Booking>> fetchBookings() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/bookings')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.map((json) => Booking.fromJson(json)).toList();
      }
    } catch (_) {}
    return _localBookings;
  }

  // 6. ĐẶT LỊCH MỚI (ĐỒNG BỘ TỨC THÌ LÊN LIVE DATABASE CHO WEB THẤY)
  static Future<bool> createBooking(Booking booking) async {
    _localBookings.insert(0, booking);
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/bookings'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(booking.toJson()),
      ).timeout(const Duration(seconds: 4));
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) {
      return true; // Lưu cục bộ thành công
    }
  }

  // 7. ĐỔI LỊCH HẸN
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

  // 8. HỦY LỊCH HẸN
  static Future<bool> cancelBooking(String bookingId) async {
    final target = _localBookings.firstWhere(
      (b) => b.id == bookingId || b.bookingCode == bookingId,
      orElse: () => _localBookings.first,
    );
    target.status = 'Cancelled';
    try {
      final res = await http.delete(
        Uri.parse('$baseUrl/bookings/$bookingId'),
      ).timeout(const Duration(seconds: 4));
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  // 9. LẤY DANH SÁCH ĐƠN HÀNG
  static Future<List<SalonOrder>> fetchOrders() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/orders')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final List data = jsonDecode(utf8.decode(res.bodyBytes));
        return data.map((json) => SalonOrder.fromJson(json)).toList();
      }
    } catch (_) {}
    return _localOrders;
  }

  // 10. TẠO ĐƠN HÀNG MỚI (ĐỒNG BỘ TỨC THÌ LÊN LIVE DATABASE CHO BẢN WEB THẤY)
  static Future<bool> createOrder(SalonOrder order) async {
    _localOrders.insert(0, order);
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/orders'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(order.toJson()),
      ).timeout(const Duration(seconds: 4));
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) {
      return true;
    }
  }

  // DỮ LIỆU DỰ PHÒNG NGOẠI TUYẾN
  static final List<Branch> _seedBranches = [
    Branch(id: 'CN01', name: 'Omni Salon Chi Nhánh 1 - Quận 1', address: '120 Lê Lợi, Bến Thành, Quận 1, TP.HCM', phone: '0901 111 222', hours: '08:30 - 21:30', city: 'TP. Hồ Chí Minh'),
    Branch(id: 'CN02', name: 'Omni Salon Chi Nhánh 2 - Tân Bình', address: '45 Cộng Hòa, Phường 4, Tân Bình, TP.HCM', phone: '0903 333 444', hours: '08:30 - 21:30', city: 'TP. Hồ Chí Minh'),
    Branch(id: 'CN03', name: 'Omni Salon Chi Nhánh 3 - Bình Thạnh', address: '88 Phan Xích Long, Bình Thạnh, TP.HCM', phone: '0905 555 666', hours: '08:30 - 21:30', city: 'TP. Hồ Chí Minh'),
  ];

  static final List<SalonService> _seedServices = [
    SalonService(id: 'DV01', name: 'Cắt Tóc Nam Thời Trang', description: 'Gội đầu thư giãn, cắt tạo phom chuẩn tỷ lệ khuôn mặt, vuốt tạo kiểu bằng sáp cao cấp', price: 120000, duration: 45, category: 'haircut', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600'),
    SalonService(id: 'DV02', name: 'Cắt & Ép Side Tóc Nam', description: 'Thiết kế phom cắt fade kết hợp ép down perm mai và gáy', price: 250000, duration: 60, category: 'haircut', image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600'),
    SalonService(id: 'DV03', name: 'Uốn Textured Nam Hàn Quốc', description: 'Uốn phồng chân tóc tạo lọn texture bồng bềnh tự nhiên', price: 450000, duration: 90, category: 'perm', image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600'),
    SalonService(id: 'DV04', name: 'Nhuộm Tóc Nam Phục Hồi', description: 'Màu nhuộm nhập khẩu chính hãng L’Oréal, khử ánh sắc tông khói sáng', price: 550000, duration: 90, category: 'color', image: 'https://images.unsplash.com/photo-1517832606589-7629c3395907?w=600'),
    SalonService(id: 'DV05', name: 'Uốn Con Sâu Dreadlocks Ruffled', description: 'Uốn phá cách tạo hiệu ứng xù gai góc phong cách hiphop cá tính', price: 600000, duration: 60, category: 'treatment', image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600'),
  ];

  static final List<Stylist> _seedStylists = [
    Stylist(id: 'NV02', name: 'Lê Đình Hải', level: 'Master Barber', branchId: 'CN01', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', rating: 5.0),
    Stylist(id: 'NV05', name: 'Võ Quốc Bảo', level: 'Thợ Tạo Mẫu Cao Cấp', branchId: 'CN03', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', rating: 5.0),
    Stylist(id: 'NV04', name: 'Phạm Tuấn Khang', level: 'Thợ Tạo Mẫu Chính', branchId: 'CN02', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300', rating: 4.9),
  ];

  static final List<Product> _seedProducts = [
    Product(id: 'SP14', name: 'Sáp Vuốt Tóc Volcanic Clay V5 80ml', brand: 'Apestomen', originalPrice: 340000, actualPrice: 340000, discountPercent: 0, description: 'Giữ nếp cực đỉnh trên 14 tiếng, kiểm soát dầu thừa tốt cho khí hậu nóng ẩm', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600', categoryId: 'DM04'),
    Product(id: 'SP15', name: 'Pomade Moroccanoil Styling Clay 75ml', brand: 'Moroccanoil', originalPrice: 540000, actualPrice: 432000, discountPercent: 20, description: 'Tạo kiểu linh hoạt, chứa tinh dầu Argan nuôi dưỡng sợi tóc chắc khỏe', image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600', categoryId: 'DM04'),
    Product(id: 'SP16', name: 'Gôm Xịt Tóc L’Oréal Infinium Pure 500ml', brand: 'L’Oréal Professionnel', originalPrice: 360000, actualPrice: 216000, discountPercent: 40, description: 'Keo xịt giữ nếp chuẩn salon quốc tế, khô tức thì, không để lại bụi trắng', image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600', categoryId: 'DM05'),
    Product(id: 'SP17', name: 'Xịt Dưỡng Bóng Moroccanoil Glimmer 100ml', brand: 'Moroccanoil', originalPrice: 590000, actualPrice: 177000, discountPercent: 70, description: 'Lớp phủ hoàn thiện tạo hiệu ứng bắt sáng óng ả cho mái tóc uốn nhuộm', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600', categoryId: 'DM05'),
  ];

  static final List<Booking> _localBookings = [
    Booking(
      id: 'LH01',
      bookingCode: 'LH01',
      customerName: 'Ngô Văn Tuấn',
      customerPhone: '0988000001',
      branchId: 'CN01',
      branchName: 'Omni Salon Chi Nhánh 1 - Quận 1',
      serviceId: 'DV01',
      serviceName: 'Cắt tóc nam thời trang',
      stylistId: 'NV02',
      stylistName: 'Lê Thị Hương',
      date: '2026-10-02',
      timeSlot: '09:00',
      totalPrice: 120000,
      status: 'Confirmed',
      createdAt: '2026-09-25 08:30:00',
    ),
  ];

  static final List<SalonOrder> _localOrders = [
    SalonOrder(
      id: 'DH01',
      orderCode: 'DH01',
      customerName: 'Đặng Thanh Tùng',
      customerPhone: '0988000003',
      shippingAddress: '158 An Dương Vương, TP.HCM',
      items: [
        OrderItem(productId: 'SP14', name: 'Sáp Vuốt Tóc Volcanic Clay V5 80ml', price: 340000, quantity: 1),
      ],
      totalAmount: 340000,
      discountAmount: 0,
      paymentMethod: 'VietQR Chuyển Khoản',
      paymentStatus: 'Đã thanh toán',
      orderStatus: 'Đang vận chuyển',
      createdAt: '2026-09-27 15:00:00',
    ),
  ];
}
