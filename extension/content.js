// Google Photos Swiper — content script v2
// Arrow Right → add to selected album | Arrow Left → skip | Backtick → toggle

(function () {
  'use strict';

  // ─── State ───────────────────────────────────────────────────────────────
  let albums = [];
  let selectedAlbum = null;
  let skipCount = 0;
  let addCount = 0;
  let isProcessing = false;
  let hudVisible = false;
  let albumsLoaded = false;
  let isLoadingAlbums = false;

  // ─── Build overlay using Shadow DOM ──────────────────────────────────────
  // Attaching to <html> (not body) avoids being clipped by body overflow:hidden.
  // Shadow DOM fully isolates our styles from Google Photos CSS.
  function buildOverlay() {
    if (document.getElementById('ps-host')) return;

    const host = document.createElement('div');
    host.id = 'ps-host';
    Object.assign(host.style, {
      position: 'fixed',
      bottom: '0',
      left: '0',
      right: '0',
      zIndex: '2147483647',
      pointerEvents: 'none',
    });
    document.documentElement.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        #flash {
          position: fixed; inset: 0;
          pointer-events: none; opacity: 0;
          transition: opacity 0.05s; z-index: 2147483645;
        }
        #flash.right { background: rgba(34,197,94,0.14); opacity: 1; }
        #flash.left  { background: rgba(239,68,68,0.12); opacity: 1; }

        #toast {
          position: fixed; top: 18px; left: 50%;
          transform: translateX(-50%) translateY(-64px);
          z-index: 2147483647;
          background: #fff; border: 1px solid #e5e7eb; border-radius: 10px;
          padding: 8px 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 13px; color: #374151;
          box-shadow: 0 4px 14px rgba(0,0,0,0.09);
          white-space: nowrap; pointer-events: none;
          transition: transform 0.26s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s;
          opacity: 0;
        }
        #toast.show    { transform: translateX(-50%) translateY(0); opacity: 1; }
        #toast.success { border-color: #86efac; color: #166534; }
        #toast.skip    { border-color: #fca5a5; color: #991b1b; }

        #hud {
          position: fixed; bottom: 0; left: 0; right: 0;
          height: 58px;
          background: #ffffff;
          border-top: 1px solid #e5e7eb;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.06);
          display: flex; align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          pointer-events: all;
          transition: transform 0.2s ease, opacity 0.2s ease;
          z-index: 2147483646;
        }
        #hud.hidden { transform: translateY(100%); opacity: 0; pointer-events: none; }

        .action {
          display: flex; align-items: center; gap: 7px;
          padding: 0 22px; height: 100%; min-width: 130px;
          cursor: pointer; font-size: 13px; font-weight: 500;
          color: #6b7280; border: none; background: none;
          transition: color 0.12s, background 0.12s;
          white-space: nowrap; font-family: inherit;
        }
        .action:hover { background: #f9fafb; }
        #btn-skip { justify-content: flex-start; }
        #btn-add  { justify-content: flex-end; }
        #btn-skip:hover { color: #ef4444; }
        #btn-add:hover  { color: #16a34a; }

        .kbd {
          display: inline-flex; align-items: center; justify-content: center;
          width: 24px; height: 24px;
          border: 1.5px solid #d1d5db; border-radius: 5px;
          font-size: 13px; color: #9ca3af; background: #f9fafb;
          flex-shrink: 0; font-family: inherit; line-height: 1;
        }
        #btn-skip:hover .kbd { border-color: #fca5a5; color: #ef4444; background: #fef2f2; }
        #btn-add:hover  .kbd { border-color: #86efac; color: #16a34a; background: #f0fdf4; }

        .sep { width: 1px; height: 30px; background: #e5e7eb; flex-shrink: 0; }

        #center {
          flex: 1; display: flex; align-items: center;
          justify-content: center; gap: 10px;
          padding: 0 12px; overflow: hidden;
        }

        #album-label {
          font-size: 12px; color: #9ca3af; white-space: nowrap; font-family: inherit;
        }

        #album-select {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 13px; font-weight: 500; color: #111827;
          background: #f9fafb; border: 1.5px solid #d1d5db; border-radius: 8px;
          padding: 5px 26px 5px 10px; outline: none; cursor: pointer;
          appearance: none; -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b7280'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 8px center;
          max-width: 210px; transition: border-color 0.14s;
        }
        #album-select:hover, #album-select:focus { border-color: #60a5fa; background: #fff; }
        #album-select.shake { border-color: #ef4444; animation: shake 0.28s; }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-4px); }
          75%      { transform: translateX(4px); }
        }

        #counter { font-size: 12px; color: #9ca3af; white-space: nowrap; font-family: inherit; }
        #counter b { color: #374151; font-weight: 600; }

        #load-status {
          font-size: 12px; color: #6b7280; white-space: nowrap; font-family: inherit;
          display: none;
        }
        #load-status.active {
          display: inline;
          animation: loadPulse 1.4s ease-in-out infinite;
        }
        @keyframes loadPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        #album-select:disabled { opacity: 0.55; cursor: default; }

        #album-badge {
          font-size: 11px; padding: 2px 8px; border-radius: 10px;
          white-space: nowrap; font-family: inherit; display: none;
        }
        #album-badge.in {
          display: inline;
          background: #dcfce7; color: #166534; border: 1px solid #86efac;
        }

        #toggle {
          position: fixed; bottom: 12px; right: 14px;
          z-index: 2147483647;
          display: flex; align-items: center; gap: 5px;
          background: #fff; border: 1px solid #e5e7eb; border-radius: 20px;
          padding: 6px 12px 6px 10px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 12px; color: #6b7280; cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.09); pointer-events: none; opacity: 0;
          transition: opacity 0.18s, box-shadow 0.14s;
        }
        #toggle.visible { opacity: 1; pointer-events: all; }
        #toggle:hover { box-shadow: 0 3px 12px rgba(0,0,0,0.13); color: #111; }
        #toggle img { width: 16px; height: 16px; border-radius: 3px; display: block; }
      </style>

      <div id="flash"></div>
      <div id="toast"></div>

      <div id="hud">
        <button class="action" id="btn-skip">
          <span class="kbd">←</span> Skip
        </button>
        <div class="sep"></div>
        <div id="center">
          <span id="album-label">Album:</span>
          <select id="album-select">
            <option value="">— select album —</option>
          </select>
          <span id="counter">skipped <b id="n-skip">0</b> &middot; added <b id="n-add">0</b></span>
          <span id="load-status">Loading albums…</span>
          <span id="album-badge"></span>
        </div>
        <div class="sep"></div>
        <button class="action" id="btn-add">
          Add to album <span class="kbd">→</span>
        </button>
      </div>

      <div id="toggle"><img src="${chrome.runtime.getURL('images/icon-16.png')}"> Google Photos Swiper</div>
    `;

    window.__psShadow = shadow;

    shadow.getElementById('btn-skip').addEventListener('click', doSkip);
    shadow.getElementById('btn-add').addEventListener('click', doAdd);
    shadow.getElementById('toggle').addEventListener('click', () => setHud(true));
    shadow.getElementById('album-select').addEventListener('change', (e) => {
      const opt = e.target.options[e.target.selectedIndex];
      selectedAlbum = opt.value ? { id: opt.value, title: opt.text } : null;
      if (selectedAlbum) {
        chrome.storage.local.set({ ps_album_id: opt.value, ps_album_title: opt.text });
        showToast(`Album set: ${opt.text}`, 'success');
        refreshBadge();
      } else {
        setAlbumBadge(null);
      }
    });

    chrome.storage.local.get(['ps_album_id', 'ps_album_title', 'ps_skip', 'ps_add'], (data) => {
      skipCount = data.ps_skip || 0;
      addCount  = data.ps_add  || 0;
      updateCounter();
      if (data.ps_album_id) {
        selectedAlbum = { id: data.ps_album_id, title: data.ps_album_title };
        refreshBadge();
      }
    });

    setHud(false);
  }

  function S(id) { return window.__psShadow?.getElementById(id); }

  // ─── Album loading ────────────────────────────────────────────────────────
  function setLoading(on) {
    const sel    = S('album-select');
    const status = S('load-status');
    const counter = S('counter');
    isLoadingAlbums = on;
    if (sel)     sel.disabled = on;
    if (status)  status.classList.toggle('active', on);
    if (counter) counter.style.display = on ? 'none' : '';
  }

  function loadAlbums() {
    const sel = S('album-select');
    if (!sel) return;
    scrapeNavAlbums(sel);
    // Fetch via background tab — fetch() returns SPA shell, need real JS-rendered DOM
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'FETCH_ALBUMS' }, (resp) => {
      setLoading(false);
      if (chrome.runtime.lastError) { showToast('Could not load albums', 'skip'); return; }
      const seen = new Set(albums.map(a => a.id));
      (resp?.albums || []).forEach(({ id, title }) => {
        if (seen.has(id)) return;
        seen.add(id);
        albums.push({ id, title });
        addOption(sel, id, title);
      });
      const msg = albums.length > 0
        ? `${albums.length} albums loaded ✓`
        : 'No albums found — visit Photos › Albums first';
      showToast(msg, albums.length > 0 ? 'success' : 'skip');
      chrome.storage.local.get(['ps_album_id'], (data) => {
        if (data.ps_album_id) sel.value = data.ps_album_id;
      });
    });
  }

  function scrapeNavAlbums(sel) {
    const seen = new Set();
    // Albums can be /album/ (owned) or /share/ (shared) — match both
    document.querySelectorAll('a[href*="/album/"], a[href*="/share/"]').forEach(a => {
      const m = a.href.match(/\/(album|share)\/([^/?#]+)/);
      if (!m) return;
      const id = m[2];
      if (seen.has(id)) return;
      // Title lives in span.ptmR6b; fall back to first span's direct text nodes
      const title = a.querySelector('span.ptmR6b')?.textContent.trim()
        || directText(a.querySelector('span'));
      if (!title || title.length >= 100) return;
      seen.add(id);
      albums.push({ id, title });
      addOption(sel, id, title);
    });
  }

  function directText(el) {
    if (!el) return '';
    return [...el.childNodes]
      .filter(n => n.nodeType === Node.TEXT_NODE)
      .map(n => n.textContent.trim())
      .join('')
      .trim();
  }

  function addOption(sel, value, text) {
    const o = document.createElement('option');
    o.value = value; o.textContent = text;
    sel.appendChild(o);
  }

  // ─── Actions ──────────────────────────────────────────────────────────────
  function doSkip() {
    flashScreen('left');
    skipCount++;
    updateCounter();
    chrome.storage.local.set({ ps_skip: skipCount });
    showToast('Skipped', 'skip');
    goToNextPhoto();
  }

  async function doAdd() {
    if (!selectedAlbum) {
      showToast('Select an album first!', 'skip');
      const sel = S('album-select');
      sel?.classList.add('shake');
      setTimeout(() => sel?.classList.remove('shake'), 400);
      return;
    }
    if (isProcessing) return;

    // Option C: free URL pre-check (only works when browsing from within the album)
    if (isAlreadyInAlbumByUrl()) {
      showToast('Already in this album');
      await sleep(250);
      goToNextPhoto();
      return;
    }

    isProcessing = true;
    flashScreen('right');
    showToast(`Adding to "${selectedAlbum.title}"…`);

    try {
      const result = await automateAddToAlbum();
      if (result === 'already') {
        showToast('Already in this album');
        await sleep(250);
        goToNextPhoto();
        return;
      }
      addCount++;
      updateCounter();
      chrome.storage.local.set({ ps_add: addCount });
      showToast(`✓ Added to "${selectedAlbum.title}"`, 'success');
      await sleep(250);
      goToNextPhoto();
    } catch (err) {
      showToast(err.message, 'skip');
      console.warn('[GooglePhotosSwiper]', err);
      fireKey('Escape');
    } finally {
      isProcessing = false;
    }
  }

  // ─── Google Photos automation ─────────────────────────────────────────────
  async function automateAddToAlbum() {
    // 1. Click ⋮ more-options button
    const more = findByAriaLabel([
      'More options', 'Open menu', 'more options',  // English
      'Więcej opcji',                                // Polish
    ]);
    if (!more) throw new Error('Open a photo first — more options button not found');
    more.click();
    const item = await waitForElement(() => findMenuItemByText('Add to album', 'Dodaj do albumu'), 1500);
    if (!item) throw new Error('"Add to album" not in menu');

    // 2. Click "Add to album", then wait for dialog
    item.click();
    const dialogReady = await waitForElement(() => document.querySelector('[role="listbox"],[role="option"]'), 3000);
    if (!dialogReady) throw new Error('Album dialog did not appear');

    // 3. Pick album in dialog
    const result = await pickAlbumInDialog();
    if (result === 'not-found') throw new Error(`Album "${selectedAlbum.title}" not found in dialog`);
    return result; // 'added' | 'already'
  }

  function findByAriaLabel(labels) {
    for (const label of labels) {
      const el = document.querySelector(`[aria-label="${label}"]`);
      if (el && isVisible(el)) return el;
    }
    // Broader substring match
    for (const el of document.querySelectorAll('button,[role="button"]')) {
      const al = (el.getAttribute('aria-label') || '').toLowerCase();
      if (labels.some(l => al.includes(l.toLowerCase())) && isVisible(el)) return el;
    }
    return null;
  }

  function findMenuItemByText(...texts) {
    const lcs = texts.map(t => t.toLowerCase());
    for (const el of document.querySelectorAll('[role="menuitem"],[role="option"],li')) {
      const t = el.textContent.trim().toLowerCase();
      if (lcs.some(lc => t.includes(lc)) && isVisible(el)) return el;
    }
    return null;
  }

  async function pickAlbumInDialog() {
    const target = selectedAlbum.title.toLowerCase();
    for (let i = 0; i < 100; i++) {
      const li = findAlbumOption(target);
      if (li) return clickOrDetect(li);
      await sleep(50);
    }
    console.warn('[GooglePhotosSwiper] album not found in dialog. id:', selectedAlbum.id, 'title:', selectedAlbum.title);
    return 'not-found';
  }

  function clickOrDetect(li) {
    if (li.getAttribute('aria-selected') === 'true') { fireKey('Escape'); return 'already'; }
    li.click();
    return 'added';
  }

  function findAlbumOption(target) {
    const listbox = document.querySelector('[role="listbox"]');
    if (listbox) {
      const byId = listbox.querySelector(`[data-id="${selectedAlbum.id}"]`);
      if (byId && isVisible(byId)) return byId;
      for (const li of listbox.querySelectorAll('[role="option"]')) {
        if (isVisible(li) && albumOptionMatches(li, target)) return li;
      }
    }
    // Always fall back to document-wide search — album options may live outside listbox
    for (const li of document.querySelectorAll('[role="option"]')) {
      if (isVisible(li) && albumOptionMatches(li, target)) return li;
    }
    return null;
  }

  function albumOptionMatches(li, target) {
    const label = (li.getAttribute('aria-label') || '').toLowerCase();
    if (label === target || label.startsWith(target + ' ') || label.startsWith(target + '·')) return true;
    const titleSpan = li.querySelector('[jsname="K4r5Ff"]');
    if (titleSpan && titleSpan.textContent.trim().toLowerCase() === target) return true;
    const ownText = [...li.childNodes]
      .filter(n => n.nodeType === Node.TEXT_NODE)
      .map(n => n.textContent.trim())
      .join('').toLowerCase();
    return ownText === target;
  }

  // ─── Keyboard ─────────────────────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;

    if (e.key === '`') { setHud(!hudVisible); return; }
    if (!hudVisible) return;

    // Only intercept when viewing a single photo
    if (!location.href.includes('/photo/')) return;

    if (e.key === 'ArrowLeft' && !e.repeat) {
      e.preventDefault(); e.stopPropagation();
      if (isLoadingAlbums) { showToast('Loading albums…'); return; }
      doSkip();
    } else if (e.key === 'ArrowRight' && !e.repeat) {
      e.preventDefault(); e.stopPropagation();
      if (isLoadingAlbums) { showToast('Loading albums…'); return; }
      doAdd();
    }
  }, true);

  // Synthetic keypresses have isTrusted=false and are ignored by Google Photos.
  // Click the native next-photo button directly instead.
  function goToNextPhoto() {
    const next = findByAriaLabel([
      'View next photo', 'Next photo', 'Next',           // English
      'Wyświetl następne zdjęcie', 'Następne zdjęcie',   // Polish
    ]);
    if (next) { next.click(); return; }

    // Position-based fallback: rightmost visible button near vertical center of screen
    const cy = window.innerHeight / 2;
    const btn = [...document.querySelectorAll('button,[role="button"]')]
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0
          && r.left > window.innerWidth * 0.6
          && Math.abs((r.top + r.bottom) / 2 - cy) < 200;
      })
      .sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right)[0];
    if (btn) btn.click();
  }

  function fireKey(key) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    document.dispatchEvent(new KeyboardEvent('keyup',   { key, bubbles: true }));
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  let toastTimer;
  function showToast(msg, type = 'info') {
    const t = S('toast'); if (!t) return;
    t.textContent = msg; t.className = `show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = ''; }, 2300);
  }

  let flashTimer;
  function flashScreen(dir) {
    const f = S('flash'); if (!f) return;
    f.className = dir;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { f.className = ''; }, 160);
  }

  function updateCounter() {
    const s = S('n-skip'), a = S('n-add');
    if (s) s.textContent = skipCount;
    if (a) a.textContent = addCount;
  }

  function setHud(visible) {
    hudVisible = visible;
    S('hud')?.classList.toggle('hidden', !visible);
    S('toggle')?.classList.toggle('visible', !visible);
    if (visible && !albumsLoaded) {
      albumsLoaded = true;
      loadAlbums();
    }
  }

  function isAlreadyInAlbumByUrl() {
    const m = /\/album\/([^/]+)\/photo\//.exec(location.pathname);
    return m ? m[1] === selectedAlbum.id : false;
  }

  function setAlbumBadge(state) {
    const b = S('album-badge');
    if (!b) return;
    b.className = state || '';
    b.textContent = state === 'in' ? '✓ Already in album' : '';
  }

  function refreshBadge() {
    if (!selectedAlbum || !location.href.includes('/photo/')) { setAlbumBadge(null); return; }
    setAlbumBadge(isAlreadyInAlbumByUrl() ? 'in' : null);
  }

  function isVisible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function waitForElement(predicate, maxMs = 1500, intervalMs = 50) {
    const deadline = Date.now() + maxMs;
    while (Date.now() < deadline) {
      const el = predicate();
      if (el) return el;
      await sleep(intervalMs);
    }
    return null;
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildOverlay);
  } else {
    buildOverlay();
  }

  // Re-scrape albums on SPA navigation to /albums
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    if (location.href.includes('/photo/')) refreshBadge();
    if (location.href.includes('/albums')) {
      setTimeout(() => { if (S('album-select')?.options.length <= 1) loadAlbums(); }, 1200);
    }
  }).observe(document.body, { childList: true, subtree: true });

})();
