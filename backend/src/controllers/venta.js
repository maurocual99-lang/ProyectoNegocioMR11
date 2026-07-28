const ventaModel = require("../models/venta");

async function crearVenta(req, res) {
    try {
        const { cliente_id, cuenta_pendiente } = req.body;
        const venta = await ventaModel.crearVentaVacia(cliente_id, cuenta_pendiente);
        res.status(201).json(venta);
    } catch (error) {
        console.error("Error al crear la venta:", error);
        res.status(500).json({ mensaje: "Hubo un error al iniciar la venta." });
    }
}

async function obtenerResumen(req, res) {
    try {
        const resumen = await ventaModel.obtenerResumen(req.params.venta_id);
        res.json(resumen);
    } catch (error) {
        console.error("Error al obtener el resumen:", error);
        res.status(500).json({ mensaje: "Hubo un error al obtener la venta." });
    }
}

// Se llama al ESCANEAR
async function agregarProducto(req, res) {
    try {
        const { codigo_barra } = req.body;
        const resultado = await ventaModel.agregarProductoAVenta(req.params.venta_id, codigo_barra);
        res.json(resultado);
    } catch (error) {
        console.error("Error al agregar producto a la venta:", error);
        res.status(500).json({ mensaje: "Hubo un error al agregar el producto." });
    }
}

// Se llama con los botones +/- de cantidad
async function actualizarCantidad(req, res) {
    try {
        const { delta } = req.body; // +1 o -1
        const resultado = await ventaModel.actualizarCantidad(req.params.venta_id, req.params.producto_id, delta);
        res.json(resultado);
    } catch (error) {
        console.error("Error al actualizar cantidad:", error);
        res.status(500).json({ mensaje: "Hubo un error al actualizar la cantidad." });
    }
}

// Se llama con el botón de basurero
async function eliminarProducto(req, res) {
    try {
        const resultado = await ventaModel.eliminarProductoDeVenta(req.params.venta_id, req.params.producto_id);
        res.json(resultado);
    } catch (error) {
        console.error("Error al eliminar producto de la venta:", error);
        res.status(500).json({ mensaje: "Hubo un error al eliminar el producto." });
    }
}

// Se llama al apretar "Finalizar Venta"
async function finalizarVenta(req, res) {
    try {
        const resultado = await ventaModel.finalizarVenta(req.params.venta_id);
        res.json(resultado);
    } catch (error) {
        console.error("Error al finalizar la venta:", error);
        res.status(409).json({ mensaje: error.message || "No se pudo finalizar la venta." });
    }
}

module.exports = {
    crearVenta,
    obtenerResumen,
    agregarProducto,
    actualizarCantidad,
    eliminarProducto,
    finalizarVenta
};