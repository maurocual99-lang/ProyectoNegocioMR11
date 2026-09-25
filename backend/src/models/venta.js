const db = require("../db");

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function esCategoriaPorPeso(categoria) {
  return [
    "verduleria",
    "verduras",
    "frutas",
    "frutas y verduras",
    "fiambres",
  ].includes(normalizarTexto(categoria));
}

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
        finalizada,
        saldo_pendiente
      )
      VALUES (
        0,
        $1,
        $2,
        FALSE,
        0
      )
      RETURNING
        id,
        fecha_venta,
        total,
        cliente_id,
        cuenta_pendiente,
        finalizada,
        saldo_pendiente
    `,
    [
      cliente_id || null,
      Boolean(
        cuenta_pendiente
      ),
    ]
  );

  return resultado.rows[0];
}

async function obtenerResumen(
  venta_id
) {
  const resultado =
    await db.query(
      `
        SELECT
          dv.producto_id,
          dv.cantidad,
          dv.precio_unitario,
          dv.subtotal,
          p.nombre,

          CASE
            WHEN
              COALESCE(
                p.tipo_venta::text,
                'UNIDAD'
              ) = 'PESO'

              OR

              LOWER(
                TRANSLATE(
                  COALESCE(
                    p.categoria::text,
                    ''
                  ),
                  'áéíóúÁÉÍÓÚ',
                  'aeiouAEIOU'
                )
              ) IN (
                'verduleria',
                'verduras',
                'frutas',
                'frutas y verduras',
                'fiambres'
              )

            THEN 'PESO'
            ELSE 'UNIDAD'
          END AS tipo_venta

        FROM detalle_venta dv

        JOIN producto p
          ON p.id =
             dv.producto_id

        WHERE
          dv.venta_id = $1

        ORDER BY
          dv.id
      `,
      [
        venta_id,
      ]
    );

  const detalle =
    resultado.rows.map(
      (item) => ({
        ...item,

        cantidad:
          Number(
            item.cantidad
          ),

        precio_unitario:
          Number(
            item.precio_unitario
          ),

        subtotal:
          Number(
            item.subtotal
          ),
      })
    );

  const total =
    detalle.reduce(
      (
        acumulado,
        item
      ) =>
        acumulado +
        item.subtotal,
      0
    );

  const cantidadProductos =
    detalle.length;

  const cantidadUnidades =
    detalle
      .filter(
        (item) =>
          item.tipo_venta ===
          "UNIDAD"
      )
      .reduce(
        (
          acumulado,
          item
        ) =>
          acumulado +
          item.cantidad,
        0
      );

  const pesoTotalKg =
    detalle
      .filter(
        (item) =>
          item.tipo_venta ===
          "PESO"
      )
      .reduce(
        (
          acumulado,
          item
        ) =>
          acumulado +
          item.cantidad,
        0
      );

  return {
    detalle,
    total,
    cantidadProductos,
    cantidadUnidades,
    pesoTotalKg,
  };
}

async function actualizarTotalVenta(
  venta_id,
  client = db
) {
  await client.query(
    `
      UPDATE venta
      SET total = (
        SELECT
          COALESCE(
            SUM(
              subtotal
            ),
            0
          )
        FROM detalle_venta
        WHERE
          venta_id = $1
      )
      WHERE
        id = $1
    `,
    [
      venta_id,
    ]
  );
}

async function agregarProductoAVenta(
  venta_id,
  codigo_barra
) {
  const resultado =
    await db.query(
      `
        SELECT *
        FROM producto
        WHERE
          codigo_barra = $1
          AND activo = TRUE
      `,
      [
        codigo_barra,
      ]
    );

  const producto =
    resultado.rows[0];

  if (!producto) {
    return {
      existe: false,
      ...(await obtenerResumen(
        venta_id
      )),
    };
  }

  const porPeso =
    String(
      producto.tipo_venta ||
        "UNIDAD"
    ) ===
      "PESO" ||
    esCategoriaPorPeso(
      producto.categoria
    );

  if (porPeso) {
    return {
      existe: true,

      error:
        `"${producto.nombre}" se vende por peso. ` +
        `Usá el botón "Producto por peso".`,

      ...(await obtenerResumen(
        venta_id
      )),
    };
  }

  const existente =
    await db.query(
      `
        SELECT
          cantidad
        FROM detalle_venta
        WHERE
          venta_id = $1
          AND producto_id = $2
      `,
      [
        venta_id,
        producto.id,
      ]
    );

  const actual =
    existente.rows.length >
    0
      ? Number(
          existente
            .rows[0]
            .cantidad
        )
      : 0;

  const nuevaCantidad =
    actual + 1;

  if (
    nuevaCantidad >
    Number(
      producto.stock
    )
  ) {
    return {
      existe: true,

      error:
        `Stock insuficiente de "${producto.nombre}".`,

      ...(await obtenerResumen(
        venta_id
      )),
    };
  }

  if (
    existente.rows.length >
    0
  ) {
    await db.query(
      `
        UPDATE detalle_venta
        SET
          cantidad =
            $1::numeric,

          subtotal =
            ROUND(
              (
                $1::numeric
                *
                precio_unitario::numeric
              ),
              2
            )

        WHERE
          venta_id = $2
          AND producto_id = $3
      `,
      [
        nuevaCantidad,
        venta_id,
        producto.id,
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
          1::numeric,
          $3::numeric,
          ROUND(
            $3::numeric,
            2
          )
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

async function agregarProductoPorPeso(
  venta_id,
  producto_id,
  cantidad_kg
) {
  const cantidad =
    Number(
      cantidad_kg
    );

  if (
    !Number.isFinite(
      cantidad
    ) ||
    cantidad <= 0
  ) {
    return {
      error:
        "El peso ingresado no es válido.",

      ...(await obtenerResumen(
        venta_id
      )),
    };
  }

  const resultado =
    await db.query(
      `
        SELECT *
        FROM producto
        WHERE
          id = $1
          AND activo = TRUE
      `,
      [
        producto_id,
      ]
    );

  const producto =
    resultado.rows[0];

  if (!producto) {
    return {
      error:
        "No se encontró el producto.",

      ...(await obtenerResumen(
        venta_id
      )),
    };
  }

  const permitido =
    String(
      producto.tipo_venta ||
        "UNIDAD"
    ) ===
      "PESO" ||
    esCategoriaPorPeso(
      producto.categoria
    );

  if (!permitido) {
    return {
      error:
        `"${producto.nombre}" no está configurado para venta por peso.`,

      ...(await obtenerResumen(
        venta_id
      )),
    };
  }

  /*
   * Productos viejos de Verdulería/Fiambres pueden haber quedado
   * como UNIDAD. Al utilizarlos por peso los normalizamos.
   */
  if (
    String(
      producto.tipo_venta
    ) !==
    "PESO"
  ) {
    await db.query(
      `
        UPDATE producto
        SET
          tipo_venta = 'PESO'
        WHERE
          id = $1
      `,
      [
        producto.id,
      ]
    );
  }

  const existente =
    await db.query(
      `
        SELECT
          cantidad
        FROM detalle_venta
        WHERE
          venta_id = $1
          AND producto_id = $2
      `,
      [
        venta_id,
        producto_id,
      ]
    );

  const cantidadActual =
    existente.rows.length >
    0
      ? Number(
          existente
            .rows[0]
            .cantidad
        )
      : 0;

  /*
   * 500 g + 250 g = 750 g.
   */
  const nuevaCantidad =
    cantidadActual +
    cantidad;

  if (
    nuevaCantidad >
    Number(
      producto.stock
    )
  ) {
    return {
      error:
        `Stock insuficiente de "${producto.nombre}". ` +
        `Disponible: ${Number(
          producto.stock
        ).toLocaleString(
          "es-AR",
          {
            maximumFractionDigits:
              3,
          }
        )} kg.`,

      ...(await obtenerResumen(
        venta_id
      )),
    };
  }

  if (
    existente.rows.length >
    0
  ) {
    await db.query(
      `
        UPDATE detalle_venta
        SET
          cantidad =
            $1::numeric,

          subtotal =
            ROUND(
              (
                $1::numeric
                *
                precio_unitario::numeric
              ),
              2
            )

        WHERE
          venta_id = $2
          AND producto_id = $3
      `,
      [
        nuevaCantidad,
        venta_id,
        producto_id,
      ]
    );
  } else {
    /*
     * Los casts explícitos son importantes.
     * Sin ellos PostgreSQL recibe $3 y $4 como unknown
     * y produce:
     *   operator is not unique: unknown * unknown
     */
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
          $3::numeric,
          $4::numeric,
          ROUND(
            (
              $3::numeric
              *
              $4::numeric
            ),
            2
          )
        )
      `,
      [
        venta_id,
        producto_id,
        cantidad,
        producto.precio,
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

async function actualizarCantidad(
  venta_id,
  producto_id,
  delta
) {
  const productoResult =
    await db.query(
      `
        SELECT *
        FROM producto
        WHERE
          id = $1
          AND activo = TRUE
      `,
      [
        producto_id,
      ]
    );

  const producto =
    productoResult.rows[0];

  if (!producto) {
    return {
      error:
        "El producto no existe.",

      ...(await obtenerResumen(
        venta_id
      )),
    };
  }

  if (
    String(
      producto.tipo_venta ||
        "UNIDAD"
    ) ===
      "PESO" ||
    esCategoriaPorPeso(
      producto.categoria
    )
  ) {
    return {
      error:
        "Los productos por peso se cargan indicando gramos o kilos.",

      ...(await obtenerResumen(
        venta_id
      )),
    };
  }

  const detalleResult =
    await db.query(
      `
        SELECT
          cantidad
        FROM detalle_venta
        WHERE
          venta_id = $1
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
        "El producto no está en esta venta.",

      ...(await obtenerResumen(
        venta_id
      )),
    };
  }

  const nuevaCantidad =
    Number(
      detalleResult
        .rows[0]
        .cantidad
    ) +
    Number(
      delta
    );

  if (
    nuevaCantidad <= 0
  ) {
    await db.query(
      `
        DELETE FROM detalle_venta
        WHERE
          venta_id = $1
          AND producto_id = $2
      `,
      [
        venta_id,
        producto_id,
      ]
    );
  } else if (
    nuevaCantidad >
    Number(
      producto.stock
    )
  ) {
    return {
      error:
        `Stock insuficiente de "${producto.nombre}".`,

      ...(await obtenerResumen(
        venta_id
      )),
    };
  } else {
    await db.query(
      `
        UPDATE detalle_venta
        SET
          cantidad =
            $1::numeric,

          subtotal =
            ROUND(
              (
                $1::numeric
                *
                precio_unitario::numeric
              ),
              2
            )

        WHERE
          venta_id = $2
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

async function eliminarProductoDeVenta(
  venta_id,
  producto_id
) {
  await db.query(
    `
      DELETE FROM detalle_venta
      WHERE
        venta_id = $1
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

async function finalizarVenta(
  venta_id,
  monto_pagado
) {
  const client =
    await db.connect();

  try {
    await client.query(
      "BEGIN"
    );

    const ventaResult =
      await client.query(
        `
          SELECT
            id,
            total,
            cliente_id,
            cuenta_pendiente,
            finalizada,
            monto_pagado_inicial
          FROM venta
          WHERE
            id = $1
          FOR UPDATE
        `,
        [
          venta_id,
        ]
      );

    const venta =
      ventaResult.rows[0];

    if (!venta) {
      throw new Error(
        "La venta no existe."
      );
    }

    if (
      venta.finalizada
    ) {
      throw new Error(
        "La venta ya fue finalizada."
      );
    }

    const totalVenta = Number(venta.total);
    let pagadoInicial = totalVenta;
    let saldoPendiente = 0;

    if (venta.cuenta_pendiente) {
      if (!venta.cliente_id) {
        throw new Error(
          "Seleccioná el cliente al que se le dejará la deuda."
        );
      }

      pagadoInicial =
        monto_pagado === undefined || monto_pagado === null || monto_pagado === ""
          ? 0
          : Number(monto_pagado);

      if (
        !Number.isFinite(pagadoInicial) ||
        pagadoInicial < 0 ||
        pagadoInicial > totalVenta
      ) {
        throw new Error(
          "El monto pagado debe estar entre cero y el total de la venta."
        );
      }

      pagadoInicial = Math.round(pagadoInicial * 100) / 100;
      saldoPendiente =
        Math.round((totalVenta - pagadoInicial) * 100) / 100;
    }

    const detalleResult =
      await client.query(
        `
          SELECT
            dv.producto_id,
            dv.cantidad,
            p.nombre
          FROM detalle_venta dv
          JOIN producto p
            ON p.id =
               dv.producto_id
          WHERE
            dv.venta_id = $1
        `,
        [
          venta_id,
        ]
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
            SET
              stock =
                stock -
                $1::numeric

            WHERE
              id = $2

              AND
              stock >=
                $1::numeric
          `,
          [
            item.cantidad,
            item.producto_id,
          ]
        );

      if (
        resultado.rowCount ===
        0
      ) {
        throw new Error(
          `Stock insuficiente para "${item.nombre}".`
        );
      }
    }

    await client.query(
      `
        UPDATE venta
        SET
          finalizada = TRUE,

          monto_pagado_inicial = $2::numeric,

          saldo_pendiente = $3::numeric,

          cuenta_pendiente = ($3::numeric > 0)

        WHERE
          id = $1
      `,
      [
        venta_id,
        pagadoInicial,
        saldoPendiente,
      ]
    );

    await client.query(
      "COMMIT"
    );
  } catch (
    error
  ) {
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
          v.es_saldo_inicial,
          v.concepto,

          (
            v.total -
            v.saldo_pendiente
          ) AS total_pagado

        FROM venta v

        WHERE
          v.cliente_id = $1
          AND v.finalizada = TRUE
          AND v.saldo_pendiente > 0

        ORDER BY
          v.fecha_venta ASC,
          v.id ASC
      `,
      [
        cliente_id,
      ]
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

            CASE
              WHEN
                COALESCE(
                  p.tipo_venta::text,
                  'UNIDAD'
                ) = 'PESO'

                OR

                LOWER(
                  TRANSLATE(
                    COALESCE(
                      p.categoria::text,
                      ''
                    ),
                    'áéíóúÁÉÍÓÚ',
                    'aeiouAEIOU'
                  )
                ) IN (
                  'verduleria',
                  'verduras',
                  'frutas',
                  'frutas y verduras',
                  'fiambres'
                )

              THEN 'PESO'
              ELSE 'UNIDAD'
            END AS tipo_venta,

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
        [
          venta.id,
        ]
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
      detalles.rows.map(
        (
          detalle
        ) => ({
          ...detalle,

          cantidad:
            Number(
              detalle.cantidad
            ),

          precio_unitario:
            Number(
              detalle.precio_unitario
            ),

          subtotal:
            Number(
              detalle.subtotal
            ),
        })
      );
  }

  return ventas;
}

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
      aplicaciones.length ===
        0
    ) {
      throw new Error(
        "No se seleccionaron ventas."
      );
    }

    let totalPago =
      0;

    const ventasValidadas =
      [];

    for (
      const aplicacion of
        aplicaciones
    ) {
      const ventaResult =
        await client.query(
          `
            SELECT
              id,
              cliente_id,
              saldo_pendiente,
              finalizada

            FROM venta

            WHERE
              id = $1

            FOR UPDATE
          `,
          [
            aplicacion.venta_id,
          ]
        );

      const venta =
        ventaResult.rows[0];

      if (!venta) {
        throw new Error(
          `La venta #${aplicacion.venta_id} no existe.`
        );
      }

      if (
        !venta.finalizada
      ) {
        throw new Error(
          `La venta #${venta.id} todavía no está finalizada.`
        );
      }

      if (
        Number(
          venta.cliente_id
        ) !==
        Number(
          cliente_id
        )
      ) {
        throw new Error(
          `La venta #${venta.id} no pertenece al cliente.`
        );
      }

      const saldoActual =
        Number(
          venta.saldo_pendiente
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
          `El monto de la venta #${venta.id} no es válido.`
        );
      }

      if (
        monto >
        saldoActual
      ) {
        throw new Error(
          `El pago de la venta #${venta.id} supera el saldo pendiente.`
        );
      }

      totalPago +=
        monto;

      ventasValidadas.push({
        venta_id:
          venta.id,

        monto,
      });
    }

    const pagoResult =
      await client.query(
        `
          INSERT INTO pago (
            cliente_id,
            total
          )
          VALUES (
            $1,
            $2::numeric
          )
          RETURNING
            id,
            cliente_id,
            fecha_pago,
            total
        `,
        [
          cliente_id,
          totalPago,
        ]
      );

    const pago =
      pagoResult.rows[0];

    for (
      const item of
        ventasValidadas
    ) {
      await client.query(
        `
          INSERT INTO pago_venta (
            pago_id,
            venta_id,
            importe
          )
          VALUES (
            $1,
            $2,
            $3::numeric
          )
        `,
        [
          pago.id,
          item.venta_id,
          item.monto,
        ]
      );

      await client.query(
        `
          UPDATE venta
          SET
            saldo_pendiente =
              GREATEST(
                saldo_pendiente -
                  $1::numeric,
                0
              ),

            cuenta_pendiente =
              (
                saldo_pendiente -
                $1::numeric
              ) > 0

          WHERE
            id = $2
        `,
        [
          item.monto,
          item.venta_id,
        ]
      );
    }

    await client.query(
      "COMMIT"
    );

    return {
      pago_id:
        pago.id,

      cliente_id:
        Number(
          cliente_id
        ),

      total:
        Number(
          pago.total
        ),

      fecha_pago:
        pago.fecha_pago,
    };
  } catch (
    error
  ) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

async function obtenerHistorialCliente(
  cliente_id
) {
  const resultado =
    await db.query(
      `
        SELECT *
        FROM (
          SELECT
            v.fecha_venta
              AS fecha,

            'VENTA'::text
              AS tipo,

            v.id
              AS referencia_id,

            v.total
              AS importe,

            v.saldo_pendiente

          FROM venta v

          WHERE
            v.cliente_id = $1
            AND v.finalizada = TRUE

          UNION ALL

          SELECT
            p.fecha_pago
              AS fecha,

            'PAGO'::text
              AS tipo,

            p.id
              AS referencia_id,

            p.total
              AS importe,

            NULL::numeric
              AS saldo_pendiente

          FROM pago p

          WHERE
            p.cliente_id = $1
        ) movimientos

        ORDER BY
          fecha DESC,
          referencia_id DESC
      `,
      [
        cliente_id,
      ]
    );

  return resultado.rows.map(
    (
      movimiento
    ) => ({
      ...movimiento,

      importe:
        Number(
          movimiento.importe
        ),

      saldo_pendiente:
        movimiento.saldo_pendiente ===
        null
          ? null
          : Number(
              movimiento.saldo_pendiente
            ),
    })
  );
}

async function crearDeudaInicial({
  cliente_id,
  cliente,
  monto,
  concepto,
  fecha,
}) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    let clienteId = cliente_id ? Number(cliente_id) : null;

    if (clienteId) {
      const clienteResult = await client.query(
        "SELECT id FROM cliente WHERE id = $1",
        [clienteId]
      );

      if (clienteResult.rowCount === 0) {
        throw new Error("El cliente seleccionado no existe.");
      }
    } else {
      const nombre = String(cliente.nombre).trim();
      const apellido = String(cliente.apellido).trim();
      const apodo = String(cliente.apodo || "").trim() || null;
      const telefono = String(cliente.telefono || "").replace(/\D/g, "") || null;

      const existenteResult = await client.query(
        `
          SELECT id
          FROM cliente
          WHERE LOWER(TRIM(nombre)) = LOWER($1)
            AND LOWER(TRIM(apellido)) = LOWER($2)
          LIMIT 1
        `,
        [nombre, apellido]
      );

      if (existenteResult.rowCount > 0) {
        clienteId = existenteResult.rows[0].id;
      } else {
        const nuevoClienteResult = await client.query(
          `
            INSERT INTO cliente (nombre, apellido, apodo, telefono)
            VALUES ($1, $2, $3, $4)
            RETURNING id
          `,
          [nombre, apellido, apodo, telefono]
        );

        clienteId = nuevoClienteResult.rows[0].id;
      }
    }

    const conceptoLimpio =
      String(concepto || "").trim() || "Saldo anterior al sistema";

    const deudaResult = await client.query(
      `
        INSERT INTO venta (
          fecha_venta,
          cuenta_pendiente,
          total,
          cliente_id,
          finalizada,
          saldo_pendiente,
          monto_pagado_inicial,
          es_saldo_inicial,
          concepto
        )
        VALUES (
          COALESCE($1::date, CURRENT_DATE) + TIME '12:00',
          TRUE,
          $2::numeric,
          $3,
          TRUE,
          $2::numeric,
          0,
          TRUE,
          $4
        )
        RETURNING
          id,
          fecha_venta,
          total,
          saldo_pendiente,
          cliente_id,
          concepto,
          es_saldo_inicial
      `,
      [fecha || null, monto, clienteId, conceptoLimpio.slice(0, 160)]
    );

    await client.query("COMMIT");

    const deuda = deudaResult.rows[0];
    return {
      ...deuda,
      total: Number(deuda.total),
      saldo_pendiente: Number(deuda.saldo_pendiente),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function obtenerClientesConDeuda() {
  const resultado =
    await db.query(
      `
        SELECT
          c.id,
          c.nombre,
          c.apellido,
          c.apodo,
          c.telefono,

          COUNT(
            v.id
          )::int
            AS ventas_pendientes,

          COALESCE(
            SUM(
              v.saldo_pendiente
            ),
            0
          ) AS deuda_total

        FROM cliente c

        JOIN venta v
          ON c.id =
             v.cliente_id

        WHERE
          v.finalizada = TRUE
          AND v.saldo_pendiente > 0

        GROUP BY
          c.id,
          c.nombre,
          c.apellido,
          c.apodo,
          c.telefono

        ORDER BY
          c.apellido ASC,
          c.nombre ASC
      `
    );

  return resultado.rows.map(
    (
      cliente
    ) => ({
      ...cliente,

      ventas_pendientes:
        Number(
          cliente.ventas_pendientes
        ),

      deuda_total:
        Number(
          cliente.deuda_total
        ),
    })
  );
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

        cuenta_pendiente =
          TRUE,

        saldo_pendiente =
          CASE
            WHEN
              finalizada = TRUE
            THEN
              total
            ELSE
              0
          END

      WHERE
        id = $2
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
        cuenta_pendiente = FALSE,
        saldo_pendiente = 0

      WHERE
        id = $1
    `,
    [
      venta_id,
    ]
  );

  return await obtenerResumen(
    venta_id
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
  crearDeudaInicial,
  obtenerHistorialCliente,
  obtenerClientesConDeuda,
  asociarCliente,
  quitarCliente,
};
