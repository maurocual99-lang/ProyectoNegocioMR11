# Ejecutar MR11 desde Visual Studio Code en Windows

1. Instalar Node.js, Rust y PostgreSQL en la computadora de desarrollo.
2. Crear una base de datos local llamada `mr11` y comprobar que PostgreSQL esté iniciado.
3. Copiar `backend/.env.example` a `backend/.env` y completar el puerto, usuario y contraseña reales de esa computadora. Este archivo es local y no se sube a Git.
4. Desde la raíz del repositorio, ejecutar `npm run install:all` y luego `npm run dev`.

`npm run dev` inicia el backend Node y la ventana Tauri. No requiere el ejecutable auxiliar ni el instalador de PostgreSQL usados para distribuir la aplicación. Si el backend muestra `Faltan variables de configuración`, revisar `backend/.env`. Si muestra un error de conexión, comprobar el servicio, puerto y credenciales de PostgreSQL. Las migraciones crean las tablas al iniciar el backend.

## Preparar un instalador para clientes

Antes de `cd backend; npm run build:sidecar`, colocar el instalador oficial de PostgreSQL para Windows en `frontend/src-tauri/resources/postgresql-installer.exe`. Después, desde `frontend`, ejecutar `npm run tauri build -- --config src-tauri/tauri.local.conf.json` para generar un instalador de prueba sin firma de actualización. El resultado queda en `frontend/src-tauri/target/release/bundle/nsis/`.

El `tauri.conf.json` principal genera también firmas para actualizaciones automáticas. Para compilar con `npm run tauri build` sin la configuración local, hace falta `TAURI_SIGNING_PRIVATE_KEY` con la clave privada correspondiente a la clave pública configurada. No compartir ni subir esa clave privada a Git. Un `.sig` de una compilación anterior no sirve para un instalador nuevo.

El script `configurar-postgres.ps1` y el hook NSIS deben incluirse en el cambio que se comparta con quien compile el instalador. El instalador de PostgreSQL y el binario generado están ignorados por Git por su tamaño.

Si la PC ya tiene un servicio `postgresql-x64-*` de PostgreSQL 9.6 o posterior, MR11 usa esa instalación y su base `mr11` existente. Si no encuentra una contraseña válida en `C:\ProgramData\MR11\.env`, la ventana de PowerShell pide la contraseña del usuario `postgres`; no la muestra en pantalla. El script verifica la conexión antes de crear o seleccionar la base `mr11`. Si hay varias instalaciones, prefiere el puerto guardado en `.env`; sin esa configuración pide elegir el servicio que contiene la base con datos. Si también existe el servicio `postgresql-mr11`, se utiliza ese servicio; comprobar primero que esa es la base que se quiere actualizar.

Si existe la base `mr11`, el instalador crea un respaldo lógico `C:\ProgramData\MR11\respaldo-mr11-AAAAmmdd-HHMMSS.dump` con `pg_dump` antes de que el backend ejecute migraciones. Si el respaldo falla, la instalación se detiene. La migración `002_categoria_verduleria.no-transaction.sql` añade `Verduleria` a un tipo de categorías anterior sin borrar productos ni ventas. Las migraciones se ejecutan al iniciar el backend. No ejecutar `database/schema.sql` sobre una base existente: ese archivo es para instalaciones nuevas.

pgAdmin es una interfaz de administración. Actualizar pgAdmin no actualiza el servidor PostgreSQL ni el esquema de `mr11`. Si hay que cambiar de versión mayor del servidor, respaldar y restaurar la base con herramientas compatibles antes de usar la aplicación nueva. No copiar el directorio de datos entre versiones mayores ni borrar la instalación anterior hasta comprobar la restauración.

Si no hay una instalación de PostgreSQL reconocida, el instalador intenta crear una instancia separada de PostgreSQL 18 en el puerto 5433. Este camino todavía requiere una prueba en una PC sin PostgreSQL. Si la base antigua está en otra instancia o el servicio usa un nombre distinto de `postgresql-x64-*`, no se importa automáticamente: revisar el puerto y restaurar el respaldo antes de empezar a usar la aplicación nueva.

No borrar `C:\ProgramData\MR11` ni el servicio de PostgreSQL de MR11 al diagnosticar una instalación fallida: esa carpeta puede contener la base de datos del negocio.

Si el instalador muestra `Código de error: 1`, revisar `C:\ProgramData\MR11\instalacion-error.txt`. Este archivo indica el paso que falló. El instalador de PostgreSQL también crea registros en `%TEMP%`, pero pueden contener contraseñas: no compartirlos sin revisarlos y ocultar las credenciales.

Si `Get-Service postgresql-mr11` indica `Running` pero `Test-Path 'C:\ProgramData\MR11\.env'` devuelve `False`, hubo una instalación parcial. El instalador nuevo intenta recuperar localmente la contraseña del registro de PostgreSQL, verifica la conexión y completa la base. Si no puede, se detiene sin borrar el servicio ni los datos y deja el motivo en `instalacion-error.txt`.
