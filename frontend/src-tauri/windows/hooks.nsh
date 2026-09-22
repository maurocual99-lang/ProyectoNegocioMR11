!macro NSIS_HOOK_POSTINSTALL

    DetailPrint "Configurando base de datos de MR11..."

    ExecWait '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\configurar-postgres.ps1" -InstallerPath "$INSTDIR\resources\postgresql-installer.exe"' $0

    ${If} $0 != 0

        MessageBox MB_ICONSTOP|MB_OK \
            "No se pudo configurar la base de datos de MR11.$\r$\n$\r$\nCódigo de error: $0"

        Abort

    ${EndIf}

    DetailPrint "Base de datos MR11 configurada correctamente."

    Delete "$INSTDIR\resources\postgresql-installer.exe"
    Delete "$INSTDIR\resources\configurar-postgres.ps1"

!macroend