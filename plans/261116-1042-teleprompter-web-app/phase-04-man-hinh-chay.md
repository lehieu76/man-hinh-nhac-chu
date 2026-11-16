---
phase: 04
title: "Màn hình chạy & điều khiển phím"
status: completed
priority: P1
effort: 3h
dependsOn: [02, 03]
---

# Phase 04 — Màn hình chạy & điều khiển phím

## Mục tiêu

Toàn màn hình, chữ dàn quanh ô trống, vạch đọc sát camera, điều khiển hoàn toàn bằng bàn phím.

## Vào / ra

- Nút "Chạy" → `document.documentElement.requestFullscreen()` (trong handler click), chờ `fullscreenchange`, đo lại kích thước màn hình, chờ `document.fonts.ready`, rồi dàn chữ từ `readingTokenIndex` đã lưu.
- `Esc` hoặc thoát fullscreen → về màn soạn, lưu vị trí.
- Ẩn con trỏ chuột (`cursor: none`) khi đang chạy.
- Giữ màn hình không tắt: `navigator.wakeLock.request('screen')`, xin lại khi tab hiện lại (`visibilitychange`). Không hỗ trợ thì bỏ qua.

## Phím tắt

| Phím | Hành động |
|---|---|
| ↓ / Space | Tiến `stepLines` dòng |
| ↑ | Lùi `stepLines` dòng |
| Page Down / Page Up | Tiến / lùi nửa màn hình (bổ sung, không thay ↑/↓) |
| Home / End | Về đầu / tới cuối |
| `+` / `−` | Tăng / giảm cỡ chữ 4px (giữ token ở vạch đọc) |
| `H` | Bật chế độ hiệu chỉnh ô trống |
| `Esc` | Thoát |

Giữ phím (auto-repeat) vẫn hoạt động nhưng giới hạn ~10 bước/giây để không rối.

## Hiển thị

- `js/prompter-renderer.js`: mỗi khe là một `div` tuyệt đối (`left/top/width`) chứa text thuần (`textContent`). Dựng lại nội dung mỗi bước (số phần tử nhỏ, đủ nhanh).
- Hiệu ứng trượt (nếu bật): dịch cả lớp chữ lên `N × rowH` bằng `transform` trong ~120ms rồi thay bằng trạng thái mới. Phần cạnh ô trống có thể đổi ngắt dòng sau trượt — chấp nhận.
- **Vạch đọc**: một đường mảnh hoặc dải nền mờ ở hàng đọc, màu theo cài đặt; chữ dòng đọc sáng hơn, các dòng đã đọc phía trên mờ đi (độ mờ chỉnh được, mặc định 60%).
- **Ô trống**: mặc định không vẽ gì (để màn hình tối, không loá vào camera); trong chế độ hiệu chỉnh mới vẽ viền.
- **Thanh tiến độ** mảnh 3px ở mép dưới màn hình.
- `resize` / đổi màn hình → dàn lại, giữ token mốc.

## Chế độ hiệu chỉnh ô trống (`H`)

- `js/hole-calibrator.js`: vẽ viền ô trống, kéo để di chuyển, kéo góc để đổi kích thước, phím mũi tên dịch 1% (Shift: 5%).
- Mục đích: Sếp đặt điện thoại thật lên rồi chỉnh ô khớp với phần bị che, ngay trên màn hình toàn cảnh.
- `Enter` lưu, `Esc` huỷ. Chữ dàn lại theo thời gian thực khi kéo.

## File liên quan

`js/prompter-controller.js`, `js/prompter-renderer.js`, `js/hole-calibrator.js`, `css/prompter-screen.css`

## Tiêu chí hoàn thành

- Bấm ↓ liên tục từ đầu đến cuối kịch bản 3.000 từ, không giật, không chữ nào đè ô trống.
- Đổi cỡ chữ khi đang chạy, dòng đang đọc vẫn ở vạch đọc.
- Thoát rồi chạy lại: tiếp tục đúng chỗ.
- Màn hình không tự tắt sau 10 phút đứng yên.
