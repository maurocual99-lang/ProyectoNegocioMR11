!macro NSIS_HOOK_POSTINSTALL

    DetailPrint "Configurando base de datos de MR11..."

    ; nsExec ejecuta procesos de consola sin abrir la ventana negra. Las ventanas
    ; graficas creadas por el script (contrasena y seleccion) siguen visibles.
    nsExec::ExecToStack '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "$INSTDIR\resources\configurar-postgres.ps1" -InstallerPath "$INSTDIR\resources\postgresql-installer.exe"'
    Pop $0
    Pop $1

    ${If} $0 != 0

        MessageBox MB_ICONSTOP|MB_OK \
            "No se pudo configurar la base de datos de MR11.$\r$\n$\r$\nCódigo de error: $0$\r$\nVer detalle en C:\ProgramData\MR11\instalacion-error.txt"

        Abort

    ${EndIf}

    DetailPrint "Base de datos MR11 configurada correctamente."

    Delete "$INSTDIR\resources\postgresql-installer.exe"
    Delete "$INSTDIR\resources\configurar-postgres.ps1"

!macroend
