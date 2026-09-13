
const productoModel = require ("../models/producto");

async function listar_productos(req, res) {
    const productos = await productoModel.obtener_productos();
    res.json(productos);

}

async function crearProducto(req, res) {
    try {

        const {
            codigo_barra,
            stock,
            categoria,
            precio,
            nombre,
            tipo_venta
        } = req.body;


        if (!nombre?.trim()) {
            return res.status(400).json({
                mensaje: "El nombre es obligatorio."
            });
        }


        if (
            !tipo_venta ||
            !["UNIDAD", "PESO"].includes(tipo_venta)
        ) {
            return res.status(400).json({
                mensaje: "Tipo de venta inválido."
            });
        }


        /*
         * Los productos por UNIDAD necesitan
         * código de barras.
         *
         * Los productos por PESO pueden no tenerlo.
         */
        if (
            tipo_venta === "UNIDAD" &&
            !codigo_barra?.trim()
        ) {
            return res.status(400).json({
                mensaje:
                    "Los productos por unidad necesitan código de barras."
            });
        }


        let existe = null;

        if (codigo_barra?.trim()) {
            existe =
                await productoModel.buscarProducto(
                    codigo_barra.trim()
                );
        }


        if (existe) {
            return res.json({
                existe: true,
                producto: existe
            });
        }


        const producto =
            await productoModel.crearProducto(
                codigo_barra?.trim() || null,
                stock,
                categoria,
                precio,
                nombre.trim(),
                tipo_venta
            );


        res.status(201).json({
            existe: false,
            producto
        });

    } catch (error) {

        console.error(
            "Error al crear producto:",
            error
        );

        res.status(500).json({
            mensaje:
                "Hubo un error al intentar guardar el producto."
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

async function modificar_producto(req, res) {
    try {
        const producto = req.body;

        console.log("Producto recibido para modificar:", producto);

        const resultado = await productoModel.modificar_producto(producto);

        res.json({
            mensaje: "Producto Modificado Correctamente",
            producto: resultado
        });

    } catch (error) {
        console.error("ERROR AL MODIFICAR PRODUCTO:");
        console.error(error);

        if (error.code === "23505") {
            return res.status(409).json({
                mensaje: "Ya existe otro producto con ese código de barras."
            });
        }

        if (error.code === "22001") {
            return res.status(400).json({
                mensaje: "Uno de los textos ingresados es demasiado largo."
            });
        }

        if (error.code === "22003") {
            return res.status(400).json({
                mensaje: "El precio ingresado es demasiado grande."
            });
        }

        return res.status(500).json({
            mensaje: "Hubo un error al modificar el producto.",
            error: error.message
        });
    }
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