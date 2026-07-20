import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import {
  Home,
  Package,
  Users,
  BarChart3,
  ShoppingCart,
  Settings,
  Bell,
  DollarSign,
  Plus,
  FileText,
  TrendingUp,
  TrendingDown
} from "lucide-react";

import ProductoCreate from "./Producto/ProductoCreate";
import Catalogo from "./Producto/CatalogoProducto";
import EliminarProducto from "./Producto/EliminarProducto";
import ModificarProducto from "./Producto/ModificarProducto";

import "./App.css";
import logoNegocio from "./../imagenes/ChatGPT Image 20 jul 2026, 11_47_32.png";

function PantallaPrincipal() {
  const navigate = useNavigate();

  return (
    <div className="layout-principal">
      {/* Sidebar*/}
      <aside className="sidebar">
        <div className="logo-container">
          <img src={logoNegocio} alt="Logo" className="logo-sidebar" />
        </div>

        <nav className="menu">
          <button className="menu-item active" onClick={() => navigate("/")}>
            <Home size={20} />
            <span>Inicio</span>
          </button>
          <button className="menu-item" onClick={() => navigate("/catalogo-producto")}>
            <Package size={20} />
            <span>Catalogo</span>
          </button>
          <button className="menu-item" onClick={() => navigate("/deudores")}>
            <Users size={20} />
            <span>Deudores</span>
          </button>
          <button className="menu-item" onClick={() => navigate("/caja")}>
            <ShoppingCart size={20} />
            <span>Ventas</span>
          </button>
          <button className="menu-item" onClick={() => navigate("/resumenes")}>
            <BarChart3 size={20} />
            <span>Resumenes</span>
          </button>
          <button className="menu-item" onClick={() => navigate("/caja")}>
            <DollarSign size={20} />
            <span>Caja</span>
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <small>Mini Mercado Ruta 11<br/>Gestiona tu negocio mejor</small>
        </div>
      </aside>

      {/* iniciio */}
      <main className="contenido">
        <header className="header-principal">
          <div>
            <h1>Mini Mercado Ruta 11</h1>
            <p>Bienvenido👋</p>
          </div>
          <div className="header-acciones">
              {/*Calendario ?? */}
          </div>
        </header>

        {/* Tarjetas de acciones */}
        <section className="cards-superiores">
          <div className="card-stat">
            <div className="icon-wrapper bg-verde">
              <DollarSign size={24} color="#16a34a" />
            </div>
            <div className="stat-info">
              <small>Ventas del dia</small>
              <h2>$152.400</h2>
              <span className="tendencia positiva"><TrendingUp size={14}/> 12% mas que ayer</span>
            </div>
          </div>

          <div className="card-stat">
            <div className="icon-wrapper bg-azul">
              <Package size={24} color="#2563eb" />
            </div>
            <div className="stat-info">
              <small>Productos en stock</small>
              <h2>327</h2>
              <span className="tendencia positiva"><TrendingUp size={14}/> 8 productos mas</span>
            </div>
          </div>

          <div className="card-stat">
            <div className="icon-wrapper bg-violeta">
              <Users size={24} color="#9333ea" />
            </div>
            <div className="stat-info">
              <small>Clientes con deuda</small>
              <h2>12</h2>
              <span className="tendencia negativa"><TrendingDown size={14}/> -3 que ayer</span>
            </div>
          </div>

          <div className="card-stat">
            <div className="icon-wrapper bg-naranja">
              <FileText size={24} color="#ea580c" />
            </div>
            <div className="stat-info">
              <small>Cuentas pendientes</small>
              <h2>$48.750</h2>
              <span className="tendencia positiva"><TrendingUp size={14}/> 24% más que ayer</span>
            </div>
          </div>
        </section>

        {/* Panel central*/}
        <section className="dashboard-grid">
          
          {/* Columna Izquierda */}
          <div className="col-izquierda">
            <div className="venta-card-destacada">
              <span className="badge">Accion principal</span>
              <h2>Comenzar venta</h2>
              <p>Realiza una nueva venta de forma rapida y sencilla.</p>
              <button className="btn-nueva-venta" onClick={() => navigate("/caja")}>
                <ShoppingCart size={20} />
                Nueva Venta
              </button>
            </div>

            <div className="grafico-card">
              <div className="grafico-header">
                <h3>Ventas de los ultimos 7 días</h3>
                <select className="select-filtro"><option>Esta semana</option></select>
              </div>
              <div className="grafico-placeholder">
                <p style={{color: '#94a3b8', textAlign: 'center', paddingTop: '40px'}}>Gráfico de ventas (Placeholder)</p>
              </div>
            </div>
          </div>

          {/* Columna Derecha */}
          <div className="col-derecha">
            <div className="actividad-card">
              <div className="actividad-header">
                <h3>Actividad reciente</h3>
                <button className="btn-link">Ver todo</button>
              </div>
              <ul className="lista-actividad">
                <li>
                  <div className="icono-act bg-verde"><ShoppingCart size={16}/></div>
                  <div className="detalle-act">
                    <strong>Venta realizada</strong>
                    <span>$12.500</span>
                  </div>
                  <small>10 min</small>
                </li>
                <li>
                  <div className="icono-act bg-naranja"><Users size={16}/></div>
                  <div className="detalle-act">
                    <strong>Nuevo deudor</strong>
                    <span>Juan Pérez</span>
                  </div>
                  <small>25 min</small>
                </li>
                <li>
                  <div className="icono-act bg-violeta"><Package size={16}/></div>
                  <div className="detalle-act">
                    <strong>Stock actualizado</strong>
                    <span>Galletitas - 20 unidades</span>
                  </div>
                  <small>40 min</small>
                </li>
              </ul>
            </div>

            <div className="accesos-card">
              <h3>Accesos rapidos</h3>
              <div className="accesos-grid">
                <button className="btn-acceso bg-light-verde" onClick={() => navigate("/caja")}>
                  <ShoppingCart size={24} color="#16a34a" />
                  <span>Nueva Venta</span>
                </button>
                <button className="btn-acceso bg-light-azul" onClick={() => navigate("/agregar-producto")}>
                  <Package size={24} color="#2563eb" />
                  <span>Agregar Producto</span>
                </button>
                <button className="btn-acceso bg-light-violeta" onClick={() => navigate("/deudores")}>
                  <Users size={24} color="#9333ea" />
                  <span>Agregar Deudor</span>
                </button>
                <button className="btn-acceso bg-light-naranja" onClick={() => navigate("/resumenes")}>
                  <FileText size={24} color="#ea580c" />
                  <span>Ver Resumenes</span>
                </button>
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PantallaPrincipal />} />
        <Route path="/menu" element={<Catalogo />} />
        <Route path="/catalogo-producto" element={<Catalogo />} />
        <Route path="/agregar-producto" element={<ProductoCreate recargar={() => {}} />} />
        <Route path="/modificar-producto" element={<ModificarProducto producto={undefined as any} recargar={() => {}} />} />
        <Route path="/eliminar-producto" element={<EliminarProducto producto={undefined as any} recargar={() => {}} />} />
        <Route path="/caja" element={<div style={{ padding: 50 }}><h2>💰 Caja</h2><button onClick={() => window.history.back()}>Volver</button></div>} />
        <Route path="/deudores" element={<div style={{ padding: 50 }}><h2>👥 Deudores</h2><button onClick={() => window.history.back()}>Volver</button></div>} />
        <Route path="/resumenes" element={<div style={{ padding: 50 }}><h2>📊 Resúmenes</h2><button onClick={() => window.history.back()}>Volver</button></div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;