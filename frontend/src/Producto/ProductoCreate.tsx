import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Producto.css";

const categorias = [
  "Bebidas",
  "Kiosco",
  "Fiambres",
  "Almacen",
  "Regaleria",
  "Verduleria",
];

export default function ProductoCreate() {
  const navigate = useNavigate();

  const [codigoBarra, setCodigoBarra] = useState("");
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState(categorias[0]);

  const [costo, setCosto] = useState("");
  const [ganancia, setGanancia] = useState("30");
  const [stock, setStock] = useState("");

  // Calculo precio de venta
  const precioFinal =
    Number(costo || 0) * (1 + Number(ganancia || 0) / 100);

  const guardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/productos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigo_barra: codigoBarra,
          nombre,
          precio: Number(precioFinal.toFixed(2)),
          stock: Number(stock),
          categoria,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar el producto.");
      }

      alert("Producto agregado correctamente.");

      navigate("/menu");
    } catch (error) {
      console.error(error);
      alert("Error al guardar el producto.");
    }
  };

  return (
    <div className="producto-page">
      <div className="producto-card">
        <h1> Agregar Producto</h1>
        <p>Complete los datos para registrar un nuevo producto.</p>

        <form className="producto-form" onSubmit={guardarProducto}>
          <div className="campo">
            <label>Código de Barras</label>
            <input
              type="text"
              value={codigoBarra}
              onChange={(e) => setCodigoBarra(e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label>Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label>Categoría</label>

            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label>Costo del Producto ($)</label>
            <input
              min="0"
              step="0.01"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="campo">
            <label>Ganancia (%)</label>

            <input
              min="0"
              step="0.1"
              value={ganancia}
              onChange={(e) => setGanancia(e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label>Precio de Venta ($)</label>

            <input
              value={precioFinal.toFixed(2)}
              readOnly
              className="precio"
            />
          </div>

          <div className="campo campo-completo">
            <label>Stock</label>

            <input
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>

          <div className="botones">
            <button className="btn-guardar" type="submit">
              Crear Producto
            </button>

            <button
              className="btn-volver"
              type="button"
              
              onClick={() => navigate("/menu")}
            >
              Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}