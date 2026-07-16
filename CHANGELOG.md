# Changelog

## 1.0.0 — 2026-07-16

Initial release.

- One-click full-page capture, stitched and copied to the clipboard as PNG.
- Normal pages: whole page from the top, up to 10 viewports.
- Infinite-scroll pages: 4 viewports from the current scroll position (known-hosts list + runtime growth detection).
- Sticky/fixed elements hidden after the first segment; scrollbar hidden during capture; page state fully restored afterwards.
- HiDPI-aware output, 16,000 px canvas cap with automatic downscale.
- Clipboard-blocked fallback: saves the PNG as a download.
- Badge progress + result (`✓`/`↓`/`✕`) and on-page toast.
- Keyboard shortcut `Alt+Shift+S`.
