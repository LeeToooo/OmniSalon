class Branch {
  final String id;
  final String name;
  final String address;
  final String phone;
  final String hours;
  final String city;

  Branch({
    required this.id,
    required this.name,
    required this.address,
    required this.phone,
    required this.hours,
    required this.city,
  });

  factory Branch.fromJson(Map<String, dynamic> json) {
    return Branch(
      id: json['id'] ?? json['MaChiNhanh'] ?? '',
      name: json['name'] ?? json['TenChiNhanh'] ?? '',
      address: json['address'] ?? json['DiaChi'] ?? '',
      phone: json['phone'] ?? json['SoDienThoai'] ?? '1900 8899',
      hours: json['hours'] ?? '08:30 - 21:30',
      city: json['city'] ?? 'TP. Hồ Chí Minh',
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
    };
  }
}
