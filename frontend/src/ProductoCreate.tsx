import React from "react";
import { useNavigate } from "react-router-dom";

export default function ProductoCreate() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h1>Agregar Nuevo Producto</h1>
      <button onClick={() => navigate("/menu")}> Volver al Menu</button>
    </div>
  );
}