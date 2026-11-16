import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeGeometry, rowTop } from '../js/layout-geometry.js';
import {
  PARA, normalizeScript, tokenize, countWords, wrapLines, findLineIndex, buildFrame,
} from '../js/layout-engine.js';

// Hàm đo giả: mỗi ký tự 10px
const measure = (t) => t.length * 10;
const SPACE = 10;

const BASE = {
  width: 1920, height: 1080, margin: 20, fontSize: 40, lineHeight: 1.35,
  columnWidthPct: 100, holeGap: 16, hole: { cx: 50, cy: 11, w: 18, h: 22 },
};

function sampleScript(paragraphs = 40) {
  const words = 'Xin chào các bạn hôm nay mình sẽ chia sẻ về cách quay video thuyết trình nhìn thẳng camera supercalifragilistic'.split(' ');
  return Array.from({ length: paragraphs }, (_, p) => (
    Array.from({ length: 30 + (p % 7) * 5 }, (_, i) => words[(i + p) % words.length]).join(' ')
  )).join('\n\n');
}

function setup(overrides = {}, paragraphSpacing = false) {
  const geo = computeGeometry({ ...BASE, ...overrides });
  const tokens = tokenize(sampleScript());
  const lines = wrapLines(tokens, geo.colW, measure, SPACE, paragraphSpacing);
  const frameAt = (k) => buildFrame({ tokens, lines, k, geo, measure, spaceW: SPACE, paragraphSpacing });
  return { geo, tokens, lines, frameAt };
}

const GEOMETRIES = {
  'ô trống trên giữa': {},
  'ô trống lệch trái, giữa màn': { hole: { cx: 25, cy: 40, w: 20, h: 25 } },
  'cột thu hẹp 50%': { columnWidthPct: 50 },
  'ô trống sát mép phải + cột hẹp': { hole: { cx: 92, cy: 15, w: 14, h: 30 }, columnWidthPct: 60 },
};

test('normalizeScript: NFC, gộp khoảng trắng, bỏ dòng trống thừa', () => {
  const nfd = 'Việt'; // "Việt" dạng tổ hợp
  assert.equal(normalizeScript(`  ${nfd}   nam \r\n\r\n\r\n  hello\tworld  `), 'Việt nam\nhello world');
  assert.equal(normalizeScript(''), '');
});

test('tokenize: chèn PARA giữa các đoạn, kịch bản rỗng → mảng rỗng', () => {
  assert.deepEqual(tokenize('a b\n\nc'), ['a', 'b', PARA, 'c']);
  assert.deepEqual(tokenize('   \n  '), []);
  assert.equal(countWords(tokenize('a b\nc')), 3);
});

test('wrapLines: không dòng nào vượt độ rộng (trừ từ đơn quá dài), đoạn mới luôn xuống dòng', () => {
  const tokens = tokenize('aaa bbb ccc ddd\neee');
  const lines = wrapLines(tokens, 75, measure, SPACE);
  assert.deepEqual(lines.map((l) => l.text), ['aaa bbb', 'ccc ddd', 'eee']);
  assert.deepEqual(lines.map((l) => l.start), [0, 2, 5]);
  const spaced = wrapLines(tokens, 75, measure, SPACE, true);
  assert.deepEqual(spaced.map((l) => l.text), ['aaa bbb', 'ccc ddd', '', 'eee']);
});

for (const [name, overrides] of Object.entries(GEOMETRIES)) {
  test(`không chữ nào đè ô trống ở mọi vị trí đọc — ${name}`, () => {
    const { geo, lines, frameAt } = setup(overrides);
    const h = geo.holeRect;
    for (let k = 0; k < lines.length; k++) {
      for (const it of frameAt(k)) {
        const top = rowTop(geo, it.row);
        const right = it.left + measure(it.text);
        const overlap = it.left < h.right && right > h.left && top < h.bottom && top + geo.rowH > h.top;
        assert.ok(!overlap, `k=${k} row=${it.row} "${it.text}" đè ô trống`);
        assert.ok(it.left >= geo.margin - 0.01 && it.left + it.width <= geo.width - geo.margin + 0.01);
      }
    }
  });
}

test('dòng ở hàng đọc luôn là lines[k], hàng đọc nằm dưới ô trống', () => {
  const { geo, lines, frameAt } = setup();
  assert.ok(rowTop(geo, geo.readingRow) >= geo.holeRect.bottom);
  for (let k = 0; k < lines.length; k++) {
    const current = frameAt(k).find((it) => it.kind === 'current');
    assert.equal(current?.text, lines[k].text);
    assert.equal(current.row, geo.readingRow);
  }
});

test('chữ phía trên hàng đọc nối liền đúng thứ tự với dòng đang đọc', () => {
  for (const spacing of [false, true]) {
    const { tokens, lines, frameAt } = setup({}, spacing);
    for (const k of [5, 17, 40, lines.length - 1]) {
      const above = frameAt(k).filter((it) => it.kind === 'read')
        .sort((a, b) => a.row - b.row || a.left - b.left)
        .flatMap((it) => it.text.split(' '));
      const before = tokens.slice(0, lines[k].start).filter((t) => t !== PARA);
      assert.deepEqual(above, before.slice(before.length - above.length), `k=${k} spacing=${spacing}`);
      assert.ok(above.length > 0);
    }
  }
});

test('vị trí đầu: phía trên hàng đọc trống; tiến rồi lùi về đúng khung cũ', () => {
  const { frameAt } = setup();
  assert.equal(frameAt(0).filter((it) => it.kind === 'read').length, 0);
  assert.deepEqual(frameAt(12), frameAt(12));
});

test('findLineIndex: khôi phục đúng dòng, kể cả sau khi đổi cỡ chữ', () => {
  const { lines } = setup();
  lines.forEach((l, k) => assert.equal(findLineIndex(lines, l.start), k));
  const anchor = lines[30].start;
  const bigger = setup({ fontSize: 64 });
  const k2 = findLineIndex(bigger.lines, anchor);
  assert.ok(bigger.lines[k2].start <= anchor);
  assert.ok(!bigger.lines[k2 + 1] || bigger.lines[k2 + 1].start > anchor);
});

test('cột thu hẹp nằm gọn trong màn hình khi ô trống sát mép', () => {
  const geo = computeGeometry({ ...BASE, hole: { cx: 97, cy: 10, w: 6, h: 20 }, columnWidthPct: 50 });
  assert.ok(geo.colLeft >= BASE.margin);
  assert.ok(geo.colLeft + geo.colW <= BASE.width - BASE.margin + 0.01);
});

test('khe quá hẹp cạnh ô trống bị bỏ', () => {
  const geo = computeGeometry({ ...BASE, hole: { cx: 50, cy: 11, w: 90, h: 22 } });
  const hitRows = geo.rowSlots.filter((slots) => !slots[0]?.full);
  assert.ok(hitRows.length > 0);
  hitRows.forEach((slots) => assert.equal(slots.length, 0));
});

// Lỗi thực tế 16/11: kéo ô trống xuống thấp + đổi cỡ chữ → chữ đè ô trống, vạch đọc xuống dòng cuối
const HOLES = {
  'trên giữa': { cx: 50, cy: 11, w: 18, h: 22 },
  'giữa màn hình': { cx: 50, cy: 45, w: 20, h: 30 },
  'dưới giữa (điện thoại trên chân đế)': { cx: 50, cy: 75, w: 20, h: 40 },
  'chạm đáy': { cx: 50, cy: 85, w: 25, h: 30 },
  'lệch trái': { cx: 20, cy: 60, w: 15, h: 35 },
};

function overlaps(geo, it) {
  const h = geo.holeRect;
  const top = rowTop(geo, it.row);
  return it.left < h.right && it.left + measure(it.text) > h.left && top < h.bottom && top + geo.rowH > h.top;
}

test('quét mọi cỡ chữ × vị trí ô trống × vị trí vạch đọc: không chữ nào đè ô trống', () => {
  const tokens = tokenize(sampleScript(10));
  for (const [name, hole] of Object.entries(HOLES)) {
    for (let fontSize = 24; fontSize <= 200; fontSize += 8) {
      for (const readingPosition of ['above', 'below']) {
        for (const spacing of [false, true]) {
          const geo = computeGeometry({ ...BASE, fontSize, hole, readingPosition });
          const lines = wrapLines(tokens, geo.colW, measure, SPACE, spacing);
          const readingFull = geo.rowSlots[geo.readingRow][0]?.full;
          for (let k = 0; k < lines.length; k += 3) {
            const frame = buildFrame({ tokens, lines, k, geo, measure, spaceW: SPACE, paragraphSpacing: spacing });
            const bad = frame.find((it) => overlaps(geo, it));
            assert.ok(!bad, `${name} size=${fontSize} ${readingPosition} k=${k}: "${bad?.text}" đè ô trống`);
            if (readingFull && lines[k].text) {
              assert.equal(frame.find((it) => it.kind === 'current')?.text, lines[k].text);
            }
          }
        }
      }
    }
  }
});

test('vạch đọc sát camera: ô ở dưới → ngay trên ô; ô chạm đỉnh → ngay dưới ô', () => {
  const low = computeGeometry({ ...BASE, hole: HOLES['dưới giữa (điện thoại trên chân đế)'] });
  assert.ok(rowTop(low, low.readingRow) + low.rowH <= low.holeRect.top);
  assert.ok(rowTop(low, low.readingRow + 1) + low.rowH > low.holeRect.top, 'phải là hàng sát ô nhất');
  const top = computeGeometry({ ...BASE, hole: HOLES['trên giữa'] });
  assert.ok(rowTop(top, top.readingRow) >= top.holeRect.bottom);
  const below = computeGeometry({ ...BASE, hole: HOLES['giữa màn hình'], readingPosition: 'below' });
  assert.ok(rowTop(below, below.readingRow) >= below.holeRect.bottom);
});

test('chữ từ hàng đọc trở xuống nối liền đúng thứ tự khi phải chạy vòng ô trống bên dưới', () => {
  const geo = computeGeometry({ ...BASE, hole: HOLES['dưới giữa (điện thoại trên chân đế)'] });
  const tokens = tokenize(sampleScript());
  const lines = wrapLines(tokens, geo.colW, measure, SPACE);
  for (const k of [0, 9, 30]) {
    const shown = buildFrame({ tokens, lines, k, geo, measure, spaceW: SPACE })
      .filter((it) => it.kind !== 'read')
      .sort((a, b) => a.row - b.row || a.left - b.left)
      .flatMap((it) => it.text.split(' '));
    const after = tokens.slice(lines[k].start).filter((t) => t !== PARA);
    assert.deepEqual(shown, after.slice(0, shown.length));
    assert.ok(shown.length > lines[k].text.split(' ').length, 'phải có chữ cạnh ô trống bên dưới');
  }
});

test('hiệu năng: dàn 3.000 từ + dựng khung dưới 50ms', () => {
  const geo = computeGeometry(BASE);
  const tokens = tokenize(Array.from({ length: 3000 }, (_, i) => `từ${i}`).join(' '));
  const t0 = performance.now();
  const lines = wrapLines(tokens, geo.colW, measure, SPACE);
  buildFrame({ tokens, lines, k: 100, geo, measure, spaceW: SPACE });
  assert.ok(performance.now() - t0 < 50);
});
