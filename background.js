const VERSION = '0.0.18';
let panelWindowId = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function getSourceWindow(tab) {
  if (tab?.windowId !== undefined) {
    try { return await chrome.windows.get(tab.windowId); } catch (_) {}
  }
  return chrome.windows.getCurrent();
}

async function openFullHeightPanel(tab) {
  const sourceWindow = await getSourceWindow(tab);
  const sourceWidth = sourceWindow.width || 1440;
  const sourceHeight = sourceWindow.height || 900;
  const sourceLeft = sourceWindow.left || 0;
  const sourceTop = sourceWindow.top || 0;

  const maxPanelWidth = Math.max(760, Math.min(1480, sourceWidth - 24));
  const minPanelWidth = Math.min(1040, maxPanelWidth);
  const panelWidth = clamp(Math.round(sourceWidth * 0.56), minPanelWidth, maxPanelWidth);
  const panelHeight = Math.max(760, sourceHeight);
  const panelLeft = sourceLeft + Math.max(0, sourceWidth - panelWidth - 8);
  const panelTop = sourceTop;
  const tabId = tab?.id || '';
  const url = chrome.runtime.getURL(`popup.html?mode=window&tabId=${encodeURIComponent(tabId)}&v=${VERSION}`);

  if (panelWindowId !== null) {
    try {
      await chrome.windows.update(panelWindowId, {
        focused: true,
        state: 'normal',
        width: panelWidth,
        height: panelHeight,
        left: panelLeft,
        top: panelTop
      });
      const tabs = await chrome.tabs.query({ windowId: panelWindowId });
      if (tabs?.[0]?.id) await chrome.tabs.update(tabs[0].id, { url, active: true });
      return;
    } catch (_) { panelWindowId = null; }
  }

  const win = await chrome.windows.create({
    url,
    type: 'popup',
    width: panelWidth,
    height: panelHeight,
    left: panelLeft,
    top: panelTop,
    focused: true
  });
  panelWindowId = win.id;
}

chrome.action.onClicked.addListener((tab) => {
  openFullHeightPanel(tab).catch((err) => console.error('[Leegle leegle-gpt-image-downloader] open panel failed:', err));
});

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === panelWindowId) panelWindowId = null;
});
