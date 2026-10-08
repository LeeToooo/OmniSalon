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
    this.isExpired = false,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    final orig = (json['originalPrice'] ?? json['GiaNiemYetGoc'] ?? json['GiaBan'] ?? json['price'] ?? 0) as int;
    int actual = (json['actualPrice'] ?? json['GiaBanThucTe'] ?? json['price'] ?? orig) as int;
    int discountPct = (json['discountPercent'] ?? json['PhanTramGiam'] ?? 0) as int;

    // Tính chính sách cận date mật: Khách hàng chỉ thấy nhãn Flash Sale
    final daysLeft = json['SoNgayConLai'] ?? json['daysRemaining'];
    bool expired = false;

    if (daysLeft != null) {
      final days = (daysLeft as num).toInt();
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

    if (discountPct == 0 && orig > actual) {
      discountPct = ((1 - (actual / orig)) * 100).round();
    }

    String rawImg = (json['image'] ?? json['HinhAnh'] ?? '').toString().trim();
    String formattedImg;
    if (rawImg.startsWith('http://') || rawImg.startsWith('https://')) {
      formattedImg = rawImg;
    } else if (rawImg.isNotEmpty) {
      formattedImg = 'http://127.0.0.1:8080/${rawImg.replaceFirst(RegExp(r'^/+'), '')}';
    } else {
      formattedImg = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400';
    }

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
    };
  }

  bool get hasDiscount => discountPercent > 0;
  String get flashSaleBadge => hasDiscount ? '⚡ Flash Sale -$discountPercent%' : '';
}
