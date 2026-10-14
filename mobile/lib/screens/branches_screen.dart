import 'package:flutter/material.dart';
import '../models/branch.dart';
import '../services/api_service.dart';
import '../widgets/omni_image.dart';
import 'booking_screen.dart';

class BranchesScreen extends StatefulWidget {
  const BranchesScreen({super.key});

  @override
  State<BranchesScreen> createState() => _BranchesScreenState();
}

class _BranchesScreenState extends State<BranchesScreen> {
  List<Branch> allBranches = [];
  bool isLoading = true;
  String selectedCity = 'all';

  final cities = [
    {'id': 'all', 'label': 'Toàn Hệ Thống'},
    {'id': 'TP. Hồ Chí Minh', 'label': 'TP. Hồ Chí Minh'},
    {'id': 'Hà Nội', 'label': 'Hà Nội'},
    {'id': 'Đà Nẵng', 'label': 'Đà Nẵng'},
  ];

  @override
  void initState() {
    super.initState();
    _loadBranches();
  }

  Future<void> _loadBranches() async {
    setState(() => isLoading = true);
    final list = await ApiService.fetchBranches();
    setState(() {
      allBranches = list;
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final filtered = allBranches.where((b) {
      if (selectedCity == 'all') return true;
      return b.city.contains(selectedCity) || b.address.contains(selectedCity);
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F3F6),
      appBar: AppBar(
        title: const Text(
          'Hệ Thống 20 Chi Nhánh',
          style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 18),
        ),
        backgroundColor: Colors.white,
        elevation: 1,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFF0F172A)),
            onPressed: _loadBranches,
            tooltip: 'Làm mới',
          ),
        ],
      ),
      body: Column(
        children: [
          // CITY FILTER CHIPS
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: SizedBox(
              height: 38,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: cities.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, idx) {
                  final c = cities[idx];
                  final isSelected = selectedCity == c['id'];
                  return ChoiceChip(
                    label: Text(
                      c['label']!,
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
                      setState(() => selectedCity = c['id']!);
                    },
                  );
                },
              ),
            ),
          ),

          // BRANCH LIST
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFFB48312)))
                : filtered.isEmpty
                    ? const Center(
                        child: Text('Không tìm thấy chi nhánh nào.'),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: filtered.length,
                        itemBuilder: (context, idx) {
                          final b = filtered[idx];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
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
                                      imageUrl: b.image,
                                      height: 160,
                                      width: double.infinity,
                                      fit: BoxFit.cover,
                                      borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                                      fallbackIcon: Icons.storefront,
                                    ),
                                    Positioned(
                                      top: 10,
                                      right: 10,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: const Color(0xD90F172A),
                                          borderRadius: BorderRadius.circular(9999),
                                        ),
                                        child: Text(
                                          'Chi Nhánh ${b.id}',
                                          style: const TextStyle(
                                            color: Color(0xFFFBBF24),
                                            fontWeight: FontWeight.w900,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        b.name,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w900,
                                          fontSize: 16,
                                          color: Color(0xFF0F172A),
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Icon(Icons.location_on_outlined, size: 16, color: Color(0xFFBE4D25)),
                                          const SizedBox(width: 6),
                                          Expanded(
                                            child: Text(
                                              b.address,
                                              style: const TextStyle(fontSize: 13, color: Color(0xFF475569)),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          const Icon(Icons.access_time, size: 16, color: Color(0xFFB48312)),
                                          const SizedBox(width: 6),
                                          Text(
                                            b.hours,
                                            style: const TextStyle(fontSize: 13, color: Color(0xFF475569), fontWeight: FontWeight.w600),
                                          ),
                                          const Spacer(),
                                          const Icon(Icons.phone_outlined, size: 16, color: Color(0xFF10B981)),
                                          const SizedBox(width: 4),
                                          Text(
                                            b.phone,
                                            style: const TextStyle(fontSize: 13, color: Color(0xFF10B981), fontWeight: FontWeight.w700),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 14),
                                      SizedBox(
                                        width: double.infinity,
                                        child: ElevatedButton(
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: const Color(0xFFB48312),
                                            foregroundColor: Colors.white,
                                            padding: const EdgeInsets.symmetric(vertical: 11),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                          ),
                                          onPressed: () {
                                            Navigator.of(context).push(
                                              MaterialPageRoute(
                                                builder: (_) => BookingScreen(preselectedBranchId: b.id),
                                              ),
                                            );
                                          },
                                          child: const Text(
                                            'Đặt Lịch Tại Chi Nhánh Này',
                                            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5),
                                          ),
                                        ),
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
