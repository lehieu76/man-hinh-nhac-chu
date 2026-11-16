---
title: "Web nhắc chữ (teleprompter) cho quay video nhìn thẳng camera"
description: "Web tĩnh trên GitHub Pages: dán kịch bản, chừa ô trống cho điện thoại, chữ chạy vòng, vạch đọc sát camera, bấm phím để tiến/lùi."
status: in-progress
priority: P2
effort: 13h
branch: main
tags: [frontend, vanilla-js, github-pages]
blockedBy: []
blocks: []
created: 2026-11-16
---

# Web nhắc chữ — Plan tổng

## Bối cảnh

Sếp quay video thuyết trình, điện thoại đặt trước màn hình máy tính, màn hình hiển thị kịch bản.
Hiện dùng Google Docs phải phóng to thủ công, không ưng ý. Cần một web chuyên dụng.

## Yêu cầu đã chốt (từ trao đổi 15–16/11/2026)

| # | Yêu cầu | Chi tiết |
|---|---|---|
| 1 | Dán kịch bản | **Text thuần** tiếng Việt hoặc tiếng Anh, giữ ngắt đoạn; không giữ định dạng (đậm, màu…) |
| 2 | Ô trống cho điện thoại | Ô chữ nhật chỉnh được vị trí + kích thước; **chữ chạy vòng hai bên ô** |
| 3 | Vạch đọc | Cố định ngay dưới ô trống, dòng đang đọc luôn sát camera |
| 4 | Cột chữ | Mặc định full ngang; tuỳ chọn thu hẹp, căn giữa theo ô trống |
| 5 | Giao diện | Chọn font, cỡ chữ, giãn dòng; cặp màu nền/chữ tương phản chọn nhanh + tự chọn màu |
| 6 | Lề | Mặc định ~0,5cm (quy ra 20px), chỉnh được |
| 7 | Khi chạy | Luôn toàn màn hình, không tự cuộn |
| 8 | Điều khiển | Bàn phím: ↑/↓ nhảy **1–3 dòng** (tuỳ setting) |
| 9 | Lưu trữ | Tự lưu **một** kịch bản + cài đặt + vị trí đọc trong trình duyệt (localStorage) |
| 10 | Triển khai | GitHub Pages, repo **public** (kịch bản không bao giờ rời máy) |

## Kiến trúc tóm tắt

- **Vanilla JS + ES modules, không build step.** GitHub Pages phục vụ thẳng file tĩnh. Không framework, không npm runtime.
- **Bộ dàn chữ tự viết (layout engine)** thay cho cuộn trang thông thường, vì ô trống đứng yên còn chữ thì di chuyển: mỗi lần bấm phím, chữ được dàn lại vào các "khe" trên màn hình.
- Engine là **hàm thuần** (nhận hàm đo chữ từ ngoài) để test được bằng `node --test`, không cần trình duyệt.

```
 Màn hình soạn (editor + settings)  ──lưu──▶  localStorage
          │ bấm "Chạy" (fullscreen)
          ▼
 Màn hình chạy ──▶ layout-engine (thuần) ──▶ renderer (div tuyệt đối)
          ▲ phím ↑/↓/PgUp/PgDn/Home/+/−/Esc
```

## Các phase

| Phase | Tên | Effort | Phụ thuộc | Trạng thái |
|---|---|---|---|---|
| 01 | [Khởi tạo project & khung app](phase-01-khoi-tao-project.md) | 1h | — | completed |
| 02 | [Layout engine (lõi dàn chữ)](phase-02-layout-engine.md) | 4h | 01 | completed |
| 03 | [Màn hình soạn, dán kịch bản & cài đặt](phase-03-man-hinh-soan-va-cai-dat.md) | 2h | 01 | completed |
| 04 | [Màn hình chạy & điều khiển phím](phase-04-man-hinh-chay.md) | 3h | 02, 03 | completed |
| 05 | [Kiểm thử thực tế & deploy GitHub Pages](phase-05-kiem-thu-va-deploy.md) | 3h | 04 | in-progress |

Phase 02 và 03 làm song song được (không chung file).

## Cấu trúc file dự kiến

```
index.html                         # 1 trang, 2 màn hình (soạn / chạy)
css/editor-screen.css
css/prompter-screen.css
js/app-main.js                     # khởi động, chuyển màn hình
js/settings-store.js               # mặc định + đọc/ghi localStorage
js/color-presets.js                # danh sách cặp màu
js/editor-screen.js                # ô soạn (textarea) + panel cài đặt
js/layout-engine.js                # THUẦN: tokenize, tạo khe, dàn dòng, chuỗi trạng thái
js/text-measurer.js                # đo chữ bằng canvas (cache)
js/prompter-renderer.js            # vẽ khe/dòng ra DOM
js/prompter-controller.js          # fullscreen, phím, wake lock, resize
js/hole-calibrator.js              # kéo/thả chỉnh ô trống ngay trên màn chạy
tests/layout-engine.test.js        # node --test
docs/                              # tài liệu dự án
```

Mỗi file JS giữ dưới 200 dòng.

## Rủi ro chính

| Rủi ro | Ảnh hưởng | Cách xử lý |
|---|---|---|
| Ngắt dòng thay đổi khi chữ đi ngang qua ô trống | Phần chữ cạnh ô "nhảy" | Chấp nhận: phần cạnh ô là chữ đã đọc; dòng ở vạch đọc luôn đầy đủ |
| Đo chữ sai khi font web chưa tải xong | Chữ tràn/đè | Chờ `document.fonts.ready` + đo lại khi font load xong |
| Tiếng Việt dán từ nguồn khác nhau ở dạng Unicode tổ hợp (NFD) | Dấu hiển thị lệch, đo chữ sai | Chuẩn hoá `text.normalize('NFC')` khi nhận kịch bản |
| Trình duyệt chặn fullscreen nếu không có thao tác người dùng | Không vào toàn màn hình | Chỉ gọi `requestFullscreen` trong handler click nút "Chạy" |
| Ô trống chừa sai chỗ so với điện thoại thật | Chữ bị che | Chế độ hiệu chỉnh kéo/thả ngay trên màn hình chạy (phase 04) |

## Tiêu chí hoàn thành toàn dự án

- Dán kịch bản dài ~3.000 từ từ Google Docs, giữ đúng ngắt đoạn, không lỗi tiếng Việt.
- Ở chế độ chạy, không dòng chữ nào đè lên ô trống ở mọi vị trí cuộn.
- ↑/↓ tiến/lùi đúng số dòng đã cài; lùi về đầu rồi tiến lại cho ra đúng các trạng thái như lần đầu.
- Đóng trình duyệt, mở lại: kịch bản, cài đặt, vị trí đọc còn nguyên.
- Truy cập được qua link GitHub Pages.

## Quyết định đã chốt (16/11/2026)

1. Hiệu ứng bấm phím: **trượt mượt ~120ms**, có nút tắt.
2. Font: Be Vietnam Pro, Inter, Roboto, Noto Serif + font hệ thống, không thêm.
3. Chỉ lưu **một kịch bản**.
4. Repo `man-hinh-nhac-chu` (public), link `https://lehieu76.github.io/man-hinh-nhac-chu/`.
5. Màn soạn nhận **text thuần**, không giữ chữ đậm từ Google Docs.

## Câu hỏi còn mở

Không còn.
