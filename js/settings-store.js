// Trạng thái ứng dụng (1 kịch bản + cài đặt + vị trí đọc), tự lưu vào localStorage.

const STORAGE_KEY = 'teleprompter.v1';

export function defaultSettings() {
  return {
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize: 64,
    lineHeight: 1.35,
    boldAll: false,
    paragraphSpacing: false,
    textColor: '#ffffff',
    bgColor: '#000000',
    readingLineColor: '#ffcc00',
    readOpacity: 0.6,
    margin: 20,
    columnWidthPct: 100,
    holeGap: 16,
    hole: { cx: 50, cy: 11, w: 18, h: 22 }, // % màn hình: tâm X, tâm Y, rộng, cao
    stepLines: 1,
    smoothScroll: true,
  };
}

export let storageAvailable = true;

function loadState() {
  const defaults = defaultSettings();
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    const saved = raw.settings || {};
    return {
      script: typeof raw.script === 'string' ? raw.script : '',
      // Gộp với mặc định để an toàn khi phiên bản sau thêm cài đặt mới
      settings: { ...defaults, ...saved, hole: { ...defaults.hole, ...saved.hole } },
      readingTokenIndex: Number(raw.readingTokenIndex) || 0,
    };
  } catch {
    storageAvailable = false;
    return { script: '', settings: defaults, readingTokenIndex: 0 };
  }
}

export const state = loadState();

export function saveNow() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageAvailable = true;
  } catch (err) {
    storageAvailable = false;
    console.warn('Không lưu được vào localStorage:', err);
  }
}

let saveTimer = 0;
export function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 300);
}
