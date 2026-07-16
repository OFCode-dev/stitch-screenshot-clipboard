// Stitch Screenshot → Clipboard — service worker (orchestrator)
//
// Flow: user clicks the action (or Alt+Shift+S) → inject content.js →
// content script detects the real scroll target (document or an internal
// overflow container) and scrolls it viewport by viewport → we capture each
// step with tabs.captureVisibleTab → segments are streamed back to the
// content script, which stitches them (element targets cropped to their
// visible rectangle) and writes the PNG to the clipboard.
//
// Page classification:
//   - "endless" (infinite scroll): known feed hosts from the start, or any
//     page whose scroll target keeps growing while we scroll. Capture starts
//     at the current position and the user is left at the last captured
//     position so a second run can continue further down.
//   - normal page: capture from the top, restore the original position.
//   Both modes capture at most MAX_SEGMENTS distinct viewports per run.

const MAX_SEGMENTS = 7;           // per run, normal and endless alike
const SETTLE_MS = 350;            // wait after each scroll for lazy content / reflow
const CAPTURE_MIN_INTERVAL = 600; // captureVisibleTab is rate-limited to 2/sec
const PROGRESS_MIN_PX = 2;        // required forward progress between segments
const RECT_POS_TOLERANCE = 2;     // allowed targetRect top/left drift (CSS px)
const RECT_SIZE_TOLERANCE = 4;    // allowed targetRect width/height drift (CSS px)

let busy = false;
let lastCaptureAt = 0;

chrome.action.onClicked.addListener((tab) => run(tab));

async function run(tab) {
  if (busy) return;
  if (!tab || !tab.id || !/^(https?|file):/.test(tab.url || "")) {
    await flashBadge("✕", "#d93025");
    return;
  }
  busy = true;
  await setBadge("…", "#5f6368");

  let endless = false;
  let captured = 0;
  let lastCapturedY = null;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });

    const page = await send(tab.id, { type: "PREPARE" });
    if (page.error) throw new Error(page.error);

    const vh = page.viewportH; // capture step: the target's visible height
    endless = page.endlessHint;
    const initialScrollH = page.scrollH;
    let canonicalRect = null;

    // Endless feeds: capture from where the user currently is.
    // Normal pages: capture the whole target from the top.
    let y = endless ? page.startY : 0;

    while (captured < MAX_SEGMENTS) {
      const s = await send(tab.id, { type: "SCROLL_TO", y, settleMs: SETTLE_MS });
      if (s.error) throw new Error(s.error);

      // The target grew by more than a viewport while we were scrolling: an
      // infinite loader is appending content → endless mode for the rest of
      // this run (same segment limit, but the final position is kept).
      if (!endless && s.scrollH > initialScrollH + vh) endless = true;

      // Every segment after the first requires real forward progress and
      // stable geometry — otherwise stop and stitch what we already have.
      // The first segment is always captured, even when the initial
      // SCROLL_TO does not move (endless feeds start in place).
      if (captured > 0) {
        if (s.actualY - lastCapturedY < PROGRESS_MIN_PX) break;
        if (rectDrifted(canonicalRect, s.targetRect)) break;
      }

      const dataUrl = await capture(tab.windowId);
      captured++;
      await setBadge(String(captured), "#2563eb");

      const added = await send(tab.id, {
        type: "ADD_SEGMENT",
        dataUrl,
        y: s.actualY,
        targetRect: s.targetRect,
      });
      if (added.error) throw new Error(added.error);

      if (captured === 1) canonicalRect = s.targetRect;
      lastCapturedY = s.actualY;

      if (s.actualY + s.clientH >= s.scrollH - 3) break; // reached the bottom

      // Fixed/sticky headers would repeat in every segment; hide them for
      // all captures after the first one.
      if (captured === 1) await send(tab.id, { type: "HIDE_STICKY" });

      y = s.actualY + vh;
    }

    // Normal pages: put the user back where they were. Endless feeds: stay
    // at the last captured position so the next run continues from there.
    const result = await send(tab.id, {
      type: "FINISH",
      keepLastScroll: endless,
      finalY: lastCapturedY,
    });
    if (result.error) throw new Error(result.error);

    // ✓ copied to clipboard, ↓ clipboard blocked → saved as download
    await flashBadge(result.copied ? "✓" : "↓", result.copied ? "#188038" : "#f9ab00");
  } catch (e) {
    console.error("[Stitch]", e);
    try {
      await send(tab.id, {
        type: "ABORT",
        keepLastScroll: endless && captured > 0,
        finalY: lastCapturedY,
      });
    } catch (_) {}
    await flashBadge("✕", "#d93025");
  } finally {
    busy = false;
  }
}

// The element target's rectangle must stay put between segments; stitching
// segments with different geometry would produce a misaligned image.
function rectDrifted(a, b) {
  if (!a || !b) return true;
  return (
    Math.abs(a.top - b.top) > RECT_POS_TOLERANCE ||
    Math.abs(a.left - b.left) > RECT_POS_TOLERANCE ||
    Math.abs(a.width - b.width) > RECT_SIZE_TOLERANCE ||
    Math.abs(a.height - b.height) > RECT_SIZE_TOLERANCE
  );
}

async function capture(windowId) {
  const wait = lastCaptureAt + CAPTURE_MIN_INTERVAL - Date.now();
  if (wait > 0) await sleep(wait);
  lastCaptureAt = Date.now();
  return chrome.tabs.captureVisibleTab(windowId, { format: "png" });
}

function send(tabId, message) {
  return chrome.tabs.sendMessage(tabId, message);
}

async function setBadge(text, color) {
  await chrome.action.setBadgeBackgroundColor({ color });
  await chrome.action.setBadgeText({ text });
}

async function flashBadge(text, color) {
  await setBadge(text, color);
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2500);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
