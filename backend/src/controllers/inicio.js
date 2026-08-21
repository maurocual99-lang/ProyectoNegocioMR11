const inicioModel =
  require("../models/inicio");

async function obtenerDatosInicio(
  req,
  res
) {
  try {

    const datos =
      await inicioModel
        .obtenerDatosInicio();

    res.status(200).json(datos);

  } catch (error) {

    console.error(
      "Error al cargar el inicio:",
      error
    );

    res.status(500).json({
      mensaje:
        "No se pudo cargar el inicio.",
    });
  }
}

module.exports = {
  obtenerDatosInicio,
};