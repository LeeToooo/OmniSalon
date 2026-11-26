(function (window) {
  'use strict';

  function escapeHtml(str) {
    if (typeof SalonUtils !== 'undefined' && typeof SalonUtils.escapeHtml === 'function') {
      return SalonUtils.escapeHtml(str);
    }
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const CustomerMainContent = {
    escapeHtml(str) {
      return escapeHtml(str);
    },

    renderMainContent() {
      const container = document.getElementById('webMainContainer');
      if (!container) return;

      const routeMap = {
        'home': '/',
        'services': '/services',
        'stylists': '/stylists',
        'booking': '/booking',
        'shop': '/shop',
        'cart': '/cart',
        'branches': '/branches',
        'ai': '/ai-studio',
        'admin': '/admin'
      };
      const targetRoute = routeMap[this.currentTab] || '/';

      if (window.AppRouter && window.AppRouter.routes && typeof window.AppRouter.routes[targetRoute] === 'function') {
        window.AppRouter.resolveRoute(targetRoute, false);
        return;
      }

      if (this.currentTab === 'admin') {
        if (window.AdminWeb && typeof window.AdminWeb.render === 'function') {
          window.AdminWeb.render(container);
          return;
        }
        if (window.AdminPortal && typeof window.AdminPortal.render === 'function') {
          window.AdminPortal.render(container);
          return;
        }
        if (window.UIWeb && typeof window.UIWeb.renderAdminView === 'function') {
          window.UIWeb.renderAdminView(container);
          return;
        }
      }

      const tabPages = {
        services: window.ServicesPage,
        stylists: window.StylistsPage,
        booking: window.BookingPage,
        shop: window.ShopPage,
        cart: window.CartPage,
        branches: window.BranchesPage,
        ai: window.AiStudioPage,
      };
      const targetPage = tabPages[this.currentTab] || window.HomePage;
      if (targetPage && typeof targetPage.render === 'function') {
        targetPage.render(container);
      }
    }
  };

  window.CustomerMainContent = CustomerMainContent;
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerMainContent);
  }
})(typeof window !== 'undefined' ? window : this);
