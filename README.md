# Google Photos Swiper

A Chrome extension for rapidly sorting Google Photos into albums using keyboard shortcuts. Burns through a backlog of hundreds of unorganized photos with minimal effort.

## How it works

Google Photos Swiper injects a small HUD bar at the bottom of `photos.google.com`. Open any photo, pick a target album from the dropdown, then swipe through your library with arrow keys.

- `→` — add current photo to the selected album
- `←` — skip (move to next photo without adding)
- `` ` `` — show / hide the HUD bar

The extension automates Google Photos' own "Add to album" UI flow — no Google Photos API key needed, no OAuth, no API restrictions. It works on your existing photo library.

## Installation

The extension is not on the Chrome Web Store. Install it as an unpacked extension:

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
