const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);

const state = {
  tabId: Number(params.get('tabId')) || null,
  groups: [],
  selectedGroups: new Set(),
  captured: [],
  conversationName: '',
  autoStarted: false
};

function setProgress(percent, text) {
  $('progressBar').style.width = `${Math.max(0, Math.min(100, percent))}%`;
  $('progressText').textContent = text;
}
function sanitizeName(text, fallback = 'gpt-conversation-images') {
  const clean = String(text || '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/[\u0000-\u001f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  return clean || fallback;
}
function dateStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}
function asciiZipBase() {
  return `leegle-gpt-image_${dateStamp()}`;
}
function asciiZipName() {
  return `${asciiZipBase()}.zip`;
}
function cleanConversationTitle(title) {
  return String(title || '')
    .replace(/\s*[—-]\s*ChatGPT\s*$/i, '')
    .replace(/^ChatGPT\s*[—-]\s*/i, '')
    .replace(/^ChatGPT\s*/i, '')
    .trim();
}
async function ensureConversationName() {
  if (state.conversationName) return state.conversationName;
  try {
    const tab = await getTargetTab();
    const title = cleanConversationTitle(tab?.title || '');
    if (title) { state.conversationName = title; return title; }
  } catch (_) {}
  const fallback = state.groups.find((g) => g.prompt)?.prompt || 'ChatGPT 会话图片';
  state.conversationName = fallback;
  return fallback;
}
function escapeHtml(text) {
  return String(text || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}
function placeholderImage(label = '预览') {
  const safe = String(label || '预览').replace(/[<>&"']/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="300" height="300" rx="24" fill="#f2f2f7"/>
    <rect x="50" y="72" width="200" height="132" rx="18" fill="#fff" stroke="#d7d7dd"/>
    <circle cx="108" cy="118" r="18" fill="#d0d0d8"/>
    <path d="M70 182l52-48 36 34 30-26 42 40" fill="none" stroke="#b7b7c2" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="150" y="236" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="22" font-weight="700" fill="#6e6e73" text-anchor="middle">${safe}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
function updateSummary() {
  $('scanStatus').textContent = `识别 ${state.groups.length} 个图片组`;
  $('selectedStatus').textContent = `已选 ${state.selectedGroups.size} 组 / 已采集 ${state.captured.length} 张`;
  $('downloadBtn').disabled = state.captured.length === 0;
}
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
async function getTargetTab() {
  if (state.tabId) {
    try {
      const tab = await chrome.tabs.get(state.tabId);
      if (tab?.id) return tab;
    } catch (_) { state.tabId = null; }
  }
  return getActiveTab();
}
async function ensureContentScript(tabId) {
  try {
    const pong = await chrome.tabs.sendMessage(tabId, { type: 'LEEGLE_PING' });
    if (pong?.ok && pong.version === '0.0.15') return;
  } catch (_) {}
  await chrome.scripting.executeScript({ target: { tabId }, files: ['contentScript.js'] });
}
async function sendToContent(message) {
  const tab = await getTargetTab();
  await ensureContentScript(tab.id);
  return chrome.tabs.sendMessage(tab.id, message);
}
function setControlsDisabled(disabled) {
  ['scanConversationBtn','captureVisibleBtn','previewVisibleBtn','captureSelectedBtn','selectAllGroupsBtn','clearBtn','legacyScanBtn','refreshBtn','fitWindowBtn','downloadBtn','hdOpenTabBtn','hdAddBtn','hdCloseBtn'].forEach((id) => {
    const el = $(id);
    if (el) el.disabled = disabled;
  });
  if (!disabled) $('downloadBtn').disabled = state.captured.length === 0;
}
async function defaultZipName(groups = state.groups) {
  $('zipNameInput').value = asciiZipName();
}
function renderGroups() {
  const list = $('groupList');
  list.innerHTML = '';
  if (!state.groups.length) {
    list.innerHTML = '<div class="empty">还没有识别到当前会话图片组。请停留在 ChatGPT 对话页面，点击「扫描当前会话图片组」，或把目标图片组滚到屏幕中间后点击「采集当前可见图片组」。</div>';
    updateSummary();
    return;
  }
  for (const group of state.groups) {
    const card = document.createElement('section');
    card.className = 'group-card';
    const checked = state.selectedGroups.has(group.id) ? 'checked' : '';
    const meta = group.hasThumbs ? `检测到右侧小图按钮 ${group.count} 张，将读取每张小图的原始 file 图片` : `检测到单张大图`;
    card.innerHTML = `
      <div class="group-header">
        <input type="checkbox" data-group-id="${escapeHtml(group.id)}" ${checked} />
        <div>
          <div class="group-title">${escapeHtml(group.title || '会话图片组')} · ${group.count || 1} 张</div>
          <div class="group-prompt" title="${escapeHtml(group.prompt || '')}">${escapeHtml(group.prompt || '未识别到提示词')}</div>
          <div class="group-meta">${escapeHtml(meta)}</div>
        </div>
        <div class="group-actions">
          <button class="capture-one" data-group-id="${escapeHtml(group.id)}">采集本组</button>
        </div>
      </div>
      <div class="preview-row"></div>
      <div class="capture-list" data-capture-list="${escapeHtml(group.id)}"></div>
    `;
    const row = card.querySelector('.preview-row');
    const previews = group.previews?.length ? group.previews : [{ index: 0 }];
    previews.slice(0, 12).forEach((p, idx) => {
      const pv = document.createElement('div');
      pv.className = 'preview-card';
      pv.title = '点击查看高清原图';
      const fallback = placeholderImage(p.fileId ? p.fileId.slice(-4) : '待采集');
      const imgSrc = p.thumbDataUrl || p.previewDataUrl || p.dataUrl || p.url || fallback;
      pv.innerHTML = `<img alt="preview"><span>#${idx + 1}</span>`;
      const img = pv.querySelector('img');
      img.onerror = () => { img.onerror = null; img.src = fallback; };
      img.src = imgSrc;
      pv.addEventListener('click', () => openHighresFromPreview(group, p, idx));
      row.appendChild(pv);
    });
    const capturedForGroup = state.captured.filter((item) => item.groupId === group.id);
    const capList = card.querySelector('.capture-list');
    capturedForGroup.forEach((item, idx) => {
      const c = document.createElement('div');
      c.className = 'capture-card';
      c.title = '点击查看高清原图';
      c.innerHTML = `<img src="${escapeHtml(item.dataUrl)}" alt="captured ${idx + 1}">`;
      c.addEventListener('click', () => showHdModal(item));
      capList.appendChild(c);
    });
    list.appendChild(card);
  }
  list.querySelectorAll('input[type="checkbox"][data-group-id]').forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) state.selectedGroups.add(input.dataset.groupId);
      else state.selectedGroups.delete(input.dataset.groupId);
      updateSummary();
    });
  });
  list.querySelectorAll('.capture-one').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const g = state.groups.find((x) => x.id === btn.dataset.groupId);
      if (g) await captureGroups([g]);
    });
  });
  updateSummary();
}

let hdCurrentItem = null;
function showHdModal(item) {
  if (!item?.dataUrl) return;
  hdCurrentItem = item;
  const modal = $('hdModal');
  $('hdTitle').textContent = item.prompt || item.groupTitle || '高清原图预览';
  const size = item.width && item.height ? `${item.width} × ${item.height}` : '高清原图';
  const fileId = item.fileId ? ` · ${item.fileId}` : '';
  $('hdMeta').textContent = `${size} · #${Number(item.index || 0) + 1}${fileId}`;
  $('hdImage').src = item.dataUrl;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}
function closeHdModal() {
  const modal = $('hdModal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}
async function openHighresFromPreview(group, preview, idx) {
  if (!preview?.url && !preview?.dataUrl) {
    setProgress(0, '这个预览没有原图链接，请先采集本组高清图。');
    return;
  }
  setControlsDisabled(true);
  try {
    setProgress(0, `正在读取高清原图 #${idx + 1}...`);
    let res = null;
    if (preview.url) res = await sendToContent({ type: 'LEEGLE_FETCH_HIGHRES_URL', url: preview.url });
    if (!res?.ok && group?.id) res = await sendToContent({ type: 'LEEGLE_SELECT_GROUP_INDEX', groupId: group.id, index: idx });
    if (!res?.ok || !res.dataUrl) throw new Error(res?.error || '高清原图读取失败');
    const item = {
      id: makeCaptureId(group.id, idx, res.dataUrl),
      groupId: group.id,
      groupTitle: group.title,
      prompt: group.prompt,
      index: idx,
      dataUrl: res.dataUrl,
      sourceUrl: res.url || preview.url || '',
      fileId: res.fileId || preview.fileId || '',
      ext: res.ext || '',
      width: res.width || 0,
      height: res.height || 0
    };
    showHdModal(item);
    setProgress(100, `已打开高清原图：${item.width || '?'} × ${item.height || '?'}。`);
  } catch (err) {
    setProgress(0, `高清预览失败：${err.message || err}`);
  } finally {
    setControlsDisabled(false);
  }
}
function addHdCurrentToCaptured() {
  if (!hdCurrentItem?.dataUrl) return;
  const exists = state.captured.some((item) => (hdCurrentItem.fileId && item.fileId === hdCurrentItem.fileId) || item.dataUrl === hdCurrentItem.dataUrl);
  if (!exists) state.captured.push({ ...hdCurrentItem, id: hdCurrentItem.id || makeCaptureId(hdCurrentItem.groupId || 'hd', hdCurrentItem.index || 0, hdCurrentItem.dataUrl) });
  renderGroups();
  updateSummary();
  setProgress(100, '已加入下载列表。');
}
async function openHdInNewTab() {
  if (!hdCurrentItem?.dataUrl) return;
  const { bytes, ext } = dataUrlToBytes(hdCurrentItem.dataUrl);
  if (!bytes.length) return;
  const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext || 'png'}`;
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  await chrome.tabs.create({ url, active: true });
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
async function cropVisibleTab(rect, viewportWidth, viewportHeight) {
  if (!rect || rect.width < 10 || rect.height < 10) return '';
  const tab = await getTargetTab();
  const shot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  const shotImg = await loadImageElement(shot);
  const scaleX = shotImg.naturalWidth / Math.max(viewportWidth || shotImg.naturalWidth, 1);
  const scaleY = shotImg.naturalHeight / Math.max(viewportHeight || shotImg.naturalHeight, 1);
  const sx = Math.max(0, Math.round(rect.left * scaleX));
  const sy = Math.max(0, Math.round(rect.top * scaleY));
  const sw = Math.min(shotImg.naturalWidth - sx, Math.round(rect.width * scaleX));
  const sh = Math.min(shotImg.naturalHeight - sy, Math.round(rect.height * scaleY));
  if (sw < 10 || sh < 10) return '';
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(shotImg, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas.toDataURL('image/png');
}
function dataUrlToBytes(dataUrl) {
  const [header, base64] = String(dataUrl || '').split(',');
  if (!base64) return { bytes: new Uint8Array(), ext: 'png' };
  const mime = (header.match(/data:([^;]+)/) || [])[1] || 'image/png';
  const ext = mime.split('/')[1]?.replace('jpeg','jpg').replace('svg+xml','svg') || 'png';
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, ext };
}
function makeCaptureId(groupId, index, dataUrl) {
  return `${groupId}-${index}-${String(dataUrl || '').slice(0, 64).length}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
async function captureGroup(group) {
  const start = await sendToContent({ type: 'LEEGLE_START_GROUP_CAPTURE', groupId: group.id });
  if (!start?.ok) throw new Error(start?.error || '无法开始采集图片组');
  const count = Math.max(1, start.count || group.count || 1);
  const freshGroup = start.group || group;
  const captured = [];
  // Remove old captures from this group before recapturing.
  state.captured = state.captured.filter((item) => item.groupId !== group.id);
  renderGroups();
  for (let i = 0; i < count; i++) {
    setProgress(Math.round((i / count) * 100), `正在采集「${freshGroup.title || group.title}」第 ${i + 1}/${count} 张...`);
    const res = await sendToContent({ type: 'LEEGLE_SELECT_GROUP_INDEX', groupId: group.id, index: i });
    if (!res?.ok) throw new Error(res?.error || `第 ${i + 1} 张采集失败`);
    let dataUrl = res.dataUrl || '';
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      dataUrl = await cropVisibleTab(res.rect, res.viewportWidth, res.viewportHeight);
    }
    if (!dataUrl || !dataUrl.startsWith('data:image/')) continue;
    const item = {
      id: makeCaptureId(group.id, i, dataUrl),
      groupId: group.id,
      groupTitle: freshGroup.title || group.title,
      prompt: freshGroup.prompt || group.prompt,
      index: i,
      dataUrl,
      sourceUrl: res.url || '',
      fileId: res.fileId || '',
      ext: res.ext || '',
      width: res.width || 0,
      height: res.height || 0
    };
    captured.push(item);
    state.captured.push(item);
    updateSummary();
  }
  renderGroups();
  return captured;
}
async function captureGroups(groups) {
  if (!groups.length) return;
  setControlsDisabled(true);
  try {
    let done = 0;
    for (const group of groups) {
      await captureGroup(group);
      done += 1;
      setProgress(Math.round((done / groups.length) * 100), `已采集 ${done}/${groups.length} 个图片组，当前共 ${state.captured.length} 张。`);
    }
    setProgress(100, `采集完成：${state.captured.length} 张图片，可以下载 ZIP。`);
  } catch (err) {
    setProgress(0, `采集失败：${err.message || err}`);
  } finally {
    setControlsDisabled(false);
    updateSummary();
  }
}
async function scanConversation() {
  setControlsDisabled(true);
  setProgress(0, '正在按 ChatGPT 图片组 DOM 扫描左侧大图 + 右侧小图按钮...');
  try {
    const res = await sendToContent({ type: 'LEEGLE_SCAN_CONVERSATION_GROUPS' });
    if (!res?.ok) throw new Error(res?.error || '扫描失败');
    state.groups = res.groups || [];
    state.selectedGroups.clear();
    state.captured = [];
    state.groups.forEach((g) => state.selectedGroups.add(g.id));
    await defaultZipName(state.groups);
    renderGroups();
    setProgress(0, state.groups.length ? `扫描完成：识别 ${state.groups.length} 个会话图片组。` : '没有识别到 GPT 图片组，请把左侧大图和右侧小图滚到屏幕中间后再试。');
  } catch (err) {
    setProgress(0, `扫描失败：${err.message || err}`);
    state.groups = [];
    state.selectedGroups.clear();
    state.captured = [];
    renderGroups();
  } finally { setControlsDisabled(false); }
}
async function captureVisibleGroup(autoPreview = false) {
  setControlsDisabled(true);
  setProgress(0, '正在定位当前屏幕中的左侧大图 + 右侧小图组，并读取高清原图...');
  try {
    const res = await sendToContent({ type: 'LEEGLE_PREPARE_VISIBLE_GROUP' });
    if (!res?.ok) throw new Error(res?.error || '没有找到当前可见图片组');
    const group = res.group;
    state.groups = [group];
    state.selectedGroups = new Set([group.id]);
    state.captured = [];
    await defaultZipName([group]);
    renderGroups();
    await captureGroups([group]);
    if (autoPreview) {
      const first = state.captured.find((item) => item.groupId === group.id) || state.captured[0];
      if (first) showHdModal(first);
    }
  } catch (err) {
    setProgress(0, `当前可见组采集失败：${err.message || err}`);
  } finally { setControlsDisabled(false); }
}
async function legacyScan() {
  setControlsDisabled(true);
  setProgress(0, '正在执行备用扫描：只扫描会话正文大图，不扫边栏...');
  try {
    const res = await sendToContent({ type: 'LEEGLE_LEGACY_SCAN' });
    if (!res?.ok) throw new Error(res?.error || '备用扫描失败');
    state.groups = res.groups || [];
    state.selectedGroups.clear();
    state.captured = [];
    state.groups.forEach((g) => state.selectedGroups.add(g.id));
    await defaultZipName(state.groups);
    renderGroups();
    setProgress(0, `备用扫描完成：${state.groups.length} 个图片组。`);
  } catch (err) { setProgress(0, `备用扫描失败：${err.message || err}`); }
  finally { setControlsDisabled(false); }
}
async function downloadZip() {
  if (!state.captured.length) return;
  setControlsDisabled(true);
  try {
    setProgress(0, '正在生成 ZIP...');
    const zip = new window.SimpleZip();
    const baseName = asciiZipBase();
    const selectedZipName = String($('zipNameInput').value || '').trim();
    const filename = /^leegle-gpt-image_\d{8}_\d{4}\.zip$/i.test(selectedZipName) ? selectedZipName : `${baseName}.zip`;
    const folder = filename.replace(/\.zip$/i, '');
    const groupIds = Array.from(new Set(state.captured.map((item) => item.groupId || 'group')));
    const multiGroup = groupIds.length > 1;
    const groupIndexById = new Map(groupIds.map((id, idx) => [id, idx + 1]));
    const counters = new Map();
    state.captured.forEach((item) => {
      const { bytes, ext } = dataUrlToBytes(item.dataUrl);
      if (!bytes.length) return;
      const gid = item.groupId || 'group';
      const next = (counters.get(gid) || 0) + 1;
      counters.set(gid, next);
      const imageName = `image_${String(next).padStart(2, '0')}.${ext || 'png'}`;
      const fileName = multiGroup
        ? `${folder}/group_${String(groupIndexById.get(gid) || 1).padStart(2, '0')}/${imageName}`
        : `${folder}/${imageName}`;
      zip.addFile(fileName, bytes);
    });
    const blob = zip.toBlob();
    const url = URL.createObjectURL(blob);
    await chrome.downloads.download({ url, filename, saveAs: false });
    setTimeout(() => URL.revokeObjectURL(url), 20000);
    setProgress(100, `高清 ZIP 已开始下载，文件名和内部文件夹均为英文安全格式：${state.captured.length} 张图片。`);
  } catch (err) { setProgress(0, `ZIP 下载失败：${err.message || err}`); }
  finally { setControlsDisabled(false); updateSummary(); }
}
async function fitWindow() {
  try {
    const tab = await getTargetTab();
    const sourceWindow = await chrome.windows.get(tab.windowId);
    const current = await chrome.windows.getCurrent();
    const panelWidth = Math.max(current.width || 0, Math.min(1380, Math.max(1040, Math.round(sourceWindow.width * 0.56))));
    await chrome.windows.update(current.id, {
      state: 'normal',
      height: Math.max(640, sourceWindow.height || 900),
      width: panelWidth,
      top: sourceWindow.top || 0,
      left: (sourceWindow.left || 0) + Math.max(0, (sourceWindow.width || 1440) - panelWidth - 8),
      focused: true
    });
  } catch (err) { setProgress(0, `贴边失败：${err.message || err}`); }
}

async function initAutoFlow() {
  if (state.autoStarted) return;
  state.autoStarted = true;
  try {
    await fitWindow();
  } catch (_) {}
  try {
    await defaultZipName(state.groups);
  } catch (_) {}
  setProgress(0, '已自动放大窗口，正在自动采集当前可见高清组...');
  await captureVisibleGroup(false);
}

$('scanConversationBtn').addEventListener('click', scanConversation);
$('captureVisibleBtn').addEventListener('click', () => captureVisibleGroup(false));
$('previewVisibleBtn').addEventListener('click', () => captureVisibleGroup(true));
$('captureSelectedBtn').addEventListener('click', () => {
  const groups = state.groups.filter((g) => state.selectedGroups.has(g.id));
  if (!groups.length) { setProgress(0, '请先勾选要采集的 GPT 图片组。'); return; }
  captureGroups(groups);
});
$('selectAllGroupsBtn').addEventListener('click', () => {
  state.groups.forEach((g) => state.selectedGroups.add(g.id));
  renderGroups();
});
$('clearBtn').addEventListener('click', () => {
  state.groups = [];
  state.selectedGroups.clear();
  state.captured = [];
  renderGroups();
  setProgress(0, '已清空。');
});
$('legacyScanBtn').addEventListener('click', legacyScan);
$('refreshBtn').addEventListener('click', scanConversation);
$('fitWindowBtn').addEventListener('click', fitWindow);
$('downloadBtn').addEventListener('click', downloadZip);

$('hdCloseBtn').addEventListener('click', closeHdModal);
$('hdBackdrop').addEventListener('click', closeHdModal);
$('hdAddBtn').addEventListener('click', addHdCurrentToCaptured);
$('hdOpenTabBtn').addEventListener('click', openHdInNewTab);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeHdModal(); });

$('zipNameInput').value = asciiZipName();
renderGroups();
setProgress(0, '打开后会自动放大窗口并自动采集当前可见高清组；下载按钮将直接下载高清 ZIP。');
window.addEventListener('load', () => { setTimeout(() => { initAutoFlow().catch((err) => setProgress(0, `自动采集失败：${err.message || err}`)); }, 180); });
