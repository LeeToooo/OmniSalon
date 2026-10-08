class Stylist {
  final String id;
  final String name;
  final String level;
  final String branchId;
  final String avatar;
  final double rating;

  Stylist({
    required this.id,
    required this.name,
    required this.level,
    required this.branchId,
    required this.avatar,
    this.rating = 5.0,
  });

  factory Stylist.fromJson(Map<String, dynamic> json) {
    final rawName = json['name'] ?? json['HoTen'] ?? 'Thợ Tạo Mẫu';
    final cleanName = rawName.toString()
        .replaceAll('Barber', 'Thợ Tạo Mẫu')
        .replaceAll('Master Stylist', 'Nghệ Nhân Tạo Mẫu');

    final rawLevel = json['level'] ?? json['CapBac'] ?? 'Thợ Tạo Mẫu Chính';
    final cleanLevel = rawLevel.toString()
        .replaceAll('Barber', 'Thợ Tạo Mẫu')
        .replaceAll('Master Stylist', 'Nghệ Nhân Tạo Mẫu');

    return Stylist(
      id: json['id'] ?? json['MaNhanVien'] ?? '',
      name: cleanName,
      level: cleanLevel,
      branchId: json['branchId'] ?? json['MaChiNhanh'] ?? 'CN01',
      avatar: json['avatar'] ?? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      rating: ((json['rating'] ?? 5.0) as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'level': level,
      'branchId': branchId,
      'avatar': avatar,
      'rating': rating,
    };
  }
}
