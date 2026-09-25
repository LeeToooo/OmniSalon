// =========================================================================
// OmniSalon / 4RAU Barbershop — CORE UTILITIES MODULE
// (Định dạng tiền tệ, ngày tháng, tính toán thời gian, Platform Manager)
// =========================================================================

const SalonUtils = {
  formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0 đ';
    return Number(amount).toLocaleString('vi-VN') + ' đ';
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    } catch (e) {}
    return dateStr;
  },

  generateId(prefix = 'id') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  },

  getInitials(fullName) {
    if (!fullName) return '4R';
    const words = fullName.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
  }
};

// -------------------------------------------------------------------------
// 3. REACTIVE STORE ENGINE (SALON STORE)
// -------------------------------------------------------------------------

const PlatformManager = {
  currentPlatform: window.location.pathname.includes('app.html') ? 'app' : 'web',
  init() {},
  setPlatform(platform) {
    window.location.href = platform === 'web' ? 'index.html' : 'app.html';
  }
};

window.SalonUtils = SalonUtils;
window.PlatformManager = PlatformManager;
