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
      backgroundColor: const Color(0xFF141413),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: Color(0xFFFAF8F5)),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Hệ Thống 20 Chi Nhánh',
          style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFFAF8F5), fontSize: 18),
        ),
        backgroundColor: const Color(0xFF141413),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFFC59B27)),
            onPressed: _loadBranches,
            tooltip: 'Làm mới',
          ),
        ],
      ),
      body: Column(
        children: [
          // CITY FILTER CHIPS
          Container(
            color: const Color(0xFF171614),
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
                        color: isSelected ? const Color(0xFF141413) : const Color(0xFFFAF8F5),
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: const Color(0xFFC59B27),
                    backgroundColor: const Color(0xFF1C1917),
                    side: BorderSide(
                      color: isSelected ? const Color(0xFFC59B27) : const Color(0xFF2E2C29),
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
                ? const Center(child: CircularProgressIndicator(color: Color(0xFFC59B27)))
                : filtered.isEmpty
                    ? const Center(
                        child: Text(
                          'Không tìm thấy chi nhánh nào.',
                          style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFA8A29E)),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: filtered.length,
                        itemBuilder: (context, idx) {
                          final b = filtered[idx];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1C1917),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFF2E2C29)),
                              boxShadow: const [
                                BoxShadow(color: Color(0x1F000000), blurRadius: 8, offset: Offset(0, 3)),
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
                                          color: const Color(0xFF141413).withValues(alpha: 0.85),
                                          borderRadius: BorderRadius.circular(9999),
                                          border: Border.all(color: const Color(0xFFC59B27).withValues(alpha: 0.4)),
                                        ),
                                        child: Text(
                                          'Chi Nhánh ${b.id}',
                                          style: const TextStyle(
                                            color: Color(0xFFC59B27),
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
                                          color: Color(0xFFFAF8F5),
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Icon(Icons.location_on_outlined, size: 16, color: Color(0xFFC59B27)),
                                          const SizedBox(width: 6),
                                          Expanded(
                                            child: Text(
                                              b.address,
                                              style: const TextStyle(fontSize: 13, color: Color(0xFFA8A29E)),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          const Icon(Icons.access_time, size: 16, color: Color(0xFFC59B27)),
                                          const SizedBox(width: 6),
                                          Text(
                                            b.hours,
                                            style: const TextStyle(fontSize: 13, color: Color(0xFFA8A29E), fontWeight: FontWeight.w600),
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
                                            backgroundColor: const Color(0xFFC59B27),
                                            foregroundColor: const Color(0xFF141413),
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
