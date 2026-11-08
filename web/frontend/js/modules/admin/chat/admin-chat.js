// ============================================================================
// OmniSalon & Omni Salon Enterprise Suite
// PHÂN HỆ QUẢN TRỊ - LIVE CHAT CSKH TRỰC TUYẾN DẠNG MESSENGER (ADMIN CHAT HUB)
// Hỗ trợ: Thu ngân, Quản lý, Quản trị viên quản lý nhiều khách hàng cùng lúc
// ============================================================================

(function (window) {
  'use strict';

  if (!window.AdminWeb) window.AdminWeb = {};

  const AdminChat = {
    conversations: [],
    currentConvId: null,
    currentMessages: [],
    pollInterval: null,
    searchQuery: '',

    renderChatTab(user, branches, stylists) {
      setTimeout(() => this.initChatHub(), 50);

      return `
        <div class="admin-chat-layout" id="adminChatLayout">
          <!-- Cột bên trái: Danh sách khách hàng nhắn tin dạng Messenger -->
          <div class="admin-chat-sidebar">
            <div class="admin-chat-sidebar-header">
              <h3 class="admin-chat-sidebar-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Hội Thoại Khách Hàng
              </h3>
              <button class="pill-btn-outline" style="font-size: 11px; padding: 4px 10px;" onclick="AdminWeb.loadConversations(false)">
                Làm mới
              </button>
            </div>
            <div class="admin-chat-search-box">
              <input type="text" class="admin-chat-search-input" id="adminChatSearch" 
                     placeholder="Tìm tên khách hàng, số điện thoại..." oninput="AdminWeb.onChatSearchChange(this.value)" />
            </div>
            <div class="admin-conv-list" id="adminConvList">
              <div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px;">
                Đang nạp danh sách khách hàng...
              </div>
            </div>
          </div>

          <!-- Cột bên phải: Cửa sổ hội thoại Messenger chi tiết -->
          <div class="admin-chat-main" id="adminChatMain">
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 14px; flex-direction: column; gap: 10px;">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.4;">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span style="font-weight: 600;">Chọn một khách hàng ở danh sách bên trái để phản hồi</span>
            </div>
          </div>
        </div>
      `;
    },

    initChatHub() {
      this.loadConversations();
      if (this.pollInterval) clearInterval(this.pollInterval);
      this.pollInterval = setInterval(() => {
        if (AdminWeb.adminSubTab === 'chat') {
          this.loadConversations(true);
          if (this.currentConvId) {
            this.loadMessages(this.currentConvId, true);
          }
        }
      }, 3500);
    },

    async loadConversations(isSilent = false) {
      try {
        const res = await fetch('/api/chat/conversations');
        if (!res.ok) return;
        this.conversations = await res.json();
        this.renderConversationList();

        // Tự động chọn cuộc hội thoại đầu tiên nếu chưa chọn
        if (!this.currentConvId && this.conversations.length > 0 && !isSilent) {
          this.selectConversation(this.conversations[0].conversationId);
        }
      } catch (err) {
        console.warn('[AdminChat] loadConversations error:', err);
      }
    },

    renderConversationList() {
      const container = document.getElementById('adminConvList');
      if (!container) return;

      let list = this.conversations || [];
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        list = list.filter(c => 
          (c.customerName && c.customerName.toLowerCase().includes(q)) ||
          (c.customerPhone && c.customerPhone.includes(q)) ||
          (c.conversationId && c.conversationId.toLowerCase().includes(q))
        );
      }

      if (list.length === 0) {
        container.innerHTML = `
          <div style="padding: 36px 16px; text-align: center; color: var(--text-secondary); font-size: 13px;">
            Không tìm thấy cuộc trò chuyện nào
          </div>
        `;
        return;
      }

      container.innerHTML = list.map(c => {
        const isActive = c.conversationId === this.currentConvId;
        const initial = (c.customerName || 'KH').substring(0, 2).toUpperCase();
        const timeStr = c.lastTime ? c.lastTime.substring(11, 16) : '';
        const unreadBadge = c.unreadCount > 0 ? `<span class="admin-conv-badge">${c.unreadCount}</span>` : '';

        return `
          <div class="admin-conv-item ${isActive ? 'active' : ''}" onclick="AdminWeb.selectConversation('${c.conversationId}')">
            <div class="admin-conv-avatar">
              ${initial}
              <span class="admin-conv-online-dot"></span>
            </div>
            <div class="admin-conv-info">
              <div class="admin-conv-top">
                <span class="admin-conv-name">${AdminWeb.escapeHtml(c.customerName || 'Khách hàng')}</span>
                <span class="admin-conv-time">${timeStr}</span>
              </div>
              <div class="admin-conv-bottom">
                <span class="admin-conv-snippet">${AdminWeb.escapeHtml(c.lastMessage || '...')}</span>
                ${unreadBadge}
              </div>
            </div>
          </div>
        `;
      }).join('');
    },

    async selectConversation(convId) {
      this.currentConvId = convId;
      this.renderConversationList();
      await this.loadMessages(convId, false);
      fetch('/api/chat/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, readerRole: 'admin' })
      }).catch(() => {});
    },

    async loadMessages(convId, isPolling = false) {
      try {
        const res = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(convId)}&markReadRole=admin`);
        if (!res.ok) return;
        this.currentMessages = await res.json();
        this.renderChatWindow(convId, isPolling);
      } catch (err) {
        console.warn('[AdminChat] loadMessages error:', err);
      }
    },

    renderChatWindow(convId, isPolling = false) {
      const main = document.getElementById('adminChatMain');
      if (!main) return;

      const conv = this.conversations.find(c => c.conversationId === convId) || {
        customerName: 'Khách hàng',
        conversationId: convId,
        memberTier: 'Khách hàng'
      };

      const stream = document.getElementById('adminChatBodyStream');
      if (isPolling && stream) {
        this.updateChatStream(stream);
        return;
      }

      main.innerHTML = `
        <div class="admin-chat-header">
          <div class="admin-chat-customer-meta">
            <div class="admin-conv-avatar" style="width: 40px; height: 40px; font-size: 14px;">
              ${(conv.customerName || 'KH').substring(0, 2).toUpperCase()}
              <span class="admin-conv-online-dot"></span>
            </div>
            <div>
              <div style="font-weight: 800; color: var(--admin-chat-item-name); font-size: 15px;">
                ${AdminWeb.escapeHtml(conv.customerName || 'Khách hàng')}
              </div>
            </div>
          </div>
          <button class="pill-btn-outline" style="font-size: 12px; padding: 6px 14px;" 
                  onclick="AdminWeb.loadMessages('${convId}')">
            Tải lại
          </button>
        </div>

        <div class="admin-chat-body-stream" id="adminChatBodyStream"></div>

        <div class="admin-chat-input-bar">
          <input type="text" id="adminChatInputText" class="admin-chat-textarea" 
                 placeholder="Nhập tin nhắn phản hồi khách hàng (nhấn Enter để gửi)..." autocomplete="off" />
          <button type="button" class="admin-chat-send-action-btn" onclick="AdminWeb.sendAdminMessage()">
            <span>Gửi</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      `;

      const input = document.getElementById('adminChatInputText');
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.sendAdminMessage();
          }
        });
        input.focus();
      }

      const streamEl = document.getElementById('adminChatBodyStream');
      if (streamEl) {
        this.updateChatStream(streamEl);
      }
    },

    updateChatStream(stream) {
      if (!this.currentMessages || this.currentMessages.length === 0) {
        stream.innerHTML = `
          <div style="padding: 40px; text-align: center; color: var(--text-secondary); font-size: 13.5px;">
            Chưa có tin nhắn trong cuộc hội thoại này.
          </div>
        `;
        return;
      }

      stream.innerHTML = this.currentMessages.map(m => {
        const isStaff = m.senderRole !== 'KhachHang';
        const roleLabel = m.senderRole === 'ThuNgan' ? 'Thu ngân' : m.senderRole === 'QuanLy' ? 'Quản lý' : 'Quản trị viên';
        const timeDisplay = m.timestamp ? m.timestamp.substring(11, 16) : '';
        const senderDisplay = isStaff ? `${m.senderName} (${roleLabel})` : m.senderName;

        return `
          <div class="admin-chat-msg-row ${isStaff ? 'out' : 'in'}">
            <div style="font-size: 11px; color: var(--admin-chat-item-time); margin-bottom: 3px; padding: 0 4px;">
              ${AdminWeb.escapeHtml(senderDisplay)}
            </div>
            <div class="admin-chat-bubble">${AdminWeb.escapeHtml(m.message)}</div>
            <div style="font-size: 10px; color: var(--admin-chat-item-time); margin-top: 3px; padding: 0 4px;">
              ${timeDisplay}
            </div>
          </div>
        `;
      }).join('');

      stream.scrollTop = stream.scrollHeight;
    },

    async sendAdminMessage() {
      const input = document.getElementById('adminChatInputText');
      if (!input || !this.currentConvId) return;
      const text = input.value.trim();
      if (!text) return;

      const user = AdminWeb.getCurrentUser ? AdminWeb.getCurrentUser() : null;
      const role = AdminWeb.getActiveRole ? AdminWeb.getActiveRole(user) : 'SUPER_ADMIN';
      let senderRole = 'QuanTriVien';
      if (role === 'CASHIER') senderRole = 'ThuNgan';
      else if (role === 'BRANCH_MANAGER') senderRole = 'QuanLy';

      const senderName = user ? (user.fullName || user.username || 'Salon Staff') : 'Admin Salon';
      const senderId = user ? (user.id || user.username || 'STAFF') : 'STAFF';

      input.value = '';

      try {
        const res = await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: this.currentConvId,
            senderId,
            senderName,
            senderRole,
            message: text
          })
        });

        if (res.ok) {
          await this.loadMessages(this.currentConvId, false);
          this.loadConversations(true);
        }
      } catch (err) {
        console.error('[AdminChat] sendAdminMessage error:', err);
      }
    },

    onChatSearchChange(val) {
      this.searchQuery = val || '';
      this.renderConversationList();
    }
  };

  // Gắn vào AdminWeb
  Object.assign(window.AdminWeb, {
    renderChatTab: (user, branches, stylists) => AdminChat.renderChatTab(user, branches, stylists),
    loadConversations: (isSilent) => AdminChat.loadConversations(isSilent),
    selectConversation: (convId) => AdminChat.selectConversation(convId),
    loadMessages: (convId) => AdminChat.loadMessages(convId),
    sendAdminMessage: () => AdminChat.sendAdminMessage(),
    onChatSearchChange: (val) => AdminChat.onChatSearchChange(val)
  });

})(typeof window !== 'undefined' ? window : this);
