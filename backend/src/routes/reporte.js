const express = require("express");
const router = express.Router();

const reporteController =
  require("../controllers/reporte");

/*
 * GET /reportes/mensual?mes=8&anio=2026
 */
router.get(
  "/mensual",
  reporteController.obtenerReporteMensual
);

module.exports = router;
