const express = require("express");

const router = express.Router();
const clienteDeudorController = require("../controllers/clienteDeudor");

// Obtener todos los deudores
router.get("/", clienteDeudorController.obtenerDeudores);

// Buscar un cliente por nombre y apellido
router.get("/buscarDeudor", clienteDeudorController.buscarClienteDeudor);

// Crear un nuevo cliente
router.post("/", clienteDeudorController.crearClienteDeudor);

// Guardar o corregir el teléfono usado para WhatsApp
router.put("/:cliente_id/telefono", clienteDeudorController.actualizarTelefono);

module.exports = router;
