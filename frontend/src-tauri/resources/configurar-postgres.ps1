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
$ErrorLog = Join-Path $ConfigDir "instalacion-error.txt"
$Etapa = "preparar configuracion"
$Password = $null

trap {
    $Failure = $_.Exception.Message
    if ($Password) {
        $Failure = $Failure.Replace($Password, "[oculta]")
    }
    $Message = "Paso: $Etapa`r`nError: $Failure"
    try {
        New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
        [System.IO.File]::WriteAllText($ErrorLog, $Message)
    } catch {
        Write-Host "No se pudo guardar el diagnostico en $ErrorLog"
    }
    Write-Host $Message
    exit 1
}


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

if ($null -eq $Servicio) {
    $ServiciosExistentes = @(Get-Service -Name 'postgresql-x64-*' -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^postgresql-x64-(\d+(?:\.\d+)?)$' } |
        Sort-Object { [decimal]($_.Name -replace '^postgresql-x64-', '') } -Descending)
    $PostgresExistente = $ServiciosExistentes | Select-Object -First 1
    $SeleccionPorPuerto = $false
    if (Test-Path $EnvPath) {
        $PuertoConfigurado = Get-Content $EnvPath |
            Where-Object { $_ -match '^DB_PORT=\d+$' } |
            Select-Object -First 1
        if ($PuertoConfigurado) {
            $PuertoConfigurado = [int]($PuertoConfigurado -replace '^DB_PORT=', '')
            foreach ($ServicioCandidato in $ServiciosExistentes) {
                $VersionCandidata = $ServicioCandidato.Name -replace '^postgresql-x64-', ''
                $ConfigCandidata = "C:\Program Files\PostgreSQL\$VersionCandidata\data\postgresql.conf"
                $PuertoCandidato = 5432
                if (Test-Path $ConfigCandidata) {
                    $LineaCandidata = Get-Content $ConfigCandidata |
                        Where-Object { $_ -match '^\s*port\s*=\s*\d+' } |
                        Select-Object -First 1
                    if ($LineaCandidata -match '^\s*port\s*=\s*(\d+)') {
                        $PuertoCandidato = [int]$Matches[1]
                    }
                }
                if ($PuertoCandidato -eq $PuertoConfigurado) {
                    $PostgresExistente = $ServicioCandidato
                    $SeleccionPorPuerto = $true
                    break
                }
            }
        }
    }
    if ($ServiciosExistentes.Count -gt 1 -and -not $SeleccionPorPuerto) {
        Write-Host 'Se encontraron varias instalaciones de PostgreSQL:'
        $ServiciosExistentes | ForEach-Object { Write-Host " - $($_.Name)" }
        $NombreElegido = Read-Host 'Nombre del servicio que contiene la base mr11 con datos'
        $PostgresExistente = $ServiciosExistentes |
            Where-Object { $_.Name -eq $NombreElegido } |
            Select-Object -First 1
        if ($null -eq $PostgresExistente) {
            throw 'Servicio no reconocido. No se creara una base nueva.'
        }
    }
    if ($null -ne $PostgresExistente) {
        # Reutilizar la instancia existente conserva la base mr11 y sus datos.
        # EDB puede reutilizar una instalacion registrada e ignorar --prefix.
        $Etapa = 'conectar a PostgreSQL existente'
        $ServiceName = $PostgresExistente.Name
        $VersionExistente = $ServiceName -replace '^postgresql-x64-', ''
        $PostgresDir = "C:\Program Files\PostgreSQL\$VersionExistente"
        $Port = 5432
        $ConfigPostgres = Join-Path $PostgresDir 'data\postgresql.conf'
        if (Test-Path $ConfigPostgres) {
            $LineaPuerto = Get-Content $ConfigPostgres | Where-Object { $_ -match '^\s*port\s*=\s*\d+' } | Select-Object -First 1
            if ($LineaPuerto -match '^\s*port\s*=\s*(\d+)') {
                $Port = [int]$Matches[1]
            }
        }
        $PsqlExistente = Join-Path $PostgresDir 'bin\psql.exe'
        if (-not (Test-Path $PsqlExistente)) {
            throw "Se encontro $ServiceName, pero falta $PsqlExistente."
        }
        if ($PostgresExistente.Status -ne 'Running') {
            Start-Service -Name $ServiceName
        }

        $Candidatos = @()
        if (Test-Path $EnvPath) {
            $LineasEnv = Get-Content $EnvPath
            if ($LineasEnv -contains "DB_PORT=$Port") {
                $LineaClave = $LineasEnv | Where-Object { $_ -match '^DB_PASSWORD=' } | Select-Object -First 1
                if ($LineaClave) {
                    $Candidatos += $LineaClave.Substring('DB_PASSWORD='.Length)
                }
            }
        }

        for ($Intento = 0; $Intento -lt 3 -and -not $Password; $Intento++) {
            if ($Intento -lt $Candidatos.Count) {
                $Candidato = $Candidatos[$Intento]
            } else {
                Write-Host "PostgreSQL $VersionExistente ya esta instalado. MR11 usara esa instancia."
                $ClaveSegura = Read-Host 'Contrasena del usuario postgres' -AsSecureString
                $Candidato = [System.Net.NetworkCredential]::new('', $ClaveSegura).Password
            }
            if (-not $Candidato) {
                continue
            }
            $env:PGPASSWORD = $Candidato
            $Autenticado = $false
            try {
                'SELECT 1;' | & $PsqlExistente -X -q -t -A -w -h 127.0.0.1 -p $Port -U $DatabaseUser -d postgres 2>$null | Out-Null
                $Autenticado = ($LASTEXITCODE -eq 0)
            } catch {
                # La clave se vuelve a pedir sin escribirla en el registro.
            }
            Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
            if ($Autenticado) {
                $Password = $Candidato
            }
        }
        if (-not $Password) {
            throw "No se pudo conectar a PostgreSQL $VersionExistente con la clave indicada. La base existente no se modifico."
        }

        $env:PGPASSWORD = $Password
        $NumeroVersion = ('SHOW server_version_num;' |
            & $PsqlExistente -X -q -t -A -w -h 127.0.0.1 -p $Port -U $DatabaseUser -d postgres | Out-String).Trim()
        $CodigoVersion = $LASTEXITCODE
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
        if ($CodigoVersion -ne 0 -or -not ($NumeroVersion -match '^\d+$') -or [int]$NumeroVersion -lt 90600) {
            throw 'MR11 requiere PostgreSQL 9.6 o posterior. Haga un respaldo y actualice el servidor antes de instalar.'
        }

        $ContenidoEnv = @"
DB_HOST=127.0.0.1
DB_PORT=$Port
DB_NAME=$DatabaseName
DB_USER=$DatabaseUser
DB_PASSWORD=$Password
PORT=3000
"@
        [System.IO.File]::WriteAllText($EnvPath, $ContenidoEnv, [System.Text.UTF8Encoding]::new($false))
        $Servicio = $PostgresExistente
    }
}


if ($null -ne $Servicio) {

    Write-Host "PostgreSQL para MR11 ya está instalado."


    $Etapa = "iniciar servicio existente"
    if ($Servicio.Status -ne "Running") {

        Start-Service `
            -Name $ServiceName
    }

    if (Test-Path $EnvPath) {
        $PasswordLine = Get-Content $EnvPath | Where-Object { $_ -match '^DB_PASSWORD=' } | Select-Object -First 1
        if (-not $PasswordLine) {
            throw "El archivo $EnvPath no contiene DB_PASSWORD."
        }
        $Password = $PasswordLine.Substring('DB_PASSWORD='.Length)
    } else {
        $Etapa = "recuperar configuracion de PostgreSQL"
        $PsqlRecuperacion = Join-Path $PostgresDir 'bin\psql.exe'
        if (-not (Test-Path $PsqlRecuperacion)) {
            throw "Falta $PsqlRecuperacion; no se puede recuperar la configuracion."
        }

        # El instalador anterior podia crear el servicio antes de escribir .env.
        # EDB guarda un registro local que puede contener la clave generada.
        $LogPaths = @(
            (Join-Path $env:TEMP 'install-postgresql.log')
            (Join-Path $env:windir 'Temp\install-postgresql.log')
        )
        $UserLogs = Get-ChildItem -Path 'C:\Users\*\AppData\Local\Temp\install-postgresql.log' -ErrorAction SilentlyContinue
        $LogPaths += @($UserLogs | ForEach-Object { $_.FullName })

        $Candidates = foreach ($LogPath in ($LogPaths | Where-Object { $_ } | Select-Object -Unique)) {
            if (Test-Path $LogPath) {
                try {
                    $LogText = [System.IO.File]::ReadAllText($LogPath)
                    [regex]::Matches($LogText, 'Mr11_[0-9a-fA-F]{32}_Aa9!') |
                        ForEach-Object { $_.Value }
                } catch {
                    # Otro usuario puede tener un registro inaccesible.
                    continue
                }
            }
        }

        foreach ($Candidate in ($Candidates | Select-Object -Unique)) {
            $env:PGPASSWORD = $Candidate
            $Autenticado = $false
            try {
                'SELECT 1;' | & $PsqlRecuperacion -X -q -t -A -w -h 127.0.0.1 -p $Port -U $DatabaseUser -d postgres 2>$null | Out-Null
                $Autenticado = ($LASTEXITCODE -eq 0)
            } catch {
                # Probar la siguiente clave sin mostrarla ni registrarla.
            }
            if ($Autenticado) {
                $Password = $Candidate
                break
            }
        }
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

        if (-not $Password) {
            throw "El servicio existe, pero falta $EnvPath y no se pudo recuperar la clave del registro local de PostgreSQL. No borre el servicio ni los datos."
        }

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
    }

    Write-Host "Configuracion existente encontrada; comprobando la base."
}


# ============================================================
# VALIDAR INSTALADOR
# ============================================================

if ($null -eq $Servicio -and -not (Test-Path $InstallerPath)) {

    throw "No se encontró el instalador de PostgreSQL: $InstallerPath"
}


# ============================================================
# GENERAR CONTRASEÑA LOCAL
# ============================================================

if ($null -eq $Servicio) {
    if (Test-Path $EnvPath) {
        $PasswordLine = Get-Content $EnvPath | Where-Object { $_ -match '^DB_PASSWORD=' } | Select-Object -First 1
        if (-not $PasswordLine) {
            throw "El archivo $EnvPath no contiene DB_PASSWORD."
        }
        $Password = $PasswordLine.Substring('DB_PASSWORD='.Length)
    } else {
        $Password = "Mr11_" + [guid]::NewGuid().ToString("N") + "_Aa9!"
    }

    # Guardar la clave antes de instalar permite continuar si el instalador
    # crea el servicio pero falla antes de terminar la configuracion.
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
}


# ============================================================
# INSTALAR POSTGRESQL
# ============================================================

if ($null -eq $Servicio) {
Write-Host "Instalando PostgreSQL..."
$Etapa = "instalar PostgreSQL"


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
    -PassThru

$InstallerProcess.WaitForExit()

if ($InstallerProcess.ExitCode -ne 0) {
    throw "La instalación de PostgreSQL terminó con código $($InstallerProcess.ExitCode)."
}
}


# ============================================================
# ESPERAR SERVICIO
# ============================================================

Write-Host "Esperando PostgreSQL..."
$Etapa = "esperar servicio PostgreSQL"


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

$Etapa = "consultar PostgreSQL"
$Resultado = $null
$PsqlExitCode = 1
for ($Intento = 1; $Intento -le 15; $Intento++) {
    # Enviar el SQL por stdin evita que PowerShell 5.1 separe la consulta
    # en varios argumentos cuando contiene espacios.
    $Resultado = "SELECT 1 FROM pg_database WHERE datname = '$DatabaseName';" |
        & $Psql -X -q -t -A -w -h 127.0.0.1 -p $Port -U $DatabaseUser -d postgres
    $PsqlExitCode = $LASTEXITCODE
    if ($PsqlExitCode -eq 0) {
        break
    }
    Start-Sleep -Seconds 2
}

if ($PsqlExitCode -ne 0) {
    throw "No se pudo consultar PostgreSQL con las credenciales guardadas en $EnvPath (psql: $PsqlExitCode)."
}


$ExisteBase =
    (
        $Resultado |
        Out-String
    ).Trim()


if ($ExisteBase -eq '1') {
    # La aplicacion ejecutara migraciones al arrancar. Conservar una copia
    # logica de los datos anteriores antes de actualizar el esquema.
    $Etapa = 'respaldar base de datos existente'
    $PgDump = Join-Path $PostgresDir 'bin\pg_dump.exe'
    if (-not (Test-Path $PgDump)) {
        throw "Falta $PgDump. No se actualizo la base sin respaldo."
    }
    $Respaldo = Join-Path $ConfigDir ("respaldo-mr11-{0}.dump" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
    & $PgDump -Fc -w -h 127.0.0.1 -p $Port -U $DatabaseUser -d $DatabaseName -f $Respaldo
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $Respaldo) -or (Get-Item $Respaldo).Length -eq 0) {
        throw 'No se pudo respaldar la base existente. No se ejecutaran migraciones.'
    }
    Write-Host "Respaldo creado: $Respaldo"
}


# ============================================================
# CREAR BASE MR11
# ============================================================

if ($ExisteBase -ne "1") {

    Write-Host "Creando base de datos MR11..."
    $Etapa = "crear base de datos MR11"


    "CREATE DATABASE $DatabaseName;" |
        & $Psql -X -q -w -h 127.0.0.1 -p $Port -U $DatabaseUser -d postgres -v ON_ERROR_STOP=1


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

Remove-Item $ErrorLog -ErrorAction SilentlyContinue


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
