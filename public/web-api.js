'use strict';

const prefsKey = 'tracnghiem-prefs';
const defaultPrefs = { count: 50, mode: 'personal', shuffleOptions: true, autoNext: false };

async function rpc(method, ...args) {
  const response = await fetch('/api/rpc', {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, args }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Không thể kết nối máy chủ.');
  return payload.result;
}

function openTxtFiles() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.txt,text/plain'; input.multiple = true;
    input.addEventListener('change', async () => {
      const files = await Promise.all([...input.files].map(async (file) => ({
        name: file.name.replace(/\.txt$/i, ''), content: await file.text(),
      })));
      resolve(files);
    }, { once: true });
    input.addEventListener('cancel', () => resolve([]), { once: true });
    input.click();
  });
}

function saveTxt(filename, content) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return Promise.resolve(filename);
}

const local = {
  prefs: async () => ({ ...defaultPrefs, ...JSON.parse(localStorage.getItem(prefsKey) || '{}') }),
  setPrefs: async (patch) => {
    const next = { ...defaultPrefs, ...JSON.parse(localStorage.getItem(prefsKey) || '{}'), ...patch };
    localStorage.setItem(prefsKey, JSON.stringify(next));
    return next;
  },
  log: (...parts) => console.info(...parts),
  openTxtFiles, saveTxt,
};

window.api = new Proxy(local, {
  get(target, key) { return target[key] || ((...args) => rpc(key, ...args)); },
});
