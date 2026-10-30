// =========================================================================
// Omni Salon: ADMIN PORTAL COMPONENT
// Module chức năng độc lập
// Route: "/admin" & "/admin/*" -> Bento Dashboard, Timeline Dispatcher, RBAC Guard
// =========================================================================

(function (window) {
  'use strict';

  const AdminPortal = {
    render(container, params = {}) {
      if (!container) return;

      // Kiểm tra sự tồn tại của AdminWeb
      if (window.AdminWeb && typeof window.AdminWeb.render === 'function') {
        // Nếu có subtab từ params, /admin?tab=stylists hoặc /admin/bookings
        if (params.tab && typeof window.AdminWeb.switchSubTab === 'function') {
          window.AdminWeb.adminSubTab = params.tab;
        }

        // Render trực tiếp AdminWeb vào container
        window.AdminWeb.render(container);

        // Khởi tạo hiệu ứng 3D Parallax Tilt trên dashboard cards
        if (window.AppRouter) {
          window.AppRouter.initTiltEffects(container);
        }
        return;
      }

      // Fallback nếu AdminWeb chưa nạp
      container.innerHTML = `
        <div style="max-width: 1440px; margin: 0 auto; padding: 60px 24px; text-align: center;">
          <div class="card-3d-tilt" style="padding: 40px; background: #141413; border-radius: 20px; border: 1px solid rgba(197, 155, 39, 0.2); max-width: 600px; margin: 0 auto;">
            <h2 class="font-serif tracking-tight leading-tight" style="font-size: 24px; font-weight: 800; color: #FAF8F5; margin-bottom: 12px;">Đang Tải Trung Tâm Quản Trị...</h2>
            <p style="color: #CBD5E1; font-size: 14px; margin-bottom: 24px;">Hệ thống đang đồng bộ cơ sở dữ liệu và cấu hình phân quyền RBAC.</p>
            <button class="nordic-btn-primary btn-magnetic" onclick="window.location.reload()">
              Tải Lại Trang →
            </button>
          </div>
        </div>
      `;
    }
  };

  window.AdminPortal = AdminPortal;

})(typeof window !== 'undefined' ? window : this);

