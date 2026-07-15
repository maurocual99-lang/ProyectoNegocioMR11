import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import MenuProducto from "./MenuProducto";
import ProductoCreate from "./ProductoCreate";
import "./App.css";

function PantallaPrincipal() {
  const navigate = useNavigate(); 
  
  return (
    <main className="container">
      <h1>Caja y Gestion</h1>
      <button className="btn-primario" onClick={() => navigate("/menu")}>
        Menu producto
      </button>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PantallaPrincipal />} />
        <Route path="/menu" element={<MenuProducto />} />
        <Route path="/agregar-producto" element={<ProductoCreate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;