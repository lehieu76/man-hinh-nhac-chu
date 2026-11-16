// Đo độ rộng chữ bằng canvas (khớp font của màn hình chạy), có cache theo font.

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const cacheByFont = new Map();

export function fontString(settings) {
  return `${settings.boldAll ? 700 : 400} ${settings.fontSize}px ${settings.fontFamily}`;
}

export function createTextMeasurer(font) {
  if (!cacheByFont.has(font)) cacheByFont.set(font, new Map());
  const cache = cacheByFont.get(font);
  return (text) => {
    let w = cache.get(text);
    if (w === undefined) {
      ctx.font = font;
      w = Math.ceil(ctx.measureText(text).width);
      cache.set(text, w);
    }
    return w;
  };
}

// Chờ web font tải xong (kèm ký tự tiếng Việt) trước khi đo, tránh đo bằng font dự phòng
export async function ensureFontLoaded(settings) {
  const font = fontString(settings);
  try {
    await document.fonts.load(font, 'Aăâđêôơư Việt');
  } catch {
    // Không tải được font: vẫn chạy bằng font dự phòng
  }
  cacheByFont.delete(font); // đo lại sau khi font thật đã sẵn sàng
}
