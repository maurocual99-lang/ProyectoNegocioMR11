// Model de cliente deudor
const db = require("../db");

// Funcion para obtener todos los clientes deudores
async function obtener_deudores() {
  const resultado = await db.query("SELECT * FROM cliente");
  return resultado.rows;
}
// Buscar clientes por nombre, apellido o ambos
async function buscarCliente(texto) {
  try {

    const palabras = texto.trim().split(/\s+/);

    let query;
    let valores;

    if (palabras.length === 1) {

      query = `
        SELECT *
        FROM cliente
        WHERE
            nombre ILIKE '%' || $1 || '%'
            OR
            apellido ILIKE '%' || $1 || '%'
        ORDER BY apellido, nombre
      `;

      valores = [palabras[0]];

    } else {

      query = `
        SELECT *
        FROM cliente
        WHERE
            apellido ILIKE '%' || $1 || '%'
        AND
            nombre ILIKE '%' || $2 || '%'
        ORDER BY apellido, nombre
      `;

      valores = [
        palabras[0],
        palabras.slice(1).join(" ")
      ];

    }

    const resultado = await db.query(query, valores);

    return resultado.rows;

  } catch (error) {
    console.error("Error al buscar cliente:", error);
    throw error;
  }
}
// Funcion para crear un nuevo cliente
async function crearClienteDeudor(nombre, apellido, apodo) {
  try {
    const query = `
        INSERT INTO cliente(nombre, apellido, apodo) 
        VALUES($1, $2, $3)
        RETURNING *
    `;
    const valores = [nombre, apellido, apodo];
    
    const resultado = await db.query(query, valores);
    console.log("¡Cliente agregado con éxito!");
    
    // Devuelve el nuevo cliente deudor 
    return resultado.rows[0]; 
  } catch (error) {
    console.error("Error al guardar el cliente en la base de datos:", error);
    throw error;
  }
}

// Exportamos todas las funciones para que el controlador pueda usarlas
module.exports = {
  obtener_deudores,
  buscarCliente,
  crearClienteDeudor
};