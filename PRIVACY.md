# Privacy Policy — Google Photos Swiper

**Last updated: April 26, 2026**

## Summary

Google Photos Swiper does not collect, transmit, or share any personal data. Everything stays on your device.

## What the extension does

- Injects a UI overlay into `photos.google.com` to let you assign photos to albums using keyboard shortcuts.
- Reads album names from the Google Photos page DOM to populate the album selector.
- Opens `photos.google.com/albums` in a background tab (if the sidebar yields no albums) to scrape album names from the DOM. This tab is closed immediately after.

## Data storage

The only data stored is your last selected album name, saved locally in your browser via `chrome.storage`. This never leaves your device.

## Data collection

None. The extension does not:

- Collect or transmit any personal data
- Access your photos or albums via any external API
- Send any data to external servers
- Use analytics or tracking of any kind

## Permissions

| Permission                            | Why                                                                           |
|---------------------------------------|-------------------------------------------------------------------------------|
| `host_permissions: photos.google.com` | Required to inject the overlay UI and to scrape album names from the page DOM |
| `scripting`                           | Required to execute scripts on `photos.google.com` tabs for album discovery   |
| `storage`                             | Required to persist your last selected album across sessions                  |
| `tabs`                                | Required to open and close the background tab used for album discovery        |

## Contact

Questions? Open an issue at [https://github.com/danielpmichalski/google-photos-swiper](https://github.com/danielpmichalski/google-photos-swiper).
