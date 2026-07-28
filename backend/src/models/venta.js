const db = require("../db");

// Crea la venta vacía apenas se entra a la pantalla de venta
async function crearVentaVacia(cliente_id, cuenta_pendiente) {
    const resultado = await db.query(
        `INSERT INTO venta (total, cliente_id, cuenta_pendiente)
         VALUES (0, $1, $2)
         RETURNING id, fecha_venta, total, cliente_id, cuenta_pendiente`,
        [cliente_id || null, cuenta_pendiente || false]
    );
    return resultado.rows[0];
}

// Trae la venta con su detalle, para armar el resumen (total, cantidad de productos, unidades)
async function obtenerResumen(venta_id) {
    const detalleResult = await db.query(
        `SELECT dv.producto_id, dv.cantidad, dv.precio_unitario, dv.subtotal, p.nombre
         FROM detalle_venta dv
         JOIN producto p ON p.id = dv.producto_id
         WHERE dv.venta_id = $1
         ORDER BY dv.id`,
        [venta_id]
    );

    const detalle = detalleResult.rows;
    const total = detalle.reduce((acc, item) => acc + Number(item.subtotal), 0);
    const cantidadProductos = detalle.length;
    const cantidadUnidades = detalle.reduce((acc, item) => acc + item.cantidad, 0);

    return { detalle, total, cantidadProductos, cantidadUnidades };
}

// Recalcula y actualiza el total en la tabla venta (para mantenerlo consistente)
async function actualizarTotalVenta(venta_id) {
    await db.query(
        `UPDATE venta
         SET total = (SELECT COALESCE(SUM(subtotal), 0) FROM detalle_venta WHERE venta_id = $1)
         WHERE id = $1`,
        [venta_id]
    );
}

// ESCANEAR: si el producto ya está en el detalle de esta venta, le suma 1. Si no, lo agrega.
async function agregarProductoAVenta(venta_id, codigo_barra) {
    const productoResult = await db.query(
        `SELECT * FROM producto WHERE codigo_barra = $1 AND activo = TRUE`,
        [codigo_barra]
    );

    const producto = productoResult.rows[0];
    if (!producto) {
        return { existe: false };
    }

    const existente = await db.query(
        `SELECT * FROM detalle_venta WHERE venta_id = $1 AND producto_id = $2`,
        [venta_id, producto.id]
    );

    if (existente.rows.length > 0) {
        const nuevaCantidad = existente.rows[0].cantidad + 1;

        if (nuevaCantidad > producto.stock) {
            return { existe: true, error: `No hay más stock de "${producto.nombre}"`, ...(await obtenerResumen(venta_id)) };
        }

        await db.query(
            `UPDATE detalle_venta
             SET cantidad = $1::int, subtotal = $1::int * precio_unitario
             WHERE venta_id = $2 AND producto_id = $3`,
            [nuevaCantidad, venta_id, producto.id]
        );
    } else {
        if (producto.stock < 1) {
            return { existe: true, error: `"${producto.nombre}" no tiene stock disponible`, ...(await obtenerResumen(venta_id)) };
        }

        await db.query(
            `INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal)
             VALUES ($1, $2, 1, $3, $3)`,
            [venta_id, producto.id, producto.precio]
        );
    }

    await actualizarTotalVenta(venta_id);
    return { existe: true, ...(await obtenerResumen(venta_id)) };
}

// Botones +/- de cantidad en la tabla: actualiza directamente detalle_venta
async function actualizarCantidad(venta_id, producto_id, delta) {
    const productoResult = await db.query(`SELECT stock, nombre FROM producto WHERE id = $1`, [producto_id]);
    const producto = productoResult.rows[0];

    const detalleResult = await db.query(
        `SELECT cantidad FROM detalle_venta WHERE venta_id = $1 AND producto_id = $2`,
        [venta_id, producto_id]
    );

    if (detalleResult.rows.length === 0) {
        return { error: "El producto no está en esta venta", ...(await obtenerResumen(venta_id)) };
    }

    const nuevaCantidad = detalleResult.rows[0].cantidad + delta;

    if (nuevaCantidad <= 0) {
        await db.query(`DELETE FROM detalle_venta WHERE venta_id = $1 AND producto_id = $2`, [venta_id, producto_id]);
    } else if (nuevaCantidad > producto.stock) {
        return { error: `No hay más stock de "${producto.nombre}"`, ...(await obtenerResumen(venta_id)) };
    } else {
        await db.query(
            `UPDATE detalle_venta
             SET cantidad = $1::int, subtotal = $1::int * precio_unitario
             WHERE venta_id = $2 AND producto_id = $3`,
            [nuevaCantidad, venta_id, producto_id]
        );
    }

    await actualizarTotalVenta(venta_id);
    return await obtenerResumen(venta_id);
}

// Botón de basurero: saca el producto de la venta por completo
async function eliminarProductoDeVenta(venta_id, producto_id) {
    await db.query(`DELETE FROM detalle_venta WHERE venta_id = $1 AND producto_id = $2`, [venta_id, producto_id]);
    await actualizarTotalVenta(venta_id);
    return await obtenerResumen(venta_id);
}

// FINALIZAR VENTA: recién acá se descuenta el stock de todo lo que quedó en el detalle
async function finalizarVenta(venta_id) {
    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const detalleResult = await client.query(
            `SELECT producto_id, cantidad FROM detalle_venta WHERE venta_id = $1`,
            [venta_id]
        );

        if (detalleResult.rows.length === 0) {
            throw new Error("La venta no tiene productos.");
        }

        for (const item of detalleResult.rows) {
            const resultado = await client.query(
                `UPDATE producto SET stock = stock - $1 WHERE id = $2 AND stock >= $1`,
                [item.cantidad, item.producto_id]
            );

            if (resultado.rowCount === 0) {
                throw new Error(`Stock insuficiente para el producto id ${item.producto_id}`);
            }
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }

    return await obtenerResumen(venta_id);
}

module.exports = {
    crearVentaVacia,
    obtenerResumen,
    agregarProductoAVenta,
    actualizarCantidad,
    eliminarProductoDeVenta,
    finalizarVenta
};