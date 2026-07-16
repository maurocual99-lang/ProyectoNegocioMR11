import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import MenuProducto from "./Producto/MenuProducto";
import ProductoCreate from "./Producto/ProductoCreate";
import "./App.css";
import Producto from "./Producto/ModificarProducto";
import Catalogo from "./Producto/CatalogoProducto";

function PantallaPrincipal() {
  const navigate = useNavigate(); 
  
  return (
    <main className="container">
      <h1>Caja y Gestion</h1>
      <button className="btn-primario" onClick={() => navigate("/menu")}>
        Catalogo
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
        <Route path="/modificar-producto" element={<Producto />} />
        <Route path="/catalogo-producto" element={<Catalogo/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;