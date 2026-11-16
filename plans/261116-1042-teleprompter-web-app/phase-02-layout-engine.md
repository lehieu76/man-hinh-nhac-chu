---
phase: 02
title: "Layout engine (lõi dàn chữ)"
status: completed
priority: P1
effort: 4h
dependsOn: [01]
---

# Phase 02 — Layout engine (lõi dàn chữ)

## Mục tiêu

Viết bộ dàn chữ thuần (không đụng DOM) quyết định từ nào nằm ở khe nào trên màn hình, với ô trống đứng yên và chữ cuộn theo bước dòng. Đây là phần khó nhất và rủi ro nhất của dự án.

## Khái niệm

- **Token**: một từ hoặc dấu ngắt đoạn `¶` (tách từ theo khoảng trắng từ text thuần).
- **Hàng (row)**: màn hình chia thành các hàng cao `rowH = fontSize × lineHeight`, bắt đầu từ lề trên. Số hàng `rows = floor((H − 2·margin) / rowH)`.
- **Khe (slot)**: đoạn ngang trong một hàng nơi được đặt chữ.
  - Hàng không giao ô trống → 1 khe = cả cột chữ `[colLeft, colRight]`.
  - Hàng giao ô trống → tối đa 2 khe: trái `[colLeft, holeLeft − gap]`, phải `[holeRight + gap, colRight]`. Khe hẹp hơn `minSlotWidth` (mặc định ~4 lần cỡ chữ) thì bỏ.
  - Hai khe trái/phải của cùng hàng được đọc theo thứ tự trái → phải, như một dòng bị ô trống cắt đôi.
- **Cột chữ**: full `[margin, W − margin]`, hoặc thu hẹp theo `columnWidthPct`, căn giữa theo tâm ngang ô trống (kẹp trong màn hình).
- **Hàng đọc (reading row)**: hàng đầu tiên nằm hoàn toàn dưới đáy ô trống (+ `readingRowOffset` chỉnh được, mặc định 0). Vạch đọc vẽ ở hàng này.

## Mô hình trạng thái (để tiến/lùi chính xác)

- **Trạng thái** `S = { firstToken, blankRows }`: màn hình bắt đầu bằng `blankRows` hàng trống rồi mới dàn chữ từ `firstToken`.
- **Trạng thái đầu** `S0 = { firstToken: 0, blankRows: readingRow }` → dòng đầu kịch bản nằm ngay vạch đọc, phía trên trống.
- **Tiến N dòng** (`N = stepLines` 1–3): từ `S`, dàn chữ cho N hàng đầu tiên; nếu còn hàng trống thì trừ `blankRows` trước, phần còn lại bỏ token đã chiếm các hàng đó → `S'`.
- **Lùi**: không tính ngược (vì ngắt dòng phụ thuộc vị trí). Thay vào đó engine sinh **chuỗi trạng thái xác định** `S0, S1, S2…` (lười, cache), lùi = về phần tử trước. Đảm bảo tiến-rồi-lùi luôn khớp.
- **Kết thúc**: dừng tiến khi token cuối đã lên đến hàng đọc.
- **Đổi cài đặt / resize**: lấy token đang ở hàng đọc làm **mốc**, sinh lại chuỗi, chọn trạng thái đầu tiên có token mốc ở hàng đọc hoặc trên đó.
- **Vị trí lưu**: lưu index token ở hàng đọc (không lưu index trạng thái, vì đổi màn hình sẽ khác).

## Thuật toán dàn một trạng thái

1. Sinh danh sách khe từ hàng `blankRows` trở xuống.
2. Duyệt token: đặt từ vào khe hiện tại nếu `x + width(từ) ≤ slotRight`; không vừa thì sang khe kế.
3. Từ dài hơn cả khe: nếu khe là khe hẹp cạnh ô → bỏ qua khe đó; nếu khe đầy đủ → cắt từ theo ký tự (hiếm gặp).
4. Gặp `¶`: kết thúc dòng hiện tại (bỏ nốt khe phải cùng hàng nếu đang ở khe trái), tuỳ chọn chèn thêm `paragraphGap` hàng trống (mặc định 0, chỉnh 0–1).
5. Đầu ra: `[{ row, slotIndex, x, y, text }]` (mỗi khe một chuỗi chữ đã ghép).

Đo chữ: nhận `measure(text) → px` từ ngoài; trình duyệt dùng `text-measurer.js` (canvas, cache theo font + từ). Khoảng trắng đo một lần.

## Việc cần làm

- [ ] `js/layout-engine.js`: `tokenize(text)`, `buildSlots(geometry)`, `layoutState(tokens, slots, state, measure)`, `createStateSequence(...)` với `next()`, `prev()`, `seekToToken(i)`.
- [ ] `js/text-measurer.js`: tạo canvas ẩn, `ctx.font` khớp CSS của màn chạy, cache `Map`.
- [ ] `tests/layout-engine.test.js` (dùng hàm đo giả `len × 10px`):
  - Không từ nào có hộp giao với ô trống, ở mọi trạng thái của kịch bản mẫu 2.000 từ.
  - `next()` N lần rồi `prev()` N lần quay về đúng `S0`.
  - Dòng đầu của `S0` nằm đúng hàng đọc.
  - Ngắt đoạn kết thúc dòng đúng; khe hẹp hơn ngưỡng bị bỏ.
  - `seekToToken` sau khi đổi cỡ chữ đưa token mốc về hàng đọc.
  - Cột thu hẹp nằm gọn trong màn hình khi ô trống sát mép.

## File liên quan

`js/layout-engine.js`, `js/text-measurer.js`, `tests/layout-engine.test.js`

## Tiêu chí hoàn thành

- `npm test` pass toàn bộ.
- Dàn 3.000 từ cho một trạng thái dưới 5ms trên máy thường (đo bằng `performance.now()`).

## Ghi chú triển khai (16/11/2026)

Khi làm, mô hình trạng thái được đơn giản hoá mà vẫn đạt đủ yêu cầu. Kịch bản được ngắt dòng một lần theo độ rộng cột, vị trí đọc là chỉ số dòng `k`, nên tiến/lùi chỉ là `k ± N`. Từ hàng đọc trở xuống hiển thị `lines[k…]`; phía trên hàng đọc dàn ngược token vào các khe cạnh ô trống. Không cần chuỗi trạng thái hay cache. Chi tiết xem `docs/system-architecture.md`.
