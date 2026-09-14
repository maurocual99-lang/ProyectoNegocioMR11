const express =
  require("express");

const router =
  express.Router();

const ventaController =
  require("../controllers/venta");

/*
 * Rutas específicas primero.
 * La ruta /:venta_id SIEMPRE al final para que no capture
 * /historial, /deudas, etc.
 */

router.post(
  "/",
  ventaController.crearVenta
);

router.get(
  "/deudores",
  ventaController.listarClientesMorosos
);

router.get(
  "/deudas/:cliente_id",
  ventaController.obtenerDeudas
);

router.get(
  "/historial/:cliente_id",
  ventaController.obtenerHistorial
);

router.put(
  "/pagar",
  ventaController.procesarPago
);

router.post(
  "/:venta_id/productos-peso",
  ventaController.agregarProductoPeso
);

router.post(
  "/:venta_id/productos",
  ventaController.agregarProducto
);

router.put(
  "/:venta_id/productos/:producto_id",
  ventaController.actualizarCantidad
);

router.delete(
  "/:venta_id/productos/:producto_id",
  ventaController.eliminarProducto
);

router.post(
  "/:venta_id/finalizar",
  ventaController.finalizarVenta
);

router.put(
  "/:venta_id/cliente",
  ventaController.asociarCliente
);

router.delete(
  "/:venta_id/cliente",
  ventaController.quitarCliente
);

/*
 * Genérica: siempre al final.
 */
router.get(
  "/:venta_id",
  ventaController.obtenerResumen
);

module.exports =
  router;
