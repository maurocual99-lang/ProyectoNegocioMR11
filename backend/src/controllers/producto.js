const productoModel =
  require("../models/producto");


function numeroValido(
  valor
) {

  const numero =
    Number(
      valor
    );


  return (
    Number.isFinite(
      numero
    )
    &&
    numero >= 0
  );

}


async function listar_productos(
  req,
  res
) {

  try {

    const productos =
      await productoModel.obtener_productos();


    res.json(
      productos
    );

  } catch (
    error
  ) {

    console.error(
      "Error al listar productos:",
      error
    );


    res
      .status(
        500
      )
      .json({
        mensaje:
          "No se pudo cargar el catálogo.",
      });

  }

}


async function crearProducto(
  req,
  res
) {

  try {

    const {
      codigo_barra,
      stock,
      categoria,
      precio,
      nombre,
      tipo_venta,
    } =
      req.body;


    const nombreLimpio =
      String(
        nombre ||
        ""
      ).trim();


    const codigoLimpio =
      String(
        codigo_barra ||
        ""
      ).trim();


    if (
      !nombreLimpio
    ) {

      return res
        .status(
          400
        )
        .json({
          mensaje:
            "El nombre es obligatorio.",
        });

    }

    if (
      nombreLimpio.length > 120
    ) {
      return res
        .status(400)
        .json({
          mensaje:
            "El nombre puede tener hasta 120 caracteres.",
        });
    }


    if (
      ![
        "UNIDAD",
        "PESO",
      ].includes(
        tipo_venta
      )
    ) {

      return res
        .status(
          400
        )
        .json({
          mensaje:
            "Tipo de venta inválido.",
        });

    }


    if (
      tipo_venta ===
      "UNIDAD"
      &&
      !codigoLimpio
    ) {

      return res
        .status(
          400
        )
        .json({
          mensaje:
            "Los productos por unidad necesitan código de barras.",
        });

    }


    if (
      !numeroValido(
        stock
      )
      ||
      !numeroValido(
        precio
      )
    ) {

      return res
        .status(
          400
        )
        .json({
          mensaje:
            "Precio y stock deben ser números válidos y no negativos.",
        });

    }


    if (
      codigoLimpio
    ) {

      const existente =
        await productoModel.buscarProducto(
          codigoLimpio
        );


      if (
        existente
      ) {

        return res
          .status(
            409
          )
          .json({
            existe:
              true,

            mensaje:
              "Ya existe un producto con ese código de barras.",

            producto:
              existente,
          });

      }

    }


    const producto =
      await productoModel.crearProducto(
        codigoLimpio ||
        null,
        stock,
        categoria,
        precio,
        nombreLimpio,
        tipo_venta
      );


    res
      .status(
        201
      )
      .json({
        existe:
          false,

        producto,
      });

  } catch (
    error
  ) {

    console.error(
      "Error al crear producto:",
      error
    );


    if (
      error.code ===
      "23505"
    ) {

      return res
        .status(
          409
        )
        .json({
          mensaje:
            "Ya existe otro producto con ese código de barras.",
        });

    }


    res
      .status(
        500
      )
      .json({
        mensaje:
          "Hubo un error al intentar guardar el producto.",
      });

  }

}


async function modificarProductoPorId(
  req,
  res
) {

  try {

    const productoId =
      Number(
        req.params.id
      );


    if (
      !Number.isInteger(
        productoId
      )
      ||
      productoId <= 0
    ) {

      return res
        .status(
          400
        )
        .json({
          mensaje:
            "ID de producto inválido.",
        });

    }


    const {
      codigo_barra,
      nombre,
      precio,
      stock,
      categoria,
      tipo_venta,
    } =
      req.body;


    const nombreLimpio =
      String(
        nombre ||
        ""
      ).trim();


    const codigoLimpio =
      String(
        codigo_barra ||
        ""
      ).trim();


    if (
      !nombreLimpio
    ) {

      return res
        .status(
          400
        )
        .json({
          mensaje:
            "El nombre es obligatorio.",
        });

    }

    if (
      nombreLimpio.length > 120
    ) {
      return res
        .status(400)
        .json({
          mensaje:
            "El nombre puede tener hasta 120 caracteres.",
        });
    }


    if (
      ![
        "UNIDAD",
        "PESO",
      ].includes(
        tipo_venta
      )
    ) {

      return res
        .status(
          400
        )
        .json({
          mensaje:
            "Tipo de venta inválido.",
        });

    }


    if (
      tipo_venta ===
      "UNIDAD"
      &&
      !codigoLimpio
    ) {

      return res
        .status(
          400
        )
        .json({
          mensaje:
            "Los productos por unidad necesitan código de barras.",
        });

    }


    if (
      !numeroValido(
        precio
      )
      ||
      !numeroValido(
        stock
      )
    ) {

      return res
        .status(
          400
        )
        .json({
          mensaje:
            "Precio y stock deben ser números válidos y no negativos.",
        });

    }


    if (
      codigoLimpio
    ) {

      const otroProducto =
        await productoModel
          .buscarProductoPorCodigoExceptoId(
            codigoLimpio,
            productoId
          );


      if (
        otroProducto
      ) {

        return res
          .status(
            409
          )
          .json({
            mensaje:
              "Ya existe otro producto con ese código de barras.",
          });

      }

    }


    const resultado =
      await productoModel.modificarProductoPorId(
        productoId,
        {
          codigo_barra:
            codigoLimpio ||
            null,

          nombre:
            nombreLimpio,

          precio:
            Number(
              precio
            ),

          stock:
            Number(
              stock
            ),

          categoria,

          tipo_venta,
        }
      );


    res.json({
      mensaje:
        "Producto modificado correctamente.",

      producto:
        resultado,
    });

  } catch (
    error
  ) {

    console.error(
      "ERROR AL MODIFICAR PRODUCTO:",
      error
    );


    if (
      error.code ===
      "23505"
    ) {

      return res
        .status(
          409
        )
        .json({
          mensaje:
            "Ya existe otro producto con ese código de barras.",
        });

    }


    if (
      error.message ===
      "No se encontró el producto a modificar."
    ) {

      return res
        .status(
          404
        )
        .json({
          mensaje:
            error.message,
        });

    }


    res
      .status(
        500
      )
      .json({
        mensaje:
          error.message ||
          "Hubo un error al modificar el producto.",
      });

  }

}


async function eliminarProductoPorId(
  req,
  res
) {

  try {

    const productoId =
      Number(
        req.params.id
      );


    if (
      !Number.isInteger(
        productoId
      )
      ||
      productoId <= 0
    ) {

      return res
        .status(
          400
        )
        .json({
          mensaje:
            "ID de producto inválido.",
        });

    }


    await productoModel.eliminarProductoPorId(
      productoId
    );


    res.json({
      mensaje:
        "Producto eliminado correctamente.",
    });

  } catch (
    error
  ) {

    console.error(
      "Error al eliminar producto:",
      error
    );


    if (
      error.message ===
      "No se encontró el producto a eliminar."
    ) {

      return res
        .status(
          404
        )
        .json({
          mensaje:
            error.message,
        });

    }


    res
      .status(
        500
      )
      .json({
        mensaje:
          "No se pudo eliminar el producto.",
      });

  }

}


/*
 * Compatibilidad con la pantalla anterior.
 */
async function eliminarProducto(
  req,
  res
) {

  try {

    await productoModel.eliminarProducto(
      req.params.codigo_barra
    );


    res.json({
      mensaje:
        "Producto eliminado correctamente.",
    });

  } catch (
    error
  ) {

    console.error(
      "Error al eliminar producto por código:",
      error
    );


    res
      .status(
        500
      )
      .json({
        mensaje:
          "No se pudo eliminar el producto.",
      });

  }

}


async function agregarStock(
  req,
  res
) {

  try {

    const {
      stock,
    } =
      req.body;


    if (
      !numeroValido(
        stock
      )
    ) {

      return res
        .status(
          400
        )
        .json({
          mensaje:
            "El stock debe ser un número válido.",
        });

    }


    await productoModel.agregarStock(
      req.params.codigo_barra,
      stock
    );


    res.json({
      mensaje:
        "Stock agregado correctamente.",
    });

  } catch (
    error
  ) {

    console.error(
      "Error al agregar stock:",
      error
    );


    res
      .status(
        500
      )
      .json({
        mensaje:
          "No se pudo agregar stock.",
      });

  }

}


async function agregarStockPorId(
  req,
  res
) {
  try {
    const productoId = Number(req.params.id);
    const cantidad = Number(req.body.stock);

    if (!Number.isInteger(productoId) || productoId <= 0) {
      return res.status(400).json({
        mensaje: "ID de producto inválido.",
      });
    }

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return res.status(400).json({
        mensaje: "Ingresá una cantidad mayor que cero.",
      });
    }

    const producto = await productoModel.agregarStockPorId(
      productoId,
      cantidad
    );

    if (!producto) {
      return res.status(404).json({
        mensaje: "No se encontró el producto.",
      });
    }

    res.json({
      mensaje: "Stock agregado correctamente.",
      producto,
    });
  } catch (error) {
    console.error("Error al agregar stock por ID:", error);
    res.status(500).json({
      mensaje: "No se pudo agregar stock.",
    });
  }
}


module.exports = {
  listar_productos,
  crearProducto,
  modificarProductoPorId,
  eliminarProductoPorId,
  eliminarProducto,
  agregarStock,
  agregarStockPorId,
};
