class ChatMessage {
  final int id;
  final String conversationId;
  final String senderId;
  final String senderName;
  final String senderRole;
  final String? recipientId;
  final String? recipientRole;
  final String message;
  final String timestamp;
  final bool isRead;
  final String messageType;

  ChatMessage({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.senderName,
    required this.senderRole,
    this.recipientId,
    this.recipientRole,
    required this.message,
    required this.timestamp,
    required this.isRead,
    this.messageType = 'text',
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      conversationId: json['conversationId']?.toString() ?? '',
      senderId: json['senderId']?.toString() ?? '',
      senderName: json['senderName']?.toString() ?? 'Khách',
      senderRole: json['senderRole']?.toString() ?? 'KhachHang',
      recipientId: json['recipientId']?.toString(),
      recipientRole: json['recipientRole']?.toString(),
      message: json['message']?.toString() ?? '',
      timestamp: json['timestamp']?.toString() ?? '',
      isRead: json['isRead'] == true || json['isRead'] == 1,
      messageType: json['messageType']?.toString() ?? 'text',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'conversationId': conversationId,
    'senderId': senderId,
    'senderName': senderName,
    'senderRole': senderRole,
    'recipientId': recipientId,
    'recipientRole': recipientRole,
    'message': message,
    'timestamp': timestamp,
    'isRead': isRead,
    'messageType': messageType,
  };
}

