const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const dotenv = require("dotenv");


function buscarArchivoConfiguracion() {

  const posiblesRutas = [];

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
    Desarrollo normal:
    backend/.env
  */
  posiblesRutas.push(
    path.resolve(
      process.cwd(),
      ".env"
    )
  );

  /*
    También sirve al ejecutar:
    node src/index.js
  */
  posiblesRutas.push(
    path.resolve(
      __dirname,
      "..",
      ".env"
    )
  );

  /*
    Instalación del cliente.
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

  dotenv.config();

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