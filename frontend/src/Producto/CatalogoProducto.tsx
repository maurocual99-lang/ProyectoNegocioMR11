import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const categorias = [
  "Bebidas",
  "Kiosco",
  "Fiambres",
  "Almacen",
  "Regaleria",
  "Verduleria",
] as const;

type Categoria = typeof categorias[number];

interface Producto {
  codigo_barra: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: Categoria;
}

function Catalogo() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState<Producto[]>([]);

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    try {
      const res = await fetch("http://localhost:3000/productos");
      if (!res.ok) throw new Error("Error al buscar productos");
      const datos = await res.json();
      setProductos(datos);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="producto-page">
      <div className="producto-card">
        <h1>Catálogo de Productos</h1>
        <table className="tabla-productos">
          <thead>
            <tr>
              <th>Código De Barras</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Categoría</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.codigo_barra}>
                <td>{producto.codigo_barra}</td>
                <td>{producto.nombre}</td>
                <td>{producto.precio}</td>
                <td>{producto.stock}</td>
                <td>{producto.categoria}</td>
                <td>
                  <button
                    className="btn-editar"
                    onClick={() =>
                      navigate("/modificar-producto", { state: { producto } }) 
                    }
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "15px" }}>
          <button
            className="btn-volver"
            type="button"
            onClick={() => navigate("/menu")}
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}

export default Catalogo;