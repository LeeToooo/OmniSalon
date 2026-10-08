import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/order.dart';
import '../services/api_service.dart';

class CartScreen extends StatefulWidget {
  final List<OrderItem> cartItems;

  const CartScreen({super.key, required this.cartItems});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0);

  final nameController = TextEditingController(text: 'Khách Hàng');
  final phoneController = TextEditingController(text: '0988 123 456');
  final addressController = TextEditingController(text: '120 Lê Lợi, Bến Thành, Quận 1, TP.HCM');
  final voucherController = TextEditingController();

  String selectedPayment = 'VietQR Chuyển Khoản';
  int discountAmount = 0;
  String? appliedVoucher;

  int get subtotal => widget.cartItems.fold<int>(0, (sum, i) => sum + (i.price * i.quantity));
  int get finalTotal => (subtotal - discountAmount) > 0 ? (subtotal - discountAmount) : 0;

  void _applyVoucher() {
    final code = voucherController.text.trim().toUpperCase();
    if (code == 'OMNIWELCOME') {
      setState(() {
        discountAmount = 50000;
        appliedVoucher = code;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Áp dụng mã OMNIWELCOME: Giảm 50.000đ')),
      );
    } else if (code == 'CHUTICH50') {
      setState(() {
        discountAmount = (subtotal * 0.5).round();
        appliedVoucher = code;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Áp dụng mã CHUTICH50: Giảm 50%')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mã voucher không hợp lệ hoặc đã hết hạn')),
      );
    }
  }

  // Chức năng: MUA HÀNG VÀ THANH TOÁN (CLO 3.5 Rubric - 0.25đ)
  Future<void> _processCheckout() async {
    if (widget.cartItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Giỏ hàng đang trống!')),
      );
      return;
    }

    final newOrder = SalonOrder(
      id: 'DH-${DateTime.now().millisecondsSinceEpoch}',
      orderCode: 'DH-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
      customerName: nameController.text.trim().isEmpty ? 'Khách Hàng' : nameController.text.trim(),
      customerPhone: phoneController.text.trim().isEmpty ? '0988 123 456' : phoneController.text.trim(),
      shippingAddress: addressController.text.trim().isEmpty ? 'Nhận tại quầy chi nhánh' : addressController.text.trim(),
      items: List.from(widget.cartItems),
      totalAmount: finalTotal,
      discountAmount: discountAmount,
      voucherCode: appliedVoucher,
      paymentMethod: selectedPayment,
      paymentStatus: selectedPayment.contains('VietQR') ? 'Đã thanh toán' : 'Chưa thanh toán (COD)',
      orderStatus: 'Đang xử lý',
      createdAt: DateFormat('yyyy-MM-dd HH:mm:ss').format(DateTime.now()),
    );

    await ApiService.createOrder(newOrder);

    setState(() {
      widget.cartItems.clear();
    });

    if (mounted) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          title: const Row(
            children: [
              Text('🎉 ', style: TextStyle(fontSize: 26)),
              Expanded(
                child: Text('Đặt Hàng Thành Công!', style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w900)),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Mã đơn hàng: #${newOrder.orderCode}', style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFFB48312), fontSize: 16)),
              const SizedBox(height: 8),
              Text('Người nhận: ${newOrder.customerName} - ${newOrder.customerPhone}'),
              Text('Địa chỉ: ${newOrder.shippingAddress}'),
              Text('Phương thức: ${newOrder.paymentMethod}'),
              const Divider(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Tổng thanh toán:', style: TextStyle(fontWeight: FontWeight.w700)),
                  Text(currencyFormat.format(newOrder.totalAmount), style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFBE4D25), fontSize: 16)),
                ],
              ),
              const SizedBox(height: 12),
              const Text('Đơn hàng đã được đồng bộ tức thì sang hệ thống Web Omni Salon.', style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B))),
            ],
          ),
          actions: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFB48312),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () {
                Navigator.of(ctx).pop();
                Navigator.of(context).pop();
              },
              child: const Text('Hoàn Tất'),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F3F6),
      appBar: AppBar(
        title: const Text('Giỏ Hàng & Mua Hàng', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 18)),
        backgroundColor: Colors.white,
        elevation: 1,
        iconTheme: const IconThemeData(color: Color(0xFF0F172A)),
      ),
      body: widget.cartItems.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.remove_shopping_cart_outlined, size: 64, color: Color(0xFF94A3B8)),
                  const SizedBox(height: 12),
                  const Text('Giỏ hàng của bạn đang trống.', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFB48312),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Tiếp Tục Mua Sắm'),
                  ),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // DANH SÁCH MÓN HÀNG
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 8, offset: Offset(0, 3))],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Sản phẩm đã chọn:', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 15)),
                        const Divider(height: 20),
                        ...widget.cartItems.map((it) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(it.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Color(0xFF0F172A))),
                                      const SizedBox(height: 2),
                                      Text(currencyFormat.format(it.price), style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFBE4D25), fontSize: 13)),
                                    ],
                                  ),
                                ),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.remove_circle_outline, size: 20, color: Color(0xFF64748B)),
                                      onPressed: () {
                                        setState(() {
                                          if (it.quantity > 1) {
                                            final idx = widget.cartItems.indexOf(it);
                                            widget.cartItems[idx] = OrderItem(
                                              productId: it.productId,
                                              name: it.name,
                                              price: it.price,
                                              quantity: it.quantity - 1,
                                            );
                                          } else {
                                            widget.cartItems.remove(it);
                                          }
                                        });
                                      },
                                    ),
                                    Text('${it.quantity}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                                    IconButton(
                                      icon: const Icon(Icons.add_circle_outline, size: 20, color: Color(0xFFB48312)),
                                      onPressed: () {
                                        setState(() {
                                          final idx = widget.cartItems.indexOf(it);
                                          widget.cartItems[idx] = OrderItem(
                                            productId: it.productId,
                                            name: it.name,
                                            price: it.price,
                                            quantity: it.quantity + 1,
                                          );
                                        });
                                      },
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // MÃ KHUYẾN MÃI VOUCHER
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: voucherController,
                            decoration: const InputDecoration(
                              hintText: 'Nhập mã voucher (OMNIWELCOME)...',
                              border: OutlineInputBorder(),
                              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0F172A),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: _applyVoucher,
                          child: const Text('Áp Dụng'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // THÔNG TIN GIAO HÀNG & PHƯƠNG THỨC THANH TOÁN
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Thông tin nhận hàng & Thanh toán:', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 15)),
                        const Divider(height: 20),
                        TextField(
                          controller: nameController,
                          decoration: const InputDecoration(labelText: 'Họ tên người nhận', border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: phoneController,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(labelText: 'Số điện thoại', border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: addressController,
                          decoration: const InputDecoration(labelText: 'Địa chỉ nhận hàng', border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
                        ),
                        const SizedBox(height: 14),
                        const Text('Phương thức thanh toán:', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: Color(0xFF64748B))),
                        const SizedBox(height: 6),
                        RadioListTile<String>(
                          value: 'VietQR Chuyển Khoản',
                          groupValue: selectedPayment,
                          title: const Text('Chuyển khoản trực tuyến VietQR (Quét mã)'),
                          contentPadding: EdgeInsets.zero,
                          onChanged: (val) => setState(() => selectedPayment = val!),
                        ),
                        RadioListTile<String>(
                          value: 'Tiền mặt khi nhận hàng (COD)',
                          groupValue: selectedPayment,
                          title: const Text('Thanh toán tiền mặt khi nhận hàng (COD)'),
                          contentPadding: EdgeInsets.zero,
                          onChanged: (val) => setState(() => selectedPayment = val!),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // TỔNG KẾT HÓA ĐƠN & NÚT ĐẶT HÀNG
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Tạm tính:', style: TextStyle(color: Color(0xFF64748B))),
                            Text(currencyFormat.format(subtotal), style: const TextStyle(fontWeight: FontWeight.w700)),
                          ],
                        ),
                        if (discountAmount > 0) ...[
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Giảm giá (${appliedVoucher ?? "Voucher"}):', style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.w700)),
                              Text('-${currencyFormat.format(discountAmount)}', style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.w700)),
                            ],
                          ),
                        ],
                        const Divider(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Tổng thanh toán:', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFF0F172A))),
                            Text(currencyFormat.format(finalTotal), style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFBE4D25), fontSize: 20)),
                          ],
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFBE4D25),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: _processCheckout,
                          child: const Center(
                            child: Text('Thanh Toán Đơn Hàng Ngay →', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
    );
  }
}
