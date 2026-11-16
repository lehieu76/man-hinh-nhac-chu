// Màn hình chạy: toàn màn hình, điều khiển bằng bàn phím, giữ màn hình sáng, hiệu chỉnh ô trống.
import { state, persist, saveNow } from './settings-store.js';
import { ensureFontLoaded } from './text-measurer.js';
import { createPrompterLayout } from './prompter-layout.js';
import { renderFrame } from './prompter-renderer.js';
import { createHoleCalibrator } from './hole-calibrator.js';

const SLIDE_MS = 120;
const REPEAT_MIN_MS = 100; // giữ phím: tối đa ~10 bước/giây

export function createPrompterController({ screenEl, onExit }) {
  const stage = screenEl.querySelector('#prompter-stage');
  const progressEl = screenEl.querySelector('#progress-bar');
  let layout = null;
  let k = 0;
  let running = false;
  let lastStepAt = 0;
  let wakeLock = null;
  let resizeTimer = 0;

  const calibrator = createHoleCalibrator({
    overlay: screenEl.querySelector('#calibrator'),
    onChange(hole) {
      state.settings.hole = hole;
      relayout(layout.tokenAt(k));
    },
    onFinish(savedHole) {
      screenEl.classList.remove('calibrating');
      if (savedHole) persist();
    },
  });

  function relayout(anchorToken) {
    layout = createPrompterLayout(state.script, state.settings, window.innerWidth, window.innerHeight);
    k = layout.indexForToken(anchorToken);
    draw(0);
  }

  function draw(movedLines) {
    const layer = renderFrame(stage, layout, k, state.settings);
    progressEl.style.width = `${layout.lastIndex ? (k / layout.lastIndex) * 100 : 100}%`;
    const shift = movedLines * layout.geo.rowH;
    if (shift && state.settings.smoothScroll && Math.abs(shift) < layout.geo.height) {
      // Lớp chữ mới bắt đầu ở vị trí cũ rồi trượt về đúng chỗ
      layer.animate([{ transform: `translateY(${shift}px)` }, { transform: 'none' }], {
        duration: SLIDE_MS, easing: 'ease-out',
      });
    }
  }

  function goTo(nextK) {
    const target = Math.min(layout.lastIndex, Math.max(0, nextK));
    if (target === k) return;
    const moved = target - k;
    k = target;
    state.readingTokenIndex = layout.tokenAt(k);
    persist();
    draw(moved);
  }

  function changeFontSize(delta) {
    const anchor = layout.tokenAt(k);
    state.settings.fontSize = Math.min(200, Math.max(24, state.settings.fontSize + delta));
    persist();
    relayout(anchor);
  }

  function onKey(e) {
    if (!layout) return; // font chưa tải xong, chưa dựng khung
    if (calibrator.isOpen) {
      calibrator.handleKey(e);
      return;
    }
    const isStep = ['ArrowDown', 'ArrowUp', ' ', 'PageDown', 'PageUp'].includes(e.key);
    if (isStep && e.repeat && performance.now() - lastStepAt < REPEAT_MIN_MS) {
      e.preventDefault();
      return;
    }
    const step = Number(state.settings.stepLines) || 1;
    const half = Math.max(1, Math.floor(layout.geo.rows / 2));
    const actions = {
      ArrowDown: () => goTo(k + step),
      ' ': () => goTo(k + step),
      ArrowUp: () => goTo(k - step),
      PageDown: () => goTo(k + half),
      PageUp: () => goTo(k - half),
      Home: () => goTo(0),
      End: () => goTo(layout.lastIndex),
      '+': () => changeFontSize(4),
      '=': () => changeFontSize(4),
      '-': () => changeFontSize(-4),
      _: () => changeFontSize(-4),
      h: () => openCalibrator(),
      H: () => openCalibrator(),
      Escape: () => stop(),
    };
    const action = actions[e.key];
    if (!action) return;
    e.preventDefault();
    if (isStep) lastStepAt = performance.now();
    action();
  }

  function openCalibrator() {
    screenEl.classList.add('calibrating');
    calibrator.open(state.settings.hole);
  }

  async function requestWakeLock() {
    try {
      wakeLock = await navigator.wakeLock?.request('screen');
    } catch {
      wakeLock = null; // trình duyệt không hỗ trợ / bị từ chối: bỏ qua
    }
  }

  function onVisibility() {
    if (running && document.visibilityState === 'visible') requestWakeLock();
  }

  function onFullscreenChange() {
    if (running && !document.fullscreenElement) stop();
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => running && relayout(layout.tokenAt(k)), 100);
  }

  // Phải được gọi trực tiếp trong handler click (trình duyệt chỉ cho fullscreen khi có thao tác người dùng)
  async function start() {
    const fullscreen = document.documentElement.requestFullscreen?.().catch(() => {});
    running = true;
    screenEl.hidden = false;
    document.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);
    await fullscreen;
    await ensureFontLoaded(state.settings);
    if (!running) return;
    relayout(state.readingTokenIndex);
    requestWakeLock();
  }

  function stop() {
    if (!running) return;
    running = false;
    calibrator.cancel();
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('fullscreenchange', onFullscreenChange);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('resize', onResize);
    wakeLock?.release().catch(() => {});
    wakeLock = null;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    screenEl.hidden = true;
    saveNow();
    onExit();
  }

  return { start, stop };
}
