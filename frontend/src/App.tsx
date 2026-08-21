import {
  useEffect,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

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


/* ======================================================
   TIPOS
====================================================== */

type DatosInicio = {
  ventas_hoy: {
    cantidad: number;
    total: number;
    variacion: number | null;
  };

  stock: {
    unidades: number;
    productos: number;
  };

  deuda: {
    clientes: number;
    cuentas: number;
    total: number;
  };

  ultimos_7_dias: {
    fecha: string;
    cantidad: number;
    total: number;
  }[];

  actividad: {
    id: number;
    fecha: string;
    total: number;
    pendiente: boolean;
    cliente_id: number | null;
    nombre: string | null;
    apellido: string | null;
    apodo: string | null;
  }[];
};


/* ======================================================
   LAYOUT
====================================================== */

function Layout({
  children,
}: {
  children: ReactNode;
}) {

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(
    () =>
      window.innerWidth > 1024
  );

  return (
    <div className="layout-principal">

      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      <main
        className={`contenido ${
          sidebarOpen
            ? "contenido-sidebar-abierto"
            : ""
        }`}
      >

        <button
          className={`btn-toggle-sidebar ${
            sidebarOpen
              ? "toggle-sidebar-abierto"
              : ""
          }`}
          onClick={() =>
            setSidebarOpen(
              !sidebarOpen
            )
          }
        >

          {sidebarOpen ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}

        </button>

        {children}

      </main>

    </div>
  );
}


/* ======================================================
   UTILIDADES
====================================================== */

function formatearDinero(
  valor: number
) {

  return new Intl.NumberFormat(
    "es-AR",
    {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }
  ).format(valor);
}


function tiempoDesde(
  fecha: string
) {

  const diferencia =
    Date.now() -
    new Date(fecha).getTime();

  const minutos =
    Math.floor(
      diferencia / 60000
    );

  if (minutos < 1) {
    return "Ahora";
  }

  if (minutos < 60) {
    return `${minutos} min`;
  }

  const horas =
    Math.floor(
      minutos / 60
    );

  if (horas < 24) {
    return `${horas} h`;
  }

  const dias =
    Math.floor(
      horas / 24
    );

  return `${dias} d`;
}


function obtenerNombreDia(
  fechaTexto: string
) {

  const fechaSimple =
    fechaTexto.split("T")[0];

  const partes =
    fechaSimple
      .split("-")
      .map(Number);

  const fecha =
    new Date(
      partes[0],
      partes[1] - 1,
      partes[2]
    );

  return fecha
    .toLocaleDateString(
      "es-AR",
      {
        weekday: "short",
      }
    )
    .replace(".", "");
}


/* ======================================================
   INICIO
====================================================== */

function PantallaPrincipal() {

  const navigate =
    useNavigate();

  const [
    datos,
    setDatos,
  ] =
    useState<DatosInicio | null>(
      null
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(true);

  const [
    errorInicio,
    setErrorInicio,
  ] =
    useState("");


  /* ====================================================
     CARGAR INICIO
  ==================================================== */

  useEffect(() => {

    async function cargarInicio() {

      try {

        setCargando(true);
        setErrorInicio("");

        const respuesta =
          await fetch(
            "http://localhost:3000/inicio"
          );

        if (!respuesta.ok) {

          throw new Error(
            "No se pudo cargar el inicio."
          );

        }

        const resultado:
          DatosInicio =
          await respuesta.json();

        setDatos(resultado);

      } catch (error) {

        console.error(
          "Error al cargar inicio:",
          error
        );

        setErrorInicio(
          "No se pudieron cargar los datos del negocio."
        );

      } finally {

        setCargando(false);

      }
    }

    cargarInicio();

  }, []);


  /* ====================================================
     GRÁFICO
  ==================================================== */

  const maxVenta7Dias =
    Math.max(
      ...(
        datos
          ?.ultimos_7_dias
          .map(
            (item) =>
              item.total
          )
        ??
        [0]
      ),
      1
    );


  /* ====================================================
     SOLO 4 ACTIVIDADES
  ==================================================== */

  const actividadesRecientes =
    datos
      ?.actividad
      .slice(0, 4)
    ?? [];


  return (
    <div className="inicio-pagina">

      {/* ===============================================
          HEADER
      =============================================== */}

      <header className="header-principal">

        <div>

          <h1>
            Mini Mercado Ruta 11
          </h1>

          <p>
            Bienvenido 👋
          </p>

        </div>

      </header>


      {/* ===============================================
          ERROR
      =============================================== */}

      {errorInicio && (

        <div className="inicio-error">
          {errorInicio}
        </div>

      )}


      {/* ===============================================
          TARJETAS
      =============================================== */}

      <section className="cards-superiores">

        {/* VENTAS */}

        <div className="card-stat card-verde">

          <div className="icon-wrapper bg-verde">

            <DollarSign
              size={24}
              color="#16a34a"
            />

          </div>

          <div className="stat-info">

            <small>
              Ventas del día
            </small>

            <h2>

              {cargando
                ? "..."
                : formatearDinero(
                    datos
                      ?.ventas_hoy
                      .total
                    ?? 0
                  )
              }

            </h2>

            {datos?.ventas_hoy
              .variacion !== null
              &&
             datos?.ventas_hoy
              .variacion !== undefined
              ? (

                <span
                  className={`tendencia ${
                    datos
                      .ventas_hoy
                      .variacion >= 0
                      ? "positiva"
                      : "negativa"
                  }`}
                >

                  {datos
                    .ventas_hoy
                    .variacion >= 0
                    ? (
                      <TrendingUp
                        size={14}
                      />
                    )
                    : (
                      <TrendingDown
                        size={14}
                      />
                    )
                  }

                  {Math.abs(
                    datos
                      .ventas_hoy
                      .variacion
                  ).toFixed(0)}
                  %

                  {datos
                    .ventas_hoy
                    .variacion >= 0
                    ? " más que ayer"
                    : " menos que ayer"
                  }

                </span>

              )
              : (

                <span className="tendencia">

                  {
                    datos
                      ?.ventas_hoy
                      .cantidad
                    ?? 0
                  }

                  {" "}

                  {
                    datos
                      ?.ventas_hoy
                      .cantidad === 1
                      ? "venta realizada"
                      : "ventas realizadas"
                  }

                </span>

              )
            }

          </div>

        </div>


        {/* STOCK */}

        <div className="card-stat card-azul">

          <div className="icon-wrapper bg-azul">

            <Package
              size={24}
              color="#2563eb"
            />

          </div>

          <div className="stat-info">

            <small>
              Unidades en stock
            </small>

            <h2>

              {cargando
                ? "..."
                : datos
                    ?.stock
                    .unidades
                  ?? 0
              }

            </h2>

            <span className="tendencia positiva">

              <Package size={14} />

              {
                datos
                  ?.stock
                  .productos
                ?? 0
              }

              {" "}
              productos disponibles

            </span>

          </div>

        </div>


        {/* CLIENTES CON DEUDA */}

        <div className="card-stat card-violeta">

          <div className="icon-wrapper bg-violeta">

            <Users
              size={24}
              color="#9333ea"
            />

          </div>

          <div className="stat-info">

            <small>
              Clientes con deuda
            </small>

            <h2>

              {cargando
                ? "..."
                : datos
                    ?.deuda
                    .clientes
                  ?? 0
              }

            </h2>

            <span className="tendencia negativa">

              <FileText size={14} />

              {
                datos
                  ?.deuda
                  .cuentas
                ?? 0
              }

              {" "}

              {
                datos
                  ?.deuda
                  .cuentas === 1
                  ? "venta pendiente"
                  : "ventas pendientes"
              }

            </span>

          </div>

        </div>


        {/* DEUDA */}

        <div className="card-stat card-naranja">

          <div className="icon-wrapper bg-naranja">

            <FileText
              size={24}
              color="#ea580c"
            />

          </div>

          <div className="stat-info">

            <small>
              Cuentas pendientes
            </small>

            <h2>

              {cargando
                ? "..."
                : formatearDinero(
                    datos
                      ?.deuda
                      .total
                    ?? 0
                  )
              }

            </h2>

            <span className="tendencia">

              {
                datos
                  ?.deuda
                  .cuentas
                ?? 0
              }

              {" "}

              {
                datos
                  ?.deuda
                  .cuentas === 1
                  ? "cuenta sin pagar"
                  : "cuentas sin pagar"
              }

            </span>

          </div>

        </div>

      </section>


      {/* ===============================================
          DASHBOARD
      =============================================== */}

      <section className="dashboard-grid">

        {/* =============================================
            IZQUIERDA
        ============================================= */}

        <div className="col-izquierda">

          {/* NUEVA VENTA */}

          <div className="venta-card-destacada">

            <span className="badge">
              Acción principal
            </span>

            <h2>
              Comenzar Venta
            </h2>

            <p>
              Realiza una nueva venta de forma
              rápida y sencilla.
            </p>

            <button
              className="btn-nueva-venta"
              onClick={() =>
                navigate("/caja")
              }
            >

              <ShoppingCart
                size={20}
              />

              Nueva Venta

            </button>

          </div>


          {/* GRÁFICO */}

          <div className="grafico-card">

            <div className="grafico-header">

              <h3>
                Ventas de los últimos 7 días
              </h3>

              <span className="periodo-semana">
                Esta semana
              </span>

            </div>


            {cargando ? (

              <div className="grafico-cargando">
                Cargando ventas...
              </div>

            ) : (

              <div className="grafico-inicio">

                {datos
                  ?.ultimos_7_dias
                  .map(
                    (item) => {

                      const porcentaje =
                        item.total === 0
                          ? 2
                          : Math.max(
                              8,
                              (
                                item.total /
                                maxVenta7Dias
                              ) * 100
                            );

                      return (

                        <div
                          key={item.fecha}
                          className="grafico-dia"
                        >

                          <div className="grafico-monto">

                            {item.total > 0
                              ? formatearDinero(
                                  item.total
                                )
                              : "$0"
                            }

                          </div>


                          <div className="grafico-barra-area">

                            <div
                              className="grafico-barra"
                              style={{
                                height:
                                  `${porcentaje}%`,
                              }}
                            />

                          </div>


                          <strong>

                            {
                              obtenerNombreDia(
                                item.fecha
                              )
                            }

                          </strong>


                          <small>

                            {item.cantidad}

                            {" "}

                            {item.cantidad === 1
                              ? "venta"
                              : "ventas"
                            }

                          </small>

                        </div>

                      );

                    }
                  )
                }

              </div>

            )}

          </div>

        </div>


        {/* =============================================
            DERECHA
        ============================================= */}

        <div className="col-derecha">


          {/* ===========================================
              ACCESOS RÁPIDOS - AHORA ARRIBA
          =========================================== */}

          <div className="accesos-card">

            <h3>
              Accesos rápidos
            </h3>

            <div className="accesos-grid">

              <button
                className="
                  btn-acceso
                  bg-light-verde
                "
                onClick={() =>
                  navigate("/caja")
                }
              >

                <ShoppingCart
                  size={23}
                  color="#16a34a"
                />

                <span>
                  Nueva Venta
                </span>

              </button>


              <button
                className="
                  btn-acceso
                  bg-light-azul
                "
                onClick={() =>
                  navigate(
                    "/catalogo-producto"
                  )
                }
              >

                <Package
                  size={23}
                  color="#2563eb"
                />

                <span>
                  Catálogo
                </span>

              </button>


              <button
                className="
                  btn-acceso
                  bg-light-violeta
                "
                onClick={() =>
                  navigate("/deudores")
                }
              >

                <Users
                  size={23}
                  color="#9333ea"
                />

                <span>
                  Deudores
                </span>

              </button>


              <button
                className="
                  btn-acceso
                  bg-light-naranja
                "
                onClick={() =>
                  navigate("/resumenes")
                }
              >

                <FileText
                  size={23}
                  color="#ea580c"
                />

                <span>
                  Resúmenes
                </span>

              </button>

            </div>

          </div>


          {/* ===========================================
              ACTIVIDAD RECIENTE - 4
          =========================================== */}

          <div className="actividad-card">

            <div className="actividad-header">

              <h3>
                Actividad reciente
              </h3>

              <button
                className="btn-link"
                onClick={() =>
                  navigate("/resumenes")
                }
              >
                Ver todo
              </button>

            </div>


            <div className="lista-contenedor">

              <ul className="lista-actividad">

                {!cargando &&
                 actividadesRecientes.length === 0
                  &&
                  (

                    <li className="item-actividad">

                      <div className="detalle-act">

                        <strong>
                          Sin actividad
                        </strong>

                        <span>
                          Todavía no hay ventas.
                        </span>

                      </div>

                    </li>

                  )
                }


                {actividadesRecientes.map(
                  (actividad) => {

                    const nombreCliente =
                      actividad.apodo
                        ? actividad.apodo
                        : actividad.nombre
                          ? `${actividad.nombre} ${
                              actividad.apellido
                              ?? ""
                            }`
                          : null;

                    return (

                      <li
                        key={actividad.id}
                        className="item-actividad"
                      >

                        <div
                          className={`icono-act ${
                            actividad.pendiente
                              ? "bg-naranja"
                              : "bg-verde"
                          }`}
                        >

                          {actividad.pendiente
                            ? (
                              <Users
                                size={18}
                                color="#ea580c"
                              />
                            )
                            : (
                              <ShoppingCart
                                size={18}
                                color="#16a34a"
                              />
                            )
                          }

                        </div>


                        <div className="detalle-act">

                          <strong>

                            {actividad.pendiente
                              ? "Venta pendiente"
                              : "Venta realizada"
                            }

                          </strong>

                          <span>

                            {formatearDinero(
                              actividad.total
                            )}

                            {nombreCliente
                              ? ` · ${nombreCliente}`
                              : ""
                            }

                          </span>

                        </div>


                        <small className="actividad-tiempo">

                          {tiempoDesde(
                            actividad.fecha
                          )}

                        </small>

                      </li>

                    );

                  }
                )}

              </ul>

            </div>

          </div>

        </div>

      </section>


      {/* ===============================================
          FOOTER
      =============================================== */}

      <footer className="footer-principal">

        Mini Mercado Ruta 11 © 2026 –
        Hecho con 💙 para tu negocio

      </footer>

    </div>
  );
}


/* ======================================================
   APP
====================================================== */

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

              <ProductoCreate
                recargar={() => {}}
              />

            </Layout>
          }
        />

        <Route
          path="/modificar-producto"
          element={
            <Layout>

              <ModificarProducto
                producto={undefined!}
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
                producto={undefined!}
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