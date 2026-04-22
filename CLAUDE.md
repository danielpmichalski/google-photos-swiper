Here's a clean summary of everything you want built:

---

## Photos Sorter — Requirements Summary

### Goal

A tool to rapidly assign Google Photos to albums, burning through a backlog of hundreds of unorganized photos with minimal physical effort.

### Core UX

- **Keyboard-only operation**: `→` adds photo to selected album, `←` skips it, next photo loads automatically
- One-time album selection from a dropdown — stays selected until changed
- Session counter showing how many photos were skipped vs. added
- Subtle visual flash feedback on each action (green = added, red = skipped)
- Toast notifications for status/errors
- Toggle the UI bar on/off with backtick `` ` ``

### Platform

- **Desktop Chrome Extension** injecting an overlay UI onto `photos.google.com`
- Works by **automating Google Photos' own UI** (simulating clicks through the existing "Add to album" menu flow) — no Google Photos API needed, bypassing all API restrictions
- HUD bar injected via Shadow DOM onto `<html>` (not `<body>`) to avoid being clipped by Google Photos' overflow styling

### UI Style

- Light mode, clean and plain — white bar, system fonts, looks native to the browser
- Fixed bar at the bottom of the screen
- Album dropdown in the center, Skip on the left, Add on the right

### Album Discovery

- Scrapes album list from the Google Photos sidebar DOM on page load
- Falls back to fetching `photos.google.com/albums` in the background if sidebar yields nothing
- Persists the last selected album across sessions via `chrome.storage`

### Technical constraints discovered

- Google Photos API (post March 2025) **cannot** read your existing library or add existing photos to albums via API — only app-uploaded content is manageable
- The DOM automation approach is the only viable path for existing photo libraries
- Google Photos is a SPA, so the extension watches for navigation changes to re-scrape albums when needed

### Future / mobile angle discussed

- Android **Accessibility Services API** would be the equivalent approach on mobile (overlay + UI automation of the Google Photos app), buildable without root
- iOS has no equivalent capability