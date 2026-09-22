param(
    [Parameter(Mandatory = $true)]
    [string]$InstallerPath
)

$ErrorActionPreference = "Stop"


# ============================================================
# CONFIGURACIÓN MR11
# ============================================================

$ServiceName = "postgresql-mr11"

$Port = 5433

$DatabaseName = "mr11"

$DatabaseUser = "postgres"

$ConfigDir = "C:\ProgramData\MR11"

$EnvPath = Join-Path $ConfigDir ".env"

$PostgresDir = "C:\Program Files\MR11PostgreSQL"

$DataDir = Join-Path $ConfigDir "PostgreSQL\data"


Write-Host "Configurando PostgreSQL para MR11..."


# ============================================================
# CREAR CARPETA DE CONFIGURACIÓN
# ============================================================

if (-not (Test-Path $ConfigDir)) {

    New-Item `
        -ItemType Directory `
        -Path $ConfigDir `
        -Force |
        Out-Null
}


# ============================================================
# ¿YA ESTÁ INSTALADO?
# ============================================================

$Servicio =
    Get-Service `
        -Name $ServiceName `
        -ErrorAction SilentlyContinue


if ($null -ne $Servicio) {

    Write-Host "PostgreSQL de MR11 ya está instalado."


    if (-not (Test-Path $EnvPath)) {

        throw @"
Se encontró el servicio PostgreSQL de MR11,
pero falta:

$EnvPath

No se puede continuar automáticamente.
"@
    }


    if ($Servicio.Status -ne "Running") {

        Start-Service `
            -Name $ServiceName
    }


    Write-Host "Configuración existente encontrada."

    exit 0
}


# ============================================================
# VALIDAR INSTALADOR
# ============================================================

if (-not (Test-Path $InstallerPath)) {

    throw "No se encontró el instalador de PostgreSQL: $InstallerPath"
}


# ============================================================
# GENERAR CONTRASEÑA LOCAL
# ============================================================

$Password =
    "Mr11_" +
    [guid]::NewGuid().ToString("N") +
    "_Aa9!"


# ============================================================
# INSTALAR POSTGRESQL
# ============================================================

Write-Host "Instalando PostgreSQL..."


# Windows PowerShell 5.1 no conserva siempre las comillas al invocar un .exe.
# El instalador debe recibir las rutas con espacios como un solo argumento.
$InstallerArguments = @(
    '--mode unattended'
    '--unattendedmodeui none'
    '--installer-language es'
    ('--prefix "{0}"' -f $PostgresDir)
    ('--datadir "{0}"' -f $DataDir)
    "--serverport $Port"
    "--servicename $ServiceName"
    "--superaccount $DatabaseUser"
    "--superpassword $Password"
    "--servicepassword $Password"
    '--enable-components server,commandlinetools'
    '--create_shortcuts 0'
) -join ' '

$InstallerProcess = Start-Process `
    -FilePath $InstallerPath `
    -ArgumentList $InstallerArguments `
    -Wait `
    -PassThru

if ($InstallerProcess.ExitCode -ne 0) {
    throw "La instalación de PostgreSQL terminó con código $($InstallerProcess.ExitCode)."
}


# ============================================================
# ESPERAR SERVICIO
# ============================================================

Write-Host "Esperando PostgreSQL..."


$Intentos = 0

do {

    Start-Sleep -Seconds 2

    $Servicio =
        Get-Service `
            -Name $ServiceName `
            -ErrorAction SilentlyContinue

    $Intentos++

} while (
    (
        $null -eq $Servicio -or
        $Servicio.Status -ne "Running"
    ) -and
    $Intentos -lt 30
)


if (
    $null -eq $Servicio -or
    $Servicio.Status -ne "Running"
) {

    throw "PostgreSQL no pudo iniciarse."
}


# ============================================================
# BUSCAR PSQL
# ============================================================

$Psql =
    Join-Path `
        $PostgresDir `
        "bin\psql.exe"


if (-not (Test-Path $Psql)) {

    throw "No se encontró psql.exe en $Psql"
}


# ============================================================
# CONFIGURAR CONTRASEÑA PARA PSQL
# ============================================================

$env:PGPASSWORD =
    $Password


# ============================================================
# COMPROBAR SI EXISTE LA BASE
# ============================================================

$Resultado =
    & $Psql `
        -h "127.0.0.1" `
        -p "$Port" `
        -U "$DatabaseUser" `
        -d "postgres" `
        -tAc "SELECT 1 FROM pg_database WHERE datname = '$DatabaseName';"


$ExisteBase =
    (
        $Resultado |
        Out-String
    ).Trim()


# ============================================================
# CREAR BASE MR11
# ============================================================

if ($ExisteBase -ne "1") {

    Write-Host "Creando base de datos MR11..."


    & $Psql `
        -h "127.0.0.1" `
        -p "$Port" `
        -U "$DatabaseUser" `
        -d "postgres" `
        -v ON_ERROR_STOP=1 `
        -c "CREATE DATABASE $DatabaseName;"


    if ($LASTEXITCODE -ne 0) {

        throw "No se pudo crear la base de datos MR11."
    }
}


# ============================================================
# CREAR .ENV PARA EL BACKEND
# ============================================================

$ContenidoEnv = @"
DB_HOST=127.0.0.1
DB_PORT=$Port
DB_NAME=$DatabaseName
DB_USER=$DatabaseUser
DB_PASSWORD=$Password
PORT=3000
"@


[System.IO.File]::WriteAllText(
    $EnvPath,
    $ContenidoEnv,
    [System.Text.UTF8Encoding]::new($false)
)


Write-Host ""
Write-Host "========================================"
Write-Host "PostgreSQL configurado correctamente."
Write-Host "Base: $DatabaseName"
Write-Host "Puerto: $Port"
Write-Host "Servicio: $ServiceName"
Write-Host "========================================"
Write-Host ""


Remove-Item Env:\PGPASSWORD `
    -ErrorAction SilentlyContinue


exit 0
