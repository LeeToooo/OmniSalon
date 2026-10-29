import 'package:omni_salon_mobile/core/api/api_service.dart';

class InventoryItem {
  final String productId;
  final String productName;
  final String branchId;
  final String branchName;
  final int stock;
  final int warningThreshold;
  final int price;
  final String image;
  final String categoryName;

  InventoryItem({
    required this.productId,
    required this.productName,
    required this.branchId,
    required this.branchName,
    required this.stock,
    required this.warningThreshold,
    required this.price,
    required this.image,
    required this.categoryName,
  });

  bool get isLowStock => stock <= warningThreshold;

  factory InventoryItem.fromJson(Map<String, dynamic> json) {
    final rawStock = json['stock'] ?? json['SoLuongTon'] ?? 0;
    final rawWarn = json['warningThreshold'] ?? json['MucCanhBao'] ?? 5;
    final rawPrice = json['price'] ?? json['GiaBan'] ?? 0;
    final rawImg = json['image'] ?? json['HinhAnh'] ?? '';

    return InventoryItem(
      productId: json['productId'] ?? json['MaSanPham'] ?? '',
      productName: json['productName'] ?? json['TenSanPham'] ?? 'Sản phẩm',
      branchId: json['branchId'] ?? json['MaChiNhanh'] ?? 'CN01',
      branchName: json['branchName'] ?? json['TenChiNhanh'] ?? 'Chi Nhánh Omni',
      stock: int.tryParse(rawStock.toString()) ?? 0,
      warningThreshold: int.tryParse(rawWarn.toString()) ?? 5,
      price: int.tryParse(rawPrice.toString()) ?? 0,
      image: ApiService.getImageUrl(rawImg.toString()),
      categoryName: json['categoryName'] ?? json['TenDanhMuc'] ?? 'Mỹ phẩm chăm sóc',
    );
  }
}

class FefoLot {
  final String id;
  final String lotNumber;
  final String productId;
  final String productName;
  final String branchId;
  final String branchName;
  final int originalPrice;
  final int actualPrice;
  final double discountPercent;
  final String expiryDate;
  final int remainingQuantity;
  final int daysLeft;
  final String statusNote;

  FefoLot({
    required this.id,
    required this.lotNumber,
    required this.productId,
    required this.productName,
    required this.branchId,
    required this.branchName,
    required this.originalPrice,
    required this.actualPrice,
    required this.discountPercent,
    required this.expiryDate,
    required this.remainingQuantity,
    required this.daysLeft,
    required this.statusNote,
  });

  factory FefoLot.fromJson(Map<String, dynamic> json) {
    return FefoLot(
      id: json['id'] ?? json['MaChiTietPhieuNhap'] ?? '',
      lotNumber: json['lotNumber'] ?? json['SoLo'] ?? 'LO-01',
      productId: json['productId'] ?? json['MaSanPham'] ?? '',
      productName: json['productName'] ?? json['TenSanPham'] ?? '',
      branchId: json['branchId'] ?? json['MaChiNhanh'] ?? 'CN01',
      branchName: json['branchName'] ?? json['TenChiNhanh'] ?? 'Omni Q1',
      originalPrice: (num.tryParse(json['originalPrice']?.toString() ?? json['GiaNiemYetGoc']?.toString() ?? json['GiaBan']?.toString() ?? '0') ?? 0).toInt(),
      actualPrice: (num.tryParse(json['actualPrice']?.toString() ?? json['GiaBanThucTe']?.toString() ?? json['GiaBan']?.toString() ?? '0') ?? 0).toInt(),
      discountPercent: (num.tryParse(json['discountPercent']?.toString() ?? json['PhanTramGiam']?.toString() ?? '0') ?? 0).toDouble(),
      expiryDate: (json['expiryDate'] ?? json['HanSuDung'] ?? '').toString().split('T')[0],
      remainingQuantity: int.tryParse(json['remainingQuantity']?.toString() ?? json['SoLuongConLai']?.toString() ?? '10') ?? 10,
      daysLeft: int.tryParse(json['daysLeft']?.toString() ?? json['SoNgayConLai']?.toString() ?? '30') ?? 30,
      statusNote: json['statusNote'] ?? json['GhiChuTrangThai'] ?? 'Bình thường',
    );
  }
}

class Invoice {
  final String id;
  final String invoiceNumber;
  final String customerId;
  final String customerName;
  final String customerPhone;
  final String branchId;
  final String branchName;
  final String createdDate;
  final int total;
  final String status;
  final String paymentMethod;
  final String serviceOrProductName;

  Invoice({
    required this.id,
    required this.invoiceNumber,
    required this.customerId,
    required this.customerName,
    required this.customerPhone,
    required this.branchId,
    required this.branchName,
    required this.createdDate,
    required this.total,
    required this.status,
    this.paymentMethod = 'VietQR',
    this.serviceOrProductName = 'Dịch vụ Barber',
  });

  factory Invoice.fromJson(Map<String, dynamic> json) {
    return Invoice(
      id: json['id'] ?? json['MaHoaDon'] ?? '',
      invoiceNumber: json['invoiceNumber'] ?? json['MaSoHoaDon'] ?? json['MaHoaDon'] ?? json['id'] ?? 'HD01',
      customerId: json['customerId'] ?? json['MaKhachHang'] ?? 'KH01',
      customerName: json['customerName'] ?? json['TenKhachHang'] ?? 'Khách Hàng',
      customerPhone: json['customerPhone'] ?? json['SdtKhachHang'] ?? json['SoDienThoai'] ?? '',
      branchId: json['branchId'] ?? json['MaChiNhanh'] ?? 'CN01',
      branchName: json['branchName'] ?? json['TenChiNhanh'] ?? 'Omni Salon Q1',
      createdDate: (json['createdDate'] ?? json['NgayLap'] ?? '').toString().replaceFirst('T', ' '),
      total: (num.tryParse(json['total']?.toString() ?? json['TongTien']?.toString() ?? '0') ?? 0).toInt(),
      status: json['status'] ?? json['TrangThai'] ?? 'Đã thanh toán',
      paymentMethod: json['paymentMethod'] ?? json['PhuongThuc'] ?? 'VietQR',
      serviceOrProductName: json['serviceOrProductName'] ?? json['NoiDung'] ?? 'Dịch vụ chăm sóc tóc Omni',
    );
  }
}

class StaffMember {
  final String id;
  final String name;
  final String phone;
  final String email;
  final String role;
  final String level;
  final String branchId;
  final String branchName;
  String status; // 'Đang làm việc' | 'Tạm nghỉ'

  StaffMember({
    required this.id,
    required this.name,
    required this.phone,
    required this.email,
    required this.role,
    required this.level,
    required this.branchId,
    required this.branchName,
    required this.status,
  });

  bool get isOnDuty => status == 'Đang làm việc' || status == 'Active';

  factory StaffMember.fromJson(Map<String, dynamic> json) {
    return StaffMember(
      id: json['id'] ?? json['MaNhanVien'] ?? '',
      name: json['name'] ?? json['HoTen'] ?? 'Nhân viên',
      phone: json['phone'] ?? json['SoDienThoai'] ?? '',
      email: json['email'] ?? json['Email'] ?? '',
      role: json['role'] ?? json['ChucVu'] ?? 'Thợ cắt tóc',
      level: json['level'] ?? json['CapBac'] ?? 'Master Barber',
      branchId: json['branchId'] ?? json['MaChiNhanh'] ?? 'CN01',
      branchName: json['branchName'] ?? json['TenChiNhanh'] ?? 'Omni Q1',
      status: json['status'] ?? json['TrangThai'] ?? 'Đang làm việc',
    );
  }
}
