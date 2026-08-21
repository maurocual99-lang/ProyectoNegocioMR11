const reporteModel =
  require("../models/reporte");
async function obtenerReporteMensual(req, res) {
  try {
    const ahora = new Date();

    const mes = Number(
      req.query.mes ?? ahora.getMonth() + 1
    );

    const anio = Number(
      req.query.anio ?? ahora.getFullYear()
    );

    if (
      !Number.isInteger(mes) ||
      mes < 1 ||
      mes > 12
    ) {
      return res.status(400).json({
        mensaje: "El mes debe ser un número entre 1 y 12.",
      });
    }

    if (
      !Number.isInteger(anio) ||
      anio < 2000 ||
      anio > 2100
    ) {
      return res.status(400).json({
        mensaje: "El año ingresado no es válido.",
      });
    }

    const reporte =
      await reporteModel.obtenerReporteMensual(
        mes,
        anio
      );

    res.status(200).json(reporte);

  } catch (error) {
    console.error(
      "Error al generar el reporte mensual:",
      error
    );

    res.status(500).json({
      mensaje:
        "No se pudo generar el reporte mensual.",
    });
  }
}

module.exports = {
  obtenerReporteMensual,
};
