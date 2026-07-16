import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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

function Producto() {
  const navigate = useNavigate();
  const location = useLocation();

  const productoOriginal = location.state?.producto as Producto | undefined;

  const [codigoViejo, setCodigoViejo] = useState("");
  const [codigoNuevo, setCodigoNuevo] = useState("");
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState(0);
  const [ganancia, setGanancia] = useState("63");
  const [stock, setStock] = useState(0);
  const [categoria, setCategoria] = useState("");

  useEffect(() => {
    if (!productoOriginal) {
      navigate("/catalogo"); 
      return;
    }

    setCodigoViejo(productoOriginal.codigo_barra);
    setCodigoNuevo(productoOriginal.codigo_barra);
    setNombre(productoOriginal.nombre);
    setPrecio(productoOriginal.precio);
    setStock(productoOriginal.stock);
    setCategoria(productoOriginal.categoria);
  }, [productoOriginal, navigate]);

  const precioFinal = Number(precio || 0) * (1 + Number(ganancia || 0) / 100);

  async function guardarCambios(e: React.FormEvent) {
    e.preventDefault();
    const productoEditado = {
      codigoViejo,
      codigoNuevo,
      nombre,
      precio: Number(precioFinal.toFixed(2)),
      stock,
      categoria,
    };

    try {
      const res = await fetch("http://localhost:3000/productos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productoEditado),
      });

      if (res.ok) {
        navigate("/catalogo-producto");
      } else {
        alert("Error al intentar guardar los cambios.");
      }
    } catch (error) {
      console.error("Error en la petición:", error);
      alert("No se pudo conectar con el servidor.");
    }
  }

  if (!productoOriginal) {
    return (
      <div className="producto-page">
        <p>Cargando datos del producto...</p>
      </div>
    );
  }

  return (
    <div className="producto-page">
      <div className="producto-card">
        <h1>Modificar Producto</h1>
        <form onSubmit={guardarCambios}  className="producto-form">
          <div className="campo">
            <label>Código De Barras</label>
            <input
              value={codigoNuevo}
              onChange={(e) => setCodigoNuevo(e.target.value)}
              required
            />
          </div>
          <div className="campo">
            <label>Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label>Costo del Producto ($)</label>
            <input
              type="number"
              step="any"
              value={precio}
              onChange={(e) => setPrecio(Number(e.target.value))}
              required
            />
          </div>

          <div className="campo">
            <label>Ganancia (%)</label>
            <input
              type="number"
              value={ganancia}
              onChange={(e) => setGanancia(e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label>Precio de Venta ($)</label>
            <input
              type="text"
              value={precioFinal.toFixed(2)}
              readOnly
              className="precio"
              style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
            />
          </div>

          <div className="campo">
            <label>Stock</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              required
            />
          </div>

          <div className="campo campo-completo">
            <label>Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              required
            >
              <option value="" disabled>Seleccione una categoría</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-botones">
            <button
              type="button"
              className="btn-volver"
              onClick={() => navigate("/catalogo-producto")}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-guardar">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Producto;