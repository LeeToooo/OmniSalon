// =========================================================================
// OmniSalon & Spa — REUSABLE WIDGETS BUNDLE (MODERN HIGH-END DESIGN SYSTEM)
// Tuân thủ: .antigravity/rules/04_refactor.md, 07_ponytail.md
// Xuất tập trung: StylistCard, BookingSlotPicker, StatCard, ServiceCard, ShimmerLoading
// =========================================================================

(function (window) {
  'use strict';

  window.SalonWidgets = {
    StylistCard: window.StylistCardWidget || window.StylistCard,
    BookingSlotPicker: window.BookingSlotPicker || window.TimeSlotChipsWidget,
    StatCard: window.StatCardWidget || window.StatCard,
    ServiceCard: window.ServiceCardWidget,
    TimeSlotChips: window.TimeSlotChipsWidget || window.BookingSlotPicker,
    ShimmerLoading: window.ShimmerLoadingWidget
  };

})(typeof window !== 'undefined' ? window : this);
