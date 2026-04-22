# Photos Sorter — TODO

## Detect if photo is already in selected album

### Option A — check `aria-selected` in picker dialog (easy, ~1-2s on → press only)

When the "Add to album" picker opens, albums the photo already belongs to have `aria-selected="true"` on their `<li>`.

- Open dialog → check `aria-selected` before clicking → if already there: press Escape, show "Already in album" toast, auto-advance to next photo.
- Same overhead as a normal add press (~1-2s). No proactive badge — only detected when user presses →.
- ~5 min change to `pickAlbumInDialog` + `doAdd`.

### Option B — click info button (ⓘ) and parse album links (proactive badge, ~1s per photo)

Google Photos shows album membership in the info panel.

- On each photo navigation: click the info button (can't use `i` keypress — isTrusted issue), wait for panel to render, read album hrefs, close panel.
- Enables a proactive HUD badge ("✓ already in album") without the user pressing →.
- Adds ~1s latency on every photo change.
- More work to implement; needs to handle panel open/close reliably.

### Option C — check photo URL (limited, almost free)

When navigating into a photo from within an album, the URL becomes `/album/ALBUM_ID/photo/PHOTO_ID`.

- Compare current album ID in URL vs selected album ID — instant, zero overhead.
- Only works when browsing from inside that album. Useless when browsing main library.
- Not worth implementing alone; could be a fast pre-check before Option A/B.
