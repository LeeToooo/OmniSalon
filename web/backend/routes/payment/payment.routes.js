const PaymentController = require('../../controllers/payment.controller');
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

  return false;
}

module.exports = handlePaymentRoutes;
