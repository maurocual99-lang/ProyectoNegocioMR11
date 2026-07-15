
const productoModel = require ("../models/producto");

async function listar_productos(req, res) {
    const productos = await productoModel.obtener_productos();
    res.json(productos);

}
async function crearProducto(req, res) {
  try {
    //obtenemos las datos solicitados desde el front
    const { codigo_barra, nombre, precio, stock, categoria } = req.body;

    // Le paso los datos a la base de datos en orden exacto
    const producto = await productoModel.crearProducto(
      codigo_barra, 
      precio, 
      stock, 
      categoria,
      nombre
    );
    res.status(201).json(producto); //Codigo de exito 201

  } catch (error) {
    console.error("Error en el controlador al crear producto:", error);//Si existe un producto creado agarramos el error
    res.status(500).json({  //notificar al front del error
      mensaje: "Hubo un error al intentar guardar el producto." 
    });
  }
}

module.exports = {
    listar_productos
};
module.exports = {
    crearProducto
};