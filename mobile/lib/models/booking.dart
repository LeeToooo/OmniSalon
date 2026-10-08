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
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'] ?? json['MaLichHen'] ?? '',
      bookingCode: json['bookingCode'] ?? json['id'] ?? 'LH-01',
      customerName: json['customerName'] ?? json['TenKhachHang'] ?? '',
      customerPhone: json['customerPhone'] ?? json['SoDienThoai'] ?? '',
      branchId: json['branchId'] ?? json['MaChiNhanh'] ?? 'CN01',
      branchName: json['branchName'] ?? 'Omni Salon Chi Nhánh 1',
      serviceId: json['serviceId'] ?? json['MaDichVu'] ?? '',
      serviceName: json['serviceName'] ?? 'Dịch Vụ Cắt Tóc',
      stylistId: json['stylistId'] ?? json['MaNhanVien'] ?? '',
      stylistName: json['stylistName'] ?? 'Thợ Tạo Mẫu',
      date: json['date'] ?? json['NgayHen'] ?? '',
      timeSlot: json['timeSlot'] ?? json['GioHen'] ?? '',
      totalPrice: (json['totalPrice'] ?? json['TongTien'] ?? 0) as int,
      status: json['status'] ?? json['TrangThai'] ?? 'Confirmed',
      createdAt: json['createdAt'] ?? '',
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

  bool get isCancelled => status.toLowerCase() == 'cancelled' || status == 'Đã hủy';
}
