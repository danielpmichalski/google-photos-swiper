# Google Photos Swiper

A Chrome extension for rapidly sorting Google Photos into albums using keyboard shortcuts. Burns through a backlog of hundreds of unorganized photos with minimal effort.

## How it works

Google Photos Swiper injects a small HUD bar at the bottom of `photos.google.com`. Open any photo, pick a target album from the dropdown, then swipe through your library with arrow keys.

- `→` — add current photo to the selected album
- `←` — skip (move to next photo without adding)
- `` ` `` — show / hide the HUD bar

The extension automates Google Photos' own "Add to album" UI flow — no Google Photos API key needed, no OAuth, no API restrictions. It works on your existing photo library.

## Installation

Install from the [Chrome Web Store](https://chrome.google.com/webstore) *(link coming soon)*.

**Or install manually (developer mode):**

1. Clone or download this repo
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the `extension/` folder
5. Navigate to [photos.google.com](https://photos.google.com) — the HUD bar appears at the bottom

## Usage

1. Open a photo in Google Photos
2. Select a target album from the dropdown in the HUD bar
3. Press `→` to add the photo to the album and advance to the next one
4. Press `←` to skip and advance without adding
5. The session counter tracks how many photos you've skipped vs. added

Albums are loaded automatically on startup (the extension briefly opens a background tab to scrape your album list — this takes a few seconds on first load).

## Building

To package the extension for the Chrome Web Store:

```bash
bash build.sh
```

This produces `google-photos-swiper.zip` in the repo root — upload that file directly to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).

## Publishing to Chrome Web Store

1. **Build the ZIP** — run `bash build.sh`. This creates `google-photos-swiper.zip` in the repo root.

2. **Open the Developer Dashboard** — go to [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole) and sign in with your Google account. Pay the one-time $5 developer registration fee if
   you haven't already.

3. **Create a new item** — click **New item** and upload `google-photos-swiper.zip`.

4. **Fill in the store listing:**
    - **Name:** Google Photos Swiper
    - **Short description** (≤132 chars): Keyboard-driven album sorter for Google Photos. Press → to add, ← to skip — burn through your photo backlog in minutes.
    - **Detailed description:** Paste a walkthrough covering: HUD bar, keyboard shortcuts (→ add, ← skip, ` toggle), album dropdown, session counter, and the note that no API key or OAuth is required.
    - **Category:** Productivity
    - **Language:** English

5. **Upload screenshots** — take 1–5 screenshots at **1280×800** showing the HUD bar in use (album dropdown open, photo being added, session counter). Chrome Web Store requires at least one.

6. **Upload the store icon** — use `extension/images/icon-512.png` (512×512).

7. **Set privacy / permissions justification** — the dashboard will ask why the extension needs each permission. Suggested answers:
    - `storage`: Persist the selected album and session counters across page loads.
    - `scripting`: Inject the HUD overlay into Google Photos and automate the "Add to album" UI flow.
    - `tabs`: Open a background tab once on startup to scrape the user's album list.
    - `https://photos.google.com/*`: The extension only operates on Google Photos pages.

8. **Submit for review** — click **Submit for review**. New extensions typically take 1–3 business days. You'll get an email when it's approved or if changes are requested.

## Requirements

- Google Chrome (Manifest V3)
- A Google Photos account with at least one album

## Permissions

| Permission                    | Why                                                           |
|-------------------------------|---------------------------------------------------------------|
| `storage`                     | Persist selected album and session counters across page loads |
| `scripting`                   | Inject the HUD overlay and scrape album data                  |
| `tabs`                        | Open a background tab to fetch the fully-rendered album list  |
| `https://photos.google.com/*` | Access Google Photos pages                                    |

## License

MIT — see [LICENSE](LICENSE)
