param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidatePattern('^\d+\.\d+\.\d+$')]
    [string]$Version,

    [Parameter(Position = 1, ValueFromRemainingArguments = $true)]
    [string[]]$Notas
)

$ErrorActionPreference = "Stop"

$RepoDir = Split-Path -Parent $PSScriptRoot
$FrontendDir = Join-Path $RepoDir "frontend"
$NotasTexto = ($Notas -join " ").Trim()

if (-not $NotasTexto) {
    $NotasTexto = "Mejoras y correcciones de MR11 $Version."
}

function Ejecutar-Paso {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Titulo,

        [Parameter(Mandatory = $true)]
        [scriptblock]$Accion
    )

    Write-Host ""
    Write-Host "=== $Titulo ===" -ForegroundColor Cyan
    & $Accion

    if ($LASTEXITCODE -ne 0) {
        throw "Fallo el paso: $Titulo"
    }
}

Push-Location $RepoDir
try {
    Ejecutar-Paso "Preparar version $Version" {
        & npm.cmd run version:app -- $Version
    }

    Ejecutar-Paso "Probar backend" {
        & npm.cmd --prefix backend test
    }

    Ejecutar-Paso "Empaquetar backend" {
        & npm.cmd --prefix backend run build:sidecar
    }

    Ejecutar-Paso "Generar iconos y recursos" {
        & npm.cmd --prefix frontend run installer:assets
    }

    Ejecutar-Paso "Construir instalador" {
        & npm.cmd --prefix frontend run tauri build -- --config src-tauri/tauri.local.conf.json
    }

    Write-Host ""
    Write-Host "La compilacion termino. Ahora se pedira la contrasena de la firma." -ForegroundColor Yellow

    & (Join-Path $PSScriptRoot "firmar-actualizacion.ps1") -Notas $NotasTexto

    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo firmar la actualizacion."
    }

    $ReleaseDir = Join-Path $FrontendDir "src-tauri\target\release\bundle\nsis"
    Write-Host ""
    Write-Host "Actualizacion $Version lista para publicar." -ForegroundColor Green
    Write-Host "Carpeta: $ReleaseDir"
    Write-Host "Subi el .exe, el .exe.sig y latest.json a la release v$Version."
}
finally {
    Pop-Location
}
