const db =
  require("../db");


async function obtener_productos() {

  const resultado =
    await db.query(
      `
        SELECT
          id,
          codigo_barra,
          stock,
          categoria,
          precio,
          nombre,
          tipo_venta,
          activo

        FROM producto

        WHERE
          activo = TRUE

        ORDER BY
          id ASC
      `
    );


  return resultado.rows;

}


async function buscarProducto(
  codigo_barra
) {

  const codigo =
    String(
      codigo_barra ||
      ""
    ).trim();


  if (
    !codigo
  ) {

    return null;

  }


  const resultado =
    await db.query(
      `
        SELECT *
        FROM producto

        WHERE
          codigo_barra = $1
      `,
      [
        codigo,
      ]
    );


  return resultado.rows[0] ||
    null;

}


async function buscarProductoPorCodigoExceptoId(
  codigo_barra,
  producto_id
) {

  const codigo =
    String(
      codigo_barra ||
      ""
    ).trim();


  if (
    !codigo
  ) {

    return null;

  }


  const resultado =
    await db.query(
      `
        SELECT *
        FROM producto

        WHERE
          codigo_barra = $1
          AND id <> $2
      `,
      [
        codigo,
        producto_id,
      ]
    );


  return resultado.rows[0] ||
    null;

}


async function modificarProductoPorId(
  producto_id,
  producto
) {

  const codigo =
    String(
      producto.codigo_barra ||
      ""
    ).trim() ||
    null;


  const resultado =
    await db.query(
      `
        UPDATE producto

        SET
          nombre = $1,
          precio = $2::numeric,
          stock = $3::numeric,
          codigo_barra = $4,
          categoria = $5,
          tipo_venta = $6

        WHERE
          id = $7

        RETURNING *
      `,
      [
        producto.nombre,
        producto.precio,
        producto.stock,
        codigo,
        producto.categoria,
        producto.tipo_venta,
        producto_id,
      ]
    );


  if (
    resultado.rows.length ===
    0
  ) {

    throw new Error(
      "No se encontró el producto a modificar."
    );

  }


  return resultado.rows[0];

}


async function crearProducto(
  codigo_barra,
  stock,
  categoria,
  precio,
  nombre,
  tipo_venta
) {

  const codigo =
    String(
      codigo_barra ||
      ""
    ).trim() ||
    null;


  const resultado =
    await db.query(
      `
        INSERT INTO producto (
          codigo_barra,
          stock,
          categoria,
          precio,
          nombre,
          tipo_venta
        )

        VALUES (
          $1,
          $2::numeric,
          $3,
          $4::numeric,
          $5,
          $6
        )

        RETURNING *
      `,
      [
        codigo,
        Number(
          stock
        ),
        categoria,
        Number(
          precio
        ),
        nombre,
        tipo_venta ||
        "UNIDAD",
      ]
    );


  return resultado.rows[0];

}


async function eliminarProductoPorId(
  producto_id
) {

  const resultado =
    await db.query(
      `
        UPDATE producto

        SET
          activo = FALSE

        WHERE
          id = $1

        RETURNING id
      `,
      [
        producto_id,
      ]
    );


  if (
    resultado.rows.length ===
    0
  ) {

    throw new Error(
      "No se encontró el producto a eliminar."
    );

  }


  return resultado.rows[0];

}


/*
 * Compatibilidad con código viejo que todavía elimina por código.
 */
async function eliminarProducto(
  codigo_barra
) {

  const resultado =
    await db.query(
      `
        UPDATE producto

        SET
          activo = FALSE

        WHERE
          codigo_barra = $1

        RETURNING id
      `,
      [
        codigo_barra,
      ]
    );


  return resultado.rows[0] ||
    null;

}


async function agregarStock(
  codigo_barra,
  stock
) {

  await db.query(
    `
      UPDATE producto

      SET
        stock =
          stock +
          $1::numeric,

        activo =
          TRUE

      WHERE
        codigo_barra = $2
    `,
    [
      stock,
      codigo_barra,
    ]
  );

}


module.exports = {
  obtener_productos,
  buscarProducto,
  buscarProductoPorCodigoExceptoId,
  modificarProductoPorId,
  crearProducto,
  eliminarProductoPorId,
  eliminarProducto,
  agregarStock,
};
