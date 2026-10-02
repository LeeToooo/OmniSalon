// =========================================================================
// OmniSalon / 4RAU Barbershop — MOBILE APP STATE MANAGEMENT MODULE
// Phiên bản: 3.0.0 Material 3 Architecture & Separation of Concerns
// Tách biệt 100% tầng quản lý trạng thái (State) khỏi tầng giao diện (View)
// Tuân thủ: .antigravity/rules/04_refactor.md, 07_ponytail.md
// =========================================================================

(function (window) {
  'use strict';

  class MobileAppState {
    constructor() {
      this._listeners = new Set();
      this.state = this._getInitialState();
    }

    _getInitialState() {
      const today = new Date().toISOString().split('T')[0];
      return {
        // 1. Navigation State
        activeTab: 'home', // 'home' | 'booking' | 'ai' | 'shop' | 'profile'
        carouselIndex: 0,

        // 2. Booking State (Tách riêng khỏi UI Wizard)
        booking: {
          branchId: 'br-dbp',
          serviceId: 'srv-1',
          stylistId: 'st-01',
          date: today,
          timeSlot: '09:30',
          durationMinutes: 45,
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          notes: ''
        },

        // 3. AI Restyle State
        ai: {
          originalImage: null,
          resultImage: null,
          selectedStyle: 'Side Part 7/3 Hàn Quốc',
          selectedColorName: 'Đen Tự Nhiên',
          selectedColorHex: '#1c1b18',
          customPrompt: '',
          isProcessing: false,
          showApiSettings: false
        },

        // 4. Shop & Catalog Filter State
        shop: {
          brand: 'all',
          query: '',
          category: 'all',
          priceSort: 'default'
        },

        // 5. User Profile Sub-tabs
        profile: {
          subTab: 'bookings', // 'bookings' | 'orders' | 'rewards'
          selectedBookingId: null
        },

        // 6. UI & Shimmer Loading States
        ui: {
          isLoading: false,
          loadingTarget: null, // 'services' | 'stylists' | 'slots' | 'ai'
          activeModal: null
        }
      };
    }

    /**
     * Đăng ký lắng nghe thay đổi trạng thái (Observer Pattern)
     * @param {Function} listener (state, mutationType) => void
     * @returns {Function} Hàm hủy đăng ký (unsubscribe)
     */
    subscribe(listener) {
      if (typeof listener === 'function') {
        this._listeners.add(listener);
      }
      return () => this._listeners.delete(listener);
    }

    /**
     * Bắn tín hiệu thông báo cho tất cả observers
     */
    notify(mutationType = 'STATE_MUTATION') {
      this._listeners.forEach(listener => {
        try {
          listener(this.state, mutationType);
        } catch (e) {
          console.error('[AppState] Error notifying listener:', e);
        }
      });
    }

    // ── Getters ──
    getState() {
      return this.state;
    }

    get(path) {
      if (!path) return this.state;
      const parts = path.split('.');
      let curr = this.state;
      for (const p of parts) {
        if (curr === undefined || curr === null) return undefined;
        curr = curr[p];
      }
      return curr;
    }

    // ── Generic Mutator ──
    set(path, value, silent = false) {
      const parts = path.split('.');
      if (parts.length === 1) {
        this.state[parts[0]] = value;
      } else {
        let curr = this.state;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!curr[parts[i]]) curr[parts[i]] = {};
          curr = curr[parts[i]];
        }
        curr[parts[parts.length - 1]] = value;
      }
      if (!silent) this.notify(`SET_${path.toUpperCase().replace(/\./g, '_')}`);
    }

    // ── Booking Domain Actions ──
    updateBooking(patch) {
      if (!patch || typeof patch !== 'object') return;
      this.state.booking = { ...this.state.booking, ...patch };
      this.notify('BOOKING_UPDATED');
    }

    resetBookingDraft() {
      const today = new Date().toISOString().split('T')[0];
      const defaultBranch = (window.store && window.store.getCurrentBranch) ? window.store.getCurrentBranch().id : 'br-dbp';
      this.state.booking = {
        branchId: defaultBranch,
        serviceId: 'srv-1',
        stylistId: 'st-01',
        date: today,
        timeSlot: '09:30',
        durationMinutes: 45,
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        notes: ''
      };
      this.notify('BOOKING_RESET');
    }

    // ── AI Studio Domain Actions ──
    updateAi(patch) {
      if (!patch || typeof patch !== 'object') return;
      this.state.ai = { ...this.state.ai, ...patch };
      this.notify('AI_UPDATED');
    }

    // ── Shop Filter Domain Actions ──
    updateShop(patch) {
      if (!patch || typeof patch !== 'object') return;
      this.state.shop = { ...this.state.shop, ...patch };
      this.notify('SHOP_UPDATED');
    }

    // ── Loading & Shimmer State Actions ──
    setLoading(isLoading, target = null) {
      this.state.ui.isLoading = Boolean(isLoading);
      this.state.ui.loadingTarget = target;
      this.notify('LOADING_CHANGED');
    }
  }

  // Khởi tạo instance Singleton toàn cục
  window.AppState = new MobileAppState();
  window.MobileAppState = window.AppState;

})(typeof window !== 'undefined' ? window : this);
