// Gắn các ô nhập có thuộc tính data-setting="đường.dẫn" vào state.settings (2 chiều).
// Range hiển thị giá trị vào <output> đứng ngay sau nó (kèm data-unit nếu có).

function getPath(obj, path) {
  return path.split('.').reduce((o, key) => o?.[key], obj);
}

function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((o, key) => o[key], obj)[last] = value;
}

function readInput(input) {
  if (input.type === 'checkbox') return input.checked;
  if (input.type === 'range' || input.type === 'number' || input.dataset.number !== undefined) {
    return Number(input.value);
  }
  return input.value;
}

function showOutput(input) {
  const out = input.nextElementSibling;
  if (out?.tagName === 'OUTPUT') out.textContent = `${input.value}${input.dataset.unit || ''}`;
}

export function bindSettingsForm(root, getSettings, onChange) {
  const inputs = [...root.querySelectorAll('[data-setting]')];

  function sync() {
    const settings = getSettings();
    for (const input of inputs) {
      const value = getPath(settings, input.dataset.setting);
      if (input.type === 'checkbox') input.checked = Boolean(value);
      else input.value = value;
      showOutput(input);
    }
  }

  for (const input of inputs) {
    input.addEventListener('input', () => {
      setPath(getSettings(), input.dataset.setting, readInput(input));
      showOutput(input);
      onChange();
    });
  }

  sync();
  return { sync };
}
