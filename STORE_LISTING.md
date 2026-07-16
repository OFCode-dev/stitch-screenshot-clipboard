# Chrome Web Store — Listing Content

Ready-to-paste texts for the Developer Dashboard. Character limits noted per field.

---

## Store name (max 75 chars)

```
Stitch Screenshot → Clipboard
```

## Short description / Summary (max 132 chars)

**EN:**
```
One click: scrolls the page, stitches a full-page screenshot and copies it to your clipboard. No editor, no saving, no fuss.
```

**TR:**
```
Tek tık: sayfayı kaydırır, tam sayfa ekran görüntüsünü birleştirir ve panonuza kopyalar. Editör yok, kaydetme yok, uğraş yok.
```

## Category

`Tools` (Productivity → Tools)

## Language

Primary: English. Add Turkish as an additional listing language with the TR texts below.

---

## Full description — EN (max 16,000 chars)

```
The fastest way to get a FULL-PAGE screenshot into your clipboard.

Sister extension of "Quick Screenshot → Clipboard" — same one-click philosophy, but for entire pages. Click the icon (or press Alt+Shift+S), the page scrolls itself, the screens are stitched into one tall PNG, and the result lands straight on your clipboard. Paste it anywhere with Ctrl+V.

WHY THIS ONE
✔ One click → clipboard. No editor opening, no save dialog, no annotation toolbar you never asked for.
✔ Full page, automatically. The extension scrolls and stitches for you — up to 7 screens per capture.
✔ App-smart. It finds the real scroll container, so pages that scroll an internal panel (like ChatGPT conversations) are captured and cropped correctly.
✔ Feed-smart. On infinite-scroll sites (X/Twitter, Reddit, Instagram, LinkedIn and friends) "the whole page" doesn't exist — so it captures up to 7 screens from wherever you are and leaves you at the last captured spot, ready to continue with another click.
✔ Clean output. Sticky headers, cookie bars and chat bubbles are hidden after the first screen so they don't repeat down your image. The scrollbar never appears in the capture.
✔ Retina/HiDPI aware. Captures at your display's native pixel density.
✔ Leaves no trace. Scroll position and hidden elements are restored the moment the capture ends.

FEEDBACK AT A GLANCE
The toolbar badge counts the screens as they're captured, then shows ✓ (copied), ↓ (clipboard blocked — saved as a download instead) or ✕ (failed). A small toast on the page confirms the result and the final image size.

PRIVACY — ACTUALLY MINIMAL PERMISSIONS
• No data is collected, stored or transmitted. Ever. Everything happens locally in your browser.
• No <all_urls> host access: the extension uses activeTab, meaning it can only see the tab you explicitly invoke it on, only at that moment.
• Open source.

KEYBOARD SHORTCUT
Alt+Shift+S by default — remappable at chrome://extensions/shortcuts.

GOOD TO KNOW
• Chrome limits tab captures to 2 per second, so a 7-screen page takes about 6–8 seconds. The badge keeps you posted.
• Doesn't work on chrome:// pages or the Chrome Web Store (browser restriction that applies to all extensions).

If you just need the visible screen, grab the sister extension "Quick Screenshot → Clipboard". Use both side by side — one hotkey each.
```

## Full description — TR

```
Tam sayfa ekran görüntüsünü panonuza almanın en hızlı yolu.

"Quick Screenshot → Clipboard" uzantısının kardeşi — aynı tek tık felsefesi, ama sayfanın tamamı için. Simgeye tıklayın (veya Alt+Shift+S), sayfa kendi kendine kaydırılır, ekranlar tek bir uzun PNG olarak birleştirilir ve sonuç doğrudan panonuza kopyalanır. Ctrl+V ile istediğiniz yere yapıştırın.

NEDEN BU UZANTI
✔ Tek tık → pano. Editör açılmaz, kaydetme penceresi çıkmaz, istemediğiniz açıklama araç çubukları yok.
✔ Tam sayfa, otomatik. Uzantı sizin yerinize kaydırır ve birleştirir — tek seferde 7 ekrana kadar.
✔ Uygulama zekâsı. Gerçek kaydırma alanını bulur; içerideki bir paneli kaydıran sayfalar (ör. ChatGPT sohbetleri) doğru şekilde yakalanır ve kırpılır.
✔ Akış (feed) zekâsı. Sonsuz kaydırmalı sitelerde (X/Twitter, Reddit, Instagram, LinkedIn vb.) "sayfanın tamamı" diye bir şey yoktur — bulunduğunuz konumdan itibaren 7 ekrana kadar yakalar ve sizi son yakalanan konumda bırakır; bir tıkla kaldığınız yerden devam edersiniz.
✔ Temiz çıktı. Sabit başlıklar, çerez bantları ve sohbet baloncukları ilk ekrandan sonra gizlenir; görüntü boyunca tekrarlamazlar. Kaydırma çubuğu asla görüntüye girmez.
✔ Retina/HiDPI desteği. Ekranınızın gerçek piksel yoğunluğunda yakalar.
✔ İz bırakmaz. Kaydırma konumu ve gizlenen öğeler, yakalama biter bitmez eski haline döner.

ANLIK GERİ BİLDİRİM
Araç çubuğu rozeti yakalanan ekranları sayar; ardından ✓ (kopyalandı), ↓ (pano engellendi — indirme olarak kaydedildi) veya ✕ (başarısız) gösterir. Sayfadaki küçük bildirim, sonucu ve görüntü boyutunu doğrular.

GİZLİLİK — GERÇEKTEN MİNİMUM İZİN
• Hiçbir veri toplanmaz, saklanmaz, gönderilmez. Her şey tarayıcınızda, yerel olarak gerçekleşir.
• <all_urls> erişimi yok: uzantı activeTab kullanır; yalnızca sizin tıkladığınız sekmeyi, yalnızca o anda görebilir.
• Açık kaynak.

KLAVYE KISAYOLU
Varsayılan Alt+Shift+S — chrome://extensions/shortcuts adresinden değiştirilebilir.

BİLİNMESİ İYİ OLUR
• Chrome, sekme yakalamayı saniyede 2 ile sınırlar; 7 ekranlık bir sayfa yaklaşık 6–8 saniye sürer. Rozet sizi bilgilendirir.
• chrome:// sayfalarında ve Chrome Web Mağazası'nda çalışmaz (tüm uzantılar için geçerli tarayıcı kısıtı).

Yalnızca görünen ekrana ihtiyacınız varsa kardeş uzantı "Quick Screenshot → Clipboard"u edinin. İkisini yan yana kullanın — her birine bir kısayol.
```

---

## Privacy tab answers (Developer Dashboard)

**Single purpose description:**
```
Captures a full-page screenshot of the current tab by scrolling and stitching, and copies the resulting image to the user's clipboard.
```

**Permission justifications:**

| Permission | Justification |
|---|---|
| `activeTab` | Required to capture the visible area of the tab the user explicitly invokes the extension on. Grants access only at invocation time; no persistent host access is requested. |
| `scripting` | Required to inject, on demand only, the script that scrolls the page and stitches the captured segments. Nothing is injected until the user clicks the extension. |
| `clipboardWrite` | Required to place the final stitched PNG image on the user's clipboard, which is the extension's single purpose. |

**Remote code:** No, the extension does not use remote code.

**Data usage disclosures:** check **none** of the data categories. The extension does not collect, store or transmit any user data; all processing is local.

**Privacy policy URL:** host `PRIVACY.md` (e.g. GitHub Pages / repo raw URL) and paste the link.

---

## Keywords (for the description / search relevance)

full page screenshot, scrolling screenshot, stitch, clipboard, copy screenshot, capture entire page, one click screenshot
