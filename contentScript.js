(function () {
  if (window.__leegleGptImageZipReadyV0012) return;
  window.__leegleGptImageZipReadyV0012 = true;

  const VERSION = '0.0.15';
  const groupCache = new Map();

  function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
  function isEl(el) { return el && el.nodeType === 1; }
  function rectOf(el) {
    try { return el.getBoundingClientRect(); }
    catch (_) { return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }; }
  }
  function areaOfRect(r) { return Math.max(0, r.width || 0) * Math.max(0, r.height || 0); }
  function visible(el, min = 8) {
    if (!isEl(el)) return false;
    const r = rectOf(el);
    if (r.width < min || r.height < min) return false;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    return true;
  }
  function visibleArea(el) {
    const r = rectOf(el);
    const w = Math.max(0, Math.min(r.right, window.innerWidth) - Math.max(r.left, 0));
    const h = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0));
    return w * h;
  }
  function cleanText(text, max = 180) {
    return String(text || '')
      .replace(/\s+/g, ' ')
      .replace(/复制|下载|分享|编辑|重试|重新生成|Copy|Download|Share|Edit|Regenerate/g, '')
      .trim()
      .slice(0, max);
  }
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < String(str).length; i++) {
      h ^= String(str).charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return (h >>> 0).toString(36);
  }
  function normalizeUrl(url) {
    try { return new URL(String(url || '').replace(/&amp;/g, '&'), location.href).href; }
    catch (_) { return String(url || '').replace(/&amp;/g, '&'); }
  }
  function fileIdFromUrl(url) {
    const s = String(url || '').replace(/&amp;/g, '&');
    const m = s.match(/[?&]id=(file_[a-zA-Z0-9_-]+)/) || s.match(/(file_[a-zA-Z0-9_-]+)/);
    return m ? m[1] : '';
  }
  function isGeneratedImageUrl(url) {
    const s = String(url || '');
    if (!s || /^javascript:/i.test(s)) return false;
    if (s.startsWith('data:image/') || s.startsWith('blob:')) return true;
    if (fileIdFromUrl(s)) return true;
    return /\/backend-api\/estuary\/content|generated|imagegen|dalle|oai|openai|chatgpt/i.test(s) || /\.(png|jpe?g|webp|gif|avif)(\?|#|$)/i.test(s);
  }
  function urlsFromElement(el) {
    const urls = [];
    if (!isEl(el)) return urls;
    if (el instanceof HTMLImageElement) {
      urls.push(el.currentSrc || '');
      urls.push(el.src || '');
      const srcset = el.getAttribute('srcset') || '';
      srcset.split(',').forEach((p) => urls.push(p.trim().split(/\s+/)[0] || ''));
    }
    ['href', 'src', 'data-src', 'data-url', 'data-image-url', 'data-full-src', 'data-download-url', 'data-original'].forEach((a) => {
      const v = el.getAttribute?.(a);
      if (v) urls.push(v);
    });
    const a = el.closest?.('a[href]');
    if (a) urls.push(a.getAttribute('href'));
    return urls.map(normalizeUrl).filter(isGeneratedImageUrl);
  }
  function bestImgUrl(el) {
    const urls = urlsFromElement(el);
    // Prefer ChatGPT estuary/file URLs over transient blob/data URLs because they are the original generated files.
    return urls.find((u) => fileIdFromUrl(u)) || urls[0] || '';
  }
  function uniqueByFileId(items) {
    const out = [];
    const seen = new Set();
    for (const item of items) {
      const fileId = item.fileId || fileIdFromUrl(item.url) || item.url || `pos-${Math.round(item.rect?.left || 0)}-${Math.round(item.rect?.top || 0)}`;
      if (seen.has(fileId)) continue;
      seen.add(fileId);
      out.push({ ...item, fileId });
    }
    return out;
  }
  async function urlToDataUrl(url) {
    if (!url) return '';
    if (String(url).startsWith('data:image/')) return url;
    try {
      const resp = await fetch(url, { credentials: 'include', cache: 'force-cache' });
      if (!resp.ok) return '';
      const blob = await resp.blob();
      if (!String(blob.type || '').startsWith('image/')) return '';
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
    } catch (_) { return ''; }
  }

  async function blobToThumbDataUrl(blob, maxSize = 180) {
    if (!blob || !String(blob.type || '').startsWith('image/')) return '';
    let bmp = null;
    try {
      if (typeof createImageBitmap === 'function') {
        bmp = await createImageBitmap(blob);
        const ratio = Math.min(maxSize / Math.max(bmp.width, 1), maxSize / Math.max(bmp.height, 1), 1);
        const w = Math.max(1, Math.round(bmp.width * ratio));
        const h = Math.max(1, Math.round(bmp.height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bmp, 0, 0, w, h);
        return canvas.toDataURL('image/jpeg', 0.82);
      }
    } catch (_) {}
    try {
      const objectUrl = URL.createObjectURL(blob);
      const img = await new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = objectUrl;
      });
      const ratio = Math.min(maxSize / Math.max(img.naturalWidth || img.width || 1, 1), maxSize / Math.max(img.naturalHeight || img.height || 1, 1), 1);
      const w = Math.max(1, Math.round((img.naturalWidth || img.width || maxSize) * ratio));
      const h = Math.max(1, Math.round((img.naturalHeight || img.height || maxSize) * ratio));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(objectUrl);
      return canvas.toDataURL('image/jpeg', 0.82);
    } catch (_) { return ''; }
  }
  async function urlToThumbDataUrl(url, maxSize = 180) {
    if (!url) return '';
    if (String(url).startsWith('data:image/')) return url;
    try {
      const resp = await fetch(url, { credentials: 'include', cache: 'force-cache' });
      if (!resp.ok) return '';
      const blob = await resp.blob();
      return await blobToThumbDataUrl(blob, maxSize);
    } catch (_) { return ''; }
  }
  async function addPreviewThumbs(publicGroup, max = 12) {
    if (!publicGroup || !Array.isArray(publicGroup.previews)) return publicGroup;
    const jobs = publicGroup.previews.slice(0, max).map(async (p) => {
      const url = p.url || '';
      const thumbDataUrl = await urlToThumbDataUrl(url, 180);
      return { ...p, thumbDataUrl };
    });
    const hydrated = await Promise.all(jobs.map((job) => job.catch(() => null)));
    publicGroup.previews = publicGroup.previews.map((p, i) => hydrated[i] || p);
    return publicGroup;
  }
  async function addPreviewThumbsToGroups(groups, maxGroups = 20, maxPerGroup = 12) {
    const out = [];
    for (let i = 0; i < groups.length; i++) {
      const g = { ...groups[i], previews: Array.isArray(groups[i].previews) ? groups[i].previews.map((p) => ({ ...p })) : [] };
      if (i < maxGroups) await addPreviewThumbs(g, maxPerGroup);
      out.push(g);
    }
    return out;
  }
  async function imageToDataUrl(el) {
    if (!isEl(el)) return '';
    try {
      if (el instanceof HTMLCanvasElement) return el.toDataURL('image/png');
    } catch (_) {}
    const url = bestImgUrl(el);
    const data = await urlToDataUrl(url);
    if (data) return data;
    try {
      if (el instanceof HTMLImageElement && el.naturalWidth && el.naturalHeight) {
        const c = document.createElement('canvas');
        c.width = el.naturalWidth;
        c.height = el.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(el, 0, 0);
        return c.toDataURL('image/png');
      }
    } catch (_) {}
    return '';
  }
  function extFromDataUrl(url) {
    const m = String(url || '').match(/^data:image\/([a-z0-9.+-]+);/i);
    if (!m) return 'png';
    return m[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg');
  }
  async function dimensionsFromDataUrl(dataUrl) {
    if (!dataUrl || !String(dataUrl).startsWith('data:image/')) return { width: 0, height: 0 };
    try {
      const img = await new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = dataUrl;
      });
      return {
        width: Math.round(img.naturalWidth || img.width || 0),
        height: Math.round(img.naturalHeight || img.height || 0)
      };
    } catch (_) {
      return { width: 0, height: 0 };
    }
  }
  async function fetchHighresUrl(url) {
    const normalized = normalizeUrl(url || '');
    if (!normalized) return { ok: false, error: '缺少原图 URL。' };
    const dataUrl = await urlToDataUrl(normalized);
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      return { ok: false, error: '无法读取高清原图，可能是页面图片链接已过期，请刷新 ChatGPT 页面后重试。' };
    }
    const dims = await dimensionsFromDataUrl(dataUrl);
    return {
      ok: true,
      url: normalized,
      fileId: fileIdFromUrl(normalized),
      dataUrl,
      ext: extFromDataUrl(dataUrl),
      width: dims.width,
      height: dims.height
    };
  }
  function mainRoot() {
    return document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
  }
  function inLeftSidebar(el) {
    const r = rectOf(el);
    if (el.closest?.('nav, aside')) return true;
    if (r.right < Math.min(260, window.innerWidth * 0.22)) return true;
    return false;
  }
  function imageShell(el) {
    return el.closest?.('[id^="image-"], [class*="group/imagegen-image"]') || el;
  }
  function allGeneratedImgs(root = mainRoot()) {
    return Array.from(root.querySelectorAll('img, canvas')).filter((el) => {
      if (!visible(el, 16) || inLeftSidebar(el)) return false;
      if (el instanceof HTMLImageElement) {
        const url = bestImgUrl(el);
        const alt = `${el.alt || ''} ${el.getAttribute('aria-label') || ''}`;
        return isGeneratedImageUrl(url) || /已生成图片|generated image|GPT image|image preview/i.test(alt);
      }
      return true;
    });
  }
  function isLargeGenerated(el) {
    if (!(el instanceof HTMLImageElement) && !(el instanceof HTMLCanvasElement)) return false;
    if (!visible(el, 120) || inLeftSidebar(el)) return false;
    const root = mainRoot();
    if (root && !root.contains(el)) return false;
    const r = rectOf(el);
    if (r.width < 220 || r.height < 220 || areaOfRect(r) < 65000) return false;
    const url = bestImgUrl(el);
    if (/avatar|favicon|sprite|emoji|logo|placeholder|loading|spinner/i.test(url)) return false;
    return true;
  }
  function findLargeNearColumn(column) {
    const cr = rectOf(column);
    const candidates = allGeneratedImgs(mainRoot())
      .filter((img) => !column.contains(img) && isLargeGenerated(img))
      .map((img) => {
        const r = rectOf(img);
        const yOverlap = Math.max(0, Math.min(r.bottom, cr.bottom + 80) - Math.max(r.top, cr.top - 80));
        const leftOfCol = r.left < cr.left && r.right <= cr.left + 42;
        const dist = Math.abs(r.right - cr.left) + Math.abs((r.top + r.bottom) / 2 - (cr.top + cr.bottom) / 2);
        const score = (leftOfCol ? 1000000 : 0) + yOverlap * 1000 + areaOfRect(r) - dist;
        return { img, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    return candidates[0]?.img || null;
  }
  function thumbItemsFromColumn(column) {
    const buttons = Array.from(column.querySelectorAll('button, [role="button"]')).filter((btn) => visible(btn, 20));
    const raw = [];
    for (const btn of buttons) {
      const imgs = Array.from(btn.querySelectorAll('img, canvas')).filter((img) => visible(img, 12));
      const urls = [];
      for (const img of imgs) urls.push(...urlsFromElement(img));
      const url = urls.find((u) => fileIdFromUrl(u)) || urls.find(isGeneratedImageUrl) || '';
      if (!url) continue;
      const shell = imageShell(imgs[0] || btn);
      raw.push({ button: btn, img: imgs[0] || btn, shell, url, fileId: fileIdFromUrl(url), rect: rectOf(shell) });
    }
    return uniqueByFileId(raw);
  }
  function thumbColumns() {
    const root = mainRoot();
    const cols = Array.from(root.querySelectorAll('[class*="shrink-0"], [class*="scrollbar-thin"]'))
      .map((el) => el.closest?.('[class*="shrink-0"]') || el)
      .filter((el, i, arr) => arr.indexOf(el) === i)
      .filter((el) => visible(el, 30) && !inLeftSidebar(el));
    return cols.filter((col) => thumbItemsFromColumn(col).length >= 2);
  }
  function previousPrompt(el) {
    const root = mainRoot();
    const promptNodes = Array.from(root.querySelectorAll('[data-message-author-role="user"], [data-testid^="conversation-turn"], article'))
      .filter((node) => {
        const txt = cleanText(node.innerText || node.textContent || '', 600);
        if (!txt) return false;
        if (/Thought for|非常抱歉|违反了|I.?m sorry|cannot assist/i.test(txt)) return false;
        const pos = node.compareDocumentPosition(el);
        return Boolean(pos & Node.DOCUMENT_POSITION_FOLLOWING);
      });
    const lastUser = promptNodes.reverse().find((node) => node.getAttribute?.('data-message-author-role') === 'user') || promptNodes[0];
    return cleanText(lastUser ? (lastUser.innerText || lastUser.textContent) : '', 160) || 'ChatGPT 生成图片';
  }
  function previewDataFor(el) {
    const r = rectOf(el);
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  }
  function makePublicGroup(group) {
    const lr = rectOf(group.large);
    const previews = group.items.length ? group.items : [{ img: group.large, url: bestImgUrl(group.large), fileId: fileIdFromUrl(bestImgUrl(group.large)), rect: lr }];
    return {
      id: group.id,
      title: group.title,
      prompt: group.prompt,
      count: previews.length,
      hasThumbs: group.items.length > 1,
      mode: group.mode || (group.items.length > 1 ? 'thumbnail-column' : 'single-large'),
      top: Math.round(lr.top + window.scrollY),
      largeRect: previewDataFor(group.large),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      previews: previews.slice(0, 20).map((item, i) => ({
        index: i,
        rect: previewDataFor(item.shell || item.img || group.large),
        url: item.url || '',
        fileId: item.fileId || fileIdFromUrl(item.url || ''),
        width: Math.round(rectOf(item.shell || item.img || group.large).width),
        height: Math.round(rectOf(item.shell || item.img || group.large).height)
      }))
    };
  }
  function makeGroupFromColumn(column, groupIndex) {
    const items = thumbItemsFromColumn(column);
    const large = findLargeNearColumn(column) || items[0]?.img;
    if (!large || !items.length) return null;
    const firstId = items[0]?.fileId || hash(items[0]?.url || '');
    const id = `chatgpt-thumbgroup-${hash(location.pathname + '|' + Math.round((rectOf(large).top + window.scrollY) / 16) + '|' + firstId + '|' + items.length)}`;
    return {
      id,
      title: `会话图片组 ${groupIndex + 1}`,
      prompt: previousPrompt(large),
      large,
      column,
      items,
      count: items.length,
      mode: 'thumbnail-column',
      order: (rectOf(large).top + window.scrollY) * 1000 + rectOf(large).left
    };
  }
  function standaloneGroups(existingGroups) {
    const usedIds = new Set();
    for (const g of existingGroups) for (const item of g.items) if (item.fileId) usedIds.add(item.fileId);
    const raw = allGeneratedImgs(mainRoot()).filter(isLargeGenerated).map((img) => {
      const url = bestImgUrl(img);
      const fileId = fileIdFromUrl(url) || hash(url || `${rectOf(img).left}-${rectOf(img).top}`);
      return { img, url, fileId };
    }).filter((x) => !usedIds.has(x.fileId));
    const uniq = uniqueByFileId(raw.map((x) => ({ ...x, shell: imageShell(x.img), rect: rectOf(imageShell(x.img)) })));
    return uniq.map((item, i) => {
      const id = `chatgpt-single-${hash(location.pathname + '|' + item.fileId + '|' + Math.round((rectOf(item.img).top + window.scrollY) / 16))}`;
      return {
        id,
        title: `会话图片组 ${existingGroups.length + i + 1}`,
        prompt: previousPrompt(item.img),
        large: item.img,
        column: null,
        items: [item],
        count: 1,
        mode: 'single-large',
        order: (rectOf(item.img).top + window.scrollY) * 1000 + rectOf(item.img).left
      };
    });
  }
  function scanConversationGroups() {
    groupCache.clear();
    const groups = [];
    for (const col of thumbColumns()) {
      const group = makeGroupFromColumn(col, groups.length);
      if (!group) continue;
      // Dedupe columns that point at the same large image and same first file id.
      const key = `${Math.round((rectOf(group.large).top + window.scrollY) / 24)}-${group.items[0]?.fileId || ''}-${group.items.length}`;
      if (groups.some((g) => g._key === key)) continue;
      group._key = key;
      groups.push(group);
    }
    groups.push(...standaloneGroups(groups));
    groups.sort((a, b) => a.order - b.order);
    groups.forEach((g, i) => {
      g.title = `会话图片组 ${i + 1}`;
      groupCache.set(g.id, g);
    });
    return { ok: true, version: VERSION, groups: groups.map(makePublicGroup) };
  }
  function prepareVisibleGroup() {
    scanConversationGroups();
    const candidates = Array.from(groupCache.values()).map((g) => {
      const ar = visibleArea(g.large);
      const tr = g.column ? visibleArea(g.column) : 0;
      const centerDist = Math.abs((rectOf(g.large).top + rectOf(g.large).bottom) / 2 - window.innerHeight / 2);
      const score = ar * 4 + tr + (g.items.length > 1 ? 350000 : 0) - centerDist * 200;
      return { g, score, visible: ar + tr };
    }).filter((x) => x.visible > 50000).sort((a, b) => b.score - a.score);
    const group = candidates[0]?.g;
    if (!group) return { ok: false, error: '没有在当前屏幕中找到 GPT 生成图片组。请把左侧大图和右侧小图滚动到屏幕中间。' };
    return { ok: true, group: makePublicGroup(group) };
  }
  async function startGroupCapture(groupId) {
    let group = groupCache.get(groupId);
    if (!group) {
      scanConversationGroups();
      group = groupCache.get(groupId);
    }
    if (!group) return { ok: false, error: '图片组已失效，请重新扫描当前会话。' };
    group.large.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    await sleep(280);
    // Recalculate thumbnail buttons after scroll/lazy render.
    if (group.column) {
      const freshColumn = thumbColumns().find((col) => {
        const large = findLargeNearColumn(col);
        return large && Math.abs(rectOf(large).top - rectOf(group.large).top) < 80;
      }) || group.column;
      group.column = freshColumn;
      group.items = thumbItemsFromColumn(freshColumn);
      const large = findLargeNearColumn(freshColumn);
      if (large) group.large = large;
    }
    group.count = Math.max(1, group.items.length || 1);
    return { ok: true, group: makePublicGroup(group), count: group.count };
  }
  function clickElement(el) {
    const target = el.closest?.('button, [role="button"], a') || el;
    const r = rectOf(target);
    const opts = { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, view: window };
    ['pointerover', 'pointerenter', 'mouseover', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach((type) => {
      try { target.dispatchEvent(new MouseEvent(type, opts)); } catch (_) {}
    });
    try { target.click?.(); } catch (_) {}
  }
  async function selectGroupIndex(groupId, index) {
    let group = groupCache.get(groupId);
    if (!group) {
      scanConversationGroups();
      group = groupCache.get(groupId);
    }
    if (!group) return { ok: false, error: '图片组已失效，请重新扫描。' };
    group.large.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    await sleep(180);

    const items = group.items.length ? group.items : [{ img: group.large, button: group.large, url: bestImgUrl(group.large), fileId: fileIdFromUrl(bestImgUrl(group.large)) }];
    const item = items[Math.max(0, Math.min(Number(index) || 0, items.length - 1))];
    let dataUrl = '';
    let sourceUrl = item?.url || '';
    let sourceFileId = item?.fileId || fileIdFromUrl(sourceUrl);
    let highresDims = { width: 0, height: 0 };

    // Most reliable path for the DOM supplied by the user: each thumbnail button already contains the original estuary file URL.
    // Fetching that URL avoids screenshot cropping and avoids downloading the same currently selected large image repeatedly.
    if (sourceUrl) {
      const payload = await fetchHighresUrl(sourceUrl);
      if (payload?.ok) {
        dataUrl = payload.dataUrl;
        sourceFileId = payload.fileId || sourceFileId;
        highresDims = { width: payload.width || 0, height: payload.height || 0 };
      }
    }

    if (item?.button && item.button !== group.large) {
      clickElement(item.button);
      await sleep(520);
      const large = findLargeNearColumn(group.column || item.button.closest('[class*="shrink-0"]')) ||
        allGeneratedImgs(mainRoot()).filter(isLargeGenerated).sort((a, b) => visibleArea(b) - visibleArea(a))[0];
      if (large) group.large = large;
    }

    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      dataUrl = await imageToDataUrl(group.large);
      highresDims = await dimensionsFromDataUrl(dataUrl);
      sourceUrl = sourceUrl || bestImgUrl(group.large);
      sourceFileId = sourceFileId || fileIdFromUrl(sourceUrl);
    }
    const r = rectOf(group.large);
    return {
      ok: true,
      index,
      groupId,
      prompt: group.prompt,
      title: group.title,
      dataUrl,
      ext: extFromDataUrl(dataUrl),
      url: sourceUrl || bestImgUrl(group.large),
      fileId: sourceFileId || fileIdFromUrl(sourceUrl || bestImgUrl(group.large)),
      width: highresDims.width || group.large.naturalWidth || Math.round(r.width),
      height: highresDims.height || group.large.naturalHeight || Math.round(r.height),
      rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
  }
  async function legacyScanConversationImages() {
    const groups = scanConversationGroups().groups || [];
    return { ok: true, version: VERSION, groups };
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const type = message?.type;
    if (type === 'LEEGLE_PING') { sendResponse({ ok: true, version: VERSION }); return true; }
    if (type === 'LEEGLE_SCAN_CONVERSATION_GROUPS') {
      (async () => {
        const res = scanConversationGroups();
        res.groups = await addPreviewThumbsToGroups(res.groups || [], 20, 12);
        sendResponse(res);
      })();
      return true;
    }
    if (type === 'LEEGLE_PREPARE_VISIBLE_GROUP') {
      (async () => {
        const res = prepareVisibleGroup();
        if (res?.ok && res.group) await addPreviewThumbs(res.group, 12);
        sendResponse(res);
      })();
      return true;
    }
    if (type === 'LEEGLE_LEGACY_SCAN') {
      legacyScanConversationImages().then(async (res) => {
        res.groups = await addPreviewThumbsToGroups(res.groups || [], 20, 12);
        sendResponse(res);
      });
      return true;
    }
    if (type === 'LEEGLE_FETCH_HIGHRES_URL') {
      fetchHighresUrl(message.url || '').then(sendResponse);
      return true;
    }
    if (type === 'LEEGLE_START_GROUP_CAPTURE') {
      startGroupCapture(message.groupId).then(async (res) => {
        if (res?.ok && res.group) await addPreviewThumbs(res.group, 12);
        sendResponse(res);
      });
      return true;
    }
    if (type === 'LEEGLE_SELECT_GROUP_INDEX') { selectGroupIndex(message.groupId, message.index || 0).then(sendResponse); return true; }
    return false;
  });
})();
