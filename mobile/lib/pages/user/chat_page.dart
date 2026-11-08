import 'dart:async';
import 'package:flutter/material.dart';
import 'package:omni_salon_mobile/core/api/api_service.dart';
import 'package:omni_salon_mobile/core/auth/auth_service.dart';
import 'package:omni_salon_mobile/core/theme/app_theme.dart';
import 'package:omni_salon_mobile/models/chat_message.dart';

class ChatPage extends StatefulWidget {
  const ChatPage({super.key});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  Timer? _pollingTimer;
  bool _isLoading = true;
  bool _isSending = false;

  String _conversationId = 'KH001';
  String _senderId = 'KH001';
  String _senderName = 'Khách Hàng';

  @override
  void initState() {
    super.initState();
    _initIdentity();
    _loadMessages();
    _startPolling();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _initIdentity() {
    final user = AuthService.currentUser;
    if (user != null) {
      _senderId = user.id.isNotEmpty ? user.id : (user.maKhachHang ?? user.username);
      _senderName = user.fullName.isNotEmpty ? user.fullName : user.username;
      _conversationId = 'KH_${_senderId}';
    } else {
      _senderId = 'GUEST_MOBILE';
      _senderName = 'Khách Mobile';
      _conversationId = 'GUEST_MOBILE';
    }
  }

  void _startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      _loadMessages(isPolling: true);
    });
  }

  Future<void> _loadMessages({bool isPolling = false}) async {
    final data = await ApiService.fetchChatMessages(_conversationId, markRole: 'customer');
    if (!mounted) return;

    final List<ChatMessage> loaded = data.map((json) => ChatMessage.fromJson(json as Map<String, dynamic>)).toList();

    setState(() {
      _messages.clear();
      _messages.addAll(loaded);
      _isLoading = false;
    });

    if (!isPolling) {
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _handleSend() async {
    final text = _textController.text.trim();
    if (text.isEmpty || _isSending) return;

    _textController.clear();
    setState(() => _isSending = true);

    final sent = await ApiService.sendChatMessage(
      conversationId: _conversationId,
      senderId: _senderId,
      senderName: _senderName,
      senderRole: 'KhachHang',
      message: text,
    );

    if (mounted) {
      setState(() => _isSending = false);
      if (sent != null) {
        _loadMessages();
      }
    }
  }

  @override
  Widget buildWidget(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: AppTheme.surface,
        elevation: 1,
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: const BoxDecoration(
                color: AppTheme.primary,
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: const Text(
                'OS',
                style: TextStyle(
                  color: Colors.black,
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Hỗ Trợ Omni Salon',
                    style: TextStyle(
                      color: AppTheme.textPrimary,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    'Trực tuyến • Phản hồi tức thì',
                    style: TextStyle(
                      color: Color(0xFF10B981),
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(color: AppTheme.primary),
                    )
                  : _messages.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.chat_bubble_outline, size: 48, color: AppTheme.textMuted),
                              const SizedBox(height: 12),
                              const Text(
                                'Chào bạn! Hãy gửi câu hỏi cho salon nhé.',
                                style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          itemCount: _messages.length,
                          itemBuilder: (context, index) {
                            final msg = _messages[index];
                            final isMe = msg.senderRole == 'KhachHang';
                            return _buildMessageBubble(msg, isMe);
                          },
                        ),
            ),
            _buildInputBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage msg, bool isMe) {
    final time = msg.timestamp.length >= 16 ? msg.timestamp.substring(11, 16) : '';
    final roleName = msg.senderRole == 'ThuNgan'
        ? 'Thu ngân'
        : msg.senderRole == 'QuanLy'
            ? 'Quản lý'
            : 'Quản trị viên';
    final label = isMe ? 'Bạn' : '${msg.senderName} ($roleName)';

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.78,
        ),
        child: Column(
          crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 4, right: 4, bottom: 3),
              child: Text(
                label,
                style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isMe ? AppTheme.primary : AppTheme.surfaceCard,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(14),
                  topRight: const Radius.circular(14),
                  bottomLeft: Radius.circular(isMe ? 14 : 2),
                  bottomRight: Radius.circular(isMe ? 2 : 14),
                ),
                border: isMe ? null : Border.all(color: AppTheme.borderSubtle),
              ),
              child: Text(
                msg.message,
                style: TextStyle(
                  color: isMe ? Colors.black : AppTheme.textPrimary,
                  fontSize: 13.5,
                  height: 1.35,
                  fontWeight: isMe ? FontWeight.w500 : FontWeight.normal,
                ),
              ),
            ),
            if (time.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 3, left: 4, right: 4),
                child: Text(
                  time,
                  style: const TextStyle(color: AppTheme.textMuted, fontSize: 10),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: const BoxDecoration(
        color: AppTheme.surface,
        border: Border(top: BorderSide(color: AppTheme.borderSubtle)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _textController,
              style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Nhập tin nhắn tư vấn...',
                hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                filled: true,
                fillColor: AppTheme.surfaceCard,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: const BorderSide(color: AppTheme.borderSubtle),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: const BorderSide(color: AppTheme.primary),
                ),
              ),
              onSubmitted: (_) => _handleSend(),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: _handleSend,
            icon: _isSending
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary),
                  )
                : const Icon(Icons.send_rounded, color: AppTheme.primary),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return buildWidget(context);
  }
}

