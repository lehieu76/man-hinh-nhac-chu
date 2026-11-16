// Hình học màn hình chạy: chia hàng, tính cột chữ, ô trống (px) và các khe đặt chữ của từng hàng.
// Hàng giao với ô trống bị cắt thành tối đa 2 khe (trái / phải). Hàng đọc là hàng đầy đủ sát ô trống
// nhất (ngay trên hoặc ngay dưới ô), để dòng đang đọc luôn gần camera.

// readingPosition: 'above' (mặc định — camera ở mép trên điện thoại nên đọc ngay trên ô trống) hoặc
// 'below' (ngay dưới ô). Phía ưu tiên không còn chỗ cho một hàng đầy đủ thì dùng phía còn lại.
function pickReadingRow(rowSlots, aboveRow, belowRow, readingPosition) {
  const order = readingPosition === 'below' ? [belowRow, aboveRow] : [aboveRow, belowRow];
  const row = order.find((r) => r >= 0);
  if (row !== undefined) return row;
  return Math.max(0, rowSlots.findIndex((s) => s.length && s[0].full));
}

export function computeGeometry({
  width, height, margin, fontSize, lineHeight, columnWidthPct, hole, holeGap,
  readingPosition = 'above', minSlotFactor = 4,
}) {
  const rowH = Math.round(fontSize * lineHeight);
  const rows = Math.max(1, Math.floor((height - 2 * margin) / rowH));
  const holeRect = {
    left: ((hole.cx - hole.w / 2) / 100) * width,
    right: ((hole.cx + hole.w / 2) / 100) * width,
    top: ((hole.cy - hole.h / 2) / 100) * height,
    bottom: ((hole.cy + hole.h / 2) / 100) * height,
  };

  // Cột chữ: full ngang hoặc thu hẹp, căn giữa theo tâm ô trống nhưng luôn nằm trong lề màn hình
  const fullW = width - 2 * margin;
  const colW = (fullW * Math.min(100, Math.max(10, columnWidthPct))) / 100;
  const holeCenter = (holeRect.left + holeRect.right) / 2;
  const colLeft = Math.min(Math.max(holeCenter - colW / 2, margin), width - margin - colW);
  const colRight = colLeft + colW;
  const minSlot = fontSize * minSlotFactor;

  const rowSlots = [];
  let aboveRow = -1; // hàng đầy đủ cuối cùng nằm trên ô trống
  let belowRow = -1; // hàng đầy đủ đầu tiên nằm dưới ô trống
  for (let r = 0; r < rows; r++) {
    const top = margin + r * rowH;
    const bottom = top + rowH;
    const hit = top < holeRect.bottom + holeGap && bottom > holeRect.top - holeGap
      && holeRect.right + holeGap > colLeft && holeRect.left - holeGap < colRight;
    if (!hit) {
      rowSlots.push([{ left: colLeft, width: colW, full: true }]);
      if (bottom <= holeRect.top) aboveRow = r;
      if (belowRow < 0 && top >= holeRect.bottom) belowRow = r;
      continue;
    }
    const slots = [];
    const leftW = holeRect.left - holeGap - colLeft;
    if (leftW >= minSlot) slots.push({ left: colLeft, width: leftW, full: false });
    const rightLeft = holeRect.right + holeGap;
    const rightW = colRight - rightLeft;
    if (rightW >= minSlot) slots.push({ left: rightLeft, width: rightW, full: false });
    rowSlots.push(slots);
  }
  const readingRow = pickReadingRow(rowSlots, aboveRow, belowRow, readingPosition);

  return { width, height, margin, rowH, rows, colLeft, colW, holeRect, rowSlots, readingRow };
}

export function rowTop(geo, row) {
  return geo.margin + row * geo.rowH;
}
