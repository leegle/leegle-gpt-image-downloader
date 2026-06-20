const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);

const state = {
  tabId: Number(params.get('tabId')) || null,
  groups: [],
  selectedGroups: new Set(),
  captured: [],
  conversationName: '',
  autoStarted: false,
  lang: localStorage.getItem('leegle_ui_lang') || 'zh'
};

const I18N = {
  zh: {
    heroDesc: '打开插件后会自动采集当前屏幕可见图片组；ZIP 名称固定为 leegle-gpt-image_时间，内部文件夹和图片名均使用英文安全格式，避免乱码。',
    fitWindow: '贴边全高',
    fitWindowTitle: '重新贴合浏览器高度',
    refreshTitle: '刷新列表',
    scanConversation: '扫描当前会话图片组',
    captureVisible: '重新采集当前可见高清组',
    previewVisible: '查看当前组高清图',
    captureSelected: '采集选中组高清原图',
    selectAll: '选全部组',
    clear: '清空',
    legacyScan: '普通扫描备用',
    scanStatus: '识别 {count} 个图片组',
    selectedStatus: '已选 {selected} 组 / 已采集 {captured} 张',
    notScanned: '未扫描',
    fileLabel: 'ZIP 文件名（固定英文安全格式）',
    wait: '等待操作',
    download: '直接下载已采集高清 ZIP',
    footer: '推荐：先把需要的图片组滚到屏幕中间，点「重新采集当前可见高清组」。要下载整段会话中多组图片，先点「扫描当前会话图片组」，勾选组，再点「采集选中组高清原图」。',
    hdTitle: '高清原图预览',
    hdMeta: '等待加载',
    openTab: '新标签打开',
    addDownload: '加入下载',
    close: '关闭',
    empty: '还没有识别到当前会话图片组。请停留在 ChatGPT 对话页面，点击「扫描当前会话图片组」，或把目标图片组滚到屏幕中间后点击「采集当前可见图片组」。',
    metaThumbs: '检测到右侧小图按钮 {count} 张，将读取每张小图的原始 file 图片',
    metaSingle: '检测到单张大图',
    groupFallback: '会话图片组',
    itemCount: '{count} 张',
    noPrompt: '未识别到提示词',
    captureThisGroup: '采集本组',
    clickHd: '点击查看高清原图',
    placeholderPreview: '预览',
    placeholderPending: '待采集',
    hdOriginal: '高清原图',
    previewNoUrl: '这个预览没有原图链接，请先采集本组高清图。',
    readingHd: '正在读取高清原图 #{index}...',
    hdReadFail: '高清原图读取失败',
    hdOpened: '已打开高清原图：{width} × {height}。',
    hdPreviewFail: '高清预览失败：{error}',
    addedDownload: '已加入下载列表。',
    startCaptureFail: '无法开始采集图片组',
    capturing: '正在采集「{title}」第 {index}/{count} 张...',
    captureOneFail: '第 {index} 张采集失败',
    capturedGroups: '已采集 {done}/{total} 个图片组，当前共 {count} 张。',
    captureDone: '采集完成：{count} 张图片，可以下载 ZIP。',
    captureFail: '采集失败：{error}',
    scanning: '正在按 ChatGPT 图片组 DOM 扫描左侧大图 + 右侧小图按钮...',
    scanFail: '扫描失败',
    scanDone: '扫描完成：识别 {count} 个会话图片组。',
    scanEmpty: '没有识别到 GPT 图片组，请把左侧大图和右侧小图滚到屏幕中间后再试。',
    scanFailWithError: '扫描失败：{error}',
    locatingVisible: '正在定位当前屏幕中的左侧大图 + 右侧小图组，并读取高清原图...',
    noVisibleGroup: '没有找到当前可见图片组',
    visibleCaptureFail: '当前可见组采集失败：{error}',
    legacyScanning: '正在执行备用扫描：只扫描会话正文大图，不扫边栏...',
    legacyFail: '备用扫描失败',
    legacyDone: '备用扫描完成：{count} 个图片组。',
    legacyFailWithError: '备用扫描失败：{error}',
    zipping: '正在生成 ZIP...',
    zipDone: '高清 ZIP 已开始下载，文件名和内部文件夹均为英文安全格式：{count} 张图片。',
    zipFail: 'ZIP 下载失败：{error}',
    fitFail: '贴边失败：{error}',
    autoCapturing: '已自动放大窗口，正在自动采集当前可见高清组...',
    selectFirst: '请先勾选要采集的 GPT 图片组。',
    cleared: '已清空。',
    initial: '打开后会自动放大窗口并自动采集当前可见高清组；下载按钮将直接下载高清 ZIP。',
    autoFail: '自动采集失败：{error}',
    languageSwitched: '已切换为中文界面。'
  },
  en: {
    heroDesc: 'After opening the extension, it automatically captures the currently visible image group. ZIP names use leegle-gpt-image_time, and internal folders/files use safe English names to avoid garbled text.',
    fitWindow: 'Fit Height',
    fitWindowTitle: 'Fit panel to browser height',
    refreshTitle: 'Refresh list',
    scanConversation: 'Scan Current Conversation',
    captureVisible: 'Recapture Visible HD Group',
    previewVisible: 'Preview Current HD Group',
    captureSelected: 'Capture Selected HD Groups',
    selectAll: 'Select All Groups',
    clear: 'Clear',
    legacyScan: 'Legacy Scan',
    scanStatus: '{count} image group(s)',
    selectedStatus: '{selected} selected / {captured} captured',
    notScanned: 'Not scanned',
    fileLabel: 'ZIP filename: safe English format',
    wait: 'Waiting',
    download: 'Download Captured HD ZIP',
    footer: 'Recommended: scroll the target image group to the center, then click “Recapture Visible HD Group”. To download multiple groups, scan the conversation, select groups, then capture selected HD groups.',
    hdTitle: 'High-Resolution Preview',
    hdMeta: 'Waiting',
    openTab: 'Open in New Tab',
    addDownload: 'Add to Download',
    close: 'Close',
    empty: 'No image groups detected yet. Stay on the ChatGPT conversation page, click “Scan Current Conversation”, or scroll the target image group to the center and click “Capture Visible Group”.',
    metaThumbs: 'Detected {count} right-side thumbnail buttons. Original file images will be used.',
    metaSingle: 'Detected one large image',
    groupFallback: 'Conversation Image Group',
    itemCount: '{count} image(s)',
    noPrompt: 'Prompt not detected',
    captureThisGroup: 'Capture Group',
    clickHd: 'Click to preview high-resolution image',
    placeholderPreview: 'Preview',
    placeholderPending: 'Pending',
    hdOriginal: 'High-resolution image',
    previewNoUrl: 'This preview has no original image URL. Please capture this group first.',
    readingHd: 'Reading high-resolution image #{index}...',
    hdReadFail: 'Failed to read high-resolution image',
    hdOpened: 'Opened high-resolution image: {width} × {height}.',
    hdPreviewFail: 'High-resolution preview failed: {error}',
    addedDownload: 'Added to download list.',
    startCaptureFail: 'Unable to start capturing this image group',
    capturing: 'Capturing “{title}” image {index}/{count}...',
    captureOneFail: 'Failed to capture image {index}',
    capturedGroups: 'Captured {done}/{total} group(s), {count} image(s) total.',
    captureDone: 'Capture complete: {count} image(s). ZIP is ready to download.',
    captureFail: 'Capture failed: {error}',
    scanning: 'Scanning ChatGPT image-group DOM: large image + right-side thumbnails...',
    scanFail: 'Scan failed',
    scanDone: 'Scan complete: detected {count} conversation image group(s).',
    scanEmpty: 'No GPT image groups detected. Scroll the large image and right-side thumbnails to the center, then try again.',
    scanFailWithError: 'Scan failed: {error}',
    locatingVisible: 'Locating the current visible large image + thumbnail group and reading original HD files...',
    noVisibleGroup: 'No visible image group found',
    visibleCaptureFail: 'Visible group capture failed: {error}',
    legacyScanning: 'Running legacy scan: conversation images only, excluding sidebar...',
    legacyFail: 'Legacy scan failed',
    legacyDone: 'Legacy scan complete: {count} image group(s).',
    legacyFailWithError: 'Legacy scan failed: {error}',
    zipping: 'Generating ZIP...',
    zipDone: 'HD ZIP download started. Filename and internal folders use safe English format: {count} image(s).',
    zipFail: 'ZIP download failed: {error}',
    fitFail: 'Fit-height failed: {error}',
    autoCapturing: 'Panel resized. Automatically capturing the current visible HD group...',
    selectFirst: 'Please select GPT image groups first.',
    cleared: 'Cleared.',
    initial: 'The panel will resize and auto-capture the current visible HD group. Click the download button to get the HD ZIP.',
    autoFail: 'Auto capture failed: {error}',
    languageSwitched: 'Switched to English UI.'
  }
};

function t(key, vars = {}) {
  const dict = I18N[state.lang] || I18N.zh;
  let out = dict[key] || I18N.zh[key] || key;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}
function setText(id, key, vars = {}) {
  const el = $(id);
  if (el) el.textContent = t(key, vars);
}
function applyI18n() {
  document.documentElement.lang = state.lang === 'en' ? 'en' : 'zh-CN';
  const langBtn = $('langToggleBtn');
  if (langBtn) langBtn.textContent = state.lang === 'en' ? '中文' : 'EN';
  const heroDesc = document.querySelector('.hero-copy p');
  if (heroDesc) heroDesc.textContent = t('heroDesc');
  setText('fitWindowBtn', 'fitWindow');
  const fit = $('fitWindowBtn');
  if (fit) fit.title = t('fitWindowTitle');
  const refresh = $('refreshBtn');
  if (refresh) refresh.title = t('refreshTitle');
  setText('scanConversationBtn', 'scanConversation');
  setText('captureVisibleBtn', 'captureVisible');
  setText('previewVisibleBtn', 'previewVisible');
  setText('captureSelectedBtn', 'captureSelected');
  setText('selectAllGroupsBtn', 'selectAll');
  setText('clearBtn', 'clear');
  setText('legacyScanBtn', 'legacyScan');
  const label = document.querySelector('label[for="zipNameInput"]');
  if (label) label.textContent = t('fileLabel');
  setText('downloadBtn', 'download');
  const footer = document.querySelector('footer p');
  if (footer) footer.textContent = t('footer');
  setText('hdOpenTabBtn', 'openTab');
  setText('hdAddBtn', 'addDownload');
  setText('hdCloseBtn', 'close');
  if ($('hdModal')?.classList.contains('hidden')) {
    setText('hdTitle', 'hdTitle');
    setText('hdMeta', 'hdMeta');
  }
  updateSummary();
}

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
  const fallback = state.groups.find((g) => g.prompt)?.prompt || 'ChatGPT generated images';
  state.conversationName = fallback;
  return fallback;
}
function escapeHtml(text) {
  return String(text || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}
function placeholderImage(label = t('placeholderPreview')) {
  const safe = String(label || t('placeholderPreview')).replace(/[<>&"']/g, '');
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
  $('scanStatus').textContent = t('scanStatus', { count: state.groups.length });
  $('selectedStatus').textContent = t('selectedStatus', { selected: state.selectedGroups.size, captured: state.captured.length });
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
    if (pong?.ok && pong.version === '0.0.18') return;
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
    list.innerHTML = `<div class="empty">${escapeHtml(t('empty'))}</div>`;
    updateSummary();
    return;
  }
  for (const group of state.groups) {
    const card = document.createElement('section');
    card.className = 'group-card';
    const checked = state.selectedGroups.has(group.id) ? 'checked' : '';
    const meta = group.hasThumbs ? t('metaThumbs', { count: group.count }) : t('metaSingle');
    card.innerHTML = `
      <div class="group-header">
        <input type="checkbox" data-group-id="${escapeHtml(group.id)}" ${checked} />
        <div>
          <div class="group-title">${escapeHtml(group.title || t('groupFallback'))} · ${escapeHtml(t('itemCount', { count: group.count || 1 }))}</div>
          <div class="group-prompt" title="${escapeHtml(group.prompt || '')}">${escapeHtml(group.prompt || t('noPrompt'))}</div>
          <div class="group-meta">${escapeHtml(meta)}</div>
        </div>
        <div class="group-actions">
          <button class="capture-one" data-group-id="${escapeHtml(group.id)}">${escapeHtml(t('captureThisGroup'))}</button>
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
      pv.title = t('clickHd');
      const fallback = placeholderImage(p.fileId ? p.fileId.slice(-4) : t('placeholderPending'));
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
      c.title = t('clickHd');
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
  $('hdTitle').textContent = item.prompt || item.groupTitle || t('hdTitle');
  const size = item.width && item.height ? `${item.width} × ${item.height}` : t('hdOriginal');
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
    setProgress(0, t('previewNoUrl'));
    return;
  }
  setControlsDisabled(true);
  try {
    setProgress(0, t('readingHd', { index: idx + 1 }));
    let res = null;
    if (preview.url) res = await sendToContent({ type: 'LEEGLE_FETCH_HIGHRES_URL', url: preview.url });
    if (!res?.ok && group?.id) res = await sendToContent({ type: 'LEEGLE_SELECT_GROUP_INDEX', groupId: group.id, index: idx });
    if (!res?.ok || !res.dataUrl) throw new Error(res?.error || t('hdReadFail'));
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
    setProgress(100, t('hdOpened', { width: item.width || '?', height: item.height || '?' }));
  } catch (err) {
    setProgress(0, t('hdPreviewFail', { error: err.message || err }));
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
  setProgress(100, t('addedDownload'));
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
  if (!start?.ok) throw new Error(start?.error || t('startCaptureFail'));
  const count = Math.max(1, start.count || group.count || 1);
  const freshGroup = start.group || group;
  const captured = [];
  // Remove old captures from this group before recapturing.
  state.captured = state.captured.filter((item) => item.groupId !== group.id);
  renderGroups();
  for (let i = 0; i < count; i++) {
    setProgress(Math.round((i / count) * 100), t('capturing', { title: freshGroup.title || group.title, index: i + 1, count }));
    const res = await sendToContent({ type: 'LEEGLE_SELECT_GROUP_INDEX', groupId: group.id, index: i });
    if (!res?.ok) throw new Error(res?.error || t('captureOneFail', { index: i + 1 }));
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
      setProgress(Math.round((done / groups.length) * 100), t('capturedGroups', { done, total: groups.length, count: state.captured.length }));
    }
    setProgress(100, t('captureDone', { count: state.captured.length }));
  } catch (err) {
    setProgress(0, t('captureFail', { error: err.message || err }));
  } finally {
    setControlsDisabled(false);
    updateSummary();
  }
}
async function scanConversation() {
  setControlsDisabled(true);
  setProgress(0, t('scanning'));
  try {
    const res = await sendToContent({ type: 'LEEGLE_SCAN_CONVERSATION_GROUPS' });
    if (!res?.ok) throw new Error(res?.error || t('scanFail'));
    state.groups = res.groups || [];
    state.selectedGroups.clear();
    state.captured = [];
    state.groups.forEach((g) => state.selectedGroups.add(g.id));
    await defaultZipName(state.groups);
    renderGroups();
    setProgress(0, state.groups.length ? t('scanDone', { count: state.groups.length }) : t('scanEmpty'));
  } catch (err) {
    setProgress(0, t('scanFailWithError', { error: err.message || err }));
    state.groups = [];
    state.selectedGroups.clear();
    state.captured = [];
    renderGroups();
  } finally { setControlsDisabled(false); }
}
async function captureVisibleGroup(autoPreview = false) {
  setControlsDisabled(true);
  setProgress(0, t('locatingVisible'));
  try {
    const res = await sendToContent({ type: 'LEEGLE_PREPARE_VISIBLE_GROUP' });
    if (!res?.ok) throw new Error(res?.error || t('noVisibleGroup'));
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
    setProgress(0, t('visibleCaptureFail', { error: err.message || err }));
  } finally { setControlsDisabled(false); }
}
async function legacyScan() {
  setControlsDisabled(true);
  setProgress(0, t('legacyScanning'));
  try {
    const res = await sendToContent({ type: 'LEEGLE_LEGACY_SCAN' });
    if (!res?.ok) throw new Error(res?.error || t('legacyFail'));
    state.groups = res.groups || [];
    state.selectedGroups.clear();
    state.captured = [];
    state.groups.forEach((g) => state.selectedGroups.add(g.id));
    await defaultZipName(state.groups);
    renderGroups();
    setProgress(0, t('legacyDone', { count: state.groups.length }));
  } catch (err) { setProgress(0, t('legacyFailWithError', { error: err.message || err })); }
  finally { setControlsDisabled(false); }
}
async function downloadZip() {
  if (!state.captured.length) return;
  setControlsDisabled(true);
  try {
    setProgress(0, t('zipping'));
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
    setProgress(100, t('zipDone', { count: state.captured.length }));
  } catch (err) { setProgress(0, t('zipFail', { error: err.message || err })); }
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
  } catch (err) { setProgress(0, t('fitFail', { error: err.message || err })); }
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
  setProgress(0, t('autoCapturing'));
  await captureVisibleGroup(false);
}

$('langToggleBtn').addEventListener('click', () => {
  state.lang = state.lang === 'zh' ? 'en' : 'zh';
  localStorage.setItem('leegle_ui_lang', state.lang);
  applyI18n();
  renderGroups();
  setProgress(0, t('languageSwitched'));
});
$('scanConversationBtn').addEventListener('click', scanConversation);
$('captureVisibleBtn').addEventListener('click', () => captureVisibleGroup(false));
$('previewVisibleBtn').addEventListener('click', () => captureVisibleGroup(true));
$('captureSelectedBtn').addEventListener('click', () => {
  const groups = state.groups.filter((g) => state.selectedGroups.has(g.id));
  if (!groups.length) { setProgress(0, t('selectFirst')); return; }
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
  setProgress(0, t('cleared'));
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
applyI18n();
setProgress(0, t('initial'));
window.addEventListener('load', () => { setTimeout(() => { initAutoFlow().catch((err) => setProgress(0, t('autoFail', { error: err.message || err }))); }, 180); });
