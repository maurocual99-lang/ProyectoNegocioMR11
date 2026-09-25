const test = require("node:test");
const assert = require("node:assert/strict");

function crearModeloVenta(venta) {
  const actualizaciones = [];

  const client = {
    async query(sql, parametros = []) {
      const consulta = String(sql).replace(/\s+/g, " ").trim();

      if (consulta === "BEGIN" || consulta === "COMMIT" || consulta === "ROLLBACK") {
        return { rows: [], rowCount: 0 };
      }

      if (consulta.includes("SELECT id, total, cliente_id, cuenta_pendiente")) {
        return { rows: [venta], rowCount: 1 };
      }

      if (consulta.includes("SELECT dv.producto_id, dv.cantidad, p.nombre")) {
        return {
          rows: [{ producto_id: 10, cantidad: 1, nombre: "Producto" }],
          rowCount: 1,
        };
      }

      if (consulta.startsWith("UPDATE producto")) {
        return { rows: [], rowCount: 1 };
      }

      if (consulta.startsWith("UPDATE venta SET finalizada = TRUE")) {
        actualizaciones.push(parametros);
        return { rows: [], rowCount: 1 };
      }

      throw new Error(`Consulta inesperada: ${consulta}`);
    },
    release() {},
  };

  const db = {
    async connect() {
      return client;
    },
    async query() {
      return { rows: [], rowCount: 0 };
    },
  };

  const dbPath = require.resolve("../src/db");
  const modelPath = require.resolve("../src/models/venta");
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: db,
  };
  delete require.cache[modelPath];

  return {
    modelo: require(modelPath),
    actualizaciones,
  };
}

test("una venta mixta guarda lo pagado y solo deja el resto como deuda", async () => {
  const { modelo, actualizaciones } = crearModeloVenta({
    id: 7,
    total: "1000.00",
    cliente_id: 3,
    cuenta_pendiente: true,
    finalizada: false,
    monto_pagado_inicial: "0",
  });

  await modelo.finalizarVenta(7, 400);

  assert.deepEqual(actualizaciones, [[7, 400, 600]]);
});

test("una venta de contado registra el total aunque el frontend envie cero", async () => {
  const { modelo, actualizaciones } = crearModeloVenta({
    id: 8,
    total: "850.50",
    cliente_id: null,
    cuenta_pendiente: false,
    finalizada: false,
    monto_pagado_inicial: "0",
  });

  await modelo.finalizarVenta(8, 0);

  assert.deepEqual(actualizaciones, [[8, 850.5, 0]]);
});
