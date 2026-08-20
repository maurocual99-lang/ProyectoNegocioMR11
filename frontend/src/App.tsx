import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import {
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  Menu,
  X,
} from "lucide-react";

import Sidebar from "./SideBar";

import ProductoCreate from "./Producto/ProductoCreate";
import Catalogo from "./Producto/CatalogoProducto";
import EliminarProducto from "./Producto/EliminarProducto";
import ModificarProducto from "./Producto/ModificarProducto";
import VentaProducto from "./Producto/VentaProducto";
import ListaDeudores from "./clienteDeudor/ListaDeudores";
import Resumenes from "./Resumen/Resumenes";
import "./App.css";

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="layout-principal">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 999,
            display: window.innerWidth > 768 ? "none" : "block",
          }}
        />
      )}

      <main
        className="contenido"
        style={{
          marginLeft: sidebarOpen ? "260px" : "0",
          width: sidebarOpen ? "calc(100% - 260px)" : "100%",
          padding: "30px",
          transition: "all 0.3s ease",
          paddingTop: "80px",
        }}
      >
        {/* Botón toggle */}
        <button
          className="btn-toggle-sidebar"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: "fixed",
            top: "20px",
            left: sidebarOpen ? "280px" : "20px",
            zIndex: 1000,
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "8px 12px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {children}
      </main>
    </div>
  );
}

function PantallaPrincipal() {
  const navigate = useNavigate();

  return (
    <>
      <header className="header-principal">
        <div>
          <h1>Mini Mercado Ruta 11</h1>
          <p>Bienvenido 👋</p>
        </div>
      </header>

      <section className="cards-superiores">
        <div className="card-stat card-verde">
          <div className="icon-wrapper bg-verde">
            <DollarSign size={24} color="#16a34a" />
          </div>

          <div className="stat-info">
            <small>Ventas del día</small>
            <h2>$152.400</h2>

            <span className="tendencia positiva">
              <TrendingUp size={14} />
              12% más que ayer
            </span>
          </div>
        </div>

        <div className="card-stat card-azul">
          <div className="icon-wrapper bg-azul">
            <Package size={24} color="#2563eb" />
          </div>

          <div className="stat-info">
            <small>Productos en stock</small>
            <h2>327</h2>

            <span className="tendencia positiva">
              <TrendingUp size={14} />
              8 productos más
            </span>
          </div>
        </div>

        <div className="card-stat card-violeta">
          <div className="icon-wrapper bg-violeta">
            <Users size={24} color="#9333ea" />
          </div>

          <div className="stat-info">
            <small>Clientes con deuda</small>
            <h2>12</h2>

            <span className="tendencia negativa">
              <TrendingDown size={14} />
              -3 que ayer
            </span>
          </div>
        </div>

        <div className="card-stat card-naranja">
          <div className="icon-wrapper bg-naranja">
            <FileText size={24} color="#ea580c" />
          </div>

          <div className="stat-info">
            <small>Cuentas pendientes</small>
            <h2>$48.750</h2>

            <span className="tendencia positiva">
              <TrendingUp size={14} />
              24% más que ayer
            </span>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="col-izquierda">
          <div className="venta-card-destacada">
            <span className="badge">Acción principal</span>

            <h2>Comenzar venta</h2>

            <p>Realiza una nueva venta de forma rápida y sencilla.</p>

            <button
              className="btn-nueva-venta"
              onClick={() => navigate("/caja")}
            >
              <ShoppingCart size={20} />
              Nueva Venta
            </button>
          </div>

          <div className="grafico-card">
            <div className="grafico-header">
              <h3>Ventas de los últimos 7 días</h3>

              <select className="select-filtro">
                <option>Esta semana</option>
              </select>
            </div>

            <div className="grafico-placeholder">
              <p
                style={{
                  color: "#94a3b8",
                  textAlign: "center",
                  paddingTop: "40px",
                }}
              >
                Gráfico de ventas (Placeholder)
              </p>
            </div>
          </div>
        </div>

        <div className="col-derecha">
          <div className="actividad-card">
            <div className="actividad-header">
              <h3>Actividad reciente</h3>

              <button className="btn-link">Ver todo</button>
            </div>

            <div className="lista-contenedor">
              <ul className="lista-actividad">
                <li className="item-actividad">
                  <div className="icono-act bg-verde">
                    <ShoppingCart size={18} color="#16a34a" />
                  </div>

                  <div className="detalle-act">
                    <strong>Venta realizada</strong>
                    <span>$12.500</span>
                  </div>

                  <small>10 min</small>
                </li>

                <li className="item-actividad">
                  <div className="icono-act bg-naranja">
                    <Users size={18} color="#ea580c" />
                  </div>

                  <div className="detalle-act">
                    <strong>Nuevo deudor</strong>
                    <span>Juan Pérez</span>
                  </div>

                  <small>25 min</small>
                </li>

                <li className="item-actividad">
                  <div className="icono-act bg-violeta">
                    <Package size={18} color="#9333ea" />
                  </div>

                  <div className="detalle-act">
                    <strong>Stock actualizado</strong>
                    <span>Galletitas - 20 unidades</span>
                  </div>

                  <small>40 min</small>
                </li>
              </ul>
            </div>
          </div>

          <div className="accesos-card">
            <h3>Accesos rápidos</h3>

            <div className="accesos-grid">
              <button
                className="btn-acceso bg-light-verde"
                onClick={() => navigate("/caja")}
              >
                <ShoppingCart size={24} color="#16a34a" />
                <span>Nueva Venta</span>
              </button>

              <button
                className="btn-acceso bg-light-azul"
                onClick={() => navigate("/catalogo-producto")}
              >
                <Package size={24} color="#2563eb" />
                <span>Catálogo</span>
              </button>

              <button
                className="btn-acceso bg-light-violeta"
                onClick={() => navigate("/deudores")}
              >
                <Users size={24} color="#9333ea" />
                <span>Deudores</span>
              </button>

              <button
                className="btn-acceso bg-light-naranja"
                onClick={() => navigate("/resumenes")}
              >
                <FileText size={24} color="#ea580c" />
                <span>Resúmenes</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer-principal">
        Mini Mercado Ruta 11 © 2024 – Hecho con 💙 para tu negocio
      </footer>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <PantallaPrincipal />
            </Layout>
          }
        />

        <Route
          path="/catalogo-producto"
          element={
            <Layout>
              <Catalogo />
            </Layout>
          }
        />

        <Route
          path="/menu"
          element={
            <Layout>
              <Catalogo />
            </Layout>
          }
        />

        <Route
          path="/agregar-producto"
          element={
            <Layout>
              <ProductoCreate recargar={() => {}} />
            </Layout>
          }
        />

        <Route
          path="/modificar-producto"
          element={
            <Layout>
              <ModificarProducto
                producto={undefined}
                recargar={() => {}}
              />
            </Layout>
          }
        />

        <Route
          path="/eliminar-producto"
          element={
            <Layout>
              <EliminarProducto
                producto={undefined}
                recargar={() => {}}
              />
            </Layout>
          }
        />

        <Route
          path="/caja"
          element={
            <Layout>
              <VentaProducto />
            </Layout>
          }
        />

        <Route
          path="/deudores"
          element={
            <Layout>
              <ListaDeudores />
            </Layout>
          }
        />

        <Route
          path="/resumenes"
          element={
            <Layout>
              <Resumenes />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}