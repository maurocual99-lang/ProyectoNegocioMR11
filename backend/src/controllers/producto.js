
const productoModel = require ("../models/producto");

async function listar_productos(req, res) {
    const productos = await productoModel.obtener_productos();
    res.json(productos);

}
async function crearProducto(req, res) {
  try {
    //obtenemos las datos solicitados desde el front
    const { codigo_barra, stock, categoria,precio , nombre } = req.body;

    const existe = await productoModel.buscarProducto(codigo_barra);

    if(!existe){

      // Le paso los datos a la base de datos en orden exacto
      const producto = await productoModel.crearProducto(
        codigo_barra, 
        stock, 
        categoria,
        precio,
        nombre
      );

      res.status(201).json({
        existe: false,
        producto}); //Codigo de exito 201

    } else{
      return res.json({
        existe: true
      });
    }
      

  } catch (error) {
    console.error("Error en el controlador al crear producto:", error);//Si existe un producto creado agarramos el error
    res.status(500).json({  //notificar al front del error
      mensaje: "Hubo un error al intentar guardar el producto." 
    });
  }
}

async function agregarStock(req,res){

    const { stock } = req.body;

    await productoModel.agregarStock(
        req.params.codigo_barra,
        stock
    );

    res.json({
        mensaje:"Stock agregado correctamente"
    });
}

async function modificar_producto(req,res) {
    const producto = req.body;

    await productoModel.modificar_producto(producto);

    res.json({
        mensaje: "Producto Modificado Correctamente"
    });
}
async function eliminarProducto(req, res) {
    await productoModel.eliminarProducto(req.params.codigo_barra);
    res.sendStatus(200);
}
module.exports = {
    listar_productos,
    modificar_producto,
    crearProducto,
    eliminarProducto,
    agregarStock
};