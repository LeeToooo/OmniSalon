const fs = require('fs');
const path = require('path');
const { querySql } = require('../database/db');

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (_) {
  nodemailer = null;
}

const EMAIL_CONFIG_FILE = fs.existsSync(path.join(__dirname, '..', 'config', 'email_config.json'))
  ? path.join(__dirname, '..', 'config', 'email_config.json')
  : (fs.existsSync(path.join(__dirname, '..', 'email_config.json'))
    ? path.join(__dirname, '..', 'email_config.json')
    : path.join(__dirname, '..', '..', '..', 'email_config.json'));

const otpMemoryCache = new Map();

function getEmailConfig() {
  let config = {
    user: process.env.GMAIL_USER || '',
    pass: process.env.GMAIL_APP_PASSWORD || '',
    fromName: 'OmniSalon Barber Suite'
  };
  if (fs.existsSync(EMAIL_CONFIG_FILE)) {
    try {
      const fileData = JSON.parse(fs.readFileSync(EMAIL_CONFIG_FILE, 'utf8'));
      if (fileData.user) config.user = fileData.user.trim();
      if (fileData.pass) config.pass = fileData.pass.trim();
      if (fileData.fromName) config.fromName = fileData.fromName.trim();
    } catch (e) {
      console.warn('[EMAIL] Không thể đọc email_config.json:', e.message);
    }
  }
  return config;
}

async function sendGmail(toEmail, otp) {
  const cfg = getEmailConfig();
  if (!nodemailer || !cfg.user || !cfg.pass) {
    return {
      sentReal: false,
      reason: !nodemailer ? 'Chưa cài đặt nodemailer' : 'Chưa cấu hình Gmail trong email_config.json'
    };
  }

  const cleanPass = cfg.pass.replace(/\s+/g, '');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: cfg.user, pass: cleanPass }
  });

  const mailHtml = `
    <div style="max-width: 560px; margin: 0 auto; background: #0f141f; color: #ffffff; padding: 36px 28px; border-radius: 18px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border: 1px solid rgba(255, 255, 255, 0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background: rgba(180, 131, 18, 0.2); color: #f59e0b; border: 1px solid rgba(180, 131, 18, 0.4); padding: 4px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 1px;">
          OMNI SALON BARBER SUITE
        </span>
        <h2 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 14px 0 6px;">MÃ XÁC THỰC BẢO MẬT</h2>
        <p style="color: #94a3b8; font-size: 14px; margin: 0;">Mã xác thực đăng nhập / đổi mật khẩu hệ thống</p>
      </div>
      <div style="background: #171d2b; border: 1px dashed #f59e0b; border-radius: 14px; padding: 24px; text-align: center; margin: 26px 0;">
        <div style="font-size: 12px; color: #cbd5e1; font-weight: 600; margin-bottom: 8px; letter-spacing: 1.5px; text-transform: uppercase;">
          MÃ XÁC THỰC OTP (HIỆU LỰC 5 PHÚT)
        </div>
        <div style="font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #f59e0b; font-family: 'Courier New', Courier, monospace; margin: 6px 0;">
          ${otp}
        </div>
        <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
          Tuyệt đối không chia sẻ mã này với bất kỳ ai để bảo vệ tài khoản
        </div>
      </div>
      <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 18px; text-align: center; font-size: 12px; color: #64748b;">
        © 2026 Omni Salon Barber • Hệ thống CSDL SQL Server QL_SALON
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"${cfg.fromName}" <${cfg.user}>`,
    to: toEmail,
    subject: `[OmniSalon] ${otp} là mã xác thực tài khoản của bạn`,
    text: `Mã xác thực OTP của bạn là: ${otp}. Mã có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.`,
    html: mailHtml,
    headers: {
      'X-Priority': '1 (Highest)',
      'X-MSMail-Priority': 'High',
      'Importance': 'High',
      'Auto-Submitted': 'auto-generated'
    }
  });

  return { sentReal: true };
}

async function ensureOtpTable(customSql = null) {
  const sql = customSql || querySql;
  try {
    await sql(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'XacThucOTP')
      BEGIN
        CREATE TABLE XacThucOTP (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Identifier NVARCHAR(255) NOT NULL,
          MaOTP VARCHAR(10) NOT NULL,
          HetHanLuc DATETIME2 NOT NULL,
          TrangThai NVARCHAR(50) DEFAULT N'Chờ xác thực',
          SoLanNhapSai INT DEFAULT 0,
          NgayTao DATETIME2 DEFAULT GETDATE()
        );
        CREATE INDEX IX_XacThucOTP_Target ON XacThucOTP (Identifier, MaOTP, HetHanLuc);
      END
      ELSE
      BEGIN
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('XacThucOTP') AND name = 'SoLanNhapSai')
        BEGIN
          ALTER TABLE XacThucOTP ADD SoLanNhapSai INT DEFAULT 0;
        END
      END
    `);
  } catch (err) {
    // Database fallback to memory cache
  }
}

async function generateAndSendOtp(target, customSql = null) {
  const cleanTarget = (target || '').trim().toLowerCase();
  if (!cleanTarget) {
    throw new Error('Vui lòng nhập Email hoặc Số điện thoại.');
  }

  const now = Date.now();
  const existing = otpMemoryCache.get(cleanTarget);

  if (existing && (now - existing.lastSentAt) < 30000) {
    const waitSec = Math.ceil((30000 - (now - existing.lastSentAt)) / 1000);
    const err = new Error(`Vui lòng đợi ${waitSec} giây trước khi gửi lại mã.`);
    err.statusCode = 429;
    throw err;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = now + 5 * 60 * 1000;

  otpMemoryCache.set(cleanTarget, { otp, expiresAt, lastSentAt: now, attempts: 0 });

  const sql = customSql || querySql;
  if (sql) {
    try {
      await ensureOtpTable(sql);
      // Hủy mọi mã OTP cũ còn đang chờ để đảm bảo chỉ có 1 mã mới nhất hợp lệ
      await sql(
        `UPDATE XacThucOTP SET TrangThai = N'Đã bị thay thế bởi mã mới'
         WHERE Identifier = ? AND TrangThai = N'Chờ xác thực'`,
        [cleanTarget]
      ).catch(() => {});

      await sql(
        `INSERT INTO XacThucOTP (Identifier, MaOTP, HetHanLuc, TrangThai, SoLanNhapSai)
         VALUES (?, ?, DATEADD(minute, 5, GETDATE()), N'Chờ xác thực', 0)`,
        [cleanTarget, otp]
      );
    } catch (dbErr) {
      console.warn('[OTP Persist Warning]', dbErr.message);
    }
  }

  let emailResult = null;
  if (cleanTarget.includes('@')) {
    try {
      emailResult = await sendGmail(cleanTarget, otp);
    } catch (mailErr) {
      console.error('[GMAIL SEND ERROR]', mailErr.message);
      emailResult = { sentReal: false, error: mailErr.message };
    }
  }

  console.log(`[OTP DISPATCH] Mã OTP cho ${cleanTarget}: ${otp}`);

  return {
    success: true,
    message: emailResult?.sentReal
      ? `Mã xác nhận đã gửi về ${cleanTarget}. Vui lòng kiểm tra Hộp thư đến hoặc Thư rác (Spam).`
      : `Mã OTP xác thực: ${otp}`,
    identifier: cleanTarget,
    otp,
    expiresAt: new Date(expiresAt).toISOString(),
    sentEmail: Boolean(emailResult?.sentReal)
  };
}

async function generateAndSaveOtp(target, purpose = 'LOGIN', customSql = null) {
  return await generateAndSendOtp(target, customSql);
}

async function verifyOtp(target, rawOtp, customSql = null) {
  const cleanTarget = (target || '').trim().toLowerCase();
  const otp = String(rawOtp || '').trim();

  if (!cleanTarget || !otp) {
    return { valid: false, message: 'Thiếu thông tin hoặc mã OTP.' };
  }

  const sql = customSql || querySql;
  if (sql) {
    try {
      await ensureOtpTable(sql);
      const rows = await sql(
        `SELECT TOP 1 Id, MaOTP, HetHanLuc, TrangThai, ISNULL(SoLanNhapSai, 0) AS SoLanNhapSai 
         FROM XacThucOTP 
         WHERE Identifier = ? AND TrangThai = N'Chờ xác thực' AND HetHanLuc > GETDATE()
         ORDER BY Id DESC`,
        [cleanTarget]
      );

      if (rows && rows.length > 0) {
        const record = rows[0];
        if (record.SoLanNhapSai >= 5) {
          await sql(`UPDATE XacThucOTP SET TrangThai = N'Bị khóa (quá số lần thử)' WHERE Id = ?`, [record.Id]);
          otpMemoryCache.delete(cleanTarget);
          return { valid: false, message: 'Mã OTP đã bị khóa do nhập sai quá 5 lần. Vui lòng yêu cầu mã mới.' };
        }

        if (record.MaOTP === otp) {
          await sql(`UPDATE XacThucOTP SET TrangThai = N'Đã sử dụng' WHERE Id = ?`, [record.Id]);
          otpMemoryCache.delete(cleanTarget);
          return { valid: true };
        } else {
          const nextAttempts = record.SoLanNhapSai + 1;
          if (nextAttempts >= 5) {
            await sql(`UPDATE XacThucOTP SET SoLanNhapSai = ?, TrangThai = N'Bị khóa (quá số lần thử)' WHERE Id = ?`, [nextAttempts, record.Id]);
            otpMemoryCache.delete(cleanTarget);
            return { valid: false, message: 'Mã OTP đã bị khóa do nhập sai quá 5 lần. Vui lòng yêu cầu mã mới.' };
          } else {
            await sql(`UPDATE XacThucOTP SET SoLanNhapSai = ? WHERE Id = ?`, [nextAttempts, record.Id]);
            const remaining = 5 - nextAttempts;
            return { valid: false, message: `Mã OTP không chính xác. Bạn còn ${remaining} lần thử.` };
          }
        }
      }
    } catch (dbErr) {
      console.warn('[OTP DB Verify Warning]', dbErr.message);
    }
  }

  const entry = otpMemoryCache.get(cleanTarget);
  if (!entry) {
    return { valid: false, message: 'Mã OTP không tồn tại hoặc đã hết hạn.' };
  }

  if (Date.now() > entry.expiresAt) {
    otpMemoryCache.delete(cleanTarget);
    return { valid: false, message: 'Mã OTP đã hết hạn (chỉ có hiệu lực trong 5 phút).' };
  }

  entry.attempts = (entry.attempts || 0) + 1;
  if (entry.attempts >= 5) {
    otpMemoryCache.delete(cleanTarget);
    return { valid: false, message: 'Mã OTP đã bị khóa do nhập sai quá 5 lần. Vui lòng yêu cầu mã mới.' };
  }

  if (entry.otp !== otp) {
    const remaining = 5 - entry.attempts;
    return { valid: false, message: `Mã OTP không chính xác. Bạn còn ${remaining} lần thử.` };
  }

  otpMemoryCache.delete(cleanTarget);
  return { valid: true };
}

async function verifyAndConsumeOtp(target, rawOtp, purpose = 'LOGIN', customSql = null) {
  const res = await verifyOtp(target, rawOtp, customSql);
  return res.valid === true;
}

module.exports = {
  generateAndSendOtp,
  generateAndSaveOtp,
  verifyOtp,
  verifyAndConsumeOtp,
  ensureOtpTable,
  sendGmail
};
