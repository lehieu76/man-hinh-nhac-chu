// Vẽ một khung hình ra DOM: mỗi khe là một div tuyệt đối, cộng dải vạch đọc (và viền ô trống khi xem trước).
import { rowTop } from './layout-geometry.js';

function px(n) {
  return `${Math.round(n)}px`;
}

function box(className, left, top, width, height) {
  const el = document.createElement('div');
  el.className = className;
  Object.assign(el.style, { left: px(left), top: px(top), width: px(width), height: px(height) });
  return el;
}

export function applyTheme(stage, settings, geo) {
  stage.style.width = px(geo.width);
  stage.style.height = px(geo.height);
  stage.style.setProperty('--fg', settings.textColor);
  stage.style.setProperty('--bg', settings.bgColor);
  stage.style.setProperty('--reading-color', settings.readingLineColor);
  stage.style.setProperty('--read-opacity', settings.readOpacity);
  stage.style.setProperty('--font', settings.fontFamily);
  stage.style.setProperty('--size', px(settings.fontSize));
  stage.style.setProperty('--weight', settings.boldAll ? 700 : 400);
  stage.style.setProperty('--row-h', px(geo.rowH));
}

// Trả về lớp chữ để bộ điều khiển chạy hiệu ứng trượt
export function renderFrame(stage, layout, k, settings, { showHole = false } = {}) {
  const { geo } = layout;
  applyTheme(stage, settings, geo);

  const band = box('reading-band', 0, rowTop(geo, geo.readingRow), geo.width, geo.rowH);
  const textLayer = document.createElement('div');
  textLayer.className = 'text-layer';
  for (const item of layout.frameAt(k)) {
    const el = box(`line ${item.kind}`, item.left, rowTop(geo, item.row), item.width, geo.rowH);
    el.textContent = item.text;
    textLayer.append(el);
  }
  const children = [band, textLayer];
  if (showHole) {
    const h = geo.holeRect;
    children.push(box('hole-outline', h.left, h.top, h.right - h.left, h.bottom - h.top));
  }
  stage.replaceChildren(...children);
  return textLayer;
}
