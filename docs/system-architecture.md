# Kiến trúc hệ thống

Web tĩnh một trang, JavaScript thuần (ES modules), không build, chạy trên GitHub Pages.

## Luồng chính

```
Màn soạn (editor-screen) ──persist──▶ localStorage (settings-store)
      │ click "Chạy" → requestFullscreen
      ▼
Màn chạy (prompter-controller)
      │ phím ↑/↓/PgUp/PgDn/Home/End/+/−/H/Esc
      ▼
prompter-layout = layout-geometry + layout-engine (thuần) + text-measurer (canvas)
      ▼
prompter-renderer → div tuyệt đối trong #prompter-stage
```

Khung xem trước ở màn soạn dùng chính `prompter-layout` + `prompter-renderer` với kích thước `screen.width × screen.height`, rồi thu nhỏ bằng CSS `transform: scale()`.

## Mô hình dàn chữ (phần dễ quên nhất)

**Hình học** (`layout-geometry.js`):
- Màn hình chia thành `rows` hàng, mỗi hàng cao `rowH = fontSize × lineHeight`, bắt đầu từ lề trên.
- Ô trống (điện thoại) lưu theo % màn hình: tâm `cx, cy`, kích thước `w, h`.
- Mỗi hàng có danh sách **khe** (slot). Hàng không giao ô trống: 1 khe bằng cả cột chữ (`full: true`). Hàng giao ô trống (mở rộng thêm `holeGap`): tối đa 2 khe trái / phải. Khe hẹp hơn `4 × fontSize` bị bỏ.
- **Hàng đọc** (`readingRow`): hàng đầu tiên không giao ô trống và nằm hoàn toàn dưới đáy ô.
- Cột chữ thu hẹp được căn giữa theo tâm ô trống, kẹp trong lề màn hình.

**Dàn chữ** (`layout-engine.js`):
- Kịch bản được tách token (từ + dấu đoạn `PARA`) rồi **ngắt dòng một lần** theo độ rộng cột → `lines[]`, mỗi dòng nhớ `start` (token đầu).
- **Vị trí đọc** là chỉ số dòng `k`. Tiến / lùi chỉ là `k ± stepLines`, nên tiến rồi lùi luôn khớp tuyệt đối.
- Từ hàng đọc trở xuống: hiển thị `lines[k], lines[k+1], …` (các hàng này luôn nằm dưới ô trống nên luôn là khe đầy đủ). Dòng đang đọc và dòng sắp đọc không bao giờ đổi ngắt dòng.
- Phía trên hàng đọc: dàn **ngược** các token đứng trước `lines[k].start` vào khe của từng hàng (từ hàng sát vạch đọc lên trên, khe phải trước rồi khe trái). Phần này là chữ đã đọc, có thể đổi ngắt dòng khi tiến / lùi, được làm mờ.
- Vị trí lưu vào localStorage là **chỉ số token** (`readingTokenIndex`), không phải `k`, vì `k` đổi khi cỡ chữ / màn hình đổi. Khôi phục bằng `findLineIndex` (dòng lớn nhất có `start ≤ token`).
- Engine nhận hàm `measure(text)` từ ngoài, nên test bằng node với hàm đo giả.

## Màn chạy

- `requestFullscreen` gọi đồng bộ trong handler click (yêu cầu của trình duyệt). Chờ `document.fonts.load` trước khi đo chữ.
- Hiệu ứng trượt: lớp chữ mới được vẽ ngay rồi chạy Web Animation từ `translateY(±N × rowH)` về 0 trong 120ms.
- Giữ phím: tối đa ~10 bước/giây. Wake Lock giữ màn hình sáng, xin lại khi tab hiện lại.
- Thoát fullscreen (Esc) → về màn soạn, lưu vị trí.
- Hiệu chỉnh ô trống (`H`): `hole-calibrator.js` vẽ ô kéo thả, mỗi thay đổi dàn lại chữ theo thời gian thực. Thoát fullscreen giữa chừng = huỷ.

## Lưu trữ

Key `teleprompter.v1` trong localStorage: `{ script, settings, readingTokenIndex }`. Khi tải, `settings` được gộp với mặc định để tương thích khi thêm cài đặt mới. Ghi có debounce 300ms, ghi ngay khi thoát màn chạy và khi đóng tab.
