param(
    [string]$Notas = "Mejoras de productos, stock, deudas y ventas con pago parcial."
)

$ErrorActionPreference = "Stop"

$RepoDir = Split-Path -Parent $PSScriptRoot
$FrontendDir = Join-Path $RepoDir "frontend"
$ConfigPath = Join-Path $FrontendDir "src-tauri\tauri.conf.json"
$KeyPath = "C:\Users\macar\.tauri\mr11.key"
$Config = Get-Content -Raw $ConfigPath | ConvertFrom-Json
$InstallerPath = Join-Path $FrontendDir "src-tauri\target\release\bundle\nsis\MR11_$($Config.version)_x64-setup.exe"

if (-not (Test-Path -LiteralPath $KeyPath)) {
    throw "No se encontro la clave privada en $KeyPath"
}

if (-not (Test-Path -LiteralPath $InstallerPath)) {
    throw "No se encontro el instalador $InstallerPath"
}

$SecurePassword = Read-Host "Contrasena de la clave de actualizaciones" -AsSecureString
$PasswordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)

try {
    $PlainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($PasswordPointer)
    $env:TAURI_SIGNING_PRIVATE_KEY_PATH = $KeyPath
    $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = $PlainPassword

    Push-Location $FrontendDir
    try {
        & npm.cmd run tauri -- signer sign -f $KeyPath $InstallerPath
        if ($LASTEXITCODE -ne 0) {
            throw "No se pudo firmar el instalador. Revisa la contrasena."
        }
    }
    finally {
        Pop-Location
    }

    Push-Location $RepoDir
    try {
        & node scripts/generar-latest.mjs $Notas
        if ($LASTEXITCODE -ne 0) {
            throw "No se pudo generar latest.json."
        }
    }
    finally {
        Pop-Location
    }
}
finally {
    Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY_PATH -ErrorAction SilentlyContinue
    Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD -ErrorAction SilentlyContinue
    if ($PasswordPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($PasswordPointer)
    }
    $PlainPassword = $null
}

Write-Host "Actualizacion firmada y latest.json generado."
