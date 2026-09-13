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

async function finalizarVenta(req, res) {
    try {
        const resultado = await ventaModel.finalizarVenta(req.params.venta_id);
        res.json(resultado);
    } catch (error) {
        console.error("Error al finalizar la venta:", error);
        res.status(409).json({ mensaje: error.message || "No se pudo finalizar la venta." });
    }
}

async function obtenerDeudas(req, res) {
    try {
        const { cliente_id } = req.params;
        const deudas = await ventaModel.obtenerDeudasPorCliente(cliente_id);
        res.status(200).json(deudas);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener las deudas del cliente." });
    }
}
async function obtenerHistorial(
    req,
    res
) {

    try {

        const historial =
            await ventaModel
                .obtenerHistorialCliente(
                    req.params.cliente_id
                );

        res.json(
            historial
        );

    } catch (error) {

        console.error(
            error
        );

        res.status(500).json({
            mensaje:
                "No se pudo obtener el historial."
        });

    }
}

async function procesarPago(
    req,
    res
) {

    try {

        const {
            cliente_id,
            aplicaciones
        } = req.body;


        if (!cliente_id) {

            return res.status(400).json({
                mensaje:
                    "Falta el cliente."
            });

        }


        if (
            !Array.isArray(
                aplicaciones
            ) ||
            aplicaciones.length === 0
        ) {

            return res.status(400).json({
                mensaje:
                    "Seleccioná al menos una venta."
            });

        }


        const pago =
            await ventaModel
                .registrarPago(
                    cliente_id,
                    aplicaciones
                );


        res.status(200).json({
            mensaje:
                "Pago registrado correctamente.",
            pago
        });


    } catch (error) {

        console.error(
            "Error al procesar pago:",
            error
        );


        res.status(400).json({
            mensaje:
                error.message ||
                "No se pudo registrar el pago."
        });

    }
}

async function listarClientesMorosos(req, res) {
    try {
        const clientes = await ventaModel.obtenerClientesConDeuda();
        res.status(200).json(clientes);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al cargar la lista de deudores." });
    }
}

async function asociarCliente(req, res) {
    try {
        const { cliente_id } = req.body;

        const resultado = await ventaModel.asociarCliente(
            req.params.venta_id,
            cliente_id
        );

        res.json(resultado);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al asociar el cliente."
        });
    }
}
async function quitarCliente(req, res) {
    try {

        const resultado = await ventaModel.quitarCliente(
            req.params.venta_id
        );

        res.json(resultado);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al quitar el cliente."
        });
    }
}
async function agregarProductoPeso(
    req,
    res
) {
    try {

        const {
            producto_id,
            cantidad_kg
        } = req.body;


        const resultado =
            await ventaModel
                .agregarProductoPorPeso(
                    req.params.venta_id,
                    producto_id,
                    cantidad_kg
                );


        if (resultado.error) {
            return res
                .status(400)
                .json(resultado);
        }


        res.json(resultado);

    } catch (error) {

        console.error(
            "Error al agregar producto por peso:",
            error
        );

        res.status(500).json({
            mensaje:
                "No se pudo agregar el producto por peso."
        });

    }
}

module.exports = {
    crearVenta,
    obtenerResumen,
    agregarProducto,
    agregarProductoPeso,
    actualizarCantidad,
    eliminarProducto,
    finalizarVenta,
    obtenerDeudas,
    procesarPago,
    listarClientesMorosos,
    quitarCliente,
    asociarCliente,
    obtenerHistorial
};