import 'package:omni_salon_mobile/core/api/api_service.dart';

class Product {
  final String id;
  final String name;
  final String brand;
  final int originalPrice;
  final int actualPrice;
  final int discountPercent;
  final String description;
  final String image;
  final String categoryId;
  final String categoryName;
  final bool isExpired;

  Product({
    required this.id,
    required this.name,
    required this.brand,
    required this.originalPrice,
    required this.actualPrice,
    required this.discountPercent,
    required this.description,
    required this.image,
    required this.categoryId,
    this.categoryName = 'Sản phẩm tạo kiểu',
    this.isExpired = false,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    final rawOrig = json['originalPrice'] ?? json['GiaNiemYetGoc'] ?? json['GiaBan'] ?? json['price'] ?? 0;
    final num origNum = rawOrig is num ? rawOrig : (num.tryParse(rawOrig.toString()) ?? 0);
    final int orig = origNum.toInt();

    final rawActual = json['actualPrice'] ?? json['GiaBanThucTe'] ?? json['price'] ?? orig;
    final num actualNum = rawActual is num ? rawActual : (num.tryParse(rawActual.toString()) ?? orig);
    int actual = actualNum.toInt();

    final rawDiscount = json['discountPercent'] ?? json['PhanTramGiam'] ?? 0;
    final num discountNum = rawDiscount is num ? rawDiscount : (num.tryParse(rawDiscount.toString()) ?? 0);
    int discountPct = discountNum.toInt();

    // Chính sách Flash sale theo cận date
    final daysLeft = json['SoNgayConLai'] ?? json['daysRemaining'];
    bool expired = false;

    if (daysLeft != null) {
      final days = (daysLeft is num ? daysLeft : (num.tryParse(daysLeft.toString()) ?? 999)).toInt();
      if (days <= 0) {
        expired = true;
      } else if (days <= 30) {
        discountPct = 70;
        actual = (orig * 0.3).round();
      } else if (days <= 90) {
        discountPct = 40;
        actual = (orig * 0.6).round();
      } else if (days <= 180) {
        discountPct = 20;
        actual = (orig * 0.8).round();
      }
    }

    if (discountPct == 0 && orig > actual && orig > 0) {
      discountPct = ((1 - (actual / orig)) * 100).round();
    }

    final rawImg = (json['image'] ?? json['HinhAnh'] ?? '').toString().trim();
    final formattedImg = ApiService.getImageUrl(
      rawImg,
      fallback: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay.jpg',
    );

    return Product(
      id: json['id'] ?? json['MaSanPham'] ?? '',
      name: json['name'] ?? json['TenSanPham'] ?? '',
      brand: json['brand'] ?? 'CHÍNH HÃNG',
      originalPrice: orig,
      actualPrice: actual,
      discountPercent: discountPct,
      description: json['description'] ?? json['MoTa'] ?? '',
      image: formattedImg,
      categoryId: json['categoryId'] ?? json['MaDanhMuc'] ?? 'DM01',
      categoryName: json['category'] ?? json['TenDanhMuc'] ?? 'Sản phẩm tạo kiểu',
      isExpired: expired || json['isExpired'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'brand': brand,
      'originalPrice': originalPrice,
      'actualPrice': actualPrice,
      'discountPercent': discountPercent,
      'description': description,
      'image': image,
      'categoryId': categoryId,
      'categoryName': categoryName,
    };
  }

  bool get hasDiscount => discountPercent > 0;
  String get flashSaleBadge => hasDiscount ? 'Giảm $discountPercent%' : '';
}
