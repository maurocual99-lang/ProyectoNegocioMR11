const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const dotenv = require("dotenv");


function buscarArchivoConfiguracion() {

  const posiblesRutas = [];
  const esEjecutableEmpaquetado =
    Boolean(process.pkg);

  /*
    Permite indicar una ruta manualmente
    si alguna vez lo necesitamos.
  */
  if (process.env.MR11_CONFIG_PATH) {
    posiblesRutas.push(
      process.env.MR11_CONFIG_PATH
    );
  }

  /*
    El ejecutable distribuido debe usar siempre la configuración creada por
    el instalador. Nunca debe leer el .env de desarrollo que pkg pudiera
    haber incluido dentro de C:\snapshot.
  */
  if (
    esEjecutableEmpaquetado &&
    process.env.PROGRAMDATA
  ) {

    posiblesRutas.push(
      path.join(
        process.env.PROGRAMDATA,
        "MR11",
        ".env"
      )
    );
  }

  /*
    Desarrollo normal: backend/.env.
  */
  if (!esEjecutableEmpaquetado) {

    posiblesRutas.push(
      path.resolve(
        process.cwd(),
        ".env"
      )
    );

    /*
      Como respaldo para desarrollo, permite usar la configuración de una
      instalación local si backend/.env no existe.
    */
    if (process.env.PROGRAMDATA) {

      posiblesRutas.push(
        path.join(
          process.env.PROGRAMDATA,
          "MR11",
          ".env"
        )
      );
    }
  }

  for (
    const ruta of posiblesRutas
  ) {

    if (
      ruta &&
      fs.existsSync(ruta)
    ) {

      dotenv.config({
        path: ruta,
      });

      console.log(
        `Configuración cargada desde: ${ruta}`
      );

      return ruta;
    }
  }

  if (!esEjecutableEmpaquetado) {
    dotenv.config();
  }

  return null;
}


buscarArchivoConfiguracion();


const requeridas = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
];


const faltantes =
  requeridas.filter(
    (variable) =>
      !process.env[variable]
  );


if (faltantes.length > 0) {

  throw new Error(
    `Faltan variables de configuración: ${faltantes.join(
      ", "
    )}`
  );
}


const pool = new Pool({

  host:
    process.env.DB_HOST,

  port:
    Number(
      process.env.DB_PORT
    ),

  database:
    process.env.DB_NAME,

  user:
    process.env.DB_USER,

  password:
    process.env.DB_PASSWORD,

});


module.exports = pool;
