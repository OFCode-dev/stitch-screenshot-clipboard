# Stitch Screenshot → Clipboard

One click: scrolls the page, stitches a full-page screenshot and copies it straight to your clipboard. No editor, no save dialog, no account.

Sister extension of [Quick Screenshot → Clipboard](https://chromewebstore.google.com/detail/quick-screenshot-%E2%86%92-clipbo/pimodklbppjmjnpmhaipihkfnbnldebh) — same philosophy (one click → clipboard), but for **full-page** captures.

## How it works

1. Click the toolbar icon (or press `Alt+Shift+S`).
2. The extension scrolls the page viewport by viewport, capturing each screen.
3. The screens are stitched into a single PNG and copied to your clipboard.
4. Paste anywhere (`Ctrl+V`): Slack, Figma, docs, image editors.

### Page behavior

| Page type | Behavior |
|---|---|
| Normal page | Captures the **whole page from the top**, up to **7 viewports**, then restores your scroll position |
| Infinite-scroll feed (Twitter/X, Reddit, Instagram, LinkedIn, …) | Captures up to **7 viewports starting at your current position** and **leaves you at the last captured position** — run it again to continue further down the feed |

Infinite scroll is detected two ways: a known-hosts list of major feed sites, plus runtime detection (if the scroll target keeps growing while we scroll, the run switches to endless mode).

The extension also detects the **real scroll container**: on apps that scroll an internal element instead of the document (ChatGPT conversations, many web apps), it finds, scrolls and captures that container, cropping the output to its visible region.

### Details

- Fixed/sticky headers, cookie bars and chat bubbles are hidden after the first screen so they don't repeat in the stitched image.
- The page scrollbar is hidden during capture and everything (scroll position, hidden elements) is restored afterwards.
- Output respects your display's pixel ratio (Retina/HiDPI aware); very tall results are scaled down to stay within the 16,000 px canvas limit.
- If the clipboard is unavailable (rare focus/permission edge cases), the PNG is saved as a download instead — the toast and the toolbar badge (`✓` copied / `↓` downloaded / `✕` failed) tell you which happened.

## Install (unpacked, for testing)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the [`extension/`](extension/) folder
   — or drag & drop `dist/stitch-screenshot-clipboard-v1.0.0.zip` onto the page.
4. Optional: pin the icon, and enable **Allow access to file URLs** if you want to capture local files.

## Project structure

```
extension/          The extension itself (load this / zip this for the store)
  manifest.json     MV3 manifest — activeTab + scripting + clipboardWrite only
  background.js     Service worker: orchestrates scroll → capture → stitch
  content.js        Injected on demand: scrolling, stitching, clipboard write
  icons/            Placeholder icons (final ones come from the design team)
tools/make-icons.ps1  Regenerates the placeholder icons
dist/               Store-ready zip
STORE_LISTING.md    Chrome Web Store listing texts (EN + TR)
DESIGN_SPEC.md      Asset spec for the design team (sizes, formats, rules)
PRIVACY.md          Privacy policy (required by the store listing)
```

## Permissions (and why they are minimal)

| Permission | Why |
|---|---|
| `activeTab` | Capture the tab you clicked on — granted only at the moment you invoke the extension. No `<all_urls>` host access. |
| `scripting` | Inject the scroller/stitcher into the page, on demand only. |
| `clipboardWrite` | Put the finished PNG on your clipboard. |

No data is collected, stored or transmitted. Everything happens locally. See [PRIVACY.md](PRIVACY.md).

## Known limitations

- Content rendered only on hover, or virtualized lists that *replace* (rather than append) DOM content, may stitch imperfectly.
- Chrome rate-limits tab captures to 2/second, so a 7-screen capture takes ~6–8 seconds. The badge counts progress.
- Does not run on `chrome://`, Chrome Web Store, or other browser-internal pages (platform restriction).

## Manual test checklist

- [ ] Short page (fits one screen) → single capture, copied
- [ ] Long article (3–6 screens) → full page stitched, no repeated headers, no seams
- [ ] Very long page (>7 screens) → capped at 7, scroll position restored
- [ ] Long ChatGPT conversation → internal container detected, distinct segments, cropped to the conversation area
- [ ] LinkedIn feed, scrolled mid-feed → up to 7 screens from current position, stays at last captured position
- [ ] Unknown infinite-scroll site → growth detection kicks in, stays at last captured position
- [ ] Paste into Slack/Figma/Paint works
- [ ] Normal pages: scroll position and sticky headers restored after capture
- [ ] Badge feedback: `✓` on success, `✕` on chrome:// pages

## License

MIT — see [LICENSE](LICENSE).
