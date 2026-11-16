// Khởi động ứng dụng: gắn màn hình soạn và màn hình chạy, lưu ngay khi đóng tab.
import { saveNow } from './settings-store.js';
import { initEditorScreen } from './editor-screen.js';
import { createPrompterController } from './prompter-controller.js';

const editorEl = document.getElementById('editor-screen');
const prompterEl = document.getElementById('prompter-screen');

const editor = initEditorScreen({
  screenEl: editorEl,
  onRun: () => {
    editorEl.hidden = true;
    prompter.start();
  },
});

const prompter = createPrompterController({
  screenEl: prompterEl,
  onExit: () => {
    editorEl.hidden = false;
    editor.refresh();
  },
});

window.addEventListener('beforeunload', saveNow);
