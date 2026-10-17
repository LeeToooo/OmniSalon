class UserModel {
  final String id;
  final String? maKhachHang;
  final String? maNhanVien;
  final String username;
  final String fullName;
  final String phone;
  final String email;
  final String? birthday;
  final String role;
  final String roleName;

  UserModel({
    required this.id,
    this.maKhachHang,
    this.maNhanVien,
    required this.username,
    required this.fullName,
    required this.phone,
    required this.email,
    this.birthday,
    required this.role,
    required this.roleName,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? json['MaTaiKhoan']?.toString() ?? '',
      maKhachHang: json['MaKhachHang']?.toString(),
      maNhanVien: json['MaNhanVien']?.toString(),
      username: json['username']?.toString() ?? json['TenDangNhap']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? json['HoTen']?.toString() ?? json['name']?.toString() ?? 'Khách Hàng',
      phone: json['phone']?.toString() ?? json['SoDienThoai']?.toString() ?? '',
      email: json['email']?.toString() ?? json['Email']?.toString() ?? '',
      birthday: json['birthday']?.toString() ?? json['NgaySinh']?.toString(),
      role: json['role']?.toString() ?? json['VaiTro']?.toString() ?? 'CUSTOMER',
      roleName: json['roleName']?.toString() ?? 'Khách Hàng Thành Viên',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'MaKhachHang': maKhachHang,
    'MaNhanVien': maNhanVien,
    'username': username,
    'fullName': fullName,
    'phone': phone,
    'email': email,
    'birthday': birthday,
    'role': role,
    'roleName': roleName,
  };
}
