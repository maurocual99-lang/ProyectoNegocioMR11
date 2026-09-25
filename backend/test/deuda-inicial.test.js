const test = require("node:test");
const assert = require("node:assert/strict");

function cargarModelo(respuestas) {
  const consultas = [];

  const client = {
    async query(sql, parametros = []) {
      const consulta = String(sql).replace(/\s+/g, " ").trim();
      consultas.push({ consulta, parametros });

      if (consulta === "BEGIN" || consulta === "COMMIT" || consulta === "ROLLBACK") {
        return { rows: [], rowCount: 0 };
      }

      return respuestas(consulta, parametros);
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

  return { modelo: require(modelPath), consultas };
}

test("registra una deuda inicial sin crear una venta comercial", async () => {
  const { modelo, consultas } = cargarModelo((consulta, parametros) => {
    if (consulta === "SELECT id FROM cliente WHERE id = $1") {
      assert.deepEqual(parametros, [4]);
      return { rows: [{ id: 4 }], rowCount: 1 };
    }

    if (consulta.startsWith("INSERT INTO venta")) {
      assert.deepEqual(parametros, ["2026-09-20", 12500.5, 4, "Cuenta previa"]);
      assert.match(consulta, /es_saldo_inicial/);
      return {
        rows: [{
          id: 31,
          fecha_venta: "2026-09-20T12:00:00.000Z",
          total: "12500.50",
          saldo_pendiente: "12500.50",
          cliente_id: 4,
          concepto: "Cuenta previa",
          es_saldo_inicial: true,
        }],
        rowCount: 1,
      };
    }

    throw new Error(`Consulta inesperada: ${consulta}`);
  });

  const deuda = await modelo.crearDeudaInicial({
    cliente_id: 4,
    monto: 12500.5,
    concepto: "Cuenta previa",
    fecha: "2026-09-20",
  });

  assert.equal(deuda.total, 12500.5);
  assert.equal(deuda.saldo_pendiente, 12500.5);
  assert.equal(deuda.es_saldo_inicial, true);
  assert.equal(consultas.at(-1).consulta, "COMMIT");
});

test("crea el cliente cuando la deuda inicial pertenece a uno nuevo", async () => {
  const { modelo } = cargarModelo((consulta, parametros) => {
    if (consulta.startsWith("SELECT id FROM cliente WHERE LOWER")) {
      return { rows: [], rowCount: 0 };
    }

    if (consulta.startsWith("INSERT INTO cliente")) {
      assert.deepEqual(parametros, ["Ana", "Pérez", "Ani", null]);
      return { rows: [{ id: 9 }], rowCount: 1 };
    }

    if (consulta.startsWith("INSERT INTO venta")) {
      assert.equal(parametros[2], 9);
      return {
        rows: [{
          id: 32,
          total: "8000.00",
          saldo_pendiente: "8000.00",
          cliente_id: 9,
          concepto: "Saldo anterior al sistema",
          es_saldo_inicial: true,
        }],
        rowCount: 1,
      };
    }

    throw new Error(`Consulta inesperada: ${consulta}`);
  });

  const deuda = await modelo.crearDeudaInicial({
    cliente: { nombre: "Ana", apellido: "Pérez", apodo: "Ani" },
    monto: 8000,
    concepto: "",
    fecha: null,
  });

  assert.equal(deuda.cliente_id, 9);
  assert.equal(deuda.concepto, "Saldo anterior al sistema");
});
