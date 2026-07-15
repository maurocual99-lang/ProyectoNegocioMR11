const express = require ("express");

const router = express.Router();
const productoController = require ("../controllers/producto");

router.get ("/",productoController.listar_productos);

router.put ("/", productoController.modficar_producto);

module.exports = router;