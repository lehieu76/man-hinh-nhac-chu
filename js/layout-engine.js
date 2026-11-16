// Lõi dàn chữ thuần (không đụng DOM), test được bằng node.
// Mô hình: kịch bản được ngắt dòng MỘT lần theo độ rộng cột chữ (lines). Vị trí đọc là chỉ số dòng k
// đặt tại hàng đọc (hàng đầy đủ sát ô trống); tiến/lùi chỉ là k ± N. Hàng đọc luôn hiển thị đúng
// lines[k]. Từ hàng đọc trở xuống dàn XUÔI từ lines[k].start vào các khe (chạy vòng ô trống nếu ô nằm
// bên dưới); phía trên hàng đọc dàn NGƯỢC từ token ngay trước lines[k] (chữ đã đọc).

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

// Đặt chữ vào một khe, đi xuôi (dir = 1) hoặc ngược (dir = -1) từ token i, dừng trước PARA.
// Cùng quy tắc với wrapLines nên khe đầy đủ cho ra đúng dòng như lines[].
function fillSlot(tokens, i, slot, dir, measure, spaceW) {
  const words = [];
  let used = 0;
  while (i >= 0 && i < tokens.length && tokens[i] !== PARA) {
    const w = measure(tokens[i]);
    const add = words.length ? spaceW + w : w;
    // Từ dài hơn cả khe: chỉ đặt cưỡng bức vào khe đầy đủ (không cạnh ô trống), khe hẹp thì bỏ qua
    if (used + add > slot.width && !(words.length === 0 && slot.full)) break;
    if (dir > 0) words.push(tokens[i]);
    else words.unshift(tokens[i]);
    used += add;
    i += dir;
    if (used > slot.width) break;
  }
  return { text: words.join(' '), next: i };
}

// Dàn token từ startTok vào các hàng theo thứ tự rows (xuôi: trái → phải, ngược: phải → trái)
function fillRows({ tokens, startTok, rows, dir, kindOf, geo, measure, spaceW, paragraphSpacing }) {
  const items = [];
  let i = startTok;
  const inRange = () => i >= 0 && i < tokens.length;
  for (const r of rows) {
    if (!inRange()) break;
    if (tokens[i] === PARA) {
      i += dir;
      if (paragraphSpacing) continue; // để trống hàng này làm dòng cách đoạn
    }
    const slots = dir > 0 ? geo.rowSlots[r] : [...geo.rowSlots[r]].reverse();
    for (const slot of slots) {
      if (!inRange() || tokens[i] === PARA) break;
      const { text, next } = fillSlot(tokens, i, slot, dir, measure, spaceW);
      if (text) items.push({ row: r, left: slot.left, width: slot.width, text, kind: kindOf(r) });
      i = next;
    }
  }
  return items;
}

function range(from, to, step) {
  const out = [];
  for (let r = from; step > 0 ? r < to : r > to; r += step) out.push(r);
  return out;
}

// Dựng toàn bộ nội dung một khung hình tại vị trí đọc k.
// Kết quả: [{ row, left, width, text, kind: 'read' | 'current' | 'next' }]
export function buildFrame({ tokens, lines, k, geo, measure, spaceW, paragraphSpacing = false }) {
  if (!lines.length) return [];
  const common = { tokens, geo, measure, spaceW, paragraphSpacing };
  const start = lines[k].start;
  const below = fillRows({
    ...common, startTok: start, rows: range(geo.readingRow, geo.rows, 1), dir: 1,
    kindOf: (r) => (r === geo.readingRow ? 'current' : 'next'),
  });
  const above = fillRows({
    ...common, startTok: start - 1, rows: range(geo.readingRow - 1, -1, -1), dir: -1, kindOf: () => 'read',
  });
  return below.concat(above);
}
