const db = require("../db");

async function obtenerDatosInicio() {

  const [
    ventasHoyResult,
    ventasAyerResult,
    stockResult,
    deudaResult,
    ultimosDiasResult,
    actividadResult,
  ] = await Promise.all([

    // ==========================================
    // VENTAS DE HOY
    // ==========================================
    db.query(`
      SELECT
        COUNT(*)::int AS cantidad,
        COALESCE(SUM(total), 0) AS total
      FROM venta
      WHERE finalizada = TRUE
        AND fecha_venta >= CURRENT_DATE
        AND fecha_venta < CURRENT_DATE + INTERVAL '1 day';
    `),

    // ==========================================
    // VENTAS DE AYER
    // ==========================================
    db.query(`
      SELECT
        COUNT(*)::int AS cantidad,
        COALESCE(SUM(total), 0) AS total
      FROM venta
      WHERE finalizada = TRUE
        AND fecha_venta >= CURRENT_DATE - INTERVAL '1 day'
        AND fecha_venta < CURRENT_DATE;
    `),

    // ==========================================
    // STOCK ACTUAL
    // ==========================================
    db.query(`
      SELECT
        COALESCE(SUM(stock), 0)::int AS unidades,
        COUNT(*) FILTER (
          WHERE stock > 0
        )::int AS productos
      FROM producto
      WHERE activo = TRUE;
    `),

    // ==========================================
    // DEUDAS ACTUALES
    // ==========================================
    db.query(`
      SELECT
        COUNT(DISTINCT cliente_id)::int AS clientes,
        COUNT(*)::int AS cuentas,
        COALESCE(SUM(total), 0) AS total
      FROM venta
      WHERE finalizada = TRUE
        AND cuenta_pendiente = TRUE
        AND cliente_id IS NOT NULL;
    `),

    // ==========================================
    // VENTAS DE LOS ÚLTIMOS 7 DÍAS
    // ==========================================
    db.query(`
      WITH dias AS (
        SELECT
          generate_series(
            CURRENT_DATE - INTERVAL '6 days',
            CURRENT_DATE,
            INTERVAL '1 day'
          )::date AS fecha
      ),

      ventas_dia AS (
        SELECT
          fecha_venta::date AS fecha,
          COUNT(*)::int AS cantidad,
          COALESCE(SUM(total), 0) AS total
        FROM venta
        WHERE finalizada = TRUE
          AND fecha_venta >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY fecha_venta::date
      )

      SELECT
        d.fecha,
        COALESCE(v.cantidad, 0)::int AS cantidad,
        COALESCE(v.total, 0) AS total
      FROM dias d
      LEFT JOIN ventas_dia v
        ON v.fecha = d.fecha
      ORDER BY d.fecha ASC;
    `),

    // ==========================================
    // ACTIVIDAD RECIENTE
    // ==========================================
    db.query(`
      SELECT
        v.id,
        v.fecha_venta,
        v.total,
        v.cuenta_pendiente,
        v.cliente_id,
        c.nombre,
        c.apellido,
        c.apodo
      FROM venta v
      LEFT JOIN cliente c
        ON c.id = v.cliente_id
      WHERE v.finalizada = TRUE
      ORDER BY v.fecha_venta DESC
      LIMIT 5;
    `),
  ]);

  const hoy = ventasHoyResult.rows[0];
  const ayer = ventasAyerResult.rows[0];
  const stock = stockResult.rows[0];
  const deuda = deudaResult.rows[0];

  const totalHoy =
    Number(hoy.total || 0);

  const totalAyer =
    Number(ayer.total || 0);

  let variacion = null;

  if (totalAyer > 0) {
    variacion =
      ((totalHoy - totalAyer) /
        totalAyer) *
      100;
  }

  return {
    ventas_hoy: {
      cantidad:
        Number(hoy.cantidad || 0),

      total:
        totalHoy,

      variacion,
    },

    stock: {
      unidades:
        Number(stock.unidades || 0),

      productos:
        Number(stock.productos || 0),
    },

    deuda: {
      clientes:
        Number(deuda.clientes || 0),

      cuentas:
        Number(deuda.cuentas || 0),

      total:
        Number(deuda.total || 0),
    },

    ultimos_7_dias:
      ultimosDiasResult.rows.map(
        (fila) => ({
          fecha: fila.fecha,
          cantidad:
            Number(fila.cantidad || 0),
          total:
            Number(fila.total || 0),
        })
      ),

    actividad:
      actividadResult.rows.map(
        (venta) => ({
          id: venta.id,
          fecha: venta.fecha_venta,
          total:
            Number(venta.total || 0),
          pendiente:
            Boolean(
              venta.cuenta_pendiente
            ),
          cliente_id:
            venta.cliente_id,
          nombre:
            venta.nombre,
          apellido:
            venta.apellido,
          apodo:
            venta.apodo,
        })
      ),
  };
}

module.exports = {
  obtenerDatosInicio,
};