import 'package:omni_salon_mobile/core/api/api_service.dart';

class Stylist {
  final String id;
  final String name;
  final String level;
  final String branchId;
  final String branchName;
  final String avatar;
  final double rating;
  final int reviewCount;
  final int experienceYears;
  final List<String> specialties;

  Stylist({
    required this.id,
    required this.name,
    required this.level,
    required this.branchId,
    this.branchName = 'Omni Salon Barber',
    required this.avatar,
    this.rating = 5.0,
    this.reviewCount = 148,
    this.experienceYears = 8,
    this.specialties = const ['Fade Kỹ Thuật Cao', 'Uốn Texture', 'Down Perm'],
  });

  factory Stylist.fromJson(Map<String, dynamic> json) {
    final rawName = json['name'] ?? json['HoTen'] ?? 'Thợ Tạo Mẫu';
    final cleanName = rawName.toString();

    final rawLevel = json['level'] ?? json['CapBac'] ?? json['ChucVu'] ?? 'Master Stylist';
    String cleanLevel = rawLevel.toString();
    if (cleanLevel == 'Senior Barber' || cleanLevel == 'Barber Chuyên Nghiệp') {
      cleanLevel = 'Master Stylist';
    }

    final rawAvatar = json['avatar'] ?? json['HinhAnh'] ?? '';
    final formattedAvatar = ApiService.getImageUrl(
      rawAvatar.toString(),
      fallback: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    );

    final rawRating = json['rating'] ?? 5.0;
    final num ratingNum = rawRating is num ? rawRating : (num.tryParse(rawRating.toString()) ?? 5.0);

    final rawReviews = json['reviewCount'] ?? json['SoDanhGia'] ?? 150;
    final int reviewCount = int.tryParse(rawReviews.toString()) ?? 150;

    final rawExp = json['experienceYears'] ?? json['KinhNghiem'] ?? 7;
    final int expYears = int.tryParse(rawExp.toString()) ?? 7;

    List<String> specs = ['Fade Kỹ Thuật Cao', 'Uốn Texture', 'Tạo Phom Quý Tộc'];
    if (json['specialties'] is List) {
      specs = (json['specialties'] as List).map((e) => e.toString()).toList();
    }

    return Stylist(
      id: json['id'] ?? json['MaNhanVien'] ?? '',
      name: cleanName,
      level: cleanLevel,
      branchId: json['branchId'] ?? json['MaChiNhanh'] ?? 'CN01',
      branchName: json['branchName'] ?? json['TenChiNhanh'] ?? 'Omni Salon Chi Nhánh',
      avatar: formattedAvatar,
      rating: ratingNum.toDouble(),
      reviewCount: reviewCount,
      experienceYears: expYears,
      specialties: specs,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'level': level,
      'branchId': branchId,
      'branchName': branchName,
      'avatar': avatar,
      'rating': rating,
      'reviewCount': reviewCount,
      'experienceYears': experienceYears,
      'specialties': specialties,
    };
  }
}
