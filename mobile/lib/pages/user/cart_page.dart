import 'package:omni_salon_mobile/core/auth/auth_service.dart';
import 'package:omni_salon_mobile/core/api/api_service.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';
import 'package:omni_salon_mobile/models/order.dart';
import 'package:omni_salon_mobile/components/editorial_image.dart';
import 'package:omni_salon_mobile/pages/auth/login_page.dart';
import 'package:omni_salon_mobile/components/main_scaffold.dart';

class CartScreen extends StatefulWidget {
  final List<OrderItem> cart;
  final VoidCallback? onUpdateCart;
  final VoidCallback? onNavigateToShop;

  const CartScreen({
    super.key,
    required this.cart,
    this.onUpdateCart,
    this.onNavigateToShop,
  });

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫', decimalDigits: 0);

  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _voucherController = TextEditingController();

  String _selectedPayment = 'VietQR Chuyển Khoản';
  int _discountAmount = 0;
  String? _appliedVoucher;
  bool _isCheckingOut = false;

  @override
  void initState() {
    super.initState();
    final user = AuthService.currentUser;
    if (user != null) {
      _nameController.text = user.fullName;
      _phoneController.text = user.phone;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _voucherController.dispose();
    super.dispose();
  }

  int get _subtotal => widget.cart.fold<int>(0, (sum, i) => sum + (i.price * i.quantity));
  int get _finalTotal => (_subtotal - _discountAmount) > 0 ? (_subtotal - _discountAmount) : 0;

  void _applyVoucher() {
    final code = _voucherController.text.trim().toUpperCase();
    if (code == 'OMNIWELCOME') {
      setState(() {
        _discountAmount = 50000;
        _appliedVoucher = code;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Áp dụng mã OMNIWELCOME: Giảm 50.000₫')),
      );
    } else if (code == 'QUYONG20') {
      setState(() {
        _discountAmount = (_subtotal * 0.2).round();
        _appliedVoucher = code;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Áp dụng mã QUYONG20: Giảm 20%')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mã voucher không hợp lệ hoặc đã hết hạn')),
      );
    }
  }

  void _showRequireLoginDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppTheme.accentGold.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.lock_outline_rounded, color: AppTheme.accentGold, size: 30),
            ),
            const SizedBox(height: 16),
            Text('Yêu Cầu Đăng Nhập', style: AppTheme.headingSmall(fontSize: 19)),
            const SizedBox(height: 10),
            Text(
              'Quý khách cần đăng nhập tài khoản để đặt hàng mỹ phẩm và theo dõi đơn hàng.',
              style: AppTheme.bodySmall(color: AppTheme.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
        actions: [
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text('ĐỂ SAU'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  onPressed: () async {
                    Navigator.of(ctx).pop();
                    await Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => LoginScreen(
                          onLoginSuccess: () {
                            if (mounted) {
                              setState(() {
                                final u = AuthService.currentUser;
                                if (u != null) {
                                  _nameController.text = u.fullName;
                                  _phoneController.text = u.phone;
                                }
                              });
                            }
                          },
                        ),
                      ),
                    );
                    if (mounted && AuthService.isLoggedIn) {
                      setState(() {
                        final u = AuthService.currentUser;
                        if (u != null) {
                          _nameController.text = u.fullName;
                          _phoneController.text = u.phone;
                        }
                      });
                    }
                  },
                  child: const Text('ĐĂNG NHẬP'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLoginNoticeBanner() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline_rounded, color: AppTheme.accentGold, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Chưa đăng nhập tài khoản',
                  style: AppTheme.bodySmall(fontWeight: FontWeight.w700, color: AppTheme.accentGold),
                ),
                const SizedBox(height: 2),
                Text(
                  'Vui lòng đăng nhập để tiến hành đặt hàng.',
                  style: AppTheme.bodySmall(color: AppTheme.textSecondary, fontSize: 11.5),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          TextButton(
            onPressed: () async {
              await Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => LoginScreen(
                    onLoginSuccess: () {
                      if (mounted) {
                        setState(() {
                          final u = AuthService.currentUser;
                          if (u != null) {
                            _nameController.text = u.fullName;
                            _phoneController.text = u.phone;
                          }
                        });
                      }
                    },
                  ),
                ),
              );
              if (mounted && AuthService.isLoggedIn) {
                setState(() {
                  final u = AuthService.currentUser;
                  if (u != null) {
                    _nameController.text = u.fullName;
                    _phoneController.text = u.phone;
                  }
                });
              }
            },
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              backgroundColor: AppTheme.accentGold.withValues(alpha: 0.15),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: Text(
              'Đăng nhập',
              style: AppTheme.bodySmall(fontWeight: FontWeight.w700, color: AppTheme.accentGold),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _processCheckout() async {
    if (widget.cart.isEmpty) return;

    // 1. Yêu cầu bắt buộc đăng nhập tài khoản mới cho đặt hàng
    if (!AuthService.isLoggedIn || AuthService.currentUser == null) {
      _showRequireLoginDialog();
      return;
    }

    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    if (name.isEmpty || phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Vui lòng nhập họ tên và số điện thoại nhận hàng!', style: AppTheme.bodyMedium(color: AppTheme.textLight)),
          backgroundColor: AppTheme.statusDanger,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _isCheckingOut = true);

    // Không dùng timestamp random (DH057533...) mà để server/database sinh mã chuẩn DH01, DH02...
    final newOrder = SalonOrder(
      id: '',
      orderCode: '',
      userId: AuthService.currentUser?.id,
      branchId: MainScaffold.of(context)?.selectedBranch?.id ?? 'CN01',
      branchName: MainScaffold.of(context)?.selectedBranch?.name ?? 'Omni Salon Flagship',
      customerName: name,
      customerPhone: phone,
      shippingAddress: _addressController.text.trim().isEmpty ? 'Nhận tại quầy chi nhánh' : _addressController.text.trim(),
      items: List.from(widget.cart),
      totalAmount: _finalTotal,
      discountAmount: _discountAmount,
      voucherCode: _appliedVoucher,
      paymentMethod: _selectedPayment,
      paymentStatus: _selectedPayment.contains('VietQR') ? 'Đã thanh toán' : 'Chưa thanh toán (COD)',
      orderStatus: 'Đang xử lý',
      createdAt: DateFormat('yyyy-MM-dd HH:mm:ss').format(DateTime.now()),
    );

    final assignedOrderCode = await ApiService.createOrder(newOrder);

    setState(() {
      widget.cart.clear();
      _isCheckingOut = false;
    });

    if (widget.onUpdateCart != null) widget.onUpdateCart!();
    if (!mounted) return;

    _showSuccessDialog(assignedOrderCode ?? 'DH01');
  }

  void _showSuccessDialog(String orderCode) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppTheme.statusSuccess.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded, color: AppTheme.statusSuccess, size: 36),
            ),
            const SizedBox(height: 16),
            Text('Đặt Hàng Thành Công!', style: AppTheme.headingSmall(fontSize: 20)),
            const SizedBox(height: 8),
            Text('Mã đơn hàng mỹ phẩm:', style: AppTheme.bodySmall(color: AppTheme.textSecondary)),
            const SizedBox(height: 4),
            Text(orderCode, style: AppTheme.headingSmall(fontSize: 18, color: AppTheme.accentGold)),
            const SizedBox(height: 12),
            Text(
              'Đơn hàng của quý khách đang được đóng gói cẩn thận và chuyển phát sớm nhất.',
              style: AppTheme.bodySmall(color: AppTheme.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                Navigator.of(context).pop();
              },
              child: const Text('TIẾP TỤC MUA SẮM'),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text('Giỏ Hàng Mỹ Phẩm', style: AppTheme.headingSmall(fontSize: 18)),
      ),
      body: SafeArea(
        child: widget.cart.isEmpty
            ? Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.shopping_bag_outlined, size: 64, color: AppTheme.textMuted.withValues(alpha: 0.5)),
                    const SizedBox(height: 12),
                    Text('Giỏ hàng của bạn đang trống', style: AppTheme.headingSmall(fontSize: 18)),
                    const SizedBox(height: 6),
                    Text('Hãy chọn các sản phẩm sáp và dưỡng cao cấp tại Cửa hàng.', style: AppTheme.bodySmall(color: AppTheme.textSecondary)),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                        if (widget.onNavigateToShop != null) {
                          widget.onNavigateToShop!();
                        } else {
                          MainScaffold.of(context)?.switchTab(4);
                        }
                      },
                      child: const Text('KHÁM PHÁ CỬA HÀNG'),
                    ),
                  ],
                ),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!AuthService.isLoggedIn) _buildLoginNoticeBanner(),
                    Text('DANH SÁCH SẢN PHẨM (${widget.cart.length})', style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold)),
                    const SizedBox(height: 10),

                    // Danh sách item
                    ...widget.cart.map((item) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.surfaceCard,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppTheme.borderColor),
                        ),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: SizedBox(
                                width: 68,
                                height: 68,
                                child: EditorialImage(imageUrl: item.image, fit: BoxFit.cover),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.name, style: AppTheme.bodyMedium(fontWeight: FontWeight.w700), maxLines: 1),
                                  const SizedBox(height: 3),
                                  Text(currencyFormat.format(item.price), style: AppTheme.headingSmall(fontSize: 15, color: AppTheme.accentGold)),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      _buildQtyBtn(Icons.remove, () {
                                        setState(() {
                                          if (item.quantity > 1) {
                                            final idx = widget.cart.indexOf(item);
                                            widget.cart[idx] = OrderItem(
                                              productId: item.productId,
                                              name: item.name,
                                              price: item.price,
                                              quantity: item.quantity - 1,
                                              image: item.image,
                                            );
                                          } else {
                                            widget.cart.remove(item);
                                          }
                                        });
                                        if (widget.onUpdateCart != null) widget.onUpdateCart!();
                                      }),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 10),
                                        child: Text('${item.quantity}', style: AppTheme.bodyMedium(fontWeight: FontWeight.w700)),
                                      ),
                                      _buildQtyBtn(Icons.add, () {
                                        setState(() {
                                          final idx = widget.cart.indexOf(item);
                                          widget.cart[idx] = OrderItem(
                                            productId: item.productId,
                                            name: item.name,
                                            price: item.price,
                                            quantity: item.quantity + 1,
                                            image: item.image,
                                          );
                                        });
                                        if (widget.onUpdateCart != null) widget.onUpdateCart!();
                                      }),
                                      const Spacer(),
                                      IconButton(
                                        icon: const Icon(Icons.delete_outline_rounded, color: AppTheme.textMuted, size: 20),
                                        onPressed: () {
                                          setState(() => widget.cart.remove(item));
                                          if (widget.onUpdateCart != null) widget.onUpdateCart!();
                                        },
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                    const SizedBox(height: 16),

                    // Mã giảm giá Voucher
                    Text('MÃ ƯU ĐÃI HỘI VIÊN', style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _voucherController,
                            style: AppTheme.bodyMedium(),
                            textCapitalization: TextCapitalization.characters,
                            decoration: const InputDecoration(
                              hintText: 'Nhập mã OMNIWELCOME hoặc QUYONG20...',
                              prefixIcon: Icon(Icons.confirmation_number_outlined, size: 20),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: _applyVoucher,
                          style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14)),
                          child: const Text('ÁP DỤNG'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Thông tin giao hàng
                    Text('THÔNG TIN GIAO HÀNG', style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold)),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _nameController,
                      style: AppTheme.bodyMedium(),
                      decoration: const InputDecoration(
                        labelText: 'Họ tên người nhận *',
                        prefixIcon: Icon(Icons.person_outline_rounded, size: 20),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      style: AppTheme.bodyMedium(),
                      decoration: const InputDecoration(
                        labelText: 'Số điện thoại *',
                        prefixIcon: Icon(Icons.phone_outlined, size: 20),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _addressController,
                      style: AppTheme.bodyMedium(),
                      decoration: const InputDecoration(
                        labelText: 'Địa chỉ nhận hàng (hoặc để trống nhận tại quầy)',
                        prefixIcon: Icon(Icons.location_on_outlined, size: 20),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Hình thức thanh toán
                    Text('HÌNH THỨC THANH TOÁN', style: AppTheme.labelUppercase(fontSize: 10.5, color: AppTheme.accentGold)),
                    const SizedBox(height: 8),
                    _buildPaymentOption(
                      title: 'VietQR Chuyển Khoản Nhanh',
                      subtitle: 'Quét mã thanh toán tự động qua mọi app ngân hàng',
                      value: 'VietQR Chuyển Khoản',
                      icon: Icons.qr_code_scanner_rounded,
                    ),
                    const SizedBox(height: 8),
                    _buildPaymentOption(
                      title: 'Thanh Toán Khi Nhận Hàng (COD)',
                      subtitle: 'Thanh toán tiền mặt cho bưu tá khi nhận kiện hàng',
                      value: 'Thanh Toán Khi Nhận Hàng (COD)',
                      icon: Icons.payments_outlined,
                    ),
                    const SizedBox(height: 20),

                    // Bảng tổng kết thanh toán
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceCard,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.borderColor),
                      ),
                      child: Column(
                        children: [
                          _buildPriceRow('Tạm tính:', currencyFormat.format(_subtotal)),
                          if (_discountAmount > 0) ...[
                            const SizedBox(height: 6),
                            _buildPriceRow('Giảm giá ($_appliedVoucher):', '-${currencyFormat.format(_discountAmount)}', isDiscount: true),
                          ],
                          const SizedBox(height: 6),
                          _buildPriceRow('Phí vận chuyển:', 'Miễn phí'),
                          const Divider(color: AppTheme.borderColorSubtle),
                          _buildPriceRow('Tổng thanh toán:', currencyFormat.format(_finalTotal), isTotal: true),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Nút Đặt hàng
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _isCheckingOut ? null : _processCheckout,
                        child: _isCheckingOut
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.charcoal),
                              )
                            : Text(
                                'XÁC NHẬN ĐẶT HÀNG (${currencyFormat.format(_finalTotal)})',
                                style: AppTheme.bodyLarge(fontWeight: FontWeight.w800, color: AppTheme.charcoal),
                              ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildPaymentOption({
    required String title,
    required String subtitle,
    required String value,
    required IconData icon,
  }) {
    final isSelected = _selectedPayment == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedPayment = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.surfaceElevated : AppTheme.surfaceCard,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? AppTheme.accentGold : AppTheme.borderColor,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
              color: isSelected ? AppTheme.accentGold : AppTheme.textMuted,
              size: 20,
            ),
            const SizedBox(width: 12),
            Icon(icon, size: 22, color: isSelected ? AppTheme.accentGold : AppTheme.textSecondary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: AppTheme.bodyMedium(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: AppTheme.bodySmall(color: AppTheme.textSecondary)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQtyBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 26,
        height: 26,
        decoration: BoxDecoration(
          color: AppTheme.surfaceElevated,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: AppTheme.borderColor),
        ),
        child: Icon(icon, size: 14, color: AppTheme.textPrimary),
      ),
    );
  }

  Widget _buildPriceRow(String label, String value, {bool isTotal = false, bool isDiscount = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: isTotal ? AppTheme.bodyLarge(fontWeight: FontWeight.w700) : AppTheme.bodySmall(color: AppTheme.textSecondary),
        ),
        Text(
          value,
          style: isTotal
              ? AppTheme.headingSmall(fontSize: 18, color: AppTheme.accentGold)
              : AppTheme.bodyMedium(
                  fontWeight: FontWeight.w600,
                  color: isDiscount ? AppTheme.statusDanger : AppTheme.textPrimary,
                ),
        ),
      ],
    );
  }
}

typedef CartPage = CartScreen;
