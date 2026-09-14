import {
  useEffect,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  BrowserRouter,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import {
  DollarSign,
  FileText,
  Menu,
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
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
      window.innerWidth >
      1024
  );

  useEffect(
    () => {
      const handleResize =
        () => {
          /*
           * Al pasar a tamaño móvil cerramos el sidebar.
           * En desktop no lo forzamos para respetar si
           * el usuario decidió cerrarlo manualmente.
           */
          if (
            window.innerWidth <=
            1024
          ) {
            setSidebarOpen(
              false
            );
          }
        };

      window.addEventListener(
        "resize",
        handleResize
      );

      return () =>
        window.removeEventListener(
          "resize",
          handleResize
        );
    },
    []
  );

  return (
    <div className="layout-principal">
      <Sidebar
        isOpen={
          sidebarOpen
        }
        setIsOpen={
          setSidebarOpen
        }
      />

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen(
              false
            )
          }
        />
      )}

      <main
        className={`contenido ${
          sidebarOpen
            ? "contenido-sidebar-abierto"
            : "contenido-sidebar-cerrado"
        }`}
      >
        <button
          type="button"
          aria-label={
            sidebarOpen
              ? "Cerrar menú lateral"
              : "Abrir menú lateral"
          }
          className={`btn-toggle-sidebar ${
            sidebarOpen
              ? "toggle-sidebar-abierto"
              : ""
          }`}
          onClick={() =>
            setSidebarOpen(
              (
                actual
              ) =>
                !actual
            )
          }
        >
          {sidebarOpen
            ? (
              <X
                size={
                  20
                }
              />
            )
            : (
              <Menu
                size={
                  20
                }
              />
            )
          }
        </button>

        <div className="contenido-interior">
          {children}
        </div>
      </main>
    </div>
  );
}

function formatearDinero(
  valor: number
) {
  return new Intl.NumberFormat(
    "es-AR",
    {
      style:
        "currency",
      currency:
        "ARS",
      maximumFractionDigits:
        0,
    }
  ).format(
    Number(
      valor || 0
    )
  );
}

function tiempoDesde(
  fecha: string
) {
  const diferencia =
    Date.now() -
    new Date(
      fecha
    ).getTime();

  const minutos =
    Math.floor(
      diferencia /
        60000
    );

  if (
    minutos < 1
  ) {
    return "Ahora";
  }

  if (
    minutos < 60
  ) {
    return `${minutos} min`;
  }

  const horas =
    Math.floor(
      minutos / 60
    );

  if (
    horas < 24
  ) {
    return `${horas} h`;
  }

  return `${Math.floor(
    horas / 24
  )} d`;
}

function obtenerNombreDia(
  fechaTexto: string
) {
  const simple =
    fechaTexto.split(
      "T"
    )[0];

  const [
    anio,
    mes,
    dia,
  ] =
    simple
      .split("-")
      .map(
        Number
      );

  return new Date(
    anio,
    mes - 1,
    dia
  )
    .toLocaleDateString(
      "es-AR",
      {
        weekday:
          "short",
      }
    )
    .replace(
      ".",
      ""
    );
}

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
    useState(
      true
    );

  const [
    errorInicio,
    setErrorInicio,
  ] =
    useState("");

  useEffect(
    () => {
      async function cargarInicio() {
        try {
          setCargando(
            true
          );

          setErrorInicio(
            ""
          );

          const respuesta =
            await fetch(
              "http://localhost:3000/inicio"
            );

          if (
            !respuesta.ok
          ) {
            throw new Error(
              "No se pudo cargar el inicio."
            );
          }

          const resultado:
            DatosInicio =
            await respuesta.json();

          setDatos(
            resultado
          );
        } catch (
          error
        ) {
          console.error(
            "Error al cargar inicio:",
            error
          );

          setErrorInicio(
            "No se pudieron cargar los datos del negocio."
          );
        } finally {
          setCargando(
            false
          );
        }
      }

      void cargarInicio();
    },
    []
  );

  const maxVenta7Dias =
    Math.max(
      ...(
        datos
          ?.ultimos_7_dias
          .map(
            (
              item
            ) =>
              item.total
          ) ??
        [0]
      ),
      1
    );

  const actividades =
    datos
      ?.actividad
      .slice(
        0,
        4
      ) ??
    [];

  return (
    <div className="inicio-pagina">
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

      {errorInicio && (
        <div className="inicio-error">
          {
            errorInicio
          }
        </div>
      )}

      <section className="cards-superiores">
        <div className="card-stat card-verde">
          <div className="icon-wrapper bg-verde">
            <DollarSign
              size={
                24
              }
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
                      .total ??
                      0
                  )
              }
            </h2>

            <span className="tendencia">
              {
                datos
                  ?.ventas_hoy
                  .cantidad ??
                0
              }
              {" "}
              ventas realizadas
            </span>
          </div>
        </div>

        <div className="card-stat card-azul">
          <div className="icon-wrapper bg-azul">
            <Package
              size={
                24
              }
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
                    .unidades ??
                  0
              }
            </h2>

            <span className="tendencia positiva">
              <Package
                size={
                  14
                }
              />
              {
                datos
                  ?.stock
                  .productos ??
                0
              }
              {" "}
              productos disponibles
            </span>
          </div>
        </div>

        <div className="card-stat card-violeta">
          <div className="icon-wrapper bg-violeta">
            <Users
              size={
                24
              }
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
                    .clientes ??
                  0
              }
            </h2>

            <span className="tendencia negativa">
              <FileText
                size={
                  14
                }
              />
              {
                datos
                  ?.deuda
                  .cuentas ??
                0
              }
              {" "}
              ventas pendientes
            </span>
          </div>
        </div>

        <div className="card-stat card-naranja">
          <div className="icon-wrapper bg-naranja">
            <FileText
              size={
                24
              }
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
                      .total ??
                      0
                  )
              }
            </h2>

            <span className="tendencia">
              {
                datos
                  ?.deuda
                  .cuentas ??
                0
              }
              {" "}
              cuentas sin pagar
            </span>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="venta-card-destacada">
          <span className="badge">
            Acción principal
          </span>

          <h2>
            Comenzar Venta
          </h2>

          <p>
            Realiza una nueva venta
            de forma rápida y sencilla.
          </p>

          <button
            type="button"
            className="btn-nueva-venta"
            onClick={() =>
              navigate(
                "/caja"
              )
            }
          >
            <ShoppingCart
              size={
                20
              }
            />
            Nueva Venta
          </button>
        </div>

        <div className="accesos-card">
          <h3>
            Accesos rápidos
          </h3>

          <div className="accesos-grid">
            <button
              type="button"
              className="btn-acceso bg-light-verde"
              onClick={() =>
                navigate(
                  "/caja"
                )
              }
            >
              <ShoppingCart
                size={
                  23
                }
                color="#16a34a"
              />
              <span>
                Nueva Venta
              </span>
            </button>

            <button
              type="button"
              className="btn-acceso bg-light-azul"
              onClick={() =>
                navigate(
                  "/catalogo-producto"
                )
              }
            >
              <Package
                size={
                  23
                }
                color="#2563eb"
              />
              <span>
                Catálogo
              </span>
            </button>

            <button
              type="button"
              className="btn-acceso bg-light-violeta"
              onClick={() =>
                navigate(
                  "/deudores"
                )
              }
            >
              <Users
                size={
                  23
                }
                color="#9333ea"
              />
              <span>
                Deudores
              </span>
            </button>

            <button
              type="button"
              className="btn-acceso bg-light-naranja"
              onClick={() =>
                navigate(
                  "/resumenes"
                )
              }
            >
              <FileText
                size={
                  23
                }
                color="#ea580c"
              />
              <span>
                Resúmenes
              </span>
            </button>
          </div>
        </div>

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
                  (
                    item
                  ) => {
                    const porcentaje =
                      item.total ===
                      0
                        ? 2
                        : Math.max(
                            8,
                            (
                              item.total /
                              maxVenta7Dias
                            ) *
                              100
                          );

                    return (
                      <div
                        key={
                          item.fecha
                        }
                        className="grafico-dia"
                      >
                        <div className="grafico-monto">
                          {item.total >
                          0
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
                          {obtenerNombreDia(
                            item.fecha
                          )}
                        </strong>

                        <small>
                          {
                            item.cantidad
                          }
                          {" "}
                          ventas
                        </small>
                      </div>
                    );
                  }
                )}
            </div>
          )}
        </div>

        <div className="actividad-card">
          <div className="actividad-header">
            <h3>
              Actividad reciente
            </h3>

            <button
              type="button"
              className="btn-link"
              onClick={() =>
                navigate(
                  "/resumenes"
                )
              }
            >
              Ver todo
            </button>
          </div>

          <ul className="lista-actividad">
            {!cargando &&
            actividades.length ===
              0 && (
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
            )}

            {actividades.map(
              (
                actividad
              ) => {
                const nombreCliente =
                  actividad.apodo
                    ? actividad.apodo
                    : actividad.nombre
                      ? `${actividad.nombre} ${
                          actividad.apellido ??
                          ""
                        }`
                      : null;

                return (
                  <li
                    key={
                      actividad.id
                    }
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
                            size={
                              18
                            }
                            color="#ea580c"
                          />
                        )
                        : (
                          <ShoppingCart
                            size={
                              18
                            }
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
      </section>

      <footer className="footer-principal">
        Mini Mercado Ruta 11 © 2026
      </footer>
    </div>
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
                producto={
                  undefined!
                }
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
                producto={
                  undefined!
                }
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
