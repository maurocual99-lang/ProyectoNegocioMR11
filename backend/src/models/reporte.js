const db = require("../db");


/* ======================================================
   OBTENER REPORTE MENSUAL
====================================================== */

async function obtenerReporteMensual(
  mes,
  anio
) {

  const mesNumero =
    Number(mes);

  const anioNumero =
    Number(anio);


  const parametros = [
    anioNumero,
    mesNumero,
  ];


  /* ====================================================
     FILTRO COMÚN DEL MES
  ==================================================== */

  const filtroMensual = `

    v.finalizada = TRUE

    AND v.fecha_venta >=
      make_date(
        $1::int,
        $2::int,
        1
      )

    AND v.fecha_venta <
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

    /* ==================================================
       1. RESUMEN GENERAL DEL MES
    ================================================== */

    const resumenResult =
      await db.query(
        `
          SELECT

            COUNT(*)::int
              AS cantidad_ventas,


            COALESCE(
              SUM(v.total),
              0
            )
              AS total_vendido,


            COALESCE(
              SUM(
                CASE

                  WHEN
                    COALESCE(
                      v.cuenta_pendiente,
                      FALSE
                    ) = FALSE

                  THEN
                    v.total

                  ELSE
                    0

                END
              ),
              0
            )
              AS total_cobrado,


            COALESCE(
              SUM(
                CASE

                  WHEN
                    v.cuenta_pendiente = TRUE

                  THEN
                    v.total

                  ELSE
                    0

                END
              ),
              0
            )
              AS total_pendiente_mes


          FROM venta v


          WHERE
            ${filtroMensual};

        `,
        parametros
      );


    /* ==================================================
       2. VENTAS AGRUPADAS POR DÍA
       PARA EL GRÁFICO
    ================================================== */

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
              SUM(v.total),
              0
            )
              AS total


          FROM venta v


          WHERE
            ${filtroMensual}


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


    /* ==================================================
       3. TODAS LAS VENTAS DEL MES
       CON PRODUCTOS Y CLIENTE
    ================================================== */

    const ventasResult =
      await db.query(
        `
          SELECT

            v.id,

            v.fecha_venta,

            v.total,

            COALESCE(
              v.cuenta_pendiente,
              FALSE
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
                  dv.id IS NOT NULL
              ),

              '[]'::json

            )
              AS detalles


          FROM venta v


          LEFT JOIN cliente c

            ON
              c.id =
              v.cliente_id


          LEFT JOIN detalle_venta dv

            ON
              dv.venta_id =
              v.id


          LEFT JOIN producto p

            ON
              p.id =
              dv.producto_id


          WHERE
            ${filtroMensual}


          GROUP BY

            v.id,

            v.fecha_venta,

            v.total,

            v.cuenta_pendiente,

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


    /* ==================================================
       4. DEUDA TOTAL ACTUAL

       IMPORTANTE:
       NO SE FILTRA POR MES.

       Esto responde:
       "¿Cuánto me deben actualmente todos
       los clientes morosos?"
    ================================================== */

    const deudaResult =
      await db.query(
        `
          SELECT

            COALESCE(
              SUM(v.total),
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
            v.cuenta_pendiente = TRUE

            AND
            v.cliente_id
              IS NOT NULL;

        `
      );


    /* ==================================================
       5. AÑOS CON VENTAS DISPONIBLES
    ================================================== */

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


          ORDER BY
            anio DESC;

        `
      );


    /* ==================================================
       ARMAR RESPUESTA
    ================================================== */

    const resumen =
      resumenResult.rows[0];


    const deuda =
      deudaResult.rows[0];


    return {

      /* ==============================
         PERÍODO
      ============================== */

      periodo: {

        mes:
          mesNumero,

        anio:
          anioNumero,

      },


      /* ==============================
         RESUMEN
      ============================== */

      resumen: {

        cantidad_ventas:
          Number(
            resumen
              ?.cantidad_ventas ||
            0
          ),

        total_vendido:
          Number(
            resumen
              ?.total_vendido ||
            0
          ),

        total_cobrado:
          Number(
            resumen
              ?.total_cobrado ||
            0
          ),

        total_pendiente_mes:
          Number(
            resumen
              ?.total_pendiente_mes ||
            0
          ),

      },


      /* ==============================
         DEUDA ACTUAL
      ============================== */

      deuda_actual: {

        total_deuda:
          Number(
            deuda
              ?.total_deuda ||
            0
          ),

        ventas_pendientes:
          Number(
            deuda
              ?.ventas_pendientes ||
            0
          ),

        clientes_morosos:
          Number(
            deuda
              ?.clientes_morosos ||
            0
          ),

      },


      /* ==============================
         DATOS DEL GRÁFICO
      ============================== */

      ventas_por_dia:

        ventasPorDiaResult.rows.map(
          (fila) => ({

            dia:
              Number(
                fila.dia
              ),

            cantidad_ventas:
              Number(
                fila
                  .cantidad_ventas ||
                0
              ),

            total:
              Number(
                fila.total ||
                0
              ),

          })
        ),


      /* ==============================
         VENTAS COMPLETAS
      ============================== */

      ventas:

        ventasResult.rows.map(
          (venta) => ({

            id:
              venta.id,


            fecha_venta:
              venta.fecha_venta,


            total:
              Number(
                venta.total ||
                0
              ),


            cuenta_pendiente:
              Boolean(
                venta
                  .cuenta_pendiente
              ),


            cliente_id:
              venta.cliente_id,


            cliente_nombre:
              venta.cliente_nombre,


            cliente_apellido:
              venta.cliente_apellido,


            cliente_apodo:
              venta.cliente_apodo,


            detalles:

              (
                venta.detalles ||
                []
              ).map(
                (detalle) => ({

                  ...detalle,


                  cantidad:
                    Number(
                      detalle
                        .cantidad ||
                      0
                    ),


                  precio_unitario:
                    Number(
                      detalle
                        .precio_unitario ||
                      0
                    ),


                  subtotal:
                    Number(
                      detalle
                        .subtotal ||
                      0
                    ),

                })
              ),

          })
        ),


      /* ==============================
         AÑOS
      ============================== */

      anios_disponibles:

        aniosResult.rows.map(
          (fila) =>
            Number(
              fila.anio
            )
        ),

    };


  } catch (error) {

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