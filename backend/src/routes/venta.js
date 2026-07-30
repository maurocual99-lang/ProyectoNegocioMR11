const express = require("express");
const router = express.Router();
const ventaController = require("../controllers/venta");


router.post("/", ventaController.crearVenta);                        // crea la venta vacía en la caja
router.get("/deudores", ventaController.listarClientesMorosos);      // trae la lista de morosos
router.put("/pagar", ventaController.procesarPago);                  // procesa el pago de boletas


router.get("/deudas/:cliente_id", ventaController.obtenerDeudas);

router.get("/:venta_id", ventaController.obtenerResumen);                           // trae el resumen actual
router.post("/:venta_id/productos", ventaController.agregarProducto);               // escanear
router.put("/:venta_id/productos/:producto_id", ventaController.actualizarCantidad); // botones +/-
router.delete("/:venta_id/productos/:producto_id", ventaController.eliminarProducto); // basurero
router.post("/:venta_id/finalizar", ventaController.finalizarVenta);                // finalizar venta
router.put("/:venta_id/cliente",ventaController.asociarCliente);
router.delete("/:venta_id/cliente",ventaController.quitarCliente);

module.exports = router;