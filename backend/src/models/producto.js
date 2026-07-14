//Model de producto para realizar las funciones
const db = require("../db");

//Funcion para obtener todos los productos, espera de la base de datos la lista de todos los productos
async function obtener_productos() {
    const resultado = await db.query("SELECT *FROM producto");
    
    return resultado.rows;
}

module.exports = {
    obtener_productos
};