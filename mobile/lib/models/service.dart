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
    return SalonService(
      id: json['id'] ?? json['MaDichVu'] ?? '',
      name: json['name'] ?? json['TenDichVu'] ?? '',
      description: json['description'] ?? json['MoTa'] ?? '',
      price: (json['price'] ?? json['Gia'] ?? json['DonGia'] ?? 150000) as int,
      duration: (json['duration'] ?? json['ThoiGianPhut'] ?? 45) as int,
      category: json['category'] ?? 'haircut',
      image: json['image'] ?? 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600',
      isCombo: json['isCombo'] ?? false,
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
