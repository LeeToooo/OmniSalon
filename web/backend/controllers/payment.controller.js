const { PayOS } = require('@payos/node');
const { querySql } = require('../database/db');
const {
  processBankTransfer,
  checkPaymentStatus: checkAutoPaymentStatus,
  recentPaymentsCache
} = require('../services/payment_automation_service');

const orderCodeToOrderIdMap = new Map();
const orderIdToOrderCodeMap = new Map();
const payosTransactionsMap = new Map();

function getPayOSClient() {
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  if (!clientId || !apiKey || !checksumKey || clientId === 'your_client_id') {
    return null;
  }

  try {
    return new PayOS({ clientId, apiKey, checksumKey });
  } catch (err) {
    console.error('PayOS client initialization failed:', err.message);
    return null;
  }
}

function generateIntegerOrderCode(orderId) {
  const rawNumbers = String(orderId || '').replace(/\D/g, '');
  const suffix = rawNumbers ? Number(rawNumbers) % 1000 : Math.floor(Math.random() * 900) + 100;
  const timestampSlice = Number(Date.now().toString().slice(-6));
  const orderCode = Number(`${timestampSlice}${String(suffix).padStart(3, '0')}`.slice(-8));
  return orderCode > 0 ? orderCode : Math.floor(Math.random() * 899999) + 100000;
}

function crc16(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= (data.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function buildVietQREMVCo({ bin = '970422', accountNo = '0900000000', amount = 0, purpose = '' }) {
  const f00 = '000201';
  const f01 = '010212';
  const sub00 = '0010A000000727';
  const sub01_inner = '0006' + bin + '01' + accountNo.length.toString().padStart(2, '0') + accountNo;
  const sub01 = '01' + sub01_inner.length.toString().padStart(2, '0') + sub01_inner;
  const sub02 = '0208QRIBFTTA';
  const f38_inner = sub00 + sub01 + sub02;
  const f38 = '38' + f38_inner.length.toString().padStart(2, '0') + f38_inner;
  const f53 = '5303704';
  const amtStr = String(Math.round(amount));
  const f54 = '54' + amtStr.length.toString().padStart(2, '0') + amtStr;
  const f58 = '5802VN';
  const cleanPurp = String(purpose || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '').trim().toUpperCase();
  const sub62_08 = '08' + cleanPurp.length.toString().padStart(2, '0') + cleanPurp;
  const f62 = '62' + sub62_08.length.toString().padStart(2, '0') + sub62_08;
  const raw = f00 + f01 + f38 + f53 + f54 + f58 + f62 + '6304';
  const crc = crc16(raw);
  return raw + crc;
}

const PaymentController = {
  async createPaymentLink(req, res, ctx) {
    try {
      const { parsedBody } = ctx;
      const { orderId, amount, description } = parsedBody || {};

      if (!orderId || !amount) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: false,
          message: 'Thiếu thông tin bắt buộc: orderId và amount.'
        }));
        return true;
      }

      const numAmount = Math.round(Number(amount));
      if (numAmount <= 0) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: false,
          message: 'Số tiền thanh toán phải lớn hơn 0.'
        }));
        return true;
      }

      const orderCode = generateIntegerOrderCode(orderId);
      const cleanDescription = (description || `THANHTOAN ${orderId}`).slice(0, 25);
      const returnUrl = process.env.PAYOS_RETURN_URL || 'http://localhost:3000/payment-success';
      const cancelUrl = process.env.PAYOS_CANCEL_URL || 'http://localhost:3000/payment-cancel';

      orderCodeToOrderIdMap.set(orderCode, orderId);
      orderIdToOrderCodeMap.set(String(orderId).toUpperCase(), orderCode);

      const payos = getPayOSClient();
      let payosResponse = null;

      if (payos) {
        try {
          const payload = {
            orderCode,
            amount: numAmount,
            description: cleanDescription,
            cancelUrl,
            returnUrl
          };

          if (payos.paymentRequests && typeof payos.paymentRequests.create === 'function') {
            payosResponse = await payos.paymentRequests.create(payload);
          } else if (typeof payos.createPaymentLink === 'function') {
            payosResponse = await payos.createPaymentLink(payload);
          }
        } catch (apiErr) {
          console.error('PayOS API call failed, generating fallback response:', apiErr.message);
        }
      }

      const finalCheckoutUrl = payosResponse?.checkoutUrl || `https://pay.payos.vn/web/${orderCode}`;
      const accountNumber = payosResponse?.accountNumber || '0900000000';
      const accountName = payosResponse?.accountName || 'OMNISALON ENTERPRISE';

      const emvcoString = (payosResponse?.qrCode && String(payosResponse.qrCode).startsWith('000201'))
        ? payosResponse.qrCode
        : buildVietQREMVCo({
            bin: '970422',
            accountNo: accountNumber,
            amount: numAmount,
            purpose: cleanDescription
          });

      const finalQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data=${encodeURIComponent(emvcoString)}`;
      const finalPaymentLinkId = payosResponse?.paymentLinkId || `LINK_${orderCode}`;

      payosTransactionsMap.set(orderCode, {
        orderId,
        orderCode,
        amount: numAmount,
        paymentLinkId: finalPaymentLinkId,
        status: 'PENDING',
        createdAt: new Date()
      });

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        checkoutUrl: finalCheckoutUrl,
        qrCode: finalQrCode,
        qrData: emvcoString,
        orderCode,
        amount: numAmount,
        accountNumber,
        accountName,
        paymentLinkId: finalPaymentLinkId,
        description: cleanDescription
      }));
      return true;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: false,
        message: 'Lỗi khởi tạo link thanh toán PayOS: ' + err.message
      }));
      return true;
    }
  },

  async handlePayosWebhook(req, res, ctx) {
    try {
      const { parsedBody } = ctx;
      if (!parsedBody) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Missing webhook body' }));
        return true;
      }

      const payos = getPayOSClient();
      let webhookData = null;

      if (payos) {
        try {
          if (payos.webhooks && typeof payos.webhooks.verify === 'function') {
            webhookData = await payos.webhooks.verify(parsedBody);
          } else if (typeof payos.verifyPaymentWebhookData === 'function') {
            webhookData = payos.verifyPaymentWebhookData(parsedBody);
          }
        } catch (verifyErr) {
          console.error('PayOS signature verification failed:', verifyErr.message);
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'Invalid webhook signature' }));
          return true;
        }
      } else {
        webhookData = parsedBody.data || parsedBody;
      }

      const orderCode = Number(webhookData.orderCode);
      const matchedOrderId = orderCodeToOrderIdMap.get(orderCode) || webhookData.description || '';
      const amount = Number(webhookData.amount) || 0;
      const refCode = webhookData.reference || `PAYOS_${orderCode}`;
      const transferDate = webhookData.transactionDateTime
        ? new Date(webhookData.transactionDateTime)
        : new Date();

      if (orderCode) {
        const tx = payosTransactionsMap.get(orderCode);
        if (tx) {
          tx.status = 'PAID';
          tx.paidAt = transferDate;
          tx.referenceCode = refCode;
        }
      }

      let syncCode = matchedOrderId;
      if (!syncCode && webhookData.description) {
        const descMatch = String(webhookData.description).match(/\b(LH\d+|DH\d+|HD\d+)\b/i);
        if (descMatch) syncCode = descMatch[1].toUpperCase();
      }

      if (syncCode) {
        await processBankTransfer({
          gateway: 'PayOS',
          accountNumber: webhookData.accountNumber || '0900000000',
          transferAmount: amount,
          content: `THANHTOAN ${syncCode}`,
          referenceCode: refCode,
          transactionDate: transferDate
        });

        recentPaymentsCache.set(String(syncCode).toUpperCase(), {
          isPaid: true,
          status: 'PAID',
          code: String(syncCode).toUpperCase(),
          amount,
          gateway: 'PayOS',
          referenceCode: refCode,
          paidAt: transferDate.toISOString()
        });
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, message: 'Webhook processed successfully' }));
      return true;
    } catch (err) {
      console.error('Error handling PayOS webhook:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: err.message }));
      return true;
    }
  },

  async checkPaymentStatus(req, res, ctx, explicitOrderId) {
    try {
      const { parsedUrl } = ctx;
      const orderId = explicitOrderId ||
        parsedUrl.searchParams.get('orderId') ||
        parsedUrl.searchParams.get('code') ||
        '';

      if (!orderId) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: false,
          message: 'Thiếu mã đơn hàng hoặc lịch hẹn để kiểm tra trạng thái.'
        }));
        return true;
      }

      const upper = String(orderId).trim().toUpperCase();
      const mappedCode = orderIdToOrderCodeMap.get(upper);

      if (mappedCode && payosTransactionsMap.has(mappedCode)) {
        const tx = payosTransactionsMap.get(mappedCode);
        if (tx.status === 'PAID') {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            orderId: upper,
            orderCode: mappedCode,
            status: 'PAID',
            isPaid: true,
            amount: tx.amount,
            paidAt: tx.paidAt
          }));
          return true;
        }
      }

      let statusInfo = { isPaid: false, status: 'PENDING' };
      try {
        statusInfo = await checkAutoPaymentStatus(upper);
      } catch (dbErr) {
        // Fallback gracefully when database connection is not ready
        statusInfo = { isPaid: false, status: 'PENDING' };
      }

      if (statusInfo.isPaid || statusInfo.status === 'Paid') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          orderId: upper,
          status: 'PAID',
          isPaid: true,
          amount: statusInfo.amount,
          transactionCode: statusInfo.transactionCode,
          paidAt: statusInfo.paidAt
        }));
        return true;
      }

      if (statusInfo.status === 'Cancelled' || statusInfo.status === 'Đã hủy') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          orderId: upper,
          status: 'CANCELLED',
          isPaid: false
        }));
        return true;
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        orderId: upper,
        status: 'PENDING',
        isPaid: false
      }));
      return true;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: false,
        message: 'Lỗi kiểm tra trạng thái thanh toán: ' + err.message
      }));
      return true;
    }
  }
};

module.exports = PaymentController;
