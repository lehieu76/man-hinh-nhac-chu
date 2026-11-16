---
phase: 03
title: "Màn hình soạn, dán kịch bản & cài đặt"
status: completed
priority: P2
effort: 2h
dependsOn: [01]
---

# Phase 03 — Màn hình soạn, dán kịch bản & cài đặt

## Mục tiêu

Sếp dán kịch bản, chỉnh giao diện, mọi thứ tự lưu; bấm "Chạy" để sang màn hình chạy.

## Dán kịch bản

- Ô soạn là `<textarea>`: dán từ Google Docs hay bất cứ đâu đều tự thành **text thuần**, không cần xử lý HTML.
- Sửa trực tiếp được. Khi `input` → lưu (debounce 300ms) chuỗi text nguyên bản.
- Khi chuyển sang chạy, chuẩn hoá: `normalize('NFC')` (tiếng Việt dạng tổ hợp), đổi `\r\n` thành `\n`, mỗi dòng không rỗng là một đoạn, gộp các dòng trống liền nhau, gộp khoảng trắng thừa.
- Hiển thị số từ và ước lượng thời lượng (~130 từ/phút).

## Panel cài đặt

| Nhóm | Điều khiển | Mặc định |
|---|---|---|
| Chữ | Font (4 web font + hệ thống), cỡ chữ (slider 24–160px), giãn dòng (1.0–2.0), đậm toàn bộ (bật/tắt) | Be Vietnam Pro, 64px, 1.35 |
| Màu | 6 cặp màu chọn nhanh + 2 ô chọn màu tự do (nền / chữ) + màu vạch đọc | Chữ trắng nền đen |
| Bố cục | Lề (px, 0–80), độ rộng cột (40–100%), khoảng cách chữ tới ô trống (gap) | 20px, 100%, 16px |
| Ô trống | Tâm X, Y, rộng, cao (theo % màn hình) — chỉnh chính xác hơn ở chế độ hiệu chỉnh (phase 04) | Giữa, trên cùng, 18% × 22% |
| Điều khiển | Số dòng mỗi lần bấm (1 / 2 / 3), hiệu ứng trượt (bật/tắt) | 1 dòng, bật |

Cặp màu chọn nhanh (`js/color-presets.js`): trắng/đen, vàng/đen, xanh lá/đen, đen/trắng, kem/xanh navy, xám nhạt/xám đậm. Mỗi cặp hiện ô mẫu "Aa" để bấm.

- **Xem trước thu nhỏ**: khung tỉ lệ màn hình hiện tại, vẽ ô trống + vài dòng chữ bằng chính layout engine. Cập nhật ngay khi chỉnh.
- Nút: **Chạy** (to, nổi bật), **Đặt lại mặc định**, **Xoá kịch bản** (có xác nhận).

## Lưu trữ

- `js/settings-store.js`: object mặc định, `load()` gộp với mặc định (an toàn khi thêm field mới), `save()` debounce. Key `teleprompter.v1` gồm `{ script, settings, readingTokenIndex }`. Bọc try/catch (localStorage có thể bị chặn) — lỗi thì báo nhẹ, app vẫn chạy.

## File liên quan

`js/editor-screen.js`, `js/settings-store.js`, `js/color-presets.js`, `css/editor-screen.css`

## Tiêu chí hoàn thành

- Dán một đoạn Google Docs nhiều đoạn văn (tiếng Việt và tiếng Anh): ngắt đoạn giữ đúng, dấu tiếng Việt hiển thị đúng.
- Tải lại trang: kịch bản và cài đặt còn nguyên.
- Xem trước phản ánh ngay thay đổi font/màu/ô trống.
