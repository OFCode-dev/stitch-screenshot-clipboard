// Stitch Screenshot → Clipboard — content script
//
// Injected on demand. Detects the real scroll container (the document, or an
// internal overflow element — modern apps like ChatGPT scroll an inner
// element), scrolls it for the service worker, collects the captured
// segments, stitches them on a canvas (element targets are cropped to their
// visible rectangle) and writes the final PNG to the clipboard (download
// fallback if the clipboard is unavailable).
//
// CSP note: segments arrive as data URLs and are decoded with atob +
// createImageBitmap, which is not subject to the page's Content Security
// Policy (no <img> element, no fetch).

(() => {
  if (window.__stitchScreenshotCS) return;
  window.__stitchScreenshotCS = true;

  // Hosts that are effectively always an infinite feed.
  const KNOWN_ENDLESS = [
    "twitter.com", "x.com", "facebook.com", "instagram.com", "threads.net",
    "reddit.com", "youtube.com", "tiktok.com", "linkedin.com", "tumblr.com",
    "pinterest.com", "pinterest.co.uk", "bsky.app", "mastodon.social",
  ];

  // Hosts where a relaxed second scan (no overflow-y requirement) is allowed
  // when the general detector finds nothing.
  const FALLBACK_SCAN_HOSTS = ["chatgpt.com", "linkedin.com"];

  const TARGET_ATTR = "data-stitch-capture-target";
  const STYLE_ATTR = "data-stitch-style";
  const HIDDEN_ATTR = "data-stitch-hidden";

  let target = null;        // { type: "document" | "element", el } — fixed for a capture session
  let segments = [];        // [{ dataUrl, y, targetRect }]
  let hiddenEls = [];       // [{ el, had, value, priority }] — exact inline-style restore info
  let styleEl = null;
  let savedScroll = null;   // { x, y } in target scroll coordinates
  let winW = 0, winH = 0;   // browser viewport (CSS px) at PREPARE time
  let viewportW = 0, viewportH = 0; // capture region size (CSS px)

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    (async () => {
      try {
        switch (msg.type) {
          case "PREPARE":     sendResponse(prepare()); break;
          case "SCROLL_TO":   sendResponse(await scrollToY(msg.y, msg.settleMs)); break;
          case "HIDE_STICKY": hideSticky(); sendResponse({ ok: true }); break;
          case "ADD_SEGMENT": segments.push({ dataUrl: msg.dataUrl, y: msg.y, targetRect: msg.targetRect }); sendResponse({ ok: true }); break;
          case "FINISH":      sendResponse(await finish(msg)); break;
          case "ABORT":       segments = []; cleanup(!!msg.keepLastScroll, msg.finalY); target = null; sendResponse({ ok: true }); break;
          default:            sendResponse({ error: "unknown message: " + msg.type });
        }
      } catch (e) {
        sendResponse({ error: String((e && e.message) || e) });
      }
    })();
    return true; // async response
  });

  // ------------------------------------------------------- target selection

  const docScroller = () => document.scrollingElement || document.documentElement;
  const isDocumentTarget = () => target && target.type === "document";

  function ensureTarget() {
    if (!target) throw new Error("capture session is not prepared");
    if (target.type === "element" && !target.el.isConnected) {
      throw new Error("the scroll container was removed from the page during capture");
    }
  }

  function getScrollTop()    { return target.el.scrollTop; }
  function setScrollTop(y)   { target.el.scrollTop = Math.max(0, Math.min(y, getMaxScrollTop())); }
  function getScrollLeft()   { return target.el.scrollLeft; }
  function setScrollLeft(x)  { target.el.scrollLeft = x; }
  function getScrollHeight() { return target.el.scrollHeight; }
  function getClientHeight() { return target.el.clientHeight; }
  function getMaxScrollTop() { return Math.max(0, target.el.scrollHeight - target.el.clientHeight); }

  function getTargetRect() {
    if (isDocumentTarget()) {
      return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    }
    return clipRectToViewport(contentBoxRect(target.el));
  }

  // The element's padding box (borders and its own scrollbar excluded) in
  // viewport CSS coordinates.
  function contentBoxRect(el) {
    const r = el.getBoundingClientRect();
    return {
      top: r.top + el.clientTop,
      left: r.left + el.clientLeft,
      width: el.clientWidth,
      height: el.clientHeight,
    };
  }

  function clipRectToViewport(rc) {
    const left = Math.max(rc.left, 0);
    const top = Math.max(rc.top, 0);
    const right = Math.min(rc.left + rc.width, window.innerWidth);
    const bottom = Math.min(rc.top + rc.height, window.innerHeight);
    return { top, left, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
  }

  // Prefer the document when it has a meaningful scroll range and actually
  // moves; otherwise pick the best-scored internal scroll container.
  function detectScrollTarget() {
    const doc = docScroller();
    const docRange = doc.scrollHeight - doc.clientHeight;
    const meaningfulRange = Math.max(150, window.innerHeight * 0.5);
    if (docRange >= meaningfulRange && verifyScrollable(doc)) {
      return { type: "document", el: doc };
    }

    let el = scanForScrollContainer(false);
    if (!el && FALLBACK_SCAN_HOSTS.some(hostMatches)) {
      el = scanForScrollContainer(true);
    }
    if (el) return { type: "element", el };

    // Nothing better found — the document (even with a small range) is the
    // least surprising fallback.
    return { type: "document", el: doc };
  }

  function hostMatches(h) {
    const host = location.hostname.replace(/^www\./, "");
    return host === h || host.endsWith("." + h);
  }

  function scanForScrollContainer(relaxed) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const minRange = Math.max(150, vh * 0.5);
    if (!document.body) return null;
    const all = [document.body, ...document.body.getElementsByTagName("*")];
    const scored = [];

    for (const el of all) {
      // Cheap geometry rejections before any style computation.
      const ch = el.clientHeight, cw = el.clientWidth;
      if (ch < vh * 0.25 || cw < 200) continue;
      if (el.scrollHeight - ch < minRange) continue;

      let st;
      try { st = getComputedStyle(el); } catch (_) { continue; }
      if (!relaxed) {
        const oy = st.overflowY;
        if (oy !== "auto" && oy !== "scroll" && oy !== "overlay") continue;
      }
      if (st.visibility === "hidden" || st.display === "none") continue;

      const clip = clipRectToViewport(contentBoxRect(el));
      if (clip.width < 200 || clip.height < vh * 0.25) continue;

      scored.push({ el, score: scoreCandidate(el, clip, el.scrollHeight - ch, vw, vh) });
    }

    scored.sort((a, b) => b.score - a.score);
    // Computed CSS alone is unreliable — confirm the winner really moves.
    for (const c of scored.slice(0, 5)) {
      if (c.score > 0 && verifyScrollable(c.el)) return c.el;
    }
    return null;
  }

  function scoreCandidate(el, clip, range, vw, vh) {
    let score = 0;
    const clipRight = clip.left + clip.width;
    const clipBottom = clip.top + clip.height;

    // Bigger visible area and scroll range → more likely the main scroller.
    score += ((clip.width * clip.height) / (vw * vh)) * 100;
    score += Math.min(range / vh, 5) * 6;

    // Main content sits at/near the horizontal center of the viewport.
    const cx = vw / 2, cy = vh / 2;
    if (clip.left <= cx && clipRight >= cx && clip.top <= cy && clipBottom >= cy) score += 30;
    score -= (Math.abs((clip.left + clipRight) / 2 - cx) / vw) * 40;

    // App-shell scrollers usually fill (close to) the viewport height.
    score += Math.max(0, 1 - Math.abs(el.clientHeight - vh) / vh) * 20;

    // Sidebars, rails and panels: narrow, edge-hugging or nav-flavored.
    if (clip.width < vw * 0.4) score -= 25;
    if (clipRight < vw * 0.35 || clip.left > vw * 0.65) score -= 30;
    if (el.tagName === "NAV" || el.tagName === "ASIDE") score -= 40;
    const role = (el.getAttribute("role") || "").toLowerCase();
    if (/^(navigation|menu|menubar|listbox|dialog|complementary|tree|toolbar|tablist)$/.test(role)) score -= 40;
    const hint = (el.id + " " + (typeof el.className === "string" ? el.className : "")).toLowerCase();
    if (/(^|[\s_-])(nav|sidebar|menu|drawer|dropdown|popover|combobox)([\s_-]|$)/.test(hint)) score -= 20;

    // Covered by an overlay at its center → probably not what the user sees.
    const hit = document.elementFromPoint(
      Math.max(0, Math.min(vw - 1, (clip.left + clipRight) / 2)),
      Math.max(0, Math.min(vh - 1, (clip.top + clipBottom) / 2))
    );
    if (hit && hit !== el && !el.contains(hit) && !hit.contains(el)) score -= 30;

    return score;
  }

  // Computed CSS can lie — prove the element actually moves. Tries downward
  // first, upward when already near the bottom, and restores the exact
  // original position.
  function verifyScrollable(el) {
    const before = el.scrollTop;
    const max = el.scrollHeight - el.clientHeight;
    let moved = false;
    if (before < max - 2) {
      el.scrollTop = Math.min(before + 200, max);
      moved = Math.abs(el.scrollTop - before) > 1;
    }
    if (!moved && before > 2) {
      el.scrollTop = Math.max(before - 200, 0);
      moved = Math.abs(el.scrollTop - before) > 1;
    }
    el.scrollTop = before;
    return moved;
  }

  // ----------------------------------------------------------- session flow

  function prepare() {
    resetStaleSession();
    winW = window.innerWidth;
    winH = window.innerHeight;

    // Kill smooth scrolling everywhere and hide scrollbars (the document's
    // and the selected container's) so they never show in the stitch.
    styleEl = document.createElement("style");
    styleEl.setAttribute(STYLE_ATTR, "");
    styleEl.textContent =
      "*{scroll-behavior:auto !important}" +
      "html{scrollbar-width:none !important}" +
      "html::-webkit-scrollbar,body::-webkit-scrollbar{display:none !important}" +
      "[" + TARGET_ATTR + "]{scrollbar-width:none !important}" +
      "[" + TARGET_ATTR + "]::-webkit-scrollbar{display:none !important}";
    document.documentElement.appendChild(styleEl);

    target = detectScrollTarget();
    if (target.type === "element") {
      target.el.setAttribute(TARGET_ATTR, "");
    }

    const rect = getTargetRect(); // measured after scrollbars are hidden
    if (target.type === "element" && (rect.width < 200 || rect.height < 150)) {
      cleanup(false, null);
      target = null;
      return { error: "could not find a usable scroll area on this page" };
    }

    savedScroll = { x: getScrollLeft(), y: getScrollTop() };
    viewportW = rect.width;
    viewportH = rect.height;

    console.debug("[Stitch]", {
      targetType: target.type,
      scrollTop: getScrollTop(),
      scrollHeight: getScrollHeight(),
      clientHeight: getClientHeight(),
      targetRect: rect,
    });

    return {
      startY: getScrollTop(),
      scrollH: getScrollHeight(),
      viewportW,
      viewportH,
      clientH: getClientHeight(),
      targetType: target.type,
      targetRect: rect,
      dpr: window.devicePixelRatio || 1,
      endlessHint: KNOWN_ENDLESS.some(hostMatches),
    };
  }

  // A previous run may have died before FINISH/ABORT (tab switch, worker
  // error) — or the whole content-script world may have been destroyed by an
  // extension reload, leaving only DOM markers behind. Restore everything
  // before starting a new session.
  function resetStaleSession() {
    restoreHiddenEls();
    if (styleEl) { styleEl.remove(); styleEl = null; }
    for (const el of document.querySelectorAll("style[" + STYLE_ATTR + "]")) {
      el.remove();
    }
    for (const el of document.querySelectorAll("[" + HIDDEN_ATTR + "]")) {
      try {
        restoreVisibility(el, JSON.parse(el.getAttribute(HIDDEN_ATTR)));
      } catch (_) {
        el.removeAttribute(HIDDEN_ATTR);
      }
    }
    for (const el of document.querySelectorAll("[" + TARGET_ATTR + "]")) {
      el.removeAttribute(TARGET_ATTR);
    }
    segments = [];
    savedScroll = null;
    target = null;
  }

  async function scrollToY(y, settleMs) {
    ensureTarget();
    setScrollTop(y);
    await nextFrames(2);
    await sleep(settleMs || 300);
    ensureTarget();
    const rect = getTargetRect();
    return {
      actualY: Math.round(getScrollTop()),
      scrollH: getScrollHeight(),
      clientH: getClientHeight(),
      viewportH: rect.height,
      targetRect: rect,
    };
  }

  // Hide position:fixed / position:sticky elements (repeating headers,
  // cookie bars, chat bubbles). For element targets, only elements that can
  // actually repeat over the captured region are touched. Called after the
  // first capture, restored exactly at the end.
  function hideSticky() {
    if (!target) return;
    const rect = getTargetRect();
    const all = document.body ? document.body.getElementsByTagName("*") : [];
    for (const el of all) {
      if (el === styleEl || el === target.el) continue;
      let st;
      try { st = getComputedStyle(el); } catch (_) { continue; }
      const pos = st.position;
      if (pos !== "fixed" && pos !== "sticky") continue;
      if (st.visibility === "hidden") continue;

      if (target.type === "element") {
        if (el.contains(target.el)) continue; // never hide the target's ancestors
        const inside = target.el.contains(el);
        if (pos === "sticky" && !inside) continue; // cannot repeat over the target
        if (pos === "fixed" && !inside && !intersectsTargetRect(el, rect)) continue;
      }

      const info = {
        had: el.style.getPropertyValue("visibility") !== "",
        value: el.style.getPropertyValue("visibility"),
        priority: el.style.getPropertyPriority("visibility"),
      };
      hiddenEls.push({ el, ...info });
      // DOM marker so a fresh injection can undo this even if this script's
      // world is destroyed mid-capture (extension reload/update).
      try { el.setAttribute(HIDDEN_ATTR, JSON.stringify(info)); } catch (_) {}
      el.style.setProperty("visibility", "hidden", "important");
    }
  }

  function intersectsTargetRect(el, rc) {
    const r = el.getBoundingClientRect();
    return r.right > rc.left && r.left < rc.left + rc.width &&
           r.bottom > rc.top && r.top < rc.top + rc.height;
  }

  function restoreHiddenEls() {
    for (const h of hiddenEls) {
      try { restoreVisibility(h.el, h); } catch (_) {}
    }
    hiddenEls = [];
  }

  function restoreVisibility(el, info) {
    if (info.had) el.style.setProperty("visibility", info.value, info.priority);
    else el.style.removeProperty("visibility");
    el.removeAttribute(HIDDEN_ATTR);
  }

  // Restores everything prepare/hideSticky touched. keepLastScroll is the
  // endless-feed policy: keep the vertical position (at finalY, the last
  // captured segment), restore only the horizontal one.
  function cleanup(keepLastScroll, finalY) {
    restoreHiddenEls();

    if (target && target.type === "element" && target.el.isConnected) {
      target.el.removeAttribute(TARGET_ATTR);
    }

    if (target && savedScroll && (target.type === "document" || target.el.isConnected)) {
      try {
        setScrollLeft(savedScroll.x);
        if (keepLastScroll) {
          if (typeof finalY === "number") setScrollTop(finalY);
        } else {
          setScrollTop(savedScroll.y);
        }
      } catch (_) {}
    }
    savedScroll = null;

    if (styleEl) {
      styleEl.remove();
      styleEl = null;
    }
  }

  // ---------------------------------------------------------------- stitch

  async function finish(opts) {
    const segs = segments;
    segments = [];
    const targetType = target ? target.type : "document";
    cleanup(!!(opts && opts.keepLastScroll), opts ? opts.finalY : null);
    target = null;

    if (!segs.length) return { error: "no segments captured" };

    const bitmaps = [];
    try {
      for (const s of segs) {
        bitmaps.push(await createImageBitmap(dataUrlToBlob(s.dataUrl)));
      }

      // Measured bitmap-to-CSS scale — covers DPR and browser zoom without
      // trusting window.devicePixelRatio.
      const scaleX = bitmaps[0].width / winW;
      const scaleY = bitmaps[0].height / winH;

      const isElement = targetType === "element";
      // All bitmaps are cropped with the first segment's rectangle (the
      // canonical geometry — the background stops the loop if it drifts).
      const canon = segs[0].targetRect;

      let srcX = 0, srcY = 0;
      let srcW = bitmaps[0].width, srcH = bitmaps[0].height;
      if (isElement) {
        srcX = clamp(Math.round(canon.left * scaleX), 0, bitmaps[0].width - 1);
        srcY = clamp(Math.round(canon.top * scaleY), 0, bitmaps[0].height - 1);
        srcW = clamp(Math.round(canon.width * scaleX), 1, bitmaps[0].width - srcX);
        srcH = clamp(Math.round(canon.height * scaleY), 1, bitmaps[0].height - srcY);
      }

      const y0 = segs[0].y;
      const stepH = isElement ? canon.height : viewportH;
      const cssHeight = segs[segs.length - 1].y - y0 + stepH;

      let width = srcW;
      let height = Math.round(cssHeight * scaleY);

      // Stay under the common canvas dimension limit.
      const MAX_DIM = 16000;
      const outScale = Math.min(1, MAX_DIM / height, MAX_DIM / width);
      width = Math.round(width * outScale);
      height = Math.round(height * outScale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      const destW = Math.round(srcW * outScale);
      const destH = Math.round(srcH * outScale);
      for (let i = 0; i < segs.length; i++) {
        const dy = Math.round((segs[i].y - y0) * scaleY * outScale);
        const dyNext = i + 1 < segs.length
          ? Math.round((segs[i + 1].y - y0) * scaleY * outScale)
          : height;
        // On fractional scales (125% display scaling, browser zoom) the
        // rounding of dy vs destH can leave a 1px unpainted seam; stretch
        // each segment to meet the next one (capped — a larger gap means
        // genuinely missing content that must not be smeared over).
        const dh = Math.min(Math.max(destH, dyNext - dy), destH + 2);
        ctx.drawImage(bitmaps[i], srcX, srcY, srcW, srcH, 0, dy, destW, dh);
      }

      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      if (!blob) return { error: "canvas.toBlob failed (image too large?)" };

      const copied = await copyToClipboard(blob);
      if (!copied) downloadBlob(blob);

      toast(
        copied
          ? `Copied to clipboard — ${width}×${height}px, ${segs.length} segment${segs.length > 1 ? "s" : ""}`
          : "Clipboard unavailable — saved as download instead"
      );
      return { ok: true, copied, width, height, segments: segs.length };
    } finally {
      for (const b of bitmaps) { try { b.close(); } catch (_) {} }
    }
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  async function copyToClipboard(blob) {
    const item = new ClipboardItem({ "image/png": blob });
    try {
      await navigator.clipboard.write([item]);
      return true;
    } catch (_) {
      // Focus may sit on the browser toolbar right after the action click.
      try {
        window.focus();
        await navigator.clipboard.write([item]);
        return true;
      } catch (_) {
        return false;
      }
    }
  }

  function downloadBlob(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stitch-screenshot-" + Date.now() + ".png";
    document.documentElement.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function dataUrlToBlob(dataUrl) {
    const comma = dataUrl.indexOf(",");
    const mime = dataUrl.slice(5, dataUrl.indexOf(";"));
    const bin = atob(dataUrl.slice(comma + 1));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  function toast(text) {
    const el = document.createElement("div");
    el.textContent = text;
    el.style.cssText =
      "position:fixed;z-index:2147483647;right:16px;bottom:16px;" +
      "background:#1f2937;color:#fff;padding:10px 14px;border-radius:8px;" +
      "font:13px/1.4 system-ui,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.35);" +
      "pointer-events:none;opacity:0;transition:opacity .2s";
    document.documentElement.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = "1"; });
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 300);
    }, 2600);
  }

  function nextFrames(n) {
    return new Promise((res) => {
      const step = (left) =>
        left <= 0 ? res() : requestAnimationFrame(() => step(left - 1));
      step(n);
    });
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
})();
