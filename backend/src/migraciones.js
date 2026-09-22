const fs = require("fs");
const path = require("path");

const pool =
  require("./db");


async function ejecutarMigraciones() {

  const cliente =
    await pool.connect();

  try {

    /*
      Tabla interna para saber
      qué migraciones ya fueron
      ejecutadas.
    */

    await cliente.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (

        id VARCHAR(255)
          PRIMARY KEY,

        aplicada_en TIMESTAMP
          NOT NULL
          DEFAULT CURRENT_TIMESTAMP

      );
    `);


    const carpetaMigraciones =
      path.join(
        __dirname,
        "..",
        "database",
        "migrations"
      );


    if (
      !fs.existsSync(
        carpetaMigraciones
      )
    ) {

      throw new Error(
        `No se encontró la carpeta de migraciones: ${carpetaMigraciones}`
      );
    }


    const archivos =
      fs
        .readdirSync(
          carpetaMigraciones
        )
        .filter(
          (archivo) =>
            archivo.endsWith(
              ".sql"
            )
        )
        .sort();


    for (
      const archivo
      of archivos
    ) {

      const consultaAplicada =
        await cliente.query(
          `
            SELECT id
            FROM schema_migrations
            WHERE id = $1
          `,
          [
            archivo,
          ]
        );


      if (
        consultaAplicada
          .rowCount > 0
      ) {

        continue;
      }


      console.log(
        `Ejecutando migración: ${archivo}`
      );


      const ruta =
        path.join(
          carpetaMigraciones,
          archivo
        );


      const sql =
        fs.readFileSync(
          ruta,
          "utf8"
        );


      const sinTransaccion =
        archivo.endsWith(".no-transaction.sql");

      try {

        // ALTER TYPE ... ADD VALUE requiere autocommit en PostgreSQL < 12.
        // Estos scripts deben ser idempotentes para admitir reintentos.
        if (sinTransaccion) {
          await cliente.query(sql);
          await cliente.query(
            "INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING",
            [archivo]
          );
          console.log(`Migración aplicada: ${archivo}`);
          continue;
        }

        await cliente.query(
          "BEGIN"
        );


        await cliente.query(
          sql
        );


        await cliente.query(
          `
            INSERT INTO schema_migrations (
              id
            )
            VALUES ($1)
          `,
          [
            archivo,
          ]
        );


        await cliente.query(
          "COMMIT"
        );


        console.log(
          `Migración aplicada: ${archivo}`
        );

      } catch (error) {

        if (!sinTransaccion) {
          await cliente.query(
            "ROLLBACK"
          );
        }

        throw error;
      }
    }


    console.log(
      "Base de datos actualizada."
    );

  } finally {

    cliente.release();
  }
}


module.exports =
  ejecutarMigraciones;
