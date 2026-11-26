import 'package:flutter_test/flutter_test.dart';

import 'package:omni_salon_mobile/core/api/api_service.dart';
import 'package:omni_salon_mobile/main.dart';
import 'package:omni_salon_mobile/models/booking.dart';
import 'package:omni_salon_mobile/models/order.dart';
import 'package:omni_salon_mobile/models/product.dart';
import 'package:omni_salon_mobile/models/service.dart';
import 'package:omni_salon_mobile/models/stylist.dart';

void main() {
  group('SalonService.fromJson', () {
    test('parses Vietnamese duration string and detects combo service', () {
      final service = SalonService.fromJson({
        'id': 'CB01',
        'name': 'Combo Hoàng Gia',
        'price': 350000,
        'duration': '90 phút',
        'category': 'Combo',
      });

      expect(service.id, 'CB01');
      expect(service.name, 'Combo Hoàng Gia');
      expect(service.price, 350000);
      expect(service.duration, 90);
      expect(service.durationMinutes, 90);
      expect(service.isCombo, isTrue);
    });

    test('parses numeric durationMinutes for standard service', () {
      final service = SalonService.fromJson({
        'id': 'DV01',
        'name': 'Cắt Tóc Nam',
        'price': 100000,
        'durationMinutes': 45,
        'category': 'Cắt tóc',
      });

      expect(service.duration, 45);
      expect(service.durationMinutes, 45);
      expect(service.isCombo, isFalse);
    });
  });

  group('Product.fromJson', () {
    test('parses pricing fields and builds fallback image URL', () {
      final product = Product.fromJson({
        'id': 'SP01',
        'name': 'Sáp Vuốt Tóc Matte Clay',
        'brand': 'Omni Men',
        'originalPrice': 300000,
        'actualPrice': 240000,
        'discountPercent': 20,
      });

      expect(product.id, 'SP01');
      expect(product.originalPrice, 300000);
      expect(product.actualPrice, 240000);
      expect(product.discountPercent, 20);
      expect(product.image, startsWith('http'));
    });
  });

  group('Stylist.fromJson', () {
    test('prefers reviewsCount field when provided', () {
      final stylist = Stylist.fromJson({
        'id': 'NV01',
        'name': 'Minh Tuấn',
        'level': 'Master Barber',
        'role': 'Stylist',
        'branchId': 'CN01',
        'branchName': 'Quận 1',
        'rating': 4.9,
        'reviewsCount': 42,
      });

      expect(stylist.id, 'NV01');
      expect(stylist.rating, 4.9);
      expect(stylist.reviewCount, 42);
    });
  });

  group('Booking.fromJson & displayStatus', () {
    test('maps backend statuses to Vietnamese display labels', () {
      Booking makeWithStatus(String status) => Booking.fromJson({
            'id': 'LH01',
            'customerName': 'Nguyễn Văn A',
            'customerPhone': '0901234567',
            'branchId': 'CN01',
            'branchName': 'Quận 1',
            'serviceId': 'DV01',
            'serviceName': 'Cắt Tóc',
            'stylistId': 'NV01',
            'stylistName': 'Minh Tuấn',
            'date': '2026-11-25',
            'timeSlot': '10:00',
            'totalPrice': 100000,
            'status': status,
            'createdAt': '2026-11-25T08:00:00Z',
          });

      expect(makeWithStatus('waiting').displayStatus, 'Chờ Vào Ghế');
      expect(makeWithStatus('Chờ vào ghế').displayStatus, 'Chờ Vào Ghế');
      expect(makeWithStatus('in_progress').displayStatus, 'Đang Thực Hiện');
      expect(makeWithStatus('Hoàn thành').displayStatus, 'Hoàn Thành');
      expect(makeWithStatus('Đã hủy').displayStatus, 'Đã Hủy');
    });
  });

  group('SalonOrder & OrderItem', () {
    test('calculates shipping fee and normalizes orderStatus', () {
      final order = SalonOrder.fromJson({
        'id': 'DH01',
        'customerName': 'Trần Thị B',
        'customerPhone': '0909998887',
        'shippingAddress': '123 Lê Lợi, Q.1',
        'items': [
          {
            'productId': 'SP01',
            'name': 'Dầu gội',
            'price': 200000,
            'quantity': 2,
          },
        ],
        'totalAmount': 430000,
        'orderStatus': 'pending',
        'createdAt': '2026-11-25',
      });

      expect(order.items.length, 1);
      expect(order.items.first.price * order.items.first.quantity, 400000);
      expect(order.actualShippingFee, 30000);
      expect(order.orderStatus, 'Chờ xác nhận');
    });
  });

  test('ApiService.getVietQrImageUrl strips diacritics and encodes EMVCo payload', () {
    final url = ApiService.getVietQrImageUrl(
      bankBin: '970422',
      accountNo: '0925898974',
      amount: 150000,
      description: 'Thanh toán đơn hàng DH01!',
    );

    final uri = Uri.parse(url);
    final emvco = uri.queryParameters['data'] ?? '';
    expect(uri.host, 'api.qrserver.com');
    expect(emvco, startsWith('00020101021238'));
    expect(emvco, contains('THANH TOAN DON HANG DH01'));
    expect(emvco, isNot(contains('á')));
    expect(emvco, matches(RegExp(r'6304[0-9A-F]{4}$')));
  });

  testWidgets('OmniSalonApp renders initial application shell', (WidgetTester tester) async {
    await tester.pumpWidget(const OmniSalonApp());
    expect(find.byType(OmniSalonApp), findsOneWidget);
  });
}
