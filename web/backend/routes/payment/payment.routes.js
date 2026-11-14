const PaymentController = require('../../controllers/payment.controller');
const vnpayService = require('../../services/vnpay_service');
const {
  processBankTransfer,
  checkPaymentStatus,
  getRecentPayments
} = require('../../services/payment_automation_service');

async function handlePaymentRoutes(req, res, ctx) {
  const { pathname, method, parsedUrl, parsedBody } = ctx;

  if ((pathname === '/api/payment/create-payment-link' || pathname === '/api/payments/create-payment-link') && method === 'POST') {
    return await PaymentController.createPaymentLink(req, res, ctx);
  }

  if ((pathname === '/api/payment/payos-webhook' || pathname === '/api/payments/payos-webhook') && method === 'POST') {
    return await PaymentController.handlePayosWebhook(req, res, ctx);
  }

  const checkStatusMatch = pathname.match(/^\/api\/payments?\/check-status(?:\/([^/?#]+))?/);
  if (checkStatusMatch && method === 'GET') {
    const orderIdParam = checkStatusMatch[1] ? decodeURIComponent(checkStatusMatch[1]) : null;
    return await PaymentController.checkPaymentStatus(req, res, ctx, orderIdParam);
  }

  if (pathname === '/api/payments/status' && method === 'GET') {
    const code = (parsedUrl.searchParams.get('code') || '').trim();
    if (!code) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Thiếu tham số code (mã lịch hẹn hoặc đơn hàng).' }));
      return true;
    }
    return await PaymentController.checkPaymentStatus(req, res, ctx, code);
  }

  if (pathname === '/api/payments/webhook' && method === 'POST') {
    try {
      const payload = parsedBody || {};

      if (payload.gateway && (payload.transferAmount !== undefined || payload.content)) {
        const result = await processBankTransfer({
          gateway: payload.gateway || 'BankTransfer',
          accountNumber: payload.accountNumber || '',
          transferAmount: payload.transferAmount || 0,
          content: payload.content || '',
          referenceCode: payload.referenceCode || payload.id || '',
          transactionDate: payload.transactionDate ? new Date(payload.transactionDate) : new Date()
        });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
        return true;
      }

      if (Array.isArray(payload.data)) {
        const results = [];
        for (const tx of payload.data) {
          const r = await processBankTransfer({
            gateway: tx.bank_sub_acc_id || 'CassoBank',
            accountNumber: tx.bank_sub_acc_id || '',
            transferAmount: tx.amount || 0,
            content: tx.description || '',
            referenceCode: tx.tid || String(tx.id || ''),
            transactionDate: tx.when ? new Date(tx.when) : new Date()
          });
          results.push(r);
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, count: results.length, details: results }));
        return true;
      }

      const content = payload.content || payload.description || payload.memo || payload.message || '';
      const amount = payload.amount || payload.transferAmount || payload.total || 0;
      const ref = payload.referenceCode || payload.reference || payload.id || '';

      const result = await processBankTransfer({
        gateway: payload.gateway || payload.bank || 'VietQR',
        accountNumber: payload.accountNumber || '',
        transferAmount: amount,
        content,
        referenceCode: ref,
        transactionDate: new Date()
      });

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Lỗi xử lý webhook: ' + err.message }));
    }
    return true;
  }

  if (pathname === '/api/payments/recent' && method === 'GET') {
    try {
      const list = getRecentPayments ? getRecentPayments() : [];
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: list.length, data: list }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Lỗi lấy danh sách giao dịch: ' + err.message }));
    }
    return true;
  }

  // --- TÍCH HỢP CỔNG THANH TOÁN VNPAY (Theo chuẩn tutorial TuanOri.vn & VNPAY 2.1.0) ---
  if ((pathname === '/api/payment/vnpay-create-url' || pathname === '/api/payments/vnpay-create-url') && method === 'POST') {
    try {
      const { orderId, amount, orderInfo, bankCode, returnUrl } = parsedBody || {};
      if (!orderId || !amount) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Thiếu thông tin bắt buộc: orderId và amount.' }));
        return true;
      }
      const result = vnpayService.createPaymentUrl({
        orderId,
        amount,
        orderInfo,
        bankCode,
        returnUrl,
        req
      });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
      return true;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Lỗi tạo liên kết thanh toán VNPAY: ' + err.message }));
      return true;
    }
  }

  if ((pathname === '/api/payment/vnpay-return' || pathname === '/api/payments/vnpay-return') && method === 'GET') {
    try {
      const queryParams = {};
      for (const [key, value] of parsedUrl.searchParams.entries()) {
        queryParams[key] = value;
      }

      const verifyResult = vnpayService.verifyReturn(queryParams);

      if (verifyResult.isSuccess) {
        await vnpayService.confirmOrderPayment(verifyResult);
      }

      const isSuccess = verifyResult.isSuccess;
      const amountFmt = Number(verifyResult.amount || 0).toLocaleString('vi-VN') + ' VNĐ';
      const orderId = verifyResult.orderId || '';
      const bankCode = verifyResult.bankCode || 'VNPAY';
      const txnNo = verifyResult.transactionNo || '';
      const message = verifyResult.message || (isSuccess ? 'Giao dịch thành công' : 'Giao dịch thất bại');

      const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OmniSalon - Kết Quả Thanh Toán VNPAY</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .receipt-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      max-width: 480px;
      width: 100%;
      padding: 32px 24px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .icon-badge {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin: 0 auto 16px;
      background: ${isSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
      color: ${isSuccess ? '#10b981' : '#ef4444'};
      border: 2px solid ${isSuccess ? '#10b981' : '#ef4444'};
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .detail-table {
      width: 100%;
      background: #0f172a;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 24px;
      text-align: left;
      font-size: 13.5px;
      border: 1px solid #334155;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #1e293b;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .label {
      color: #94a3b8;
    }
    .value {
      font-weight: 600;
      color: #f8fafc;
    }
    .amount-val {
      color: #38bdf8;
      font-size: 16px;
      font-weight: 700;
    }
    .action-btn {
      display: inline-block;
      width: 100%;
      padding: 12px;
      background: #0284c7;
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      transition: background 0.2s;
    }
    .action-btn:hover {
      background: #0369a1;
    }
    .redirect-note {
      font-size: 12px;
      color: #64748b;
      margin-top: 14px;
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="icon-badge">${isSuccess ? '✓' : '✕'}</div>
    <h1 class="title">${isSuccess ? 'Thanh Toán VNPAY Thành Công' : 'Thanh Toán Không Thành Công'}</h1>
    <p class="subtitle">${message}</p>

    <div class="detail-table">
      <div class="detail-row">
        <span class="label">Mã giao dịch / Đơn hàng:</span>
        <span class="value">${orderId}</span>
      </div>
      <div class="detail-row">
        <span class="label">Số tiền:</span>
        <span class="value amount-val">${amountFmt}</span>
      </div>
      <div class="detail-row">
        <span class="label">Mã giao dịch VNPAY:</span>
        <span class="value">${txnNo || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="label">Ngân hàng thanh toán:</span>
        <span class="value">${bankCode}</span>
      </div>
      <div class="detail-row">
        <span class="label">Cổng xử lý:</span>
        <span class="value">VNPAY SandBox (v2.1.0)</span>
      </div>
    </div>

    <a href="/?vnpay_status=${isSuccess ? 'success' : 'failed'}&orderId=${encodeURIComponent(orderId)}" class="action-btn">
      Quay Về Cửa Hàng OmniSalon
    </a>
    <p class="redirect-note">Tự động chuyển về trang chủ sau <span id="countdown">4</span> giây...</p>
  </div>
  <script>
    let timeLeft = 4;
    const counter = document.getElementById('countdown');
    const timer = setInterval(() => {
      timeLeft--;
      if (counter) counter.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timer);
        window.location.href = '/?vnpay_status=${isSuccess ? 'success' : 'failed'}&orderId=${encodeURIComponent(orderId)}';
      }
    }, 1000);
  </script>
</body>
</html>`;

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return true;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Lỗi xác nhận kết quả VNPAY: ' + err.message }));
      return true;
    }
  }

  if ((pathname === '/api/payment/vnpay-ipn' || pathname === '/api/payments/vnpay-ipn') && method === 'GET') {
    try {
      const queryParams = {};
      for (const [key, value] of parsedUrl.searchParams.entries()) {
        queryParams[key] = value;
      }

      const verifyResult = vnpayService.verifyReturn(queryParams);
      if (!verifyResult.isValid) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ RspCode: '97', Message: 'Fail checksum' }));
        return true;
      }

      if (verifyResult.isSuccess) {
        await vnpayService.confirmOrderPayment(verifyResult);
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ RspCode: '00', Message: 'Confirm Success' }));
      return true;
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ RspCode: '99', Message: 'Unknown error: ' + err.message }));
      return true;
    }
  }

  return false;
}

module.exports = handlePaymentRoutes;
