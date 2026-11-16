---
phase: 01
title: "Khởi tạo project & khung app"
status: completed
priority: P2
effort: 1h
dependsOn: []
---

# Phase 01 — Khởi tạo project & khung app

## Mục tiêu

Có repo git, khung trang chạy được trên trình duyệt với 2 màn hình rỗng (soạn / chạy) và cơ chế chuyển qua lại.

## Việc cần làm

- [ ] `git init`, tạo `.gitignore` (bỏ `node_modules/`, `.DS_Store`, `plans/reports/` nếu Sếp muốn giữ riêng).
- [ ] `README.md`: mô tả ngắn, cách dùng, phím tắt, link GitHub Pages (điền sau).
- [ ] `index.html`: khung 2 `<section>` — `#editor-screen` và `#prompter-screen` (ẩn mặc định). Nạp `js/app-main.js` dạng `type="module"`. Nạp Google Fonts (Be Vietnam Pro, Inter, Roboto, Noto Serif — subset `vietnamese`).
- [ ] `js/app-main.js`: hàm `showScreen(name)`; khởi động đọc settings, gắn editor.
- [ ] `css/editor-screen.css`, `css/prompter-screen.css`: reset cơ bản, layout 2 cột cho màn soạn (ô kịch bản bên trái, panel cài đặt bên phải).
- [ ] `package.json` tối thiểu chỉ để chạy test: `"scripts": { "test": "node --test tests/" }` (không có dependency).
- [ ] Chạy thử local: `npx serve .` hoặc `python3 -m http.server` (ES modules cần http, không mở thẳng file://).

## File liên quan

`index.html`, `js/app-main.js`, `css/*.css`, `README.md`, `.gitignore`, `package.json`

## Tiêu chí hoàn thành

- Mở `http://localhost:8000` thấy màn soạn; console không lỗi.
- `npm test` chạy được (chưa có test cũng không lỗi).
