const reporteModel =
  require("../models/reporte");


async function obtenerReporteMensual(
  req,
  res
) {

  try {

    const ahora =
      new Date();


    const mes =
      Number(
        req.query.mes ??
        ahora.getMonth() + 1
      );


    const anio =
      Number(
        req.query.anio ??
        ahora.getFullYear()
      );


    console.log(
      "Generando reporte:",
      {
        mes,
        anio,
      }
    );


    if (
      !Number.isInteger(mes) ||
      mes < 1 ||
      mes > 12
    ) {

      return res
        .status(400)
        .json({
          mensaje:
            "El mes debe estar entre 1 y 12.",
        });

    }


    if (
      !Number.isInteger(anio)
    ) {

      return res
        .status(400)
        .json({
          mensaje:
            "El año no es válido.",
        });

    }


    const reporte =
      await reporteModel
        .obtenerReporteMensual(
          mes,
          anio
        );


    return res
      .status(200)
      .json(
        reporte
      );


  } catch (error) {

    console.error(
      "=================================="
    );

    console.error(
      "ERROR REAL DEL REPORTE"
    );

    console.error(
      error
    );

    console.error(
      "Mensaje:",
      error.message
    );

    console.error(
      "Código PostgreSQL:",
      error.code
    );

    console.error(
      "Detalle:",
      error.detail
    );

    console.error(
      "=================================="
    );


    /*
     * Lo dejamos así mientras estamos
     * desarrollando para poder saber
     * exactamente qué consulta falla.
     */
    return res
      .status(500)
      .json({
        mensaje:
          "No se pudo generar el reporte mensual.",

        error:
          error.message,

        codigo:
          error.code,

        detalle:
          error.detail,
      });

  }
}


module.exports = {
  obtenerReporteMensual,
};