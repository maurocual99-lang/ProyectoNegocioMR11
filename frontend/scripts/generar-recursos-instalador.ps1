param()

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$FrontendDir = Split-Path -Parent $PSScriptRoot
$TauriDir = Join-Path $FrontendDir "src-tauri"
$LogoPath = Join-Path $FrontendDir "imagenes\ChatGPT Image 20 jul 2026, 11_47_32.png"
$SidebarSourcePath = Join-Path $TauriDir "installer-assets\sidebar-source.png"
$AssetsDir = Join-Path $TauriDir "installer-assets"
$IconsDir = Join-Path $TauriDir "icons"

New-Item -ItemType Directory -Force -Path $AssetsDir, $IconsDir | Out-Null

function New-QualityGraphics {
    param([System.Drawing.Image]$Image)

    $Graphics = [System.Drawing.Graphics]::FromImage($Image)
    $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    return $Graphics
}

function Get-FitRectangle {
    param(
        [System.Drawing.Image]$Image,
        [System.Drawing.Rectangle]$Bounds
    )

    $Scale = [Math]::Min($Bounds.Width / $Image.Width, $Bounds.Height / $Image.Height)
    $Width = [int][Math]::Round($Image.Width * $Scale)
    $Height = [int][Math]::Round($Image.Height * $Scale)
    $X = $Bounds.X + [int](($Bounds.Width - $Width) / 2)
    $Y = $Bounds.Y + [int](($Bounds.Height - $Height) / 2)

    return [System.Drawing.Rectangle]::new($X, $Y, $Width, $Height)
}

function Export-Bitmap24 {
    param(
        [System.Drawing.Bitmap]$Source,
        [string]$Path
    )

    $Output = [System.Drawing.Bitmap]::new(
        $Source.Width,
        $Source.Height,
        [System.Drawing.Imaging.PixelFormat]::Format24bppRgb
    )
    $Graphics = New-QualityGraphics -Image $Output
    try {
        $Graphics.DrawImage($Source, 0, 0, $Source.Width, $Source.Height)
        $Output.Save($Path, [System.Drawing.Imaging.ImageFormat]::Bmp)
    }
    finally {
        $Graphics.Dispose()
        $Output.Dispose()
    }
}

$Logo = [System.Drawing.Image]::FromFile($LogoPath)
$SidebarSource = [System.Drawing.Image]::FromFile($SidebarSourcePath)

try {
    # Imagen lateral de las pantallas de bienvenida y finalizacion de NSIS.
    $Sidebar = [System.Drawing.Bitmap]::new(164, 314)
    $SidebarGraphics = New-QualityGraphics -Image $Sidebar
    try {
        $SourceRatio = $SidebarSource.Width / $SidebarSource.Height
        $TargetRatio = 164 / 314

        if ($SourceRatio -gt $TargetRatio) {
            $CropHeight = $SidebarSource.Height
            $CropWidth = [int][Math]::Round($CropHeight * $TargetRatio)
            $CropX = [int](($SidebarSource.Width - $CropWidth) / 2)
            $Crop = [System.Drawing.Rectangle]::new($CropX, 0, $CropWidth, $CropHeight)
        }
        else {
            $CropWidth = $SidebarSource.Width
            $CropHeight = [int][Math]::Round($CropWidth / $TargetRatio)
            $CropY = [int](($SidebarSource.Height - $CropHeight) / 2)
            $Crop = [System.Drawing.Rectangle]::new(0, $CropY, $CropWidth, $CropHeight)
        }

        $SidebarGraphics.DrawImage(
            $SidebarSource,
            [System.Drawing.Rectangle]::new(0, 0, 164, 314),
            $Crop,
            [System.Drawing.GraphicsUnit]::Pixel
        )
        Export-Bitmap24 -Source $Sidebar -Path (Join-Path $AssetsDir "sidebar.bmp")
    }
    finally {
        $SidebarGraphics.Dispose()
        $Sidebar.Dispose()
    }

    # Cabecera compacta: fondo claro, acento celeste y el escudo original.
    $Header = [System.Drawing.Bitmap]::new(150, 57)
    $HeaderGraphics = New-QualityGraphics -Image $Header
    try {
        $HeaderBounds = [System.Drawing.Rectangle]::new(0, 0, 150, 57)
        $Background = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
            $HeaderBounds,
            [System.Drawing.Color]::White,
            [System.Drawing.Color]::FromArgb(220, 243, 255),
            0
        )
        try {
            $HeaderGraphics.FillRectangle($Background, $HeaderBounds)
        }
        finally {
            $Background.Dispose()
        }

        $Accent = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(38, 166, 229))
        try {
            $HeaderGraphics.FillRectangle($Accent, 0, 54, 150, 3)
        }
        finally {
            $Accent.Dispose()
        }

        $LogoRectangle = Get-FitRectangle -Image $Logo -Bounds ([System.Drawing.Rectangle]::new(101, 3, 44, 49))
        $HeaderGraphics.DrawImage($Logo, $LogoRectangle)
        Export-Bitmap24 -Source $Header -Path (Join-Path $AssetsDir "header.bmp")
    }
    finally {
        $HeaderGraphics.Dispose()
        $Header.Dispose()
    }

    # Fuente cuadrada para que Tauri genere el .ico y todos los tamanos de Windows.
    $Icon = [System.Drawing.Bitmap]::new(1024, 1024)
    $IconGraphics = New-QualityGraphics -Image $Icon
    try {
        $IconGraphics.Clear([System.Drawing.Color]::Transparent)
        $IconRectangle = Get-FitRectangle -Image $Logo -Bounds ([System.Drawing.Rectangle]::new(92, 44, 840, 936))
        $IconGraphics.DrawImage($Logo, $IconRectangle)
        $Icon.Save((Join-Path $AssetsDir "mr11-icon-source.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
        $IconGraphics.Dispose()
        $Icon.Dispose()
    }
}
finally {
    $Logo.Dispose()
    $SidebarSource.Dispose()
}

Push-Location $FrontendDir
try {
    & npm.cmd run tauri -- icon "src-tauri/installer-assets/mr11-icon-source.png"
    if ($LASTEXITCODE -ne 0) {
        throw "Tauri no pudo generar los iconos de MR11."
    }
}
finally {
    Pop-Location
}

# El proyecto se distribuye solo para escritorio; Tauri tambien crea estos
# recursos moviles por defecto y no hace falta conservarlos en el repositorio.
$AndroidIcons = Join-Path $IconsDir "android"
$IosIcons = Join-Path $IconsDir "ios"
$ExtraIcon = Join-Path $IconsDir "64x64.png"

if (Test-Path -LiteralPath $AndroidIcons) {
    Remove-Item -LiteralPath $AndroidIcons -Recurse -Force
}
if (Test-Path -LiteralPath $IosIcons) {
    Remove-Item -LiteralPath $IosIcons -Recurse -Force
}
if (Test-Path -LiteralPath $ExtraIcon) {
    Remove-Item -LiteralPath $ExtraIcon -Force
}

Write-Host "Recursos visuales e iconos de MR11 generados en $AssetsDir"
