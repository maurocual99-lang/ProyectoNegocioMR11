const express = require("express");

const router =
  express.Router();

const reporteController =
  require("../controllers/reporte");

router.get(
  "/mensual",
  reporteController.obtenerReporteMensual
);

module.exports =
  router;