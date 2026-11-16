# Tóm tắt codebase

| File | Vai trò |
|---|---|
| `index.html` | Trang duy nhất: màn soạn (`#editor-screen`) và màn chạy (`#prompter-screen`) |
| `css/editor-screen.css` | Giao diện màn soạn và panel cài đặt |
| `css/prompter-screen.css` | Màn chạy, khung xem trước, vạch đọc, hiệu chỉnh ô trống |
| `js/app-main.js` | Khởi động, chuyển qua lại giữa hai màn hình |
| `js/settings-store.js` | Cài đặt mặc định, trạng thái app, đọc / ghi localStorage |
| `js/color-presets.js` | 6 cặp màu chữ / nền chọn nhanh |
| `js/settings-form-binding.js` | Gắn các ô `data-setting` vào `state.settings` (2 chiều) |
| `js/editor-screen.js` | Ô kịch bản, thống kê số từ, nút cặp màu, xem trước, các nút thao tác |
| `js/layout-geometry.js` | **Thuần.** Hàng, cột chữ, ô trống, khe đặt chữ, hàng đọc |
| `js/layout-engine.js` | **Thuần.** Chuẩn hoá text, tách token, ngắt dòng, dựng khung hình |
| `js/text-measurer.js` | Đo chữ bằng canvas có cache, chờ web font tải xong |
| `js/prompter-layout.js` | Ghép engine thuần với bộ đo của trình duyệt |
| `js/prompter-renderer.js` | Vẽ khung hình ra DOM |
| `js/prompter-controller.js` | Fullscreen, phím tắt, hiệu ứng trượt, wake lock, resize |
| `js/hole-calibrator.js` | Chế độ kéo thả chỉnh ô trống trên màn chạy |
| `tests/layout-engine.test.js` | Test lõi dàn chữ (`npm test`) |

Chi tiết mô hình dàn chữ: [system-architecture.md](system-architecture.md).
