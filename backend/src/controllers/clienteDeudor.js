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
    const { nombre, apellido, apodo } = req.body;

    // Validacion
    if (!nombre || !apellido) {
      return res.status(400).json({
        mensaje: "El nombre y el apellido son obligatorios."
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
      apodo
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
  buscarClienteDeudor
};