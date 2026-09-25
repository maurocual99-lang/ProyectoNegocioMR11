const test = require("node:test");
const assert = require("node:assert/strict");

function cargarModelo(respuestas) {
  const db = {
    async query(sql, parametros = []) {
      return respuestas(String(sql).replace(/\s+/g, " ").trim(), parametros);
    },
  };

  const dbPath = require.resolve("../src/db");
  const modelPath = require.resolve("../src/models/clienteDeudor");
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: db,
  };
  delete require.cache[modelPath];

  return require(modelPath);
}

test("actualiza todos los datos editables de un cliente", async () => {
  const modelo = cargarModelo((consulta, parametros) => {
    if (consulta.startsWith("SELECT id FROM cliente")) {
      assert.deepEqual(parametros, ["Juan", "Pérez", 7]);
      return { rows: [], rowCount: 0 };
    }

    if (consulta.startsWith("UPDATE cliente")) {
      assert.deepEqual(parametros, ["Juan", "Pérez", "Juani", "5492215551234", 7]);
      return {
        rows: [{
          id: 7,
          nombre: "Juan",
          apellido: "Pérez",
          apodo: "Juani",
          telefono: "5492215551234",
        }],
        rowCount: 1,
      };
    }

    throw new Error(`Consulta inesperada: ${consulta}`);
  });

  const cliente = await modelo.actualizarCliente({
    clienteId: 7,
    nombre: "Juan",
    apellido: "Pérez",
    apodo: "Juani",
    telefono: "5492215551234",
  });

  assert.equal(cliente.apodo, "Juani");
  assert.equal(cliente.telefono, "5492215551234");
});

test("impide que una edición duplique otro cliente", async () => {
  const modelo = cargarModelo((consulta) => {
    if (consulta.startsWith("SELECT id FROM cliente")) {
      return { rows: [{ id: 3 }], rowCount: 1 };
    }

    throw new Error(`Consulta inesperada: ${consulta}`);
  });

  await assert.rejects(
    () =>
      modelo.actualizarCliente({
        clienteId: 7,
        nombre: "Ana",
        apellido: "Gómez",
        apodo: null,
        telefono: null,
      }),
    (error) => error.code === "CLIENTE_DUPLICADO"
  );
});

