//Model de producto para realizar las funciones
const db = require("../db");

//Funcion para obtener todos los productos, espera de la base de datos la lista de todos los productos
async function obtener_productos() {
    const resultado = await db.query("SELECT *FROM producto");
    
    return resultado.rows;
}

//Funcion para modificar producto
async function modficar_producto(producto) {
    await db.query(

        `UPDATE producto
        SET
            nombre = $1,
            precio = $2,
            stock = 3
        WHERE codigo_barra = $4
        `,

        [
            producto.nombre,
            producto.precio,
            producto.stock,
            producto.codigo_barra
        ]
    );

}

module.exports = {
    obtener_productos,
    modficar_producto
};