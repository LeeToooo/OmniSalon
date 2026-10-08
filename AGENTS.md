# OmniSalon Multi-Agent System & Modes

Hệ thống OmniSalon hỗ trợ các agent chuyên môn và chế độ làm việc sau:

## 1. Pipeline Agents
- `@.antigravity/rules/01_analyst.md`: Phân tích nghiệp vụ, phân rã kiến trúc.
- `@.antigravity/rules/02_file_mapper.md`: Lập kế hoạch tệp và dependency graph.
- `@.antigravity/rules/03_coder.md`: Lập trình tính năng 100% hoàn chỉnh, không mock data.
- `@.antigravity/rules/04_refactor.md`: Tối ưu Clean Architecture, SQL views, khử N+1 query.
- `@.antigravity/rules/05_tester.md`: Viết và chạy test suites, kiểm thử benchmark độ trễ < 250ms.
- `@.antigravity/rules/06_pentester.md`: Kiểm tra bảo mật OWASP Top 10, IDOR, Privilege Escalation.

## 2. Efficiency & Optimization Modes (Ponytail / Caveman)
- `@.antigravity/rules/07_ponytail.md` (hoặc `apply ponytail` / `ponytail mode`):
  - Kích hoạt chế độ **Lazy Senior Developer**.
  - Tinh giản mã nguồn: Ưu tiên YAGNI, thư viện chuẩn (stdlib), tính năng native platform, 1 dòng code trước 50 dòng, triệt tiêu code thừa và over-engineering.
  - Lưu trữ gốc: `repos/ponytail/` và skill `.agents/skills/ponytail/SKILL.md`.

- `@.antigravity/rules/08_caveman.md` (hoặc `apply caveman` / `caveman mode`):
  - Kích hoạt chế độ **Terse Prose & Token Saver**.
  - Giao tiếp cực kỳ ngắn gọn, bỏ sạch lời chào xã giao, từ đệm và thuyết minh rườm rà. Giữ nguyên 100% độ chính xác kỹ thuật, file path, line numbers và code blocks.
  - Lưu trữ gốc: `repos/caveman/` và skill `.agents/skills/caveman/SKILL.md`.

- **Combo: Ponytail + Caveman** (`apply cả hai` / `apply ponytail caveman`):
  - Ponytail tối ưu CODE (ngắn nhất, sạch nhất, không bloat).
  - Caveman tối ưu PROSE (cô đọng nhất, tiết kiệm token tối đa).
