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
- **Hàng đọc** (`readingRow`): hàng đầy đủ sát ô trống nhất. Mặc định (`readingPosition: 'above'`) là hàng ngay **trên** ô, vì camera ở mép trên điện thoại; `'below'` là hàng ngay dưới ô. Phía ưu tiên không còn chỗ cho một hàng đầy đủ thì dùng phía còn lại.
- Cột chữ thu hẹp được căn giữa theo tâm ô trống, kẹp trong lề màn hình.

**Dàn chữ** (`layout-engine.js`):
- Kịch bản được tách token (từ + dấu đoạn `PARA`) rồi **ngắt dòng một lần** theo độ rộng cột → `lines[]`, mỗi dòng nhớ `start` (token đầu).
- **Vị trí đọc** là chỉ số dòng `k`. Tiến / lùi chỉ là `k ± stepLines`, nên tiến rồi lùi luôn khớp tuyệt đối.
- Hàng đọc là hàng đầy đủ nên luôn hiển thị đúng `lines[k]`.
- Từ hàng đọc trở xuống: dàn **xuôi** từ `lines[k].start` vào khe của từng hàng (trái rồi phải). Hàng đầy đủ cho ra đúng các dòng `lines[k+1], …`; hàng cạnh ô trống (khi ô nằm dưới vạch đọc) chỉ chứa phần chữ vừa khe.
- Phía trên hàng đọc: dàn **ngược** các token đứng trước `lines[k].start` (khe phải trước rồi khe trái). Phần này là chữ đã đọc, được làm mờ.
- **Không được giả định** hàng nào luôn đầy đủ ngoài hàng đọc: ô trống có thể nằm bất kỳ đâu (lỗi 16/11/2026: các dòng dưới vạch đọc từng được vẽ full ngang và đè lên ô trống khi ô nằm thấp).
- Hàng đầy đủ dùng cùng quy tắc ngắt dòng với `wrapLines` (hàm `fillSlot`), nên tiến / lùi không làm đổi dòng đang đọc.
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
