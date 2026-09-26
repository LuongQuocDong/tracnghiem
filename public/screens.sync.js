'use strict';
/** Sao lưu / khôi phục dữ liệu dùng chung từ MongoDB. */

async function renderSyncScreen(root, App) {
  root.appendChild(pageTitle({
    eyebrow: '🔄 Sao lưu', title: 'Xuất / nhập', hl: 'toàn bộ dữ liệu',
    subtitle: 'Tải bản sao đề, danh sách học viên và lịch sử từ MongoDB để lưu trữ hoặc khôi phục khi cần.',
  }));

  const stats = await gatherStats(App);
  const statGrid = el('div', { class: 'stat-grid', style: { gridTemplateColumns: 'repeat(4, 1fr)' } });
  [
    [String(stats.banks), 'Môn trắc nghiệm', 'var(--accent)'],
    [String(stats.fillBanks), 'Bộ đề điền chỗ trống', 'var(--accent-2)'],
    [String(stats.roster), 'Học viên', 'var(--accent-3)'],
    [String(stats.history), 'Lượt làm bài', 'var(--accent)'],
  ].forEach(([v, l, c]) => statGrid.appendChild(statCard(v, l, c)));
  root.appendChild(statGrid);

  const exportPanel = panel([]);
  exportPanel.classList.add('mt18');
  exportPanel.appendChild(el('div', { style: { fontSize: '13px', fontWeight: 800 }, text: '1 · Tải bản sao dữ liệu về máy' }));
  exportPanel.appendChild(el('div', { class: 'muted-line mt8', text: 'Tải dữ liệu hiện có về máy thành một file .txt.' }));
  const exportBtn = btn('Xuất toàn bộ dữ liệu ra file .txt', async () => {
    const content = await App.api.exportAll();
    const stamp = new Date().toISOString().slice(0, 10);
    const path = await App.api.saveTxt(`TracNghiem_DuLieu_${stamp}.txt`, content);
    if (path) toast(`Đã xuất file: ${path.split(/[\\/]/).pop()}`, 'ok');
  }, { kind: 'primary', iconName: 'download' });
  exportBtn.style.marginTop = '14px';
  exportPanel.appendChild(exportBtn);
  root.appendChild(exportPanel);

  const importPanel = panel([]);
  importPanel.classList.add('mt14');
  importPanel.appendChild(el('div', { style: { fontSize: '13px', fontWeight: 800 }, text: '2 · Nhập dữ liệu lên hệ thống' }));
  importPanel.appendChild(el('div', { class: 'muted-line mt8',
    text: 'Chọn file .txt đã xuất từ máy kia. Dữ liệu sẽ được GỘP vào (đề trùng id sẽ ghi đè, học viên trùng tên/lớp sẽ bỏ qua, lịch sử không lặp lại) — không xoá mất dữ liệu sẵn có trên máy này.' }));
  const importBtn = btn('Chọn file .txt để nhập', async () => {
    const files = await App.api.openTxtFiles();
    if (!files.length) return;
    const result = await App.api.importAll(files[0].content);
    if (!result.ok) { toast(result.error, 'err'); return; }
    toast(`Đã nhập: +${result.banksAdded} môn trắc nghiệm, +${result.fillAdded} bộ điền chỗ trống, +${result.studentsAdded} học viên mới, +${result.historyAdded} lượt làm bài`, 'ok');
    App.navigate('sync');
  }, { kind: 'accent', iconName: 'upload' });
  importBtn.style.marginTop = '14px';
  importPanel.appendChild(importBtn);
  root.appendChild(importPanel);

  root.appendChild(el('div', { style: { height: '20px' } }));
}

async function gatherStats(App) {
  const [banks, fillBanks, roster, history] = await Promise.all([
    App.api.listBanks(), App.api.listFillBanks(), App.api.allStudents(), App.api.history(),
  ]);
  return { banks: banks.length, fillBanks: fillBanks.length, roster: roster.length, history: history.length };
}
