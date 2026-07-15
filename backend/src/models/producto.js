//Model de producto para realizar las funciones
const db = require("../db");

//Funcion para obtener todos los productos, espera de la base de datos la lista de todos los productos
async function obtener_productos() {
    const resultado = await db.query("SELECT *FROM producto");
    
    return resultado.rows;
}

//Funcion para modificar producto
async function modificar_producto(producto) {
    await db.query(

        `UPDATE producto
        SET
            nombre = $1,
            precio = $2,
            stock = $3
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
//Funcion para crear un nuevo producto
async function crearProducto(codigo_barra, stock, categoria, precio,nombre) {
    try {
        const query= `
        INSERT INTO producto(codigo_barra, stock, categoria, precio, nombre) 
        VALUES($1,$2,$3,$4,$5)
        RETURNING *`;
        const valores = [
            codigo_barra,
            stock,
            categoria,
            precio,
            nombre
        ];
        const resultado = await db.query(query, valores)
        console.log("¡Producto creado con éxito!");
    return resultado.rows[0]; // Devuelve el producto con su nuevo ID

    }catch (error) {
        console.error("Error al guardar el producto en la base de datos:", error);
    throw error;
  }
}

module.exports = {
    obtener_productos,
    modificar_producto,
    crearProducto
};