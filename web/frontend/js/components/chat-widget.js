// =========================================================================
// OMNISALON CUSTOMER LIVE CHAT WIDGET
// Hỗ trợ khách hàng nhắn tin trực tiếp với Thu Ngân / Quản Lý / Quản Trị Viên
// Tự động đồng bộ tin nhắn qua API /api/chat/...
// =========================================================================

(function (window) {
  'use strict';

  const OmniChat = {
    isOpen: false,
    pollTimer: null,
    lastMsgId: 0,
    conversationId: '',
    senderName: '',
    senderId: '',
    unreadCount: 0,

    shouldHide() {
      // Ẩn hoàn toàn widget nổi khi đang ở trong trang Admin hoặc có class admin-mode
      const path = (window.location.pathname || '').toLowerCase();
      const hash = (window.location.hash || '').toLowerCase();
      const search = (window.location.search || '').toLowerCase();
      const isAdminRoute = path.includes('/admin') || hash.includes('/admin') || search.includes('route=/admin');
      const isAdminMode = document.body && document.body.classList.contains('admin-mode');
      const adminLayout = document.querySelector('.admin-dashboard-layout');

      return isAdminRoute || isAdminMode || !!adminLayout;
    },

    syncVisibility() {
      const fab = document.getElementById('omniChatFab');
      const panel = document.getElementById('omniChatPanel');
      if (!fab && !panel) return;

      if (this.shouldHide()) {
        if (fab) fab.style.display = 'none';
        if (panel) {
          panel.classList.remove('active');
          panel.style.display = 'none';
        }
      } else {
        if (fab) fab.style.display = 'flex';
        if (panel && this.isOpen) {
          panel.style.display = 'flex';
          panel.classList.add('active');
        } else if (panel) {
          panel.style.display = '';
        }
      }
    },

    init() {
      if (!document.getElementById('omniChatFab')) {
        this.initIdentity();
        this.render();
        this.bindEvents();
        this.startPolling();
      }

      this.syncVisibility();

      // Theo dõi thay đổi định tuyến URL hoặc DOM để ẩn/hiện kịp thời
      window.addEventListener('popstate', () => this.syncVisibility());
      window.addEventListener('hashchange', () => this.syncVisibility());
      setInterval(() => this.syncVisibility(), 800);
    },

    initIdentity() {
      const user = (typeof AuthEngine !== 'undefined' && AuthEngine.getCurrentUser) 
        ? AuthEngine.getCurrentUser() 
        : null;

      if (user && user.role === 'CUSTOMER') {
        this.senderId = user.id || user.username || 'KH001';
        this.senderName = user.name || user.fullName || user.username || 'Khách hàng';
        this.conversationId = 'KH_' + (user.id || user.username);
      } else {
        let guestId = localStorage.getItem('omni_guest_chat_id');
        let guestName = localStorage.getItem('omni_guest_chat_name');
        if (!guestId) {
          guestId = 'GUEST_' + Math.random().toString(36).substring(2, 9).toUpperCase();
          localStorage.setItem('omni_guest_chat_id', guestId);
        }
        this.senderId = guestId;
        this.senderName = guestName || 'Khách Vãng Lai';
        this.conversationId = guestId;
      }
    },

    render() {
      // 1. Floating Action Button
      const fab = document.createElement('div');
      fab.id = 'omniChatFab';
      fab.className = 'omni-chat-fab';
      fab.setAttribute('title', 'Trò chuyện với Salon');
      fab.innerHTML = `
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="omni-chat-badge" id="omniChatBadge">0</span>
      `;
      document.body.appendChild(fab);

      // 2. Chat Panel Container
      const panel = document.createElement('div');
      panel.id = 'omniChatPanel';
      panel.className = 'omni-chat-panel';
      panel.innerHTML = `
        <div class="omni-chat-header">
          <div class="omni-chat-header-info">
            <div class="omni-chat-avatar">
              OS
              <span class="omni-chat-status-dot"></span>
            </div>
            <div>
              <h4 class="omni-chat-title">
                Hỗ Trợ Omni Salon
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981" stroke="#10b981"><circle cx="12" cy="12" r="10"/></svg>
              </h4>
            </div>
          </div>
          <button class="omni-chat-close-btn" id="omniChatCloseBtn" title="Thu nhỏ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="omni-chat-body" id="omniChatBody">
          <div class="omni-chat-msg-row in">
            <div class="omni-chat-sender-label">Omni Salon Support</div>
            <div class="omni-chat-bubble">
              Dạ xin chào quý khách! Salon có thể hỗ trợ gì về đặt lịch, dịch vụ hoặc sản phẩm cho bạn hôm nay ạ?
            </div>
            <div class="omni-chat-time">Vừa xong</div>
          </div>
        </div>

        <div class="omni-chat-footer">
          <input type="text" id="omniChatInput" class="omni-chat-input" placeholder="Nhập tin nhắn..." autocomplete="off" />
          <button type="button" id="omniChatSendBtn" class="omni-chat-send-btn" title="Gửi">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      `;
      document.body.appendChild(panel);
    },

    bindEvents() {
      const fab = document.getElementById('omniChatFab');
      const closeBtn = document.getElementById('omniChatCloseBtn');
      const sendBtn = document.getElementById('omniChatSendBtn');
      const input = document.getElementById('omniChatInput');

      if (fab) {
        fab.addEventListener('click', () => this.toggleChat());
      }
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.toggleChat(false));
      }
      if (sendBtn) {
        sendBtn.addEventListener('click', () => this.sendMessage());
      }
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.sendMessage();
          }
        });
      }
    },

    toggleChat(show) {
      if (this.shouldHide()) return;

      const panel = document.getElementById('omniChatPanel');
      if (!panel) return;

      this.isOpen = (typeof show === 'boolean') ? show : !this.isOpen;
      if (this.isOpen) {
        panel.style.display = 'flex';
        panel.classList.add('active');
        this.unreadCount = 0;
        this.updateBadge();
        this.loadMessages();
        setTimeout(() => {
          const input = document.getElementById('omniChatInput');
          if (input) input.focus();
          this.scrollToBottom();
        }, 150);
      } else {
        panel.classList.remove('active');
        panel.style.display = 'none';
      }
    },

    updateBadge() {
      const badge = document.getElementById('omniChatBadge');
      if (!badge) return;
      if (this.unreadCount > 0 && !this.isOpen && !this.shouldHide()) {
        badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    },

    scrollToBottom() {
      const body = document.getElementById('omniChatBody');
      if (body) {
        body.scrollTop = body.scrollHeight;
      }
    },

    async loadMessages() {
      this.initIdentity();
      if (!this.conversationId) return;

      try {
        const markRole = this.isOpen ? '&markReadRole=customer' : '';
        const res = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(this.conversationId)}${markRole}`);
        if (!res.ok) return;
        const messages = await res.json();
        if (Array.isArray(messages)) {
          this.renderMessages(messages);
        }
      } catch (err) {
        console.warn('[OmniChat] loadMessages error:', err);
      }
    },

    renderMessages(messages) {
      const container = document.getElementById('omniChatBody');
      if (!container) return;

      if (messages.length === 0) {
        return;
      }

      container.innerHTML = `
        <div class="omni-chat-msg-row in">
          <div class="omni-chat-sender-label">Omni Salon Support</div>
          <div class="omni-chat-bubble">
            Dạ xin chào quý khách! Salon có thể hỗ trợ gì về đặt lịch, dịch vụ hoặc sản phẩm cho bạn hôm nay ạ?
          </div>
          <div class="omni-chat-time">Vừa xong</div>
        </div>
      `;

      let unread = 0;
      messages.forEach(msg => {
        const isMe = msg.senderRole === 'KhachHang';
        if (!isMe && !msg.isRead) {
          unread++;
        }

        const row = document.createElement('div');
        row.className = `omni-chat-msg-row ${isMe ? 'out' : 'in'}`;

        const senderDisplay = isMe ? 'Bạn' : `${msg.senderName} (${msg.senderRole === 'ThuNgan' ? 'Thu ngân' : msg.senderRole === 'QuanLy' ? 'Quản lý' : 'Quản trị viên'})`;
        const timeDisplay = msg.timestamp ? msg.timestamp.substring(11, 16) : '';

        row.innerHTML = `
          <div class="omni-chat-sender-label">${senderDisplay}</div>
          <div class="omni-chat-bubble">${this.escapeHtml(msg.message)}</div>
          <div class="omni-chat-time">${timeDisplay}</div>
        `;
        container.appendChild(row);

        if (msg.id > this.lastMsgId) {
          this.lastMsgId = msg.id;
        }
      });

      if (!this.isOpen) {
        this.unreadCount = unread;
        this.updateBadge();
      }

      this.scrollToBottom();
    },

    async sendMessage() {
      const input = document.getElementById('omniChatInput');
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;

      this.initIdentity();
      input.value = '';

      const container = document.getElementById('omniChatBody');
      const tempRow = document.createElement('div');
      tempRow.className = 'omni-chat-msg-row out';
      tempRow.innerHTML = `
        <div class="omni-chat-sender-label">Bạn</div>
        <div class="omni-chat-bubble">${this.escapeHtml(text)}</div>
        <div class="omni-chat-time">Đang gửi...</div>
      `;
      container.appendChild(tempRow);
      this.scrollToBottom();

      try {
        const res = await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: this.conversationId,
            senderId: this.senderId,
            senderName: this.senderName,
            senderRole: 'KhachHang',
            message: text
          })
        });

        if (res.ok) {
          this.loadMessages();
        } else {
          tempRow.querySelector('.omni-chat-time').textContent = 'Lỗi gửi tin';
          tempRow.querySelector('.omni-chat-time').style.color = '#ef4444';
        }
      } catch (err) {
        console.error('[OmniChat] Send error:', err);
        tempRow.querySelector('.omni-chat-time').textContent = 'Lỗi kết nối';
        tempRow.querySelector('.omni-chat-time').style.color = '#ef4444';
      }
    },

    startPolling() {
      if (this.pollTimer) clearInterval(this.pollTimer);
      this.pollTimer = setInterval(() => {
        this.loadMessages();
      }, 3500);
    },

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => OmniChat.init());
  } else {
    setTimeout(() => OmniChat.init(), 300);
  }

  window.OmniChat = OmniChat;
})(window);
