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


# El instalador NSIS no ofrece una consola interactiva confiable. Los pedidos
# con Read-Host pueden quedar invisibles, por eso toda decision del usuario se
# realiza con ventanas de Windows.
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

function Solicitar-Contrasena {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Titulo,

        [Parameter(Mandatory = $true)]
        [string]$Mensaje,

        [switch]$Confirmar,

        [switch]$PermitirGenerar
    )

    $Formulario = New-Object System.Windows.Forms.Form
    $Formulario.Text = $Titulo
    $Formulario.StartPosition = 'CenterScreen'
    $Formulario.ClientSize = New-Object System.Drawing.Size(470, $(if ($Confirmar) { 285 } else { 225 }))
    $Formulario.FormBorderStyle = 'FixedDialog'
    $Formulario.MaximizeBox = $false
    $Formulario.MinimizeBox = $false
    $Formulario.TopMost = $true

    $EtiquetaMensaje = New-Object System.Windows.Forms.Label
    $EtiquetaMensaje.Location = New-Object System.Drawing.Point(20, 18)
    $EtiquetaMensaje.Size = New-Object System.Drawing.Size(430, 48)
    $EtiquetaMensaje.Text = $Mensaje
    $Formulario.Controls.Add($EtiquetaMensaje)

    $EtiquetaClave = New-Object System.Windows.Forms.Label
    $EtiquetaClave.Location = New-Object System.Drawing.Point(20, 73)
    $EtiquetaClave.AutoSize = $true
    $EtiquetaClave.Text = 'Contrasena:'
    $Formulario.Controls.Add($EtiquetaClave)

    $CajaClave = New-Object System.Windows.Forms.TextBox
    $CajaClave.Location = New-Object System.Drawing.Point(20, 94)
    $CajaClave.Size = New-Object System.Drawing.Size(430, 23)
    $CajaClave.UseSystemPasswordChar = $true
    $Formulario.Controls.Add($CajaClave)

    $CajaConfirmacion = $null
    if ($Confirmar) {
        $EtiquetaConfirmacion = New-Object System.Windows.Forms.Label
        $EtiquetaConfirmacion.Location = New-Object System.Drawing.Point(20, 126)
        $EtiquetaConfirmacion.AutoSize = $true
        $EtiquetaConfirmacion.Text = 'Repetir contrasena:'
        $Formulario.Controls.Add($EtiquetaConfirmacion)

        $CajaConfirmacion = New-Object System.Windows.Forms.TextBox
        $CajaConfirmacion.Location = New-Object System.Drawing.Point(20, 147)
        $CajaConfirmacion.Size = New-Object System.Drawing.Size(430, 23)
        $CajaConfirmacion.UseSystemPasswordChar = $true
        $Formulario.Controls.Add($CajaConfirmacion)
    }

    $PosicionOpciones = if ($Confirmar) { 178 } else { 126 }
    $MostrarClave = New-Object System.Windows.Forms.CheckBox
    $MostrarClave.Location = New-Object System.Drawing.Point(20, $PosicionOpciones)
    $MostrarClave.AutoSize = $true
    $MostrarClave.Text = 'Mostrar contrasena'
    $MostrarClave.Add_CheckedChanged({
        $Ocultar = -not $MostrarClave.Checked
        $CajaClave.UseSystemPasswordChar = $Ocultar
        if ($null -ne $CajaConfirmacion) {
            $CajaConfirmacion.UseSystemPasswordChar = $Ocultar
        }
    })
    $Formulario.Controls.Add($MostrarClave)

    if ($PermitirGenerar) {
        $BotonGenerar = New-Object System.Windows.Forms.Button
        $BotonGenerar.Location = New-Object System.Drawing.Point(300, $($PosicionOpciones - 4))
        $BotonGenerar.Size = New-Object System.Drawing.Size(150, 28)
        $BotonGenerar.Text = 'Generar una segura'
        $BotonGenerar.Add_Click({
            $Generada = 'Mr11_' + [guid]::NewGuid().ToString('N') + '_Aa9'
            $CajaClave.Text = $Generada
            $CajaConfirmacion.Text = $Generada
            $MostrarClave.Checked = $true
        })
        $Formulario.Controls.Add($BotonGenerar)
    }

    $EtiquetaError = New-Object System.Windows.Forms.Label
    $EtiquetaError.Location = New-Object System.Drawing.Point(20, $($PosicionOpciones + 31))
    $EtiquetaError.Size = New-Object System.Drawing.Size(430, 32)
    $EtiquetaError.ForeColor = [System.Drawing.Color]::Firebrick
    $Formulario.Controls.Add($EtiquetaError)

    $BotonAceptar = New-Object System.Windows.Forms.Button
    $BotonAceptar.Location = New-Object System.Drawing.Point(270, $($PosicionOpciones + 64))
    $BotonAceptar.Size = New-Object System.Drawing.Size(85, 29)
    $BotonAceptar.Text = 'Aceptar'
    $BotonAceptar.Add_Click({
        if ([string]::IsNullOrWhiteSpace($CajaClave.Text)) {
            $EtiquetaError.Text = 'La contrasena no puede estar vacia.'
            return
        }
        if ($Confirmar) {
            if ($CajaClave.Text -ne $CajaConfirmacion.Text) {
                $EtiquetaError.Text = 'Las contrasenas no coinciden.'
                return
            }
            if ($CajaClave.Text.Length -lt 10 -or $CajaClave.Text -notmatch '[A-Za-z]' -or $CajaClave.Text -notmatch '[0-9]') {
                $EtiquetaError.Text = 'Use al menos 10 caracteres, con letras y numeros.'
                return
            }
            if ($CajaClave.Text -notmatch '^[A-Za-z0-9_-]+$') {
                $EtiquetaError.Text = 'Use solamente letras, numeros, guion y guion bajo.'
                return
            }
        }
        $Formulario.Tag = $CajaClave.Text
        $Formulario.DialogResult = [System.Windows.Forms.DialogResult]::OK
        $Formulario.Close()
    })
    $Formulario.Controls.Add($BotonAceptar)

    $BotonCancelar = New-Object System.Windows.Forms.Button
    $BotonCancelar.Location = New-Object System.Drawing.Point(365, $($PosicionOpciones + 64))
    $BotonCancelar.Size = New-Object System.Drawing.Size(85, 29)
    $BotonCancelar.Text = 'Cancelar'
    $BotonCancelar.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
    $Formulario.Controls.Add($BotonCancelar)

    $Formulario.AcceptButton = $BotonAceptar
    $Formulario.CancelButton = $BotonCancelar
    $Formulario.Add_Shown({ $Formulario.Activate(); $CajaClave.Focus() })

    $ResultadoDialogo = $Formulario.ShowDialog()
    if ($ResultadoDialogo -ne [System.Windows.Forms.DialogResult]::OK) {
        throw 'La configuracion de PostgreSQL fue cancelada por el usuario.'
    }

    return [string]$Formulario.Tag
}

function Seleccionar-ServicioPostgres {
    param(
        [Parameter(Mandatory = $true)]
        [object[]]$Servicios
    )

    $Formulario = New-Object System.Windows.Forms.Form
    $Formulario.Text = 'MR11 - Seleccionar PostgreSQL'
    $Formulario.StartPosition = 'CenterScreen'
    $Formulario.ClientSize = New-Object System.Drawing.Size(470, 185)
    $Formulario.FormBorderStyle = 'FixedDialog'
    $Formulario.MaximizeBox = $false
    $Formulario.MinimizeBox = $false
    $Formulario.TopMost = $true

    $Etiqueta = New-Object System.Windows.Forms.Label
    $Etiqueta.Location = New-Object System.Drawing.Point(20, 18)
    $Etiqueta.Size = New-Object System.Drawing.Size(430, 44)
    $Etiqueta.Text = 'Se encontraron varias instalaciones. Seleccione la que contiene la base mr11 con sus datos.'
    $Formulario.Controls.Add($Etiqueta)

    $Lista = New-Object System.Windows.Forms.ComboBox
    $Lista.Location = New-Object System.Drawing.Point(20, 72)
    $Lista.Size = New-Object System.Drawing.Size(430, 24)
    $Lista.DropDownStyle = 'DropDownList'
    foreach ($ServicioDisponible in $Servicios) {
        [void]$Lista.Items.Add($ServicioDisponible.Name)
    }
    $Lista.SelectedIndex = 0
    $Formulario.Controls.Add($Lista)

    $BotonAceptar = New-Object System.Windows.Forms.Button
    $BotonAceptar.Location = New-Object System.Drawing.Point(270, 125)
    $BotonAceptar.Size = New-Object System.Drawing.Size(85, 29)
    $BotonAceptar.Text = 'Aceptar'
    $BotonAceptar.Add_Click({
        $Formulario.Tag = [string]$Lista.SelectedItem
        $Formulario.DialogResult = [System.Windows.Forms.DialogResult]::OK
        $Formulario.Close()
    })
    $Formulario.Controls.Add($BotonAceptar)

    $BotonCancelar = New-Object System.Windows.Forms.Button
    $BotonCancelar.Location = New-Object System.Drawing.Point(365, 125)
    $BotonCancelar.Size = New-Object System.Drawing.Size(85, 29)
    $BotonCancelar.Text = 'Cancelar'
    $BotonCancelar.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
    $Formulario.Controls.Add($BotonCancelar)

    $Formulario.AcceptButton = $BotonAceptar
    $Formulario.CancelButton = $BotonCancelar
    $Formulario.Add_Shown({ $Formulario.Activate() })

    if ($Formulario.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
        throw 'La seleccion de PostgreSQL fue cancelada por el usuario.'
    }

    return [string]$Formulario.Tag
}

function Restablecer-ContrasenaServicioMr11 {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PsqlPath,

        [Parameter(Mandatory = $true)]
        [string]$NuevaContrasena
    )

    # Esta recuperacion solo se usa para la instancia aislada que creo MR11.
    # Se habilita acceso local sin clave durante unos segundos, se cambia la
    # clave y se restaura pg_hba.conf byte por byte aun cuando algo falle.
    $PgHbaPath = Join-Path $DataDir 'pg_hba.conf'
    if (-not (Test-Path $PgHbaPath)) {
        throw "Falta $PgHbaPath; no se puede recuperar la instalacion parcial."
    }

    $PgHbaOriginal = [System.IO.File]::ReadAllBytes($PgHbaPath)
    $ReglasTemporales = [System.Text.UTF8Encoding]::new($false).GetBytes(
        "host all all 127.0.0.1/32 trust`r`nhost all all ::1/128 trust`r`n"
    )
    $PgHbaTemporal = New-Object byte[] ($ReglasTemporales.Length + $PgHbaOriginal.Length)
    [System.Array]::Copy($ReglasTemporales, 0, $PgHbaTemporal, 0, $ReglasTemporales.Length)
    [System.Array]::Copy($PgHbaOriginal, 0, $PgHbaTemporal, $ReglasTemporales.Length, $PgHbaOriginal.Length)

    $CambioAplicado = $false
    try {
        [System.IO.File]::WriteAllBytes($PgHbaPath, $PgHbaTemporal)
        Restart-Service -Name $ServiceName -Force

        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
        "ALTER ROLE $DatabaseUser WITH PASSWORD '$NuevaContrasena';" |
            & $PsqlPath -X -q -w -h 127.0.0.1 -p $Port -U $DatabaseUser -d postgres -v ON_ERROR_STOP=1
        if ($LASTEXITCODE -ne 0) {
            throw 'PostgreSQL no permitio establecer la nueva contrasena.'
        }
        $CambioAplicado = $true
    } finally {
        [System.IO.File]::WriteAllBytes($PgHbaPath, $PgHbaOriginal)
        Restart-Service -Name $ServiceName -Force
    }

    if (-not $CambioAplicado) {
        throw 'No se pudo restablecer la contrasena de la instalacion parcial.'
    }
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
        $NombreElegido = Seleccionar-ServicioPostgres -Servicios $ServiciosExistentes
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
                $Candidato = Solicitar-Contrasena `
                    -Titulo 'MR11 - PostgreSQL existente' `
                    -Mensaje "PostgreSQL $VersionExistente ya esta instalado. Ingrese la contrasena actual del usuario postgres para que MR11 pueda usarlo."
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
            if ($ServiceName -ne 'postgresql-mr11') {
                throw "El servicio existe, pero falta $EnvPath y no se pudo recuperar la clave del registro local de PostgreSQL. No borre el servicio ni los datos."
            }

            $Etapa = 'restablecer contrasena de instalacion parcial'
            $Password = Solicitar-Contrasena `
                -Titulo 'MR11 - Recuperar instalacion' `
                -Mensaje 'Se encontro una instalacion anterior incompleta. Elija una contrasena nueva para recuperarla sin borrar la base de datos.' `
                -Confirmar `
                -PermitirGenerar
            Restablecer-ContrasenaServicioMr11 `
                -PsqlPath $PsqlRecuperacion `
                -NuevaContrasena $Password
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
        $Password = Solicitar-Contrasena `
            -Titulo 'MR11 - Crear contrasena de PostgreSQL' `
            -Mensaje 'Elija una contrasena para la base de datos de MR11. Guardela: tambien servira para conectarse con pgAdmin.' `
            -Confirmar `
            -PermitirGenerar
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
    -WindowStyle Hidden `
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
