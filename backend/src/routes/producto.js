const express = require ("express");

const router = express.Router();
const productoController = require ("../controllers/producto");

router.get ("/",productoController.listar_productos);
router.post("/", productoController.crearProducto);
router.put("/:codigo_barra", productoController.eliminarProducto);
router.put ("/", productoController.modificar_producto);

module.exports = router;