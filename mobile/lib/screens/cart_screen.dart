import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/order.dart';
import '../services/api_service.dart';
import '../widgets/omni_image.dart';

class CartScreen extends StatefulWidget {
  final List<OrderItem> cartItems;

  const CartScreen({super.key, required this.cartItems});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0);

  final nameController = TextEditingController(text: 'Khách Hàng Omni');
  final phoneController = TextEditingController(text: '0988 123 456');
  final addressController = TextEditingController(text: '120 Lê Lợi, P. Bến Thành, Quận 1, TP.HCM');
  final voucherController = TextEditingController();

  String selectedPayment = 'VietQR Chuyển Khoản';
  int discountAmount = 0;
  String? appliedVoucher;
  bool isCheckingOut = false;

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

  Future<void> _processCheckout() async {
    if (widget.cartItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Giỏ hàng đang trống!')),
      );
      return;
    }

    final name = nameController.text.trim();
    final phone = phoneController.text.trim();
    if (name.isEmpty || phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập họ tên và số điện thoại nhận hàng!')),
      );
      return;
    }

    setState(() => isCheckingOut = true);

    final orderCode = 'DH${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
    final newOrder = SalonOrder(
      id: orderCode,
      orderCode: orderCode,
      customerName: name,
      customerPhone: phone,
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
      isCheckingOut = false;
    });

    if (!mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Color(0xFF10B981), size: 26),
            SizedBox(width: 8),
            Expanded(
              child: Text('Đặt Hàng Thành Công!', style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w900)),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Mã đơn hàng: #${newOrder.orderCode}', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFB48312), fontSize: 16)),
            const SizedBox(height: 8),
            Text('Người nhận: ${newOrder.customerName} - ${newOrder.customerPhone}'),
            Text('Địa chỉ: ${newOrder.shippingAddress}'),
            Text('Thanh toán: ${newOrder.paymentMethod}'),
            Text('Tổng thanh toán: ${currencyFormat.format(newOrder.totalAmount)}', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFBE4D25))),
            const Divider(height: 20),
            const Text(
              'Đơn hàng đã được lưu tức thì vào bảng DonHang trong CSDL SQL Server của salon!',
              style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B)),
            ),
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
            child: const Text('Tiếp Tục Mua Sắm'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F3F6),
      appBar: AppBar(
        title: const Text('Giỏ Hàng Của Bạn', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontSize: 18)),
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
                                OmniImage(
                                  imageUrl: it.image,
                                  width: 48,
                                  height: 48,
                                  fit: BoxFit.cover,
                                  borderRadius: BorderRadius.circular(8),
                                  fallbackIcon: Icons.shopping_bag,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(it.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Color(0xFF0F172A))),
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
                                              image: it.image,
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
                                            image: it.image,
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

                  // MÃ GIẢM GIÁ
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
                        const Text('Mã khuyến mãi / Voucher:', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5, color: Color(0xFF0F172A))),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: voucherController,
                                decoration: const InputDecoration(
                                  hintText: 'Nhập OMNIWELCOME hoặc CHUTICH50',
                                  border: OutlineInputBorder(),
                                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFB48312),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              onPressed: _applyVoucher,
                              child: const Text('Áp Dụng'),
                            ),
                          ],
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
                        const Text('Thông tin giao hàng:', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Color(0xFF0F172A))),
                        const SizedBox(height: 10),
                        TextField(
                          controller: nameController,
                          decoration: const InputDecoration(labelText: 'Họ tên người nhận *', border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: phoneController,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(labelText: 'Số điện thoại liên hệ *', border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: addressController,
                          decoration: const InputDecoration(labelText: 'Địa chỉ nhận hàng chi tiết *', border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
                        ),
                        const SizedBox(height: 14),
                        const Text('Phương thức thanh toán:', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: Color(0xFF64748B))),
                        const SizedBox(height: 8),
                        _buildPaymentOption('VietQR Chuyển Khoản', 'Chuyển khoản trực tuyến VietQR (Quét mã nhanh)'),
                        _buildPaymentOption('Tiền mặt khi nhận hàng (COD)', 'Thanh toán tiền mặt khi nhận hàng (COD)'),
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
                          onPressed: isCheckingOut ? null : _processCheckout,
                          child: Center(
                            child: isCheckingOut
                                ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : const Text('Thanh Toán Đơn Hàng', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
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

  Widget _buildPaymentOption(String value, String title) {
    final isSel = selectedPayment == value;
    return InkWell(
      onTap: () => setState(() => selectedPayment = value),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isSel ? const Color(0xFFFEF3C7) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isSel ? const Color(0xFFB48312) : const Color(0xFFE2E8F0)),
        ),
        child: Row(
          children: [
            Icon(
              isSel ? Icons.radio_button_checked : Icons.radio_button_off,
              color: isSel ? const Color(0xFFB48312) : const Color(0xFF94A3B8),
              size: 20,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                  color: isSel ? const Color(0xFF0F172A) : const Color(0xFF475569),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
