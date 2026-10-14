import '../services/api_service.dart';

class SalonService {
  final String id;
  final String name;
  final String description;
  final int price;
  final int duration;
  final String category;
  final String image;
  final bool isCombo;

  SalonService({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.duration,
    required this.category,
    required this.image,
    this.isCombo = false,
  });

  factory SalonService.fromJson(Map<String, dynamic> json) {
    final rawImg = json['image'] ?? json['HinhAnh'] ?? '';
    final isVipCombo = json['isCombo'] == true ||
        (json['id'] ?? json['MaCombo'] ?? '').toString().toUpperCase().startsWith('CB');

    final fallback = isVipCombo ? 'DichVu_Men/CBDV1.jpg' : 'DichVu_Men/DV1.jpg';
    final formattedImg = ApiService.getImageUrl(rawImg.toString(), fallback: fallback);

    final rawPrice = json['price'] ?? json['Gia'] ?? json['GiaCombo'] ?? json['DonGia'] ?? 120000;
    final num priceNum = rawPrice is num ? rawPrice : (num.tryParse(rawPrice.toString()) ?? 120000);

    final rawDur = json['duration'] ?? json['durationMinutes'] ?? json['ThoiLuong'] ?? 45;
    final num durNum = rawDur is num ? rawDur : (num.tryParse(rawDur.toString()) ?? 45);

    return SalonService(
      id: json['id'] ?? json['MaDichVu'] ?? json['MaCombo'] ?? '',
      name: json['name'] ?? json['TenDichVu'] ?? json['TenCombo'] ?? '',
      description: json['description'] ?? json['MoTa'] ?? '',
      price: priceNum.toInt(),
      duration: durNum.toInt(),
      category: json['category'] ?? (isVipCombo ? 'Combo VIP' : 'Cắt & Tạo Kiểu'),
      image: formattedImg,
      isCombo: isVipCombo,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'duration': duration,
      'category': category,
      'image': image,
      'isCombo': isCombo,
    };
  }
}
