import '../services/api_service.dart';

class OrderItem {
  final String productId;
  final String name;
  final int price;
  final int quantity;
  final String image;

  OrderItem({
    required this.productId,
    required this.name,
    required this.price,
    required this.quantity,
    this.image = '',
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    final rawPrice = json['price'] ?? json['unitPrice'] ?? json['GiaBan'] ?? 0;
    final num priceNum = rawPrice is num ? rawPrice : (num.tryParse(rawPrice.toString()) ?? 0);

    final rawQty = json['quantity'] ?? json['qty'] ?? json['SoLuong'] ?? 1;
    final num qtyNum = rawQty is num ? rawQty : (num.tryParse(rawQty.toString()) ?? 1);

    final rawImg = json['image'] ?? json['HinhAnh'] ?? '';
    final formattedImg = ApiService.getImageUrl(rawImg.toString());

    return OrderItem(
      productId: json['productId'] ?? json['id'] ?? json['MaSanPham'] ?? '',
      name: json['name'] ?? json['TenSanPham'] ?? '',
      price: priceNum.toInt(),
      quantity: qtyNum.toInt(),
      image: formattedImg,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'productId': productId,
      'name': name,
      'price': price,
      'quantity': quantity,
      'image': image,
    };
  }
}

class SalonOrder {
  final String id;
  final String orderCode;
  final String customerName;
  final String customerPhone;
  final String shippingAddress;
  final List<OrderItem> items;
  final int totalAmount;
  final int discountAmount;
  final String? voucherCode;
  final String paymentMethod;
  final String paymentStatus;
  final String orderStatus;
  final String createdAt;

  SalonOrder({
    required this.id,
    required this.orderCode,
    required this.customerName,
    required this.customerPhone,
    required this.shippingAddress,
    required this.items,
    required this.totalAmount,
    required this.discountAmount,
    this.voucherCode,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.orderStatus,
    required this.createdAt,
  });

  factory SalonOrder.fromJson(Map<String, dynamic> json) {
    var rawItems = json['items'];
    List<OrderItem> itemsList = [];
    if (rawItems is List) {
      itemsList = rawItems.map((i) => OrderItem.fromJson(i as Map<String, dynamic>)).toList();
    }

    final rawTotal = json['totalAmount'] ?? json['TongTien'] ?? json['TongThanhToan'] ?? 0;
    final num totalNum = rawTotal is num ? rawTotal : (num.tryParse(rawTotal.toString()) ?? 0);

    final rawDiscount = json['discountAmount'] ?? json['TongGiamGia'] ?? 0;
    final num discountNum = rawDiscount is num ? rawDiscount : (num.tryParse(rawDiscount.toString()) ?? 0);

    return SalonOrder(
      id: json['id'] ?? json['MaDonHang'] ?? '',
      orderCode: json['orderCode'] ?? json['MaDonHang'] ?? json['id'] ?? 'DH01',
      customerName: json['customerName'] ?? json['TenKhachHang'] ?? 'Khách Hàng',
      customerPhone: json['customerPhone'] ?? json['SdtKhachHang'] ?? json['SoDienThoai'] ?? '',
      shippingAddress: json['shippingAddress'] ?? json['DiaChiGiaoHang'] ?? json['DiaChiGiao'] ?? 'Nhận tại quầy',
      items: itemsList,
      totalAmount: totalNum.toInt(),
      discountAmount: discountNum.toInt(),
      voucherCode: json['voucherCode'],
      paymentMethod: json['paymentMethod'] ?? 'Tiền mặt',
      paymentStatus: json['paymentStatus'] ?? 'Chưa thanh toán',
      orderStatus: json['orderStatus'] ?? json['TrangThai'] ?? 'Đang xử lý',
      createdAt: json['createdAt'] ?? json['orderDate'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'orderCode': orderCode,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'shippingAddress': shippingAddress,
      'items': items.map((i) => i.toJson()).toList(),
      'totalAmount': totalAmount,
      'discountAmount': discountAmount,
      'voucherCode': voucherCode,
      'paymentMethod': paymentMethod,
      'paymentStatus': paymentStatus,
      'orderStatus': orderStatus,
      'createdAt': createdAt,
    };
  }
}
