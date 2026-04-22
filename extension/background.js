'use strict';

let scrapingTabId = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'FETCH_ALBUMS') return false;
  // Ignore FETCH_ALBUMS sent by the scraping tab itself — prevents infinite loop
  if (sender.tab?.id === scrapingTabId) return false;
  fetchAlbumsViaTab()
    .then(albums => sendResponse({ albums }))
    .catch(() => sendResponse({ albums: [] }));
  return true; // keep channel open for async response
});

async function fetchAlbumsViaTab() {
  const tab = await chrome.tabs.create({ url: 'https://photos.google.com/albums', active: false });
  scrapingTabId = tab.id;
  try {
    await waitForTabLoad(tab.id);
    await waitForAlbumLinks(tab.id);
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeAlbums,
    });
    return result || [];
  } finally {
    scrapingTabId = null;
    chrome.tabs.remove(tab.id).catch(() => {});
  }
}

function waitForTabLoad(tabId) {
  return new Promise(resolve => {
    chrome.tabs.get(tabId, tab => {
      if (tab.status === 'complete') { resolve(); return; }
      function onUpdated(id, info) {
        if (id !== tabId || info.status !== 'complete') return;
        chrome.tabs.onUpdated.removeListener(onUpdated);
        resolve();
      }
      chrome.tabs.onUpdated.addListener(onUpdated);
    });
  });
}

async function waitForAlbumLinks(tabId, timeout = 8000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => document.querySelectorAll('a[href*="/album/"]').length,
    });
    if (result > 0) return;
    await new Promise(r => setTimeout(r, 400));
  }
}

// Executed inside the albums tab — must be self-contained
function scrapeAlbums() {
  const albums = [];
  const seen = new Set();
  // Albums can be /album/ (owned) or /share/ (shared) — match both
  document.querySelectorAll('a[href*="/album/"], a[href*="/share/"]').forEach(a => {
    const m = a.href.match(/\/(album|share)\/([^/?#]+)/);
    if (!m) return;
    const id = m[2];
    if (seen.has(id)) return;
    // Title lives in span.ptmR6b inside the album card
    const title = (a.querySelector('span.ptmR6b') || a.querySelector('span'))?.textContent.trim() || '';
    if (!title || title.length >= 100) return;
    seen.add(id);
    albums.push({ id, title });
  });
  return albums;
}
