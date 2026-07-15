
const productoModel = require ("../models/producto");

async function listar_productos(req, res) {
    const productos = await productoModel.obtener_productos();
    res.json(productos);

}

async function modficar_producto(req,res) {
    const producto = req.body;

    await productoModel.modficar_producto(producto);

    res.json({
        mensaje: "Producto Modificado Correctamente"
    });
}

module.exports = {
    listar_productos,
    modficar_producto
};