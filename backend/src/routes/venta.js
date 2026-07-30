const express = require("express");
const router = express.Router();
const ventaController = require("../controllers/venta");

// =========================================================
// 1️⃣ RUTAS ESPECÍFICAS (Fijas) - ¡Siempre van primero!
// =========================================================

router.post("/", ventaController.crearVenta);                        // crea la venta vacía en la caja
router.get("/deudores", ventaController.listarClientesMorosos);      // trae la lista de morosos
router.put("/pagar", ventaController.procesarPago);                  // procesa el pago de boletas

// =========================================================
// 2️⃣ RUTAS DINÁMICAS (Con :parámetros) - ¡Van al final!
// =========================================================

// Esta es para ver qué boletas debe un cliente específico
router.get("/deudas/:cliente_id", ventaController.obtenerDeudas);

// --- RUTAS DE LA CAJA (Atrapan IDs, por eso van a lo último) ---
router.get("/:venta_id", ventaController.obtenerResumen);                           // trae el resumen actual
router.post("/:venta_id/productos", ventaController.agregarProducto);               // escanear
router.put("/:venta_id/productos/:producto_id", ventaController.actualizarCantidad); // botones +/-
router.delete("/:venta_id/productos/:producto_id", ventaController.eliminarProducto); // basurero
router.post("/:venta_id/finalizar", ventaController.finalizarVenta);                // finalizar venta

module.exports = router;