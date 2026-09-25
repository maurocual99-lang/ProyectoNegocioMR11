# Publicar una actualización de MR11

La aplicación ya consulta la última release de GitHub al iniciarse. Para que una
versión nueva aparezca en la computadora del negocio, la release debe contener el
instalador, su firma y un `latest.json` válido.

## Forma simple (recomendada)

Desde la carpeta principal del proyecto ejecutar un solo comando, cambiando el
número y la descripción:

```powershell
npm run actualizar -- 0.2.1 "Modal de productos más compacto."
```

El comando actualiza la versión, ejecuta las pruebas, empaqueta el backend,
regenera los recursos, construye el instalador, solicita la contraseña de firma
y crea `latest.json`. Al finalizar solamente quedan por subir los tres archivos
indicados a la release de GitHub con la etiqueta del mismo número (`v0.2.1`).

Los pasos siguientes explican el mismo proceso por separado y sirven para
diagnóstico si el comando automático informa un error.

## Accesos que necesita la persona que publica

- Permiso para subir cambios y crear releases en
  `maurocual99-lang/ProyectoNegocioMR11`.
- La misma clave privada de Tauri que corresponde a la clave pública incluida en
  `frontend/src-tauri/tauri.conf.json`.
- La contraseña de esa clave, si fue creada con contraseña.

La clave privada no se envía por chat, no se guarda en este repositorio y no se
incluye en el instalador. Si se pierde, las instalaciones existentes no aceptarán
actualizaciones firmadas con otra clave.

## Flujo para cada versión

1. Guardar los cambios de código y probarlos con `npm run dev`.
2. Desde la raíz, elegir un número superior al instalado:

   ```powershell
   npm run version:app -- 0.1.2
   ```

3. Volver a generar el backend que se incluye en la aplicación:

   ```powershell
   cd backend
   npm run build:sidecar
   cd ..\frontend
   npm run installer:assets
   ```

4. Confirmar que existe
   `frontend/src-tauri/resources/postgresql-installer.exe` y cargar la clave solo
   en esa terminal:

   ```powershell
   $env:TAURI_SIGNING_PRIVATE_KEY="C:\ruta-segura\mr11.key"
   $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD="contraseña-de-la-clave"
   npm run tauri build
   ```

   Para una clave sin contraseña, usar una cadena vacía en la segunda variable.
   No usar `tauri.local.conf.json`: esa configuración es solo para instaladores de
   prueba y desactiva la firma de actualización.

5. Regresar a la raíz y generar el manifiesto. El texto entre comillas es lo que
   verá la persona usuaria como novedades:

   ```powershell
   cd ..
   npm run release:manifest -- "Nuevo resumen de caja y correcciones de stock."
   ```

   Si el instalador ya fue compilado pero falta firmarlo, usar este comando. La
   contraseña se pide de forma oculta y no queda escrita en el historial:

   ```powershell
   npm run release:sign -- -Notas "Nuevo resumen de caja y correcciones de stock."
   ```

   Este comando crea tanto el archivo `.sig` como `latest.json`.

6. En GitHub, crear una release pública (no borrador ni prerelease) con la etiqueta
   `v0.1.2`. Adjuntar desde `frontend/src-tauri/target/release/bundle/nsis/`:

   - `MR11_0.1.2_x64-setup.exe`
   - `MR11_0.1.2_x64-setup.exe.sig`
   - `latest.json`

7. Publicar la release. Al próximo inicio, una instalación con versión anterior
   mostrará la ventana de actualización de MR11.

## Reglas importantes

- El número debe aumentar en cada publicación (`0.1.1` → `0.1.2`).
- Los tres archivos deben provenir de la misma compilación.
- No reutilizar una firma `.sig` anterior.
- Antes de publicar para el negocio, instalar y abrir esa versión en una PC de
  prueba. Las migraciones conservan los datos, pero el instalador crea un respaldo
  antes de aplicarlas.
- Los cambios de interfaz se publican con el frontend; los cambios del servidor o
  de base de datos requieren volver a ejecutar `npm run build:sidecar`.
