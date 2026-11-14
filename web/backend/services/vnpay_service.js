const crypto = require('crypto');
const querystring = require('querystring');
const { processBankTransfer } = require('./payment_automation_service');
const { querySql } = require('../database/db');

/**
 * Dịch vụ tích hợp Cổng thanh toán VNPAY (Chuẩn VNPAY 2.1.0 theo tutorial TuanOri.vn)
 * Mã hóa dữ liệu HMAC-SHA512, đồng bộ trạng thái đơn hàng & lịch hẹn vào SQL Server
 */
class VNPayService {
  constructor() {
    // Thông tin cấu hình VNPAY Sandbox (TuanOri / VNPAY Standard Sandbox)
    this.tmnCode = process.env.VNPAY_TMN_CODE || '2QXUI4B4';
    this.hashSecret = process.env.VNPAY_HASH_SECRET || 'RAOCTGeometrySecret';
    this.vnpUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:3000/api/payment/vnpay-return';
  }

  /**
   * Hàm sortObject chuẩn VNPAY Node.js (khớp chuẩn hướng dẫn TuanOri.vn)
   * Mã hóa URI và thay thế khoảng trắng thành dấu '+'
   */
  sortObject(obj) {
    const sorted = {};
    const str = [];
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (let i = 0; i < str.length; i++) {
      const k = str[i];
      const origKey = decodeURIComponent(k);
      const val = obj[origKey];
      if (val !== undefined && val !== null && val !== '') {
        sorted[k] = encodeURIComponent(String(val)).replace(/%20/g, '+');
      }
    }
    return sorted;
  }

  /**
   * Định dạng ngày giờ YYYYMMDDHHmmss
   */
  formatDateTime(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}${m}${d}${h}${mi}${s}`;
  }

  /**
   * Bóc tách IP Client an toàn
   */
  getClientIp(req) {
    if (!req) return '127.0.0.1';
    const forwarded = req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip']);
    if (forwarded) {
      const ip = String(forwarded).split(',')[0].trim();
      return ip === '::1' ? '127.0.0.1' : ip;
    }
    const sockIp = req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
    return sockIp === '::1' ? '127.0.0.1' : sockIp;
  }

  /**
   * Tạo URL thanh toán VNPAY (TuanOri.vn flow)
   * @param {Object} params - { orderId, amount, orderInfo, bankCode, returnUrl, req }
   */
  createPaymentUrl({ orderId, amount, orderInfo, bankCode, returnUrl, req }) {
    if (!orderId || !amount) {
      throw new Error('Thiếu tham số bắt buộc: orderId hoặc amount.');
    }

    const cleanOrderId = String(orderId).trim();
    const numAmount = Math.round(Number(amount));
    if (numAmount <= 0) {
      throw new Error('Số tiền thanh toán phải lớn hơn 0.');
    }

    const createDate = this.formatDateTime(new Date());
    const ipAddr = this.getClientIp(req);
    const finalReturnUrl = returnUrl || this.returnUrl;
    const cleanInfo = (orderInfo || `Thanh toan don hang ${cleanOrderId}`).slice(0, 250);

    const vnpParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: cleanOrderId, // Mã tham chiếu đơn hàng
      vnp_OrderInfo: cleanInfo,
      vnp_OrderType: 'other',
      vnp_Amount: numAmount * 100, // VNPAY tính đơn vị xu (VNĐ x 100)
      vnp_ReturnUrl: finalReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate
    };

    if (bankCode && String(bankCode).trim().length > 0) {
      vnpParams.vnp_BankCode = String(bankCode).trim();
    }

    // 1. Sắp xếp tham số theo chuẩn alphabet
    const sorted = this.sortObject(vnpParams);

    // 2. Tạo chuỗi ký HMAC-SHA512 (khớp chuẩn qs.stringify(sorted, { encode: false }))
    const signData = Object.keys(sorted).map(k => `${k}=${sorted[k]}`).join('&');
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // 3. Ghép chữ ký vào tham số
    sorted['vnp_SecureHash'] = signed;

    // 4. Tạo URL thanh toán hoàn chỉnh
    const paymentUrl = `${this.vnpUrl}?${Object.keys(sorted).map(k => `${k}=${sorted[k]}`).join('&')}`;

    return {
      success: true,
      paymentUrl,
      orderId: cleanOrderId,
      amount: numAmount,
      txnRef: cleanOrderId
    };
  }

  /**
   * Xác thực kết quả trả về từ VNPAY (Return URL hoặc IPN)
   */
  verifyReturn(queryParams) {
    const vnpParams = {};
    for (const key in queryParams) {
      if (Object.prototype.hasOwnProperty.call(queryParams, key)) {
        vnpParams[key] = queryParams[key];
      }
    }

    const secureHash = vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    const sorted = this.sortObject(vnpParams);
    const signData = Object.keys(sorted).map(k => `${k}=${sorted[k]}`).join('&');
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const isValid = secureHash && secureHash.toLowerCase() === signed.toLowerCase();
    const responseCode = vnpParams['vnp_ResponseCode'];
    const isSuccess = isValid && responseCode === '00';

    const orderId = vnpParams['vnp_TxnRef'] || '';
    const amount = Number(vnpParams['vnp_Amount'] || 0) / 100;

    return {
      isValid,
      isSuccess,
      orderId,
      amount,
      responseCode,
      transactionNo: vnpParams['vnp_TransactionNo'] || '',
      bankCode: vnpParams['vnp_BankCode'] || '',
      cardType: vnpParams['vnp_CardType'] || '',
      payDate: vnpParams['vnp_PayDate'] || '',
      orderInfo: vnpParams['vnp_OrderInfo'] || '',
      message: this.getResponseMessage(responseCode)
    };
  }

  /**
   * Xử lý xác nhận đơn hàng khi VNPAY gọi IPN hoặc Return
   */
  async confirmOrderPayment(vnpResult) {
    if (!vnpResult || !vnpResult.isSuccess || !vnpResult.orderId) {
      return { success: false, message: 'Giao dịch không hợp lệ hoặc thanh toán chưa hoàn tất.' };
    }

    const orderId = vnpResult.orderId;
    const amount = vnpResult.amount;

    try {
      const transferRes = await processBankTransfer({
        gateway: 'VNPAY',
        accountNumber: vnpResult.bankCode || 'VNPAY',
        transferAmount: amount,
        content: `THANHTOAN ${orderId}`,
        referenceCode: vnpResult.transactionNo || `VNP_${orderId}`,
        transactionDate: new Date()
      });

      return {
        success: true,
        orderId,
        amount,
        details: transferRes
      };
    } catch (err) {
      console.error('[VNPAY Confirmation Error]:', err.message);
      return {
        success: false,
        message: 'Lỗi ghi nhận vào CSDL: ' + err.message
      };
    }
  }

  /**
   * Diễn giải các mã trạng thái phản hồi của VNPAY
   */
  getResponseMessage(code) {
    const messages = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới gian lận).',
      '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.',
      '11': 'Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch.',
      '12': 'Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Quý khách nhập sai mật khẩu xác thực OTP. Xin vui lòng thực hiện lại.',
      '24': 'Khách hàng hủy giao dịch.',
      '51': 'Tài khoản của quý khách không đủ số dư để thanh toán.',
      '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Khách hàng nhập sai mật khẩu thanh toán quá số lần quy định.',
      '99': 'Lỗi không xác định từ hệ thống ngân hàng.'
    };
    return messages[code] || 'Mã phản hồi không xác định';
  }
}

module.exports = new VNPayService();
