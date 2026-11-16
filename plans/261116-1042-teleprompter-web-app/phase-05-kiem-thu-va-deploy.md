---
phase: 05
title: "Kiểm thử thực tế & deploy GitHub Pages"
status: in-progress
priority: P2
effort: 3h
dependsOn: [04]
---

# Phase 05 — Kiểm thử thực tế & deploy GitHub Pages

## Mục tiêu

Kiểm thử trên trình duyệt thật, đưa lên GitHub Pages, cập nhật tài liệu.

## Kiểm thử

- [ ] `npm test` pass (layout engine).
- [ ] Kiểm thử bằng trình duyệt tự động (agent-browser): dán kịch bản mẫu tiếng Việt + tiếng Anh, vào chế độ chạy, bấm phím, chụp màn hình ở đầu / giữa / cuối kịch bản, kiểm tra chữ không đè ô trống.
- [ ] Kiểm thử thủ công của Sếp (checklist):
  - Dán kịch bản thật từ Google Docs.
  - Đặt điện thoại thật, dùng `H` chỉnh ô trống cho khớp.
  - Quay thử 1 phút, xem lại video: ánh mắt có lệch khỏi camera không, có cần thu hẹp cột không.
  - Thử các cặp màu dưới ánh sáng phòng quay (màn hình có hắt lên mặt không).
- [ ] Trình duyệt: Chrome và Edge trên Windows (chính). Firefox chỉ cần chạy được.
- [ ] Màn hình: laptop 1920×1080 scale 125–150%, màn rời 2K/4K.

## Deploy

- [ ] Commit theo conventional commits.
- [ ] `gh.exe repo create man-hinh-nhac-chu --public --source=. --push`
- [ ] Bật Pages từ nhánh `main`, thư mục gốc: `gh.exe api -X POST repos/lehieu76/man-hinh-nhac-chu/pages -f "source[branch]=main" -f "source[path]=/"`
- [ ] Kiểm tra link `https://lehieu76.github.io/man-hinh-nhac-chu/` (đường dẫn tương đối trong `index.html` phải chạy được dưới thư mục con).
- [ ] Ghi link vào `README.md`.

## Tài liệu

- [ ] `README.md`: cách dùng, phím tắt, mẹo đặt điện thoại.
- [ ] `docs/system-architecture.md`: mô hình khe/hàng/trạng thái của layout engine (phần dễ quên nhất khi sửa sau này).
- [ ] `docs/codebase-summary.md`: danh sách file và vai trò.

## Tiêu chí hoàn thành

- Link GitHub Pages mở được, chạy đủ tính năng như local.
- Sếp quay thử thành công với kịch bản thật.
