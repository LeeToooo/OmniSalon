// =========================================================================
// OmniSalon — UIWeb Compatibility Bridge & Delegate
// Chuyển tiếp toàn bộ phương thức và thuộc tính sang CustomerWeb & AdminWeb
// Giữ nguyên 100% tính năng, loại bỏ hoàn toàn 2.700 dòng code trùng lặp
// Tuân thủ: .antigravity/rules/07_ponytail.md (YAGNI & De-duplication)
// =========================================================================

(function (window) {
  'use strict';

  const UIWebBridge = new Proxy({}, {
    get(target, prop) {
      if (prop === 'customer' || prop === 'CustomerWeb') return window.CustomerWeb;
      if (prop === 'admin' || prop === 'AdminWeb') return window.AdminWeb;

      // Ưu tiên chuyển tiếp sang CustomerWeb
      if (window.CustomerWeb && prop in window.CustomerWeb) {
        const val = window.CustomerWeb[prop];
        return typeof val === 'function' ? val.bind(window.CustomerWeb) : val;
      }

      // Tiếp tục tìm trong AdminWeb
      if (window.AdminWeb && prop in window.AdminWeb) {
        const val = window.AdminWeb[prop];
        return typeof val === 'function' ? val.bind(window.AdminWeb) : val;
      }

      return target[prop];
    },
    set(target, prop, val) {
      target[prop] = val;
      if (window.CustomerWeb && prop in window.CustomerWeb) window.CustomerWeb[prop] = val;
      if (window.AdminWeb && prop in window.AdminWeb) window.AdminWeb[prop] = val;
      return true;
    }
  });

  window.UIWeb = UIWebBridge;
})(typeof window !== 'undefined' ? window : this);
