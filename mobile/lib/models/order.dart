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
    return OrderItem(
      productId: json['productId'] ?? json['id'] ?? '',
      name: json['name'] ?? json['TenSanPham'] ?? '',
      price: (json['price'] ?? json['unitPrice'] ?? 0) as int,
      quantity: (json['quantity'] ?? json['qty'] ?? 1) as int,
      image: json['image'] ?? '',
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

    return SalonOrder(
      id: json['id'] ?? json['MaDonHang'] ?? '',
      orderCode: json['orderCode'] ?? json['id'] ?? 'DH-01',
      customerName: json['customerName'] ?? json['TenKhachHang'] ?? 'Khách Hàng',
      customerPhone: json['customerPhone'] ?? json['SoDienThoai'] ?? '',
      shippingAddress: json['shippingAddress'] ?? json['DiaChiGiao'] ?? 'Nhận tại quầy',
      items: itemsList,
      totalAmount: (json['totalAmount'] ?? json['TongThanhToan'] ?? 0) as int,
      discountAmount: (json['discountAmount'] ?? json['TongGiamGia'] ?? 0) as int,
      voucherCode: json['voucherCode'],
      paymentMethod: json['paymentMethod'] ?? 'Tiền mặt',
      paymentStatus: json['paymentStatus'] ?? 'Chưa thanh toán',
      orderStatus: json['orderStatus'] ?? 'Đang xử lý',
      createdAt: json['createdAt'] ?? '',
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
