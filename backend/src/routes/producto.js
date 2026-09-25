const express =
  require("express");


const router =
  express.Router();


const productoController =
  require("../controllers/producto");


/*
 * Rutas específicas antes de la ruta antigua por código.
 */

router.get(
  "/",
  productoController.listar_productos
);


router.post(
  "/",
  productoController.crearProducto
);


/*
 * Editar por ID.
 * Esto funciona aunque codigo_barra sea NULL.
 */
router.put(
  "/id/:id",
  productoController.modificarProductoPorId
);


router.put(
  "/id/:id/stock",
  productoController.agregarStockPorId
);


/*
 * Eliminar por ID.
 * También funciona con productos sin código.
 */
router.delete(
  "/id/:id",
  productoController.eliminarProductoPorId
);


router.put(
  "/:codigo_barra/stock",
  productoController.agregarStock
);


/*
 * Ruta vieja conservada para no romper otras pantallas
 * que todavía eliminen por código de barras.
 */
router.put(
  "/:codigo_barra",
  productoController.eliminarProducto
);


module.exports =
  router;
