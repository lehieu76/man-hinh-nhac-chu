// Lõi dàn chữ thuần (không đụng DOM), test được bằng node.
// Mô hình: kịch bản được ngắt dòng MỘT lần theo độ rộng cột chữ (lines). Vị trí đọc là chỉ số dòng k
// đặt tại hàng đọc (ngay dưới ô trống). Từ hàng đọc trở xuống hiển thị lines[k], lines[k+1]... nên
// dòng đang đọc và các dòng sắp đọc không bao giờ đổi ngắt dòng khi tiến/lùi; tiến/lùi chỉ là k ± N.
// Các hàng phía trên hàng đọc (chữ đã đọc, có thể bị ô trống cắt đôi) được dàn NGƯỢC từ token ngay
// trước lines[k] vào các khe còn trống.

export const PARA = '\n';

// Chuẩn hoá text thuần: Unicode NFC (tiếng Việt tổ hợp), mỗi dòng không rỗng là một đoạn
export function normalizeScript(text) {
  return (text || '')
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

// Tách thành mảng từ, chèn PARA giữa các đoạn
export function tokenize(text) {
  const normalized = normalizeScript(text);
  if (!normalized) return [];
  const tokens = [];
  normalized.split('\n').forEach((para, i) => {
    if (i > 0) tokens.push(PARA);
    tokens.push(...para.split(' '));
  });
  return tokens;
}

export function countWords(tokens) {
  return tokens.filter((t) => t !== PARA).length;
}

// Ngắt dòng toàn bộ kịch bản theo độ rộng cột. Mỗi dòng: { start: chỉ số token đầu, text }.
// Dòng trống giữa đoạn (paragraphSpacing) có start = chỉ số token PARA.
export function wrapLines(tokens, width, measure, spaceW, paragraphSpacing = false) {
  const lines = [];
  let words = [];
  let lineW = 0;
  let start = 0;
  const flush = () => {
    if (words.length) lines.push({ start, text: words.join(' ') });
    words = [];
    lineW = 0;
  };
  tokens.forEach((t, i) => {
    if (t === PARA) {
      flush();
      if (paragraphSpacing) lines.push({ start: i, text: '' });
      start = i + 1;
      return;
    }
    const w = measure(t);
    const add = words.length ? spaceW + w : w;
    if (words.length && lineW + add > width) {
      flush();
      start = i;
    }
    words.push(t);
    lineW += words.length > 1 ? add : w;
  });
  flush();
  return lines;
}

// Chỉ số dòng lớn nhất có start <= token (dùng để khôi phục vị trí đọc sau khi đổi cỡ chữ/màn hình)
export function findLineIndex(lines, token) {
  let lo = 0;
  let hi = lines.length - 1;
  let found = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].start <= token) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

// Dàn ngược các token kết thúc tại endTok (không gồm) vào các khe phía trên hàng đọc
function fillAboveReadingRow(tokens, endTok, geo, measure, spaceW, paragraphSpacing) {
  const items = [];
  let i = endTok - 1;
  for (let r = geo.readingRow - 1; r >= 0 && i >= 0; r--) {
    if (tokens[i] === PARA) {
      i--;
      if (paragraphSpacing) continue; // để trống hàng này làm dòng cách đoạn
    }
    const slots = geo.rowSlots[r];
    for (let s = slots.length - 1; s >= 0 && i >= 0 && tokens[i] !== PARA; s--) {
      const slot = slots[s];
      const words = [];
      let used = 0;
      while (i >= 0 && tokens[i] !== PARA) {
        const w = measure(tokens[i]);
        const add = words.length ? spaceW + w : w;
        // Từ dài hơn cả khe: chỉ đặt cưỡng bức vào khe đầy đủ (không cạnh ô trống), khe hẹp thì bỏ qua
        if (used + add > slot.width && !(words.length === 0 && slot.full)) break;
        words.unshift(tokens[i]);
        used += add;
        i--;
        if (used > slot.width) break;
      }
      if (words.length) {
        items.push({ row: r, left: slot.left, width: slot.width, text: words.join(' '), kind: 'read' });
      }
    }
  }
  return items;
}

// Dựng toàn bộ nội dung một khung hình tại vị trí đọc k.
// Kết quả: [{ row, left, width, text, kind: 'read' | 'current' | 'next' }]
export function buildFrame({ tokens, lines, k, geo, measure, spaceW, paragraphSpacing = false }) {
  if (!lines.length) return [];
  const items = [];
  for (let r = geo.readingRow; r < geo.rows; r++) {
    const line = lines[k + r - geo.readingRow];
    if (!line) break;
    if (line.text) {
      items.push({
        row: r, left: geo.colLeft, width: geo.colW, text: line.text,
        kind: r === geo.readingRow ? 'current' : 'next',
      });
    }
  }
  return items.concat(fillAboveReadingRow(tokens, lines[k].start, geo, measure, spaceW, paragraphSpacing));
}
