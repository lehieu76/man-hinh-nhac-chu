# Màn hình nhắc chữ

Web nhắc chữ (teleprompter) để quay video thuyết trình nhìn thẳng camera điện thoại đặt trước màn hình máy tính.

**Dùng ngay:** https://lehieu76.github.io/man-hinh-nhac-chu/

## Cách dùng

1. Dán kịch bản (text thuần, tiếng Việt hoặc tiếng Anh) vào ô bên trái. Mỗi dòng là một đoạn.
2. Chỉnh font, cỡ chữ, cặp màu, lề, độ rộng cột chữ và ô trống (phần điện thoại che) ở panel bên phải. Khung xem trước cập nhật ngay.
3. Bấm **Chạy toàn màn hình**. Đặt điện thoại lên, bấm `H` để kéo ô trống cho khớp, `Enter` để lưu.
4. Dùng bàn phím để tiến / lùi kịch bản.

Kịch bản, cài đặt và vị trí đọc tự lưu trong trình duyệt của máy (localStorage), không gửi lên mạng.

## Phím tắt khi chạy

| Phím | Tác dụng |
|---|---|
| `↓` / `Space` | Tiến 1–3 dòng (theo cài đặt) |
| `↑` | Lùi 1–3 dòng |
| `PgDn` / `PgUp` | Tiến / lùi nửa màn hình |
| `Home` / `End` | Về đầu / tới cuối |
| `+` / `−` | Tăng / giảm cỡ chữ |
| `H` | Hiệu chỉnh ô trống (kéo thả, mũi tên dịch, Ctrl + mũi tên đổi cỡ, `Enter` lưu, `X` huỷ) |
| `Esc` | Thoát về màn soạn |

## Mẹo

- Dòng đang đọc luôn nằm ngay dưới ô trống, sát camera, để ánh mắt không lệch.
- Nếu quay thử thấy mắt liếc trái phải nhiều, giảm **Độ rộng cột chữ** để chữ gom vào giữa dưới camera.
- Chữ phía trên vạch đọc là phần đã đọc, được làm mờ và chạy vòng hai bên ô trống.

## Phát triển

Web tĩnh, JavaScript thuần (ES modules), không có bước build.

```bash
npm start   # http://localhost:8000
npm test    # test lõi dàn chữ (node --test)
```

Kiến trúc: [docs/system-architecture.md](docs/system-architecture.md) · Danh sách file: [docs/codebase-summary.md](docs/codebase-summary.md)
