import React from "react";
import { useNavigate } from "react-router-dom";

export default function MenuProducto() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h1>Productos</h1>
      <button className="btn-secundario" onClick={() => navigate("/agregar-producto")}>
        Agregar producto
      </button>
      <br />
      <button className="btn-secundario" onClick={() => navigate("/modificar-producto")}>
        Modificar Producto
      </button>
      <br />
      <button className="btn-secundario" onClick={() => navigate("/catalogo-producto")}>
        Catalogo
      </button>
      <br/>
      <button onClick={() => navigate("/")}>Inicio</button>
    </div>
  );
}