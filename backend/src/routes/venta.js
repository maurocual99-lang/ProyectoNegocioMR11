const express = require("express");

const router = express.Router();
const ventaController = require("../controllers/venta");

router.post("/", ventaController.crearVenta);                                      // crea la venta vacía
router.get("/:venta_id", ventaController.obtenerResumen);                           // trae el resumen actual
router.post("/:venta_id/productos", ventaController.agregarProducto);               // escanear
router.put("/:venta_id/productos/:producto_id", ventaController.actualizarCantidad); // botones +/-
router.delete("/:venta_id/productos/:producto_id", ventaController.eliminarProducto); // basurero
router.post("/:venta_id/finalizar", ventaController.finalizarVenta);                // finalizar venta

module.exports = router;