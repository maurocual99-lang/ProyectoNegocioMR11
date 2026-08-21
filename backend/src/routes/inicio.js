const express =
  require("express");

const router =
  express.Router();

const inicioController =
  require("../controllers/inicio");

router.get(
  "/",
  inicioController.obtenerDatosInicio
);

module.exports = router;