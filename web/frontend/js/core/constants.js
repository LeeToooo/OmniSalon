/**
 * =========================================================================
 * Omni Salon — CORE CONSTANTS & DESIGN TOKENS (ANTI-AI CLEAN ARCHITECTURE)
 * Anti-Glare Palette, Strict Lucide Iconography, District Filters & UI Specs
 * =========================================================================
 */

(function (window) {
  'use strict';

  // Anti-Glare & Anti-AI Palette Tokens
  const THEME_TOKENS = Object.freeze({
    bg: '#0A0A0B',              // bg-zinc-950 (Không chói, đen tuyền dịu mắt)
    card: '#121214',            // bg-zinc-900/90
    cardHover: '#18181B',       // bg-zinc-900
    border: '#222225',          // border-zinc-800/80
    borderHover: '#3F3F46',     // border-zinc-700
    imageBg: '#F3F2EE',         // Khung ảnh kem ấm chống lóa
    
    // Typography Colors
    textPrimary: '#F4F4F5',     // text-zinc-100 (Trắng dịu, cấm dùng #FFFFFF)
    textSecondary: '#A1A1AA',   // text-zinc-400
    textMuted: '#71717A',       // text-zinc-500
    
    // Accent Colors
    primaryCta: '#D97706',      // bg-amber-600
    primaryCtaHover: '#F59E0B', // bg-amber-500
    primaryCtaText: '#09090B',  // text-zinc-950 font-medium
    
    // Neutral Secondary Button State
    secondaryBtnBg: '#27272A',  // bg-zinc-800
    secondaryBtnText: '#F4F4F5',// text-zinc-100
    secondaryBtnBorder: '#3F3F46',
    
    // Badge Giảm Giá Tông Trầm Tinh Tế
    discountBadgeBg: '#27272A',
    discountBadgeText: '#FBBF24',
    discountBadgeBorder: 'rgba(245, 158, 11, 0.2)',
    
    // Status
    statusOpen: '#10B981',
    statusClosed: '#71717A'
  });

  // Danh mục quận / huyện chính thức để phân nhóm layout chi nhánh
  const BRANCH_DISTRICTS = Object.freeze([
    'Tất Cả',
    'Quận 1',
    'Quận 3',
    'Bình Thạnh',
    'Tân Bình',
    'Quận 10',
    'Phú Nhuận',
    'Gò Vấp',
    'TP. Thủ Đức'
  ]);

  // Hệ thống Lucide SVG Icons chuẩn nét mảnh
  const LUCIDE_ICONS = Object.freeze({
    mapPin: (size = 16, cls = '') => `
      <svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    `,
    clock: (size = 16, cls = '') => `
      <svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    `,
    phone: (size = 16, cls = '') => `
      <svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    `,
    shoppingBag: (size = 16, cls = '') => `
      <svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
        <line x1="3" x2="21" y1="6" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    `,
    star: (size = 14, cls = '') => `
      <svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="#FBBF24" stroke="none" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    `,
    navigation: (size = 16, cls = '') => `
      <svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
      </svg>
    `,
    calendar: (size = 16, cls = '') => `
      <svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
        <line x1="16" x2="16" y1="2" y2="6"/>
        <line x1="8" x2="8" y1="2" y2="6"/>
        <line x1="3" x2="21" y1="10" y2="10"/>
      </svg>
    `,
    scissors: (size = 16, cls = '') => `
      <svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
        <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/>
        <line x1="8.12" y1="8.12" x2="12" y2="12"/>
      </svg>
    `,
    shieldCheck: (size = 16, cls = '') => `
      <svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    `,
    truck: (size = 16, cls = '') => `
      <svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
        <path d="M15 18H9"/>
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
        <circle cx="17" cy="18.5" r="2.5"/><circle cx="7" cy="18.5" r="2.5"/>
      </svg>
    `,
    rotateCcw: (size = 16, cls = '') => `
      <svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
      </svg>
    `,
    sparkles: (size = 16, cls = '') => `
      <svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      </svg>
    `,
    arrowRight: (size = 16, cls = '') => `
      <svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
      </svg>
    `,
    search: (size = 16, cls = '') => `
      <svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
      </svg>
    `
  });

  // Xuất ra toàn cục
  window.APP_CONSTANTS = Object.freeze({
    THEME_TOKENS,
    BRANCH_DISTRICTS,
    LUCIDE_ICONS
  });

})(typeof window !== 'undefined' ? window : this);
