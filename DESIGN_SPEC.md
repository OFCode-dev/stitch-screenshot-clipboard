# UI Ekibi — Görsel Üretim Şartnamesi (Chrome Web Store)

Uzantı: **Stitch Screenshot → Clipboard** — "Quick Screenshot → Clipboard" uzantısının kardeşi.
Amaç: Mağaza yayını için gerekli tüm görsellerin üretimi. Kod tarafı hazır; koddaki ikonlar geçicidir (placeholder) ve teslimatla değiştirilecektir.

## Marka bağlamı

- Kardeş uzantı: https://chromewebstore.google.com/detail/quick-screenshot-%E2%86%92-clipbo/pimodklbppjmjnpmhaipihkfnbnldebh
- İki uzantı yan yana kurulacak; **aile görünümü** şart: aynı stil dili, aynı renk ailesi, ayırt edici tek fark motifi (bu üründe "birleştirilmiş/stitch edilmiş dikey parçalar" motifi).
- Ürün fikri görselleştirmesi: üst üste dizilip tek uzun görüntü haline gelen ekran parçaları + pano (clipboard) vurgusu.
- Placeholder ikondaki mevcut motif: mavi (#2563EB) yuvarlatılmış kare içinde 3 yatay beyaz şerit. Devralınabilir ya da tamamen yeniden tasarlanabilir; kardeş uzantıyla tutarlılık önceliklidir.

## 1. Mağaza ikonu (zorunlu)

- **Boyut:** 128×128 px, PNG, 24-bit + alfa (şeffaf arka plan destekli).
- **Güvenli alan:** Görselin ana gövdesi ~96×96 px olmalı; her kenarda ~16 px boşluk bırakılmalı (Google'ın ikon ızgarası önerisi — mağaza küçültmelerinde taşma/kırpılma hissini önler).
- Köşe yuvarlatmayı **tasarımın kendisi** içermeli (mağaza otomatik maske uygulamaz); kardeş ikonla aynı yarıçap oranı kullanılmalı.
- Beyaz ve koyu zeminde test edilmeli (mağaza her iki temada gösterir). Salt beyaz zemin üzerinde kaybolan açık renkler kullanılmamalı; gerekiyorsa ince kontur.
- Fotoğraf, ekran görüntüsü, uzun metin ikon içinde kullanılamaz.

## 2. Uzantı (toolbar) ikonları (zorunlu, kodda paketlenir)

- **Boyutlar:** 16×16, 32×32, 48×48, 128×128 px — her biri ayrı PNG, şeffaf zemin.
- 16 px'te dahi okunur olacak sadelikte tek motif; küçük boyutlar büyükten otomatik küçültme değil, gerekiyorsa piksel hizalı ayrı çizim.
- Chrome açık/koyu araç çubuğu temalarının ikisinde de seçilebilir olmalı.
- Teslim dosya adları: `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`.

## 3. Ekran görüntüleri / vitrin görselleri (en az 1, en fazla 5 — zorunlu)

- **Boyut:** 1280×800 px (tercih) veya 640×400 px. Tüm görseller aynı boyutta olmalı; karışık boyut kabul edilmez.
- **Format:** PNG veya JPEG (24-bit, alfasız).
- İçerik önerisi (5 kare):
  1. Kahraman kare: tek tık → uzun stitched görüntü → pano; 3 adımlı akış.
  2. Gerçek kullanım: uzun bir makale sayfasının tam sayfa çıktısı (gerçek UI, gerçek capture).
  3. Feed davranışı: sonsuz sayfalarda "bulunduğun yerden 4 ekran" anlatımı.
  4. Yapıştırma anı: Slack/Figma'ya Ctrl+V.
  5. Kardeş uzantı ile birlikte kullanım ("visible screen" vs "full page").
- Metin kullanımı minimum; kullanılan metin büyük ve okunur olmalı (mağazada küçük gösterilir). Metinli görseller İngilizce hazırlanmalı; TR listeleme için TR varyant opsiyonel.
- Cihaz mockup'ı kullanılacaksa gerçek Chrome UI oranları korunmalı; yanıltıcı işlevsellik gösterilemez (Google ilkesi).

## 4. Küçük tanıtım karosu — Small promo tile (kuvvetle önerilir)

- **Boyut:** 440×280 px, PNG veya JPEG (24-bit, alfasız).
- Mağaza vitrini ve arama sonuçlarında kullanılır; bu görsel olmadan öne çıkarılma (feature) şansı yoktur.
- Az metin (yalnızca ürün adı ya da hiç), güçlü motif, kenarlara minimum 30 px güvenli alan.

## 5. Marquee tanıtım karosu — opsiyonel

- **Boyut:** 1400×560 px, PNG veya JPEG (24-bit, alfasız).
- Yalnızca editör vitrini (featured) yerleşimleri için; öncelik düşük, small tile tesliminden sonra üretilebilir.

## 6. Tanıtım videosu — opsiyonel

- YouTube linki olarak eklenir; üretilecekse 15–30 sn, tek akış: tık → kaydırma → yapıştırma.

## Genel kurallar (tüm görseller)

- Renk uzayı sRGB; 96 dpi varsayımı.
- "Best", "#1" gibi doğrulanamayan iddialar ve Google/Chrome logosunun marka ihlali sayılacak kullanımları yasak.
- Yuvarlatılmış köşe, kalın kenarlık ve düşük kontrast, mağaza kartlarında kötü görünür — small tile ve ekran görüntülerinde tam kanama (full-bleed) tasarım tercih edilmeli.
- Teslim: kayıpsız PNG'ler + kaynak dosya (Figma linki). İkonlar için ayrıca tek SVG master.

## Teslimat listesi (özet)

| # | Asset | Boyut | Format | Zorunluluk |
|---|---|---|---|---|
| 1 | Mağaza ikonu | 128×128 | PNG (alfa) | Zorunlu |
| 2 | Toolbar ikon seti | 16 / 32 / 48 / 128 | PNG (alfa) ×4 | Zorunlu |
| 3 | Ekran görüntüleri | 1280×800 ×1–5 | PNG/JPEG | En az 1 zorunlu |
| 4 | Small promo tile | 440×280 | PNG/JPEG | Önerilir |
| 5 | Marquee tile | 1400×560 | PNG/JPEG | Opsiyonel |
| 6 | Video | YouTube | — | Opsiyonel |
