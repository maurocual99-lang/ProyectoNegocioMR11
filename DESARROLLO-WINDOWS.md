# Ejecutar MR11 desde Visual Studio Code en Windows

1. Instalar Node.js, Rust y PostgreSQL en la computadora de desarrollo.
2. Crear una base de datos local llamada `mr11` y comprobar que PostgreSQL esté iniciado.
3. Copiar `backend/.env.example` a `backend/.env` y completar el puerto, usuario y contraseña reales de esa computadora. Este archivo es local y no se sube a Git.
4. Desde la raíz del repositorio, ejecutar `npm run install:all` y luego `npm run dev`.

`npm run dev` inicia el backend Node y la ventana Tauri. No requiere el ejecutable auxiliar ni el instalador de PostgreSQL usados para distribuir la aplicación. Si el backend muestra `Faltan variables de configuración`, revisar `backend/.env`. Si muestra un error de conexión, comprobar el servicio, puerto y credenciales de PostgreSQL. Las migraciones crean las tablas al iniciar el backend.

## Preparar un instalador para clientes

Antes de `cd backend; npm run build:sidecar` y `cd ../frontend; npm run tauri build`, colocar el instalador oficial de PostgreSQL para Windows en `frontend/src-tauri/resources/postgresql-installer.exe`. El script `configurar-postgres.ps1` y el hook NSIS deben incluirse en el cambio que se comparta con quien compile el instalador. El instalador de PostgreSQL y el binario generado están ignorados por Git por su tamaño.

No borrar `C:\ProgramData\MR11` ni el servicio de PostgreSQL de MR11 al diagnosticar una instalación fallida: esa carpeta puede contener la base de datos del negocio.
