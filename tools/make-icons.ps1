# Generates placeholder toolbar/store icons (16/32/48/128 px PNG).
# Final icons will be delivered by the design team — see DESIGN_SPEC.md.
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "..\extension\icons"
New-Item -ItemType Directory -Force $outDir | Out-Null

foreach ($size in 16, 32, 48, 128) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    # Rounded blue square
    $pad = [Math]::Max(1, [int]($size * 0.02))
    $r = [int]($size * 0.22)
    $side = $size - (2 * $pad)
    $rect = New-Object System.Drawing.Rectangle($pad, $pad, $side, $side)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = 2 * $r
    $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
    $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
    $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    $blue = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 37, 99, 235))
    $g.FillPath($blue, $path)

    # Three white bars = stitched viewport segments
    $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $barX = [int]($size * 0.22)
    $barW = $size - 2 * $barX
    $barH = [Math]::Max(1, [int]($size * 0.14))
    $gap = [Math]::Max(1, [int]($size * 0.08))
    $totalH = 3 * $barH + 2 * $gap
    $startY = [int](($size - $totalH) / 2)
    for ($i = 0; $i -lt 3; $i++) {
        $g.FillRectangle($white, $barX, $startY + $i * ($barH + $gap), $barW, $barH)
    }

    $g.Dispose()
    $bmp.Save((Join-Path $outDir "icon$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "icon$size.png"
}
