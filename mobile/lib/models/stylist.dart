import '../services/api_service.dart';

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

    final rawLevel = json['level'] ?? json['CapBac'] ?? 'Master Barber';
    final cleanLevel = rawLevel.toString();

    final rawAvatar = json['avatar'] ?? json['HinhAnh'] ?? '';
    final formattedAvatar = ApiService.getImageUrl(
      rawAvatar.toString(),
      fallback: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    );

    final rawRating = json['rating'] ?? 5.0;
    final num ratingNum = rawRating is num ? rawRating : (num.tryParse(rawRating.toString()) ?? 5.0);

    return Stylist(
      id: json['id'] ?? json['MaNhanVien'] ?? '',
      name: cleanName,
      level: cleanLevel,
      branchId: json['branchId'] ?? json['MaChiNhanh'] ?? 'CN01',
      avatar: formattedAvatar,
      rating: ratingNum.toDouble(),
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
