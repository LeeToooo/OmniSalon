import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/service.dart';
import '../services/api_service.dart';
import '../widgets/omni_image.dart';
import 'booking_screen.dart';

class ServicesScreen extends StatefulWidget {
  const ServicesScreen({super.key});

  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0);

  List<SalonService> allServices = [];
  bool isLoading = true;
  String selectedCategory = 'all';

  final categories = [
    {'id': 'all', 'label': 'Tất Cả'},
    {'id': 'Combo VIP', 'label': 'Combo Quý Tộc'},
    {'id': 'Cắt & Tạo Kiểu', 'label': 'Cắt & Tạo Kiểu'},
    {'id': 'Uốn & Nhuộm', 'label': 'Uốn & Nhuộm'},
    {'id': 'Chăm Sóc & Phục Hồi', 'label': 'Chăm Sóc & Râu'},
  ];

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  Future<void> _loadServices() async {
    setState(() => isLoading = true);
    final list = await ApiService.fetchServices();
    setState(() {
      allServices = list;
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final filtered = allServices.where((s) {
      if (selectedCategory == 'all') return true;
      if (selectedCategory == 'Combo VIP') return s.isCombo;
      return s.category == selectedCategory;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F3F6),
      appBar: AppBar(
        title: const Text(
          'Dịch Vụ & Combo Barber',
          style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 18),
        ),
        backgroundColor: Colors.white,
        elevation: 1,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFF0F172A)),
            onPressed: _loadServices,
            tooltip: 'Làm mới',
          ),
        ],
      ),
      body: Column(
        children: [
          // CATEGORY CHIPS
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: SizedBox(
              height: 38,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, idx) {
                  final cat = categories[idx];
                  final isSelected = selectedCategory == cat['id'];
                  return ChoiceChip(
                    label: Text(
                      cat['label']!,
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                        color: isSelected ? Colors.white : const Color(0xFF334155),
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: const Color(0xFFB48312),
                    backgroundColor: const Color(0xFFF1F5F9),
                    side: BorderSide(
                      color: isSelected ? const Color(0xFFB48312) : const Color(0xFFE2E8F0),
                    ),
                    onSelected: (_) {
                      setState(() => selectedCategory = cat['id']!);
                    },
                  );
                },
              ),
            ),
          ),

          // SERVICE LIST
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFFB48312)))
                : filtered.isEmpty
                    ? const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.content_cut, size: 54, color: Color(0xFF94A3B8)),
                            SizedBox(height: 12),
                            Text(
                              'Không tìm thấy dịch vụ nào trong mục này.',
                              style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: filtered.length,
                        itemBuilder: (context, idx) {
                          final s = filtered[idx];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: s.isCombo ? const Color(0xFFFDE68A) : const Color(0xFFE2E8F0),
                                width: s.isCombo ? 1.5 : 1,
                              ),
                              boxShadow: const [
                                BoxShadow(color: Color(0x0A000000), blurRadius: 8, offset: Offset(0, 3)),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Stack(
                                  children: [
                                    OmniImage(
                                      imageUrl: s.image,
                                      height: 160,
                                      width: double.infinity,
                                      fit: BoxFit.cover,
                                      borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                                    ),
                                    if (s.isCombo)
                                      Positioned(
                                        top: 10,
                                        left: 10,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            gradient: const LinearGradient(
                                              colors: [Color(0xFFB48312), Color(0xFFD97706)],
                                            ),
                                            borderRadius: BorderRadius.circular(9999),
                                            boxShadow: const [
                                              BoxShadow(color: Color(0x33000000), blurRadius: 4),
                                            ],
                                          ),
                                          child: const Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Text(
                                                'COMBO QUÝ TỘC',
                                                style: TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.w900,
                                                  fontSize: 10.5,
                                                  letterSpacing: 0.5,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    Positioned(
                                      bottom: 10,
                                      right: 10,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: const Color(0xBF000000),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          'Thời lượng: ${s.duration} phút',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.w800,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                Padding(
                                  padding: const EdgeInsets.all(14),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        s.name,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w900,
                                          fontSize: 16,
                                          color: Color(0xFF0F172A),
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        s.description,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          color: Color(0xFF64748B),
                                          height: 1.4,
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              const Text(
                                                'Giá niêm yết:',
                                                style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                                              ),
                                              Text(
                                                currencyFormat.format(s.price),
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w900,
                                                  color: Color(0xFFBE4D25),
                                                  fontSize: 17,
                                                ),
                                              ),
                                            ],
                                          ),
                                          ElevatedButton(
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: const Color(0xFFB48312),
                                              foregroundColor: Colors.white,
                                              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                                              shape: RoundedRectangleBorder(
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                            ),
                                            onPressed: () {
                                              Navigator.of(context).push(
                                                MaterialPageRoute(
                                                  builder: (_) => BookingScreen(preselectedServiceId: s.id),
                                                ),
                                              );
                                            },
                                            child: const Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(Icons.calendar_today, size: 14),
                                                SizedBox(width: 6),
                                                Text(
                                                  'Đặt Lịch',
                                                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
