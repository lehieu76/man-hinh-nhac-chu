// Chế độ hiệu chỉnh ô trống ngay trên màn hình chạy: kéo để di chuyển, kéo góc để đổi kích thước,
// phím mũi tên dịch 1% (Shift: 5%), Ctrl + mũi tên đổi kích thước. Enter/H lưu, X huỷ.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function clampHole(h) {
  const w = clamp(h.w, 5, 60);
  const hh = clamp(h.h, 5, 60);
  return { w, h: hh, cx: clamp(h.cx, w / 2, 100 - w / 2), cy: clamp(h.cy, hh / 2, 100 - hh / 2) };
}

export function createHoleCalibrator({ overlay, onChange, onFinish }) {
  const boxEl = overlay.querySelector('.calib-box');
  const handleEl = overlay.querySelector('.calib-handle');
  let hole = null;
  let original = null;
  let drag = null;

  function place() {
    Object.assign(boxEl.style, {
      left: `${hole.cx - hole.w / 2}%`, top: `${hole.cy - hole.h / 2}%`, width: `${hole.w}%`, height: `${hole.h}%`,
    });
  }

  function update(next) {
    hole = clampHole(next);
    place();
    onChange({ ...hole });
  }

  function toPct(e) {
    return { x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 };
  }

  function onPointerDown(e) {
    e.preventDefault();
    drag = { mode: e.target === handleEl ? 'resize' : 'move', start: toPct(e), from: { ...hole } };
    boxEl.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!drag) return;
    const p = toPct(e);
    const dx = p.x - drag.start.x;
    const dy = p.y - drag.start.y;
    const f = drag.from;
    if (drag.mode === 'move') {
      update({ ...f, cx: f.cx + dx, cy: f.cy + dy });
    } else {
      // Giữ cố định góc trên-trái khi kéo góc dưới-phải
      const w = clamp(f.w + dx, 5, 60);
      const h = clamp(f.h + dy, 5, 60);
      update({ w, h, cx: f.cx - f.w / 2 + w / 2, cy: f.cy - f.h / 2 + h / 2 });
    }
  }

  function finish(save) {
    overlay.hidden = true;
    if (!save) onChange({ ...original });
    onFinish(save ? { ...hole } : null);
  }

  function onKey(e) {
    const step = e.shiftKey ? 5 : 1;
    const arrows = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (arrows[e.key]) {
      const [dx, dy] = arrows[e.key];
      update(e.ctrlKey ? { ...hole, w: hole.w + dx, h: hole.h + dy } : { ...hole, cx: hole.cx + dx, cy: hole.cy + dy });
    } else if (e.key === 'Enter' || e.key.toLowerCase() === 'h') {
      finish(true);
    } else if (e.key.toLowerCase() === 'x') {
      finish(false);
    } else {
      return;
    }
    e.preventDefault();
  }

  boxEl.addEventListener('pointerdown', onPointerDown);
  boxEl.addEventListener('pointermove', onPointerMove);
  boxEl.addEventListener('pointerup', () => { drag = null; });
  overlay.querySelector('[data-calib="save"]').addEventListener('click', () => finish(true));
  overlay.querySelector('[data-calib="cancel"]').addEventListener('click', () => finish(false));

  return {
    open(currentHole) {
      original = { ...currentHole };
      hole = clampHole(currentHole);
      place();
      overlay.hidden = false;
    },
    // Thoát fullscreen giữa chừng: coi như huỷ
    cancel() {
      if (!overlay.hidden) finish(false);
    },
    handleKey: onKey,
    get isOpen() {
      return !overlay.hidden;
    },
  };
}
