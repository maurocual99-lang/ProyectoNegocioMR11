const db = require("../db");

// Crea la venta vacía apenas se entra a la pantalla de venta
async function crearVentaVacia(
  cliente_id,
  cuenta_pendiente
) {
  const resultado = await db.query(
    `
      INSERT INTO venta (
        total,
        cliente_id,
        cuenta_pendiente,
        finalizada
      )
      VALUES (0, $1, $2, FALSE)
      RETURNING
        id,
        fecha_venta,
        total,
        cliente_id,
        cuenta_pendiente,
        finalizada
    `,
    [
      cliente_id || null,
      cuenta_pendiente || false,
    ]
  );

  return resultado.rows[0];
}


// Trae la venta con su detalle, para armar el resumen
async function obtenerResumen(venta_id) {
  const detalleResult = await db.query(
    `
      SELECT
        dv.producto_id,
        dv.cantidad,
        dv.precio_unitario,
        dv.subtotal,
        p.nombre
      FROM detalle_venta dv
      JOIN producto p
        ON p.id = dv.producto_id
      WHERE dv.venta_id = $1
      ORDER BY dv.id
    `,
    [venta_id]
  );

  const detalle =
    detalleResult.rows;

  const total =
    detalle.reduce(
      (acc, item) =>
        acc + Number(item.subtotal),
      0
    );

  const cantidadProductos =
    detalle.length;

  const cantidadUnidades =
    detalle.reduce(
      (acc, item) =>
        acc + item.cantidad,
      0
    );

  return {
    detalle,
    total,
    cantidadProductos,
    cantidadUnidades,
  };
}


// Recalcula y actualiza el total
async function actualizarTotalVenta(
  venta_id
) {
  await db.query(
    `
      UPDATE venta
      SET total = (
        SELECT COALESCE(
          SUM(subtotal),
          0
        )
        FROM detalle_venta
        WHERE venta_id = $1
      )
      WHERE id = $1
    `,
    [venta_id]
  );
}


// ESCANEAR
async function agregarProductoAVenta(
  venta_id,
  codigo_barra
) {
  const productoResult =
    await db.query(
      `
        SELECT *
        FROM producto
        WHERE codigo_barra = $1
          AND activo = TRUE
      `,
      [codigo_barra]
    );

  const producto =
    productoResult.rows[0];

  if (!producto) {
    return {
      existe: false,
    };
  }

  const existente =
    await db.query(
      `
        SELECT *
        FROM detalle_venta
        WHERE venta_id = $1
          AND producto_id = $2
      `,
      [
        venta_id,
        producto.id,
      ]
    );

  if (
    existente.rows.length > 0
  ) {
    const nuevaCantidad =
      existente.rows[0].cantidad + 1;

    if (
      nuevaCantidad >
      producto.stock
    ) {
      return {
        existe: true,
        error:
          `No hay más stock de "${producto.nombre}"`,
        ...(await obtenerResumen(
          venta_id
        )),
      };
    }

    await db.query(
      `
        UPDATE detalle_venta
        SET
          cantidad = $1::int,
          subtotal =
            $1::int * precio_unitario
        WHERE venta_id = $2
          AND producto_id = $3
      `,
      [
        nuevaCantidad,
        venta_id,
        producto.id,
      ]
    );

  } else {

    if (
      producto.stock < 1
    ) {
      return {
        existe: true,
        error:
          `"${producto.nombre}" no tiene stock disponible`,
        ...(await obtenerResumen(
          venta_id
        )),
      };
    }

    await db.query(
      `
        INSERT INTO detalle_venta (
          venta_id,
          producto_id,
          cantidad,
          precio_unitario,
          subtotal
        )
        VALUES (
          $1,
          $2,
          1,
          $3,
          $3
        )
      `,
      [
        venta_id,
        producto.id,
        producto.precio,
      ]
    );
  }

  await actualizarTotalVenta(
    venta_id
  );

  return {
    existe: true,
    ...(await obtenerResumen(
      venta_id
    )),
  };
}


// Botones +/-
async function actualizarCantidad(
  venta_id,
  producto_id,
  delta
) {
  const productoResult =
    await db.query(
      `
        SELECT stock, nombre
        FROM producto
        WHERE id = $1
      `,
      [producto_id]
    );

  const producto =
    productoResult.rows[0];

  const detalleResult =
    await db.query(
      `
        SELECT cantidad
        FROM detalle_venta
        WHERE venta_id = $1
          AND producto_id = $2
      `,
      [
        venta_id,
        producto_id,
      ]
    );

  if (
    detalleResult.rows.length ===
    0
  ) {
    return {
      error:
        "El producto no está en esta venta",
      ...(await obtenerResumen(
        venta_id
      )),
    };
  }

  const nuevaCantidad =
    detalleResult.rows[0]
      .cantidad + delta;

  if (
    nuevaCantidad <= 0
  ) {
    await db.query(
      `
        DELETE FROM detalle_venta
        WHERE venta_id = $1
          AND producto_id = $2
      `,
      [
        venta_id,
        producto_id,
      ]
    );

  } else if (
    nuevaCantidad >
    producto.stock
  ) {

    return {
      error:
        `No hay más stock de "${producto.nombre}"`,
      ...(await obtenerResumen(
        venta_id
      )),
    };

  } else {

    await db.query(
      `
        UPDATE detalle_venta
        SET
          cantidad = $1::int,
          subtotal =
            $1::int * precio_unitario
        WHERE venta_id = $2
          AND producto_id = $3
      `,
      [
        nuevaCantidad,
        venta_id,
        producto_id,
      ]
    );
  }

  await actualizarTotalVenta(
    venta_id
  );

  return await obtenerResumen(
    venta_id
  );
}


// Basurero
async function eliminarProductoDeVenta(
  venta_id,
  producto_id
) {
  await db.query(
    `
      DELETE FROM detalle_venta
      WHERE venta_id = $1
        AND producto_id = $2
    `,
    [
      venta_id,
      producto_id,
    ]
  );

  await actualizarTotalVenta(
    venta_id
  );

  return await obtenerResumen(
    venta_id
  );
}


// FINALIZAR VENTA
async function finalizarVenta(
  venta_id
) {
  const client =
    await db.connect();

  try {
    await client.query(
      "BEGIN"
    );

    /*
     * Bloqueamos la venta para evitar
     * finalizar dos veces y descontar
     * stock nuevamente.
     */
    const ventaResult =
      await client.query(
        `
          SELECT
            id,
            finalizada
          FROM venta
          WHERE id = $1
          FOR UPDATE
        `,
        [venta_id]
      );

    if (
      ventaResult.rows.length === 0
    ) {
      throw new Error(
        "La venta no existe."
      );
    }

    if (
      ventaResult.rows[0]
        .finalizada
    ) {
      throw new Error(
        "La venta ya fue finalizada."
      );
    }

    const detalleResult =
      await client.query(
        `
          SELECT
            producto_id,
            cantidad
          FROM detalle_venta
          WHERE venta_id = $1
        `,
        [venta_id]
      );

    if (
      detalleResult.rows.length ===
      0
    ) {
      throw new Error(
        "La venta no tiene productos."
      );
    }

    for (
      const item of
      detalleResult.rows
    ) {
      const resultado =
        await client.query(
          `
            UPDATE producto
            SET stock =
              stock - $1
            WHERE id = $2
              AND stock >= $1
          `,
          [
            item.cantidad,
            item.producto_id,
          ]
        );

      if (
        resultado.rowCount === 0
      ) {
        throw new Error(
          `Stock insuficiente para el producto id ${item.producto_id}`
        );
      }
    }

    /*
    * ESTO YA LO TENÉS BIEN
    */
    await client.query(
      `
        UPDATE venta
        SET finalizada = TRUE
        WHERE id = $1
      `,
      [venta_id]
    );

    await client.query(
      "COMMIT"
    );

  } catch (error) {

    await client.query(
      "ROLLBACK"
    );

    throw error;

  } finally {

    client.release();
  }

  return await obtenerResumen(
    venta_id
  );
}


// Buscar deudas de un cliente
async function obtenerDeudasPorCliente(
  cliente_id
) {
  try {
    const queryVentas = `
      SELECT
        id,
        fecha_venta,
        total
      FROM venta
      WHERE cliente_id = $1
        AND cuenta_pendiente = true
        AND finalizada = true
      ORDER BY fecha_venta ASC;
    `;

    const resultadoVentas =
      await db.query(
        queryVentas,
        [cliente_id]
      );

    const ventas =
      resultadoVentas.rows;

    for (
      let venta of ventas
    ) {
      const queryDetalles = `
        SELECT
          dv.id,
          dv.producto_id,
          p.nombre
            AS producto_nombre,
          dv.cantidad,
          dv.precio_unitario,
          dv.subtotal
        FROM detalle_venta dv
        JOIN producto p
          ON p.id =
            dv.producto_id
        WHERE dv.venta_id = $1
        ORDER BY dv.id ASC;
      `;

      const resultadoDetalles =
        await db.query(
          queryDetalles,
          [venta.id]
        );

      venta.detalles =
        resultadoDetalles.rows;
    }

    return ventas;

  } catch (error) {

    console.error(
      "Error al obtener deudas:",
      error
    );

    throw error;
  }
}


// Marca ventas como pagadas
async function pagarVentas(
  ventas_ids
) {
  try {
    const query = `
      UPDATE venta
      SET cuenta_pendiente = false
      WHERE id = ANY($1::int[])
        AND finalizada = true
      RETURNING *;
    `;

    const resultado =
      await db.query(
        query,
        [ventas_ids]
      );

    return resultado.rows;

  } catch (error) {

    console.error(
      "Error al pagar ventas:",
      error
    );

    throw error;
  }
}


// Clientes con deuda
async function obtenerClientesConDeuda() {
  try {
    const query = `
      SELECT DISTINCT
        c.id,
        c.nombre,
        c.apellido,
        c.apodo
      FROM cliente c
      JOIN venta v
        ON c.id =
          v.cliente_id
      WHERE v.cuenta_pendiente =
        true
        AND v.finalizada = true
      ORDER BY c.apellido ASC;
    `;

    const resultado =
      await db.query(query);

    return resultado.rows;

  } catch (error) {

    console.error(
      "Error al obtener clientes con deuda:",
      error
    );

    throw error;
  }
}


async function asociarCliente(
  venta_id,
  cliente_id
) {
  await db.query(
    `
      UPDATE venta
      SET
        cliente_id = $1,
        cuenta_pendiente = TRUE
      WHERE id = $2
    `,
    [
      cliente_id,
      venta_id,
    ]
  );

  return await obtenerResumen(
    venta_id
  );
}


async function quitarCliente(
  venta_id
) {
  await db.query(
    `
      UPDATE venta
      SET
        cliente_id = NULL,
        cuenta_pendiente = FALSE
      WHERE id = $1
    `,
    [venta_id]
  );

  return await obtenerResumen(
    venta_id
  );
}


module.exports = {
  crearVentaVacia,
  obtenerResumen,
  agregarProductoAVenta,
  actualizarCantidad,
  eliminarProductoDeVenta,
  finalizarVenta,
  obtenerDeudasPorCliente,
  pagarVentas,
  obtenerClientesConDeuda,
  asociarCliente,
  quitarCliente,
};
