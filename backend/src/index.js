const express =
  require("express");

const cors =
  require("cors");

const pool =
  require("./db");

const ejecutarMigraciones =
  require("./migraciones");


const app =
  express();


app.use(
  cors()
);


app.use(
  express.json()
);


/* =========================================================
   HEALTH
========================================================= */

app.get(
  "/health",
  (
    req,
    res
  ) => {

    res.json({
      ok: true,
      servicio:
        "MR11 Backend",
    });
  }
);


app.get(
  "/",
  (
    req,
    res
  ) => {

    res.json({
      mensaje:
        "Backend MR11 funcionando correctamente",
    });
  }
);


/* =========================================================
   RUTAS
========================================================= */

const reporteRouter =
  require(
    "./routes/reporte"
  );


const productosRouter =
  require(
    "./routes/producto"
  );


const ventaRouter =
  require(
    "./routes/venta"
  );


const deudoresRouter =
  require(
    "./routes/clienteDeudor"
  );


const inicioRouter =
  require(
    "./routes/inicio"
  );


app.use(
  "/productos",
  productosRouter
);


app.use(
  "/ventas",
  ventaRouter
);


app.use(
  "/deudores",
  deudoresRouter
);


app.use(
  "/reportes",
  reporteRouter
);


app.use(
  "/inicio",
  inicioRouter
);


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const PORT =
  Number(
    process.env.PORT ||
    3000
  );


const HOST =
  "127.0.0.1";


let servidor = null;


/* =========================================================
   PID DE TAURI
========================================================= */

function obtenerPidPadre() {

  const indice =
    process.argv.indexOf(
      "--parent-pid"
    );


  if (
    indice === -1
  ) {

    return null;
  }


  const valor =
    Number(
      process.argv[
        indice + 1
      ]
    );


  if (
    !Number.isInteger(
      valor
    )
  ) {

    return null;
  }


  return valor;
}


/* =========================================================
   CIERRE LIMPIO
========================================================= */

let cerrando =
  false;


async function cerrarAplicacion(
  motivo
) {

  if (cerrando) {
    return;
  }


  cerrando = true;


  console.log(
    `Cerrando backend: ${motivo}`
  );


  try {

    if (servidor) {

      await new Promise(
        (
          resolve
        ) => {

          servidor.close(
            resolve
          );
        }
      );
    }

  } catch (error) {

    console.error(
      "Error cerrando servidor:",
      error
    );
  }


  try {

    await pool.end();

  } catch (error) {

    console.error(
      "Error cerrando PostgreSQL:",
      error
    );
  }


  process.exit(0);
}


/* =========================================================
   ARRANQUE
========================================================= */

async function iniciar() {

  try {

    /*
      Verifica PostgreSQL.
    */

    await pool.query(
      "SELECT 1"
    );


    console.log(
      "Conectado a PostgreSQL"
    );


    /*
      Ejecuta actualizaciones de BD.
    */

    await ejecutarMigraciones();


    servidor =
      app.listen(
        PORT,
        HOST,
        () => {

          console.log(
            `Servidor iniciado en http://${HOST}:${PORT}`
          );
        }
      );


    servidor.on(
      "error",
      (
        error
      ) => {

        if (
          error.code ===
          "EADDRINUSE"
        ) {

          console.error(
            `El puerto ${PORT} ya está siendo utilizado.`
          );

        } else {

          console.error(
            "Error del servidor:",
            error
          );
        }


        process.exit(1);
      }
    );


    /*
      Si Tauri desaparece,
      apagamos también
      el backend.
    */

    const pidPadre =
      obtenerPidPadre();


    if (pidPadre) {

      const intervalo =
        setInterval(
          () => {

            try {

              process.kill(
                pidPadre,
                0
              );

            } catch {

              clearInterval(
                intervalo
              );


              void cerrarAplicacion(
                "la aplicación principal se cerró"
              );
            }

          },
          3000
        );


      intervalo.unref();
    }

  } catch (error) {

    console.error(
      "No se pudo iniciar MR11:",
      error
    );


    process.exit(1);
  }
}


/* =========================================================
   SEÑALES
========================================================= */

process.on(
  "SIGINT",
  () => {

    void cerrarAplicacion(
      "SIGINT"
    );
  }
);


process.on(
  "SIGTERM",
  () => {

    void cerrarAplicacion(
      "SIGTERM"
    );
  }
);


void iniciar();