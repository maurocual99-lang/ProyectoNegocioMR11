const clienteDeudorModel = require("../models/clienteDeudor.js");

async function obtenerDeudores(req, res) {
  try {
    const deudores = await clienteDeudorModel.obtener_deudores();
    res.status(200).json(deudores);
  } catch (error) {
    console.error("Error en el controlador al obtener deudores:", error);
    res.status(500).json({
      mensaje: "Hubo un error al intentar obtener la lista de clientes."
    });
  }
}
// Crear deudor
async function crearClienteDeudor(req, res) {
  try {
    const { nombre, apellido, apodo, telefono } = req.body;

    // Validacion
    if (!nombre || !apellido) {
      return res.status(400).json({
        mensaje: "El nombre y el apellido son obligatorios."
      });
    }

    const telefonoNormalizado = String(telefono || "").replace(/\D/g, "");

    if (
      telefonoNormalizado &&
      (telefonoNormalizado.length < 8 || telefonoNormalizado.length > 15)
    ) {
      return res.status(400).json({
        mensaje: "Ingresá el teléfono completo, con código de país y área."
      });
    }

    // Buscar posibles coincidencias
    const clientes = await clienteDeudorModel.buscarCliente(
      `${apellido} ${nombre}`
    );

    // Verificar si existe exactamente el mismo cliente
    const clienteExistente = clientes.find(
      (c) =>
        c.nombre.toLowerCase().trim() === nombre.toLowerCase().trim() &&
        c.apellido.toLowerCase().trim() === apellido.toLowerCase().trim()
    );

    if (clienteExistente) {
      return res.status(409).json({
        existe: true,
        mensaje: "El cliente ya está registrado en el sistema."
      });
    }

    // Crear cliente
    const nuevoCliente = await clienteDeudorModel.crearClienteDeudor(
      nombre,
      apellido,
      apodo,
      telefonoNormalizado
    );

    res.status(201).json({
      existe: false,
      cliente: nuevoCliente,
      mensaje: "Cliente registrado con éxito."
    });

  } catch (error) {
    console.error("Error en el controlador al crear deudor:", error);

    res.status(500).json({
      mensaje: "Hubo un error al intentar guardar el cliente."
    });
  }
}
async function actualizarTelefono(req, res) {
  try {
    const telefono = String(req.body?.telefono || "").replace(/\D/g, "");

    if (telefono.length < 8 || telefono.length > 15) {
      return res.status(400).json({
        mensaje: "Ingresá el teléfono completo, con código de país y área.",
      });
    }

    const cliente = await clienteDeudorModel.actualizarTelefono(
      req.params.cliente_id,
      telefono
    );

    if (!cliente) {
      return res.status(404).json({ mensaje: "El cliente no existe." });
    }

    res.json({
      mensaje: "Teléfono actualizado correctamente.",
      cliente,
    });
  } catch (error) {
    console.error("Error al actualizar teléfono:", error);
    res.status(500).json({ mensaje: "No se pudo actualizar el teléfono." });
  }
}
async function actualizarCliente(req, res) {
  try {
    const nombre = String(req.body?.nombre || "").trim();
    const apellido = String(req.body?.apellido || "").trim();
    const apodo = String(req.body?.apodo || "").trim();
    const telefono = String(req.body?.telefono || "").replace(/\D/g, "");

    if (!nombre || !apellido) {
      return res.status(400).json({
        mensaje: "El nombre y el apellido son obligatorios.",
      });
    }

    if (nombre.length > 15 || apellido.length > 15 || apodo.length > 15) {
      return res.status(400).json({
        mensaje: "Nombre, apellido y apodo pueden tener hasta 15 caracteres.",
      });
    }

    if (telefono && (telefono.length < 8 || telefono.length > 15)) {
      return res.status(400).json({
        mensaje: "Ingresá el teléfono completo, con código de país y área.",
      });
    }

    const cliente = await clienteDeudorModel.actualizarCliente({
      clienteId: req.params.cliente_id,
      nombre,
      apellido,
      apodo: apodo || null,
      telefono: telefono || null,
    });

    if (!cliente) {
      return res.status(404).json({ mensaje: "El cliente no existe." });
    }

    res.json({
      mensaje: "Datos del cliente actualizados correctamente.",
      cliente,
    });
  } catch (error) {
    if (error.code === "CLIENTE_DUPLICADO") {
      return res.status(409).json({
        mensaje: "Ya existe otro cliente con ese nombre y apellido.",
      });
    }

    console.error("Error al actualizar cliente:", error);
    res.status(500).json({ mensaje: "No se pudieron actualizar los datos." });
  }
}
async function buscarClienteDeudor(req, res) {
  try {

    const { texto } = req.query;

    if (!texto || texto.trim() === "") {
      return res.status(400).json({
        mensaje: "Debe ingresar un nombre o apellido."
      });
    }

    const clientes =
      await clienteDeudorModel.buscarCliente(texto);

    res.status(200).json(clientes);

  } catch (error) {

    console.error("Error en el controlador:", error);

    res.status(500).json({
      mensaje: "Hubo un error al buscar clientes."
    });

  }
}
module.exports = {
  obtenerDeudores,
  crearClienteDeudor,
  buscarClienteDeudor,
  actualizarTelefono,
  actualizarCliente
};
