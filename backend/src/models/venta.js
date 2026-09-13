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
            p.nombre,
            p.tipo_venta

        FROM detalle_venta dv

        JOIN producto p
            ON p.id = dv.producto_id

        WHERE dv.venta_id = $1

        ORDER BY dv.id
        `,
        [venta_id]
    );


    const detalle =
        detalleResult.rows.map(item => ({
            ...item,
            cantidad: Number(item.cantidad),
            precio_unitario:
                Number(item.precio_unitario),
            subtotal:
                Number(item.subtotal)
        }));


    const total =
        detalle.reduce(
            (acc, item) =>
                acc + item.subtotal,
            0
        );


    const cantidadProductos =
        detalle.length;


    const cantidadUnidades =
        detalle
            .filter(
                item =>
                    item.tipo_venta ===
                    "UNIDAD"
            )
            .reduce(
                (acc, item) =>
                    acc + item.cantidad,
                0
            );


    const pesoTotalKg =
        detalle
            .filter(
                item =>
                    item.tipo_venta ===
                    "PESO"
            )
            .reduce(
                (acc, item) =>
                    acc + item.cantidad,
                0
            );


    return {
        detalle,
        total,
        cantidadProductos,
        cantidadUnidades,
        pesoTotalKg
    };
}

async function agregarProductoPorPeso(
    venta_id,
    producto_id,
    cantidad_kg
) {

    const cantidad =
        Number(cantidad_kg);


    if (
        !Number.isFinite(cantidad) ||
        cantidad <= 0
    ) {
        return {
            error:
                "El peso ingresado no es válido.",
            ...(await obtenerResumen(venta_id))
        };
    }


    const productoResult =
        await db.query(
            `
            SELECT *
            FROM producto
            WHERE id = $1
              AND activo = TRUE
            `,
            [producto_id]
        );


    const producto =
        productoResult.rows[0];


    if (!producto) {
        return {
            error:
                "No se encontró el producto."
        };
    }


    if (
        producto.tipo_venta !==
        "PESO"
    ) {
        return {
            error:
                "Este producto no se vende por peso."
        };
    }


    if (
        cantidad >
        Number(producto.stock)
    ) {
        return {
            error:
                `Stock insuficiente de "${producto.nombre}".`,
            ...(await obtenerResumen(venta_id))
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
                producto_id
            ]
        );


    if (
        existente.rows.length > 0
    ) {

        await db.query(
            `
            UPDATE detalle_venta
            SET
                cantidad = $1,
                subtotal =
                    ROUND(
                        ($1 * precio_unitario)::numeric,
                        2
                    )
            WHERE venta_id = $2
              AND producto_id = $3
            `,
            [
                cantidad,
                venta_id,
                producto_id
            ]
        );

    } else {

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
                $3,
                $4,
                ROUND(($3 * $4)::numeric, 2)
            )
            `,
            [
                venta_id,
                producto_id,
                cantidad,
                producto.precio
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

  if (
      producto.tipo_venta === "PESO"
  ) {
      return {
          existe: true,
          error:
              `"${producto.nombre}" se vende por peso. Ingresá el peso manualmente.`,
          ...(await obtenerResumen(venta_id))
      };
  }
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

    const resultado =
        await db.query(
            `
            SELECT
                v.id,
                v.fecha_venta,
                v.total,
                v.saldo_pendiente,

                (
                    v.total -
                    v.saldo_pendiente
                ) AS total_pagado

            FROM venta v

            WHERE
                v.cliente_id = $1

                AND
                v.saldo_pendiente > 0

            ORDER BY
                v.fecha_venta ASC
            `,
            [cliente_id]
        );


    const ventas =
        resultado.rows;


    for (
        const venta of ventas
    ) {

        const detalles =
            await db.query(
                `
                SELECT
                    dv.id,
                    dv.producto_id,
                    p.nombre
                        AS producto_nombre,
                    p.tipo_venta,
                    dv.cantidad,
                    dv.precio_unitario,
                    dv.subtotal

                FROM detalle_venta dv

                JOIN producto p
                    ON p.id =
                       dv.producto_id

                WHERE
                    dv.venta_id = $1

                ORDER BY
                    dv.id ASC
                `,
                [venta.id]
            );


        venta.total =
            Number(
                venta.total
            );

        venta.saldo_pendiente =
            Number(
                venta.saldo_pendiente
            );

        venta.total_pagado =
            Number(
                venta.total_pagado
            );

        venta.detalles =
            detalles.rows;

    }


    return ventas;
}

// Marca ventas como pagadas
async function registrarPago(
    cliente_id,
    aplicaciones
) {

    const client =
        await db.connect();


    try {

        await client.query(
            "BEGIN"
        );


        if (
            !Array.isArray(
                aplicaciones
            ) ||
            aplicaciones.length === 0
        ) {
            throw new Error(
                "No se seleccionaron ventas."
            );
        }


        let totalPago = 0;


        /*
         * Primero validamos absolutamente todo
         * antes de guardar el pago.
         */
        const ventasValidadas =
            [];


        for (
            const aplicacion
            of aplicaciones
        ) {

            const ventaResult =
                await client.query(
                    `
                    SELECT
                        id,
                        cliente_id,
                        total,
                        saldo_pendiente

                    FROM venta

                    WHERE id = $1

                    FOR UPDATE
                    `,
                    [
                        aplicacion
                            .venta_id
                    ]
                );


            const venta =
                ventaResult.rows[0];


            if (!venta) {
                throw new Error(
                    "Una de las ventas no existe."
                );
            }


            if (
                Number(
                    venta.cliente_id
                )
                !==
                Number(cliente_id)
            ) {
                throw new Error(
                    "La venta no pertenece al cliente."
                );
            }


            const saldo =
                Number(
                    venta
                        .saldo_pendiente
                );


            const monto =
                Number(
                    aplicacion.monto
                );


            if (
                !Number.isFinite(
                    monto
                ) ||
                monto <= 0
            ) {
                throw new Error(
                    "El monto del pago no es válido."
                );
            }


            if (
                monto >
                saldo
            ) {
                throw new Error(
                    `El pago de la venta #${venta.id} supera su saldo pendiente.`
                );
            }


            totalPago +=
                monto;


            ventasValidadas.push({
                venta,
                monto
            });

        }


        const pagoResult =
            await client.query(
                `
                INSERT INTO pago (
                    cliente_id,
                    total
                )
                VALUES ($1, $2)
                RETURNING *
                `,
                [
                    cliente_id,
                    totalPago
                ]
            );


        const pago =
            pagoResult.rows[0];


        for (
            const item
            of ventasValidadas
        ) {

            await client.query(
                `
                INSERT INTO pago_venta (
                    pago_id,
                    venta_id,
                    importe
                )
                VALUES ($1, $2, $3)
                `,
                [
                    pago.id,
                    item.venta.id,
                    item.monto
                ]
            );


            await client.query(
                `
                UPDATE venta

                SET
                    saldo_pendiente =
                        saldo_pendiente
                        -
                        $1,

                    cuenta_pendiente =
                        (
                            saldo_pendiente
                            -
                            $1
                        ) > 0

                WHERE id = $2
                `,
                [
                    item.monto,
                    item.venta.id
                ]
            );

        }


        await client.query(
            "COMMIT"
        );


        return {
            pago_id:
                pago.id,

            total:
                totalPago,

            fecha_pago:
                pago.fecha_pago
        };


    } catch (error) {

        await client.query(
            "ROLLBACK"
        );

        throw error;


    } finally {

        client.release();

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

async function obtenerHistorialCliente(
    cliente_id
) {

    const movimientos =
        await db.query(
            `
            SELECT *
            FROM (

                SELECT
                    v.fecha_venta
                        AS fecha,

                    'VENTA'
                        AS tipo,

                    v.id
                        AS referencia_id,

                    v.total
                        AS importe,

                    v.saldo_pendiente
                        AS saldo_pendiente

                FROM venta v

                WHERE
                    v.cliente_id = $1

                    AND
                    v.cuenta_pendiente
                    IS NOT NULL


                UNION ALL


                SELECT
                    p.fecha_pago
                        AS fecha,

                    'PAGO'
                        AS tipo,

                    p.id
                        AS referencia_id,

                    p.total
                        AS importe,

                    NULL
                        AS saldo_pendiente

                FROM pago p

                WHERE
                    p.cliente_id = $1

            ) movimientos

            ORDER BY
                fecha DESC,
                referencia_id DESC
            `,
            [cliente_id]
        );


    return movimientos.rows.map(
        movimiento => ({
            ...movimiento,

            importe:
                Number(
                    movimiento.importe
                ),

            saldo_pendiente:
                movimiento
                    .saldo_pendiente ===
                    null
                    ? null
                    : Number(
                        movimiento
                            .saldo_pendiente
                    )
        })
    );
}
module.exports = {
    crearVentaVacia,
    obtenerResumen,
    agregarProductoAVenta,
    agregarProductoPorPeso,
    actualizarCantidad,
    eliminarProductoDeVenta,
    finalizarVenta,
    obtenerDeudasPorCliente,
    registrarPago,
    obtenerClientesConDeuda,
    asociarCliente,
    quitarCliente,
    obtenerHistorialCliente
};
