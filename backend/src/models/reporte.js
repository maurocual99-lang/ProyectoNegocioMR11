const db =
  require("../db");


/* =========================================================
   HELPERS
========================================================= */

function numero(
  valor
) {

  return Number(
    valor ||
    0
  );

}


function mapearDetalle(
  detalle
) {

  return {
    ...detalle,

    id:
      Number(
        detalle.id
      ),

    producto_id:
      Number(
        detalle.producto_id
      ),

    cantidad:
      numero(
        detalle.cantidad
      ),

    precio_unitario:
      numero(
        detalle.precio_unitario
      ),

    subtotal:
      numero(
        detalle.subtotal
      ),
  };

}


/* =========================================================
   REPORTE MENSUAL
========================================================= */

async function obtenerReporteMensual(
  mes,
  anio
) {

  const mesNumero =
    Number(
      mes
    );

  const anioNumero =
    Number(
      anio
    );


  const parametros = [
    anioNumero,
    mesNumero,
  ];


  /*
   * Todas las consultas que corresponden al período
   * seleccionado usan el mismo rango:
   *
   *   >= primer día del mes
   *   <  primer día del mes siguiente
   *
   * De esta forma también se conserva correctamente
   * la hora de fecha_venta / fecha_pago.
   */
  const filtroMensualVenta = `
    v.finalizada = TRUE

    AND
    COALESCE(v.es_saldo_inicial, FALSE) = FALSE

    AND
    v.fecha_venta >=
      make_date(
        $1::int,
        $2::int,
        1
      )

    AND
    v.fecha_venta <
      (
        make_date(
          $1::int,
          $2::int,
          1
        )
        +
        INTERVAL '1 month'
      )
  `;


  try {

    /* =====================================================
       1. RESUMEN EXACTO DE LAS VENTAS DEL MES

       total_vendido:
         suma de TODAS las ventas finalizadas del mes.

       total_pendiente_mes:
         saldo que HOY continúa pendiente de las ventas
         realizadas durante ese mes.

       IMPORTANTE:
       No usamos v.total para el pendiente porque una venta
       puede haber recibido pagos parciales.
    ===================================================== */

    const resumenResult =
      await db.query(
        `
          SELECT

            COUNT(*)::int
              AS cantidad_ventas,


            COALESCE(
              SUM(
                v.total
              ),
              0
            )
              AS total_vendido,


            COALESCE(
              SUM(
                GREATEST(
                  COALESCE(
                    v.saldo_pendiente,
                    0
                  ),
                  0
                )
              ),
              0
            )
              AS total_pendiente_mes

          FROM venta v

          WHERE
            ${filtroMensualVenta};
        `,
        parametros
      );


    /* =====================================================
       2. CONTROL DE CAJA DEL MES

       Hay dos formas de ingresar dinero:

       A) Importe cobrado al vender, sea total o parcial.
       B) Pago de una deuda.

       monto_pagado_inicial conserva exactamente lo que entró en caja
       al finalizar la venta. Los pagos posteriores se registran en pago,
       con su propia fecha, para no duplicar ni anticipar ingresos.
    ===================================================== */

    const cajaResult =
      await db.query(
        `
          SELECT

            /* -------------------------------------------
               COBROS RECIBIDOS AL MOMENTO DE VENDER
            ------------------------------------------- */
            COALESCE(
              (
                SELECT
                  SUM(
                    COALESCE(
                      v.monto_pagado_inicial,
                      0
                    )
                  )

                FROM venta v

                WHERE
                  v.finalizada = TRUE

                  AND
                  COALESCE(v.es_saldo_inicial, FALSE) = FALSE

                  AND
                  v.fecha_venta >=
                    make_date(
                      $1::int,
                      $2::int,
                      1
                    )

                  AND
                  v.fecha_venta <
                    (
                      make_date(
                        $1::int,
                        $2::int,
                        1
                      )
                      +
                      INTERVAL '1 month'
                    )

              ),
              0
            )
              AS ventas_contado_mes,


            /* -------------------------------------------
               PAGOS DE DEUDAS RECIBIDOS EN EL MES
            ------------------------------------------- */
            COALESCE(
              (
                SELECT
                  SUM(
                    p.total
                  )

                FROM pago p

                WHERE
                  p.fecha_pago >=
                    make_date(
                      $1::int,
                      $2::int,
                      1
                    )

                  AND
                  p.fecha_pago <
                    (
                      make_date(
                        $1::int,
                        $2::int,
                        1
                      )
                      +
                      INTERVAL '1 month'
                    )
              ),
              0
            )
              AS pagos_deuda_mes;
        `,
        parametros
      );


    /* =====================================================
       3. VENTAS AGRUPADAS POR DÍA
    ===================================================== */

    const ventasPorDiaResult =
      await db.query(
        `
          SELECT

            EXTRACT(
              DAY
              FROM v.fecha_venta
            )::int
              AS dia,


            COUNT(*)::int
              AS cantidad_ventas,


            COALESCE(
              SUM(
                v.total
              ),
              0
            )
              AS total

          FROM venta v

          WHERE
            ${filtroMensualVenta}

          GROUP BY
            EXTRACT(
              DAY
              FROM v.fecha_venta
            )

          ORDER BY
            dia ASC;
        `,
        parametros
      );


    /* =====================================================
       4. REGISTRO EXACTO DE TODAS LAS VENTAS DEL MES

       Se devuelve:
       - venta
       - fecha y hora
       - total
       - saldo actual
       - monto total pagado
       - cliente
       - todos los productos
       - cantidad/precio/subtotal
       - tipo de venta UNIDAD/PESO
    ===================================================== */

    const ventasResult =
      await db.query(
        `
          SELECT

            v.id,

            v.fecha_venta,

            v.total,

            GREATEST(
              COALESCE(
                v.saldo_pendiente,
                0
              ),
              0
            )
              AS saldo_pendiente,


            GREATEST(
              v.total
              -
              COALESCE(
                v.saldo_pendiente,
                0
              ),
              0
            )
              AS total_pagado,


            (
              COALESCE(
                v.saldo_pendiente,
                0
              ) > 0
            )
              AS cuenta_pendiente,


            v.cliente_id,

            c.nombre
              AS cliente_nombre,

            c.apellido
              AS cliente_apellido,

            c.apodo
              AS cliente_apodo,


            COALESCE(
              json_agg(
                json_build_object(

                  'id',
                  dv.id,

                  'producto_id',
                  dv.producto_id,

                  'producto_nombre',
                  p.nombre,

                  'tipo_venta',
                  CASE
                    WHEN
                      COALESCE(
                        p.tipo_venta::text,
                        'UNIDAD'
                      ) = 'PESO'
                    THEN
                      'PESO'
                    ELSE
                      'UNIDAD'
                  END,

                  'cantidad',
                  dv.cantidad,

                  'precio_unitario',
                  dv.precio_unitario,

                  'subtotal',
                  dv.subtotal
                )

                ORDER BY
                  dv.id
              )
              FILTER (
                WHERE
                  dv.id
                  IS NOT NULL
              ),

              '[]'::json
            )
              AS detalles

          FROM venta v

          LEFT JOIN cliente c
            ON c.id =
               v.cliente_id

          LEFT JOIN detalle_venta dv
            ON dv.venta_id =
               v.id

          LEFT JOIN producto p
            ON p.id =
               dv.producto_id

          WHERE
            ${filtroMensualVenta}

          GROUP BY
            v.id,
            v.fecha_venta,
            v.total,
            v.saldo_pendiente,
            v.cliente_id,
            c.id,
            c.nombre,
            c.apellido,
            c.apodo

          ORDER BY
            v.fecha_venta DESC,
            v.id DESC;
        `,
        parametros
      );


    /* =====================================================
       5. PERSONAS QUE DEBEN DINERO ACTUALMENTE

       NO se filtra por mes.
       El issue pide saber cuánto deben HOY los clientes
       morosos, independientemente de cuándo nació la deuda.
    ===================================================== */

    const deudoresResult =
      await db.query(
        `
          SELECT

            c.id,

            c.nombre,

            c.apellido,

            c.apodo,


            COUNT(
              v.id
            )::int
              AS ventas_pendientes,


            COALESCE(
              SUM(
                v.saldo_pendiente
              ),
              0
            )
              AS deuda_total

          FROM cliente c

          JOIN venta v
            ON v.cliente_id =
               c.id

          WHERE
            v.finalizada = TRUE

            AND
            COALESCE(
              v.saldo_pendiente,
              0
            ) > 0

          GROUP BY
            c.id,
            c.nombre,
            c.apellido,
            c.apodo

          ORDER BY
            deuda_total DESC,
            c.apellido ASC,
            c.nombre ASC;
        `
      );


    /* =====================================================
       6. TOTAL DE DEUDA ACTUAL

       Tampoco se filtra por mes.
    ===================================================== */

    const deudaResult =
      await db.query(
        `
          SELECT

            COALESCE(
              SUM(
                v.saldo_pendiente
              ),
              0
            )
              AS total_deuda,


            COUNT(*)::int
              AS ventas_pendientes,


            COUNT(
              DISTINCT
              v.cliente_id
            )::int
              AS clientes_morosos

          FROM venta v

          WHERE
            v.finalizada = TRUE

            AND
            COALESCE(
              v.saldo_pendiente,
              0
            ) > 0

            AND
            v.cliente_id
              IS NOT NULL;
        `
      );


    /* =====================================================
       7. PAGOS DE DEUDAS REALIZADOS DURANTE EL MES

       Este detalle no rompe el frontend actual.
       Queda disponible para auditar el valor
       "Ingresó a caja" y para ampliar la pantalla después.
    ===================================================== */

    const pagosMesResult =
      await db.query(
        `
          SELECT

            p.id,

            p.fecha_pago,

            p.total,

            p.cliente_id,

            c.nombre
              AS cliente_nombre,

            c.apellido
              AS cliente_apellido,

            c.apodo
              AS cliente_apodo

          FROM pago p

          LEFT JOIN cliente c
            ON c.id =
               p.cliente_id

          WHERE
            p.fecha_pago >=
              make_date(
                $1::int,
                $2::int,
                1
              )

            AND
            p.fecha_pago <
              (
                make_date(
                  $1::int,
                  $2::int,
                  1
                )
                +
                INTERVAL '1 month'
              )

          ORDER BY
            p.fecha_pago DESC,
            p.id DESC;
        `,
        parametros
      );


    /* =====================================================
       8. AÑOS DISPONIBLES
    ===================================================== */

    const aniosResult =
      await db.query(
        `
          SELECT DISTINCT

            EXTRACT(
              YEAR
              FROM fecha_venta
            )::int
              AS anio

          FROM venta

          WHERE
            finalizada = TRUE

            AND
            COALESCE(es_saldo_inicial, FALSE) = FALSE

          ORDER BY
            anio DESC;
        `
      );


    /* =====================================================
       9. ARMAR RESPUESTA
    ===================================================== */

    const resumen =
      resumenResult
        .rows[0] ||
      {};


    const caja =
      cajaResult
        .rows[0] ||
      {};


    const deuda =
      deudaResult
        .rows[0] ||
      {};


    const ventasContadoMes =
      numero(
        caja
          .ventas_contado_mes
      );


    const pagosDeudaMes =
      numero(
        caja
          .pagos_deuda_mes
      );


    const totalCajaMes =
      ventasContadoMes
      +
      pagosDeudaMes;


    return {

      periodo: {
        mes:
          mesNumero,

        anio:
          anioNumero,
      },


      resumen: {

        cantidad_ventas:
          numero(
            resumen
              .cantidad_ventas
          ),


        total_vendido:
          numero(
            resumen
              .total_vendido
          ),


        /*
         * Conservamos el nombre total_cobrado para que
         * Resumenes.tsx actual siga funcionando.
         *
         * Semántica:
         * "dinero que realmente entró a caja durante
         * el período seleccionado".
         */
        total_cobrado:
          totalCajaMes,


        total_pendiente_mes:
          numero(
            resumen
              .total_pendiente_mes
          ),


        /*
         * Desglose nuevo.
         * El frontend actual puede ignorarlo sin problema.
         */
        ventas_contado_mes:
          ventasContadoMes,

        pagos_deuda_mes:
          pagosDeudaMes,

        total_caja_mes:
          totalCajaMes,
      },


      /*
       * IMPORTANTE:
       * En la rama anterior "deudores" estaba metido
       * accidentalmente dentro de "resumen".
       *
       * Resumenes.tsx espera:
       *   reporte.deudores
       *
       * Por eso ahora va en la raíz.
       */
      deudores:
        deudoresResult
          .rows
          .map(
            (
              cliente
            ) => ({

              id:
                Number(
                  cliente.id
                ),

              nombre:
                cliente.nombre,

              apellido:
                cliente.apellido,

              apodo:
                cliente.apodo,

              ventas_pendientes:
                numero(
                  cliente
                    .ventas_pendientes
                ),

              deuda_total:
                numero(
                  cliente
                    .deuda_total
                ),
            })
          ),


      deuda_actual: {

        total_deuda:
          numero(
            deuda
              .total_deuda
          ),

        ventas_pendientes:
          numero(
            deuda
              .ventas_pendientes
          ),

        clientes_morosos:
          numero(
            deuda
              .clientes_morosos
          ),
      },


      ventas_por_dia:
        ventasPorDiaResult
          .rows
          .map(
            (
              fila
            ) => ({

              dia:
                numero(
                  fila.dia
                ),

              cantidad_ventas:
                numero(
                  fila
                    .cantidad_ventas
                ),

              total:
                numero(
                  fila.total
                ),
            })
          ),


      ventas:
        ventasResult
          .rows
          .map(
            (
              venta
            ) => ({

              id:
                Number(
                  venta.id
                ),

              fecha_venta:
                venta.fecha_venta,

              total:
                numero(
                  venta.total
                ),

              saldo_pendiente:
                numero(
                  venta
                    .saldo_pendiente
                ),

              total_pagado:
                numero(
                  venta
                    .total_pagado
                ),

              cuenta_pendiente:
                Boolean(
                  venta
                    .cuenta_pendiente
                ),

              cliente_id:
                venta.cliente_id ===
                null
                  ? null
                  : Number(
                      venta
                        .cliente_id
                    ),

              cliente_nombre:
                venta
                  .cliente_nombre,

              cliente_apellido:
                venta
                  .cliente_apellido,

              cliente_apodo:
                venta
                  .cliente_apodo,

              detalles:
                (
                  venta.detalles ||
                  []
                )
                  .map(
                    mapearDetalle
                  ),
            })
          ),


      pagos_mes:
        pagosMesResult
          .rows
          .map(
            (
              pago
            ) => ({

              id:
                Number(
                  pago.id
                ),

              fecha_pago:
                pago.fecha_pago,

              total:
                numero(
                  pago.total
                ),

              cliente_id:
                pago.cliente_id ===
                null
                  ? null
                  : Number(
                      pago.cliente_id
                    ),

              cliente_nombre:
                pago
                  .cliente_nombre,

              cliente_apellido:
                pago
                  .cliente_apellido,

              cliente_apodo:
                pago
                  .cliente_apodo,
            })
          ),


      anios_disponibles:
        aniosResult
          .rows
          .map(
            (
              fila
            ) =>
              numero(
                fila.anio
              )
          ),
    };


  } catch (
    error
  ) {

    console.error(
      "======================================"
    );

    console.error(
      "ERROR EN MODELS/REPORTE.JS"
    );

    console.error(
      error
    );

    console.error(
      "Mensaje:",
      error.message
    );

    console.error(
      "Código:",
      error.code
    );

    console.error(
      "Detalle:",
      error.detail
    );

    console.error(
      "======================================"
    );


    throw error;

  }

}


module.exports = {
  obtenerReporteMensual,
};
