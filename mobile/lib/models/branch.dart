import 'package:omni_salon_mobile/core/api/api_service.dart';

class Branch {
  final String id;
  final String name;
  final String address;
  final String phone;
  final String hours;
  final String city;
  final String image;

  Branch({
    required this.id,
    required this.name,
    required this.address,
    required this.phone,
    required this.hours,
    required this.city,
    required this.image,
  });

  factory Branch.fromJson(Map<String, dynamic> json) {
    final rawImg = json['image'] ?? json['HinhAnh'] ?? '';
    final formattedImg = ApiService.getImageUrl(rawImg.toString(), fallback: 'ChiNhanh_Omni/CN1.jpg');

    return Branch(
      id: json['id'] ?? json['MaChiNhanh'] ?? '',
      name: json['name'] ?? json['TenChiNhanh'] ?? '',
      address: json['address'] ?? json['DiaChi'] ?? '',
      phone: json['phone'] ?? json['SoDienThoai'] ?? '0901 111 001',
      hours: json['hours'] ?? json['openHours'] ?? '08:30 - 21:30',
      city: json['city'] ?? 'TP. Hồ Chí Minh',
      image: formattedImg,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'phone': phone,
      'hours': hours,
      'city': city,
      'image': image,
    };
  }
}
