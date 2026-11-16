// Màn hình soạn: ô kịch bản (text thuần), panel cài đặt, cặp màu nhanh, xem trước thu nhỏ.
import { state, persist, defaultSettings, storageAvailable } from './settings-store.js';
import { COLOR_PRESETS } from './color-presets.js';
import { tokenize, countWords } from './layout-engine.js';
import { ensureFontLoaded } from './text-measurer.js';
import { createPrompterLayout } from './prompter-layout.js';
import { renderFrame } from './prompter-renderer.js';
import { bindSettingsForm } from './settings-form-binding.js';

const WORDS_PER_MINUTE = 130;

export function initEditorScreen({ screenEl, onRun }) {
  const scriptInput = screenEl.querySelector('#script-input');
  const statsEl = screenEl.querySelector('#script-stats');
  const previewBox = screenEl.querySelector('#preview-box');
  const previewStage = screenEl.querySelector('#preview-stage');
  const presetsEl = screenEl.querySelector('#color-presets');
  let previewTimer = 0;

  // Xem trước theo đúng tỉ lệ màn hình thật, dựng bằng chính layout engine rồi thu nhỏ
  async function renderPreview() {
    const width = window.screen.width;
    const height = window.screen.height;
    previewBox.style.aspectRatio = `${width} / ${height}`;
    await ensureFontLoaded(state.settings);
    const layout = createPrompterLayout(state.script, state.settings, width, height);
    renderFrame(previewStage, layout, layout.indexForToken(state.readingTokenIndex), state.settings, {
      showHole: true,
    });
    previewStage.style.transform = `scale(${previewBox.clientWidth / width})`;
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(renderPreview, 80);
  }

  function updateStats() {
    const words = countWords(tokenize(state.script));
    const minutes = words / WORDS_PER_MINUTE;
    statsEl.textContent = words
      ? `${words.toLocaleString('vi-VN')} từ · khoảng ${minutes < 1 ? '< 1' : Math.round(minutes)} phút đọc`
      : 'Chưa có kịch bản';
    if (!storageAvailable) statsEl.textContent += ' · ⚠ Trình duyệt đang chặn lưu trữ, kịch bản sẽ mất khi đóng tab';
  }

  scriptInput.value = state.script;
  scriptInput.addEventListener('input', () => {
    state.script = scriptInput.value;
    persist();
    updateStats();
    schedulePreview();
  });

  const form = bindSettingsForm(screenEl, () => state.settings, () => {
    persist();
    schedulePreview();
  });

  for (const preset of COLOR_PRESETS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'preset';
    btn.title = preset.name;
    btn.textContent = 'Aa';
    btn.style.color = preset.text;
    btn.style.background = preset.bg;
    btn.addEventListener('click', () => {
      state.settings.textColor = preset.text;
      state.settings.bgColor = preset.bg;
      form.sync();
      persist();
      schedulePreview();
    });
    presetsEl.append(btn);
  }

  screenEl.querySelector('#btn-reset-settings').addEventListener('click', () => {
    if (!confirm('Đặt lại toàn bộ cài đặt về mặc định?')) return;
    state.settings = defaultSettings();
    form.sync();
    persist();
    schedulePreview();
  });

  screenEl.querySelector('#btn-clear-script').addEventListener('click', () => {
    if (!confirm('Xoá toàn bộ kịch bản? Không khôi phục được.')) return;
    state.script = '';
    state.readingTokenIndex = 0;
    scriptInput.value = '';
    persist();
    updateStats();
    schedulePreview();
  });

  screenEl.querySelector('#btn-restart').addEventListener('click', () => {
    state.readingTokenIndex = 0;
    persist();
    schedulePreview();
  });

  screenEl.querySelector('#btn-run').addEventListener('click', () => {
    if (!tokenize(state.script).length) {
      alert('Sếp dán kịch bản vào trước nhé.');
      scriptInput.focus();
      return;
    }
    onRun();
  });

  window.addEventListener('resize', schedulePreview);
  updateStats();
  schedulePreview();

  return { refresh: schedulePreview };
}
