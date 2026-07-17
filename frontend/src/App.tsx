import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import ProductoCreate from "./Producto/ProductoCreate";
import "./App.css";
import Catalogo from "./Producto/CatalogoProducto";
import EliminarProducto  from "./Producto/EliminarProducto";
import ModificarProducto from "./Producto/ModificarProducto";

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
        <Route path="/menu" element={<Catalogo />} />
        <Route path="/agregar-producto" element={<ProductoCreate recargar={() => {}} />} />
        <Route
          path="/modificar-producto"
          element={<ModificarProducto producto={undefined as any} recargar={() => {}} />}
        />
        <Route path="/catalogo-producto" element={<Catalogo/>} />  
        <Route
          path="/eliminar-producto"
          element={<EliminarProducto producto={undefined as any} recargar={() => {}} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;