import '../services/api_service.dart';

class Booking {
  final String id;
  final String bookingCode;
  final String customerName;
  final String customerPhone;
  final String branchId;
  final String branchName;
  final String serviceId;
  final String serviceName;
  final String stylistId;
  final String stylistName;
  final String date;
  final String timeSlot;
  final int totalPrice;
  String status;
  final String createdAt;
  final String serviceImage;

  Booking({
    required this.id,
    required this.bookingCode,
    required this.customerName,
    required this.customerPhone,
    required this.branchId,
    required this.branchName,
    required this.serviceId,
    required this.serviceName,
    required this.stylistId,
    required this.stylistName,
    required this.date,
    required this.timeSlot,
    required this.totalPrice,
    required this.status,
    required this.createdAt,
    this.serviceImage = '',
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    final rawPrice = json['totalPrice'] ?? json['TongTien'] ?? 0;
    final num priceNum = rawPrice is num ? rawPrice : (num.tryParse(rawPrice.toString()) ?? 0);

    final rawImg = json['serviceImage'] ?? json['HinhAnh'] ?? '';
    final formattedImg = ApiService.getImageUrl(rawImg.toString(), fallback: 'DichVu_Men/DV1.jpg');

    return Booking(
      id: json['id'] ?? json['MaLichHen'] ?? '',
      bookingCode: json['bookingCode'] ?? json['MaLichHen'] ?? json['id'] ?? 'LH01',
      customerName: json['customerName'] ?? json['TenKhachHang'] ?? 'Khách Hàng',
      customerPhone: json['customerPhone'] ?? json['SdtKhachHang'] ?? json['SoDienThoai'] ?? '',
      branchId: json['branchId'] ?? json['MaChiNhanh'] ?? 'CN01',
      branchName: json['branchName'] ?? json['TenChiNhanh'] ?? 'Omni Salon Chi Nhánh',
      serviceId: json['serviceId'] ?? json['MaDichVu'] ?? 'DV01',
      serviceName: json['serviceName'] ?? json['TenDichVu'] ?? 'Dịch Vụ Cắt Tóc Nam',
      stylistId: json['stylistId'] ?? json['MaNhanVien'] ?? 'NV02',
      stylistName: json['stylistName'] ?? json['TenNhanVien'] ?? 'Master Barber',
      date: json['date'] ?? json['NgayHen'] ?? '',
      timeSlot: json['timeSlot'] ?? json['GioBatDau'] ?? json['GioHen'] ?? '09:00',
      totalPrice: priceNum.toInt(),
      status: json['status'] ?? json['TrangThai'] ?? 'Confirmed',
      createdAt: json['createdAt'] ?? '',
      serviceImage: formattedImg,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bookingCode': bookingCode,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'branchId': branchId,
      'branchName': branchName,
      'serviceId': serviceId,
      'serviceName': serviceName,
      'stylistId': stylistId,
      'stylistName': stylistName,
      'date': date,
      'timeSlot': timeSlot,
      'totalPrice': totalPrice,
      'status': status,
      'createdAt': createdAt,
    };
  }

  bool get isCancelled =>
      status.toLowerCase() == 'cancelled' ||
      status == 'Đã hủy' ||
      status.toLowerCase() == 'da_huy';

  bool get isCompleted =>
      status.toLowerCase() == 'completed' ||
      status == 'Hoàn thành' ||
      status.toLowerCase() == 'hoan_thanh';

  String get displayStatus {
    if (isCancelled) return 'Đã Hủy';
    if (isCompleted) return 'Hoàn Thành';
    if (status.toLowerCase().contains('progress') || status == 'In_Progress') return 'Đang Thực Hiện';
    return 'Đã Xác Nhận';
  }
}
