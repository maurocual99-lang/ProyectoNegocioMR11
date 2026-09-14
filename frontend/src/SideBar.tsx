import {
  useEffect,
} from "react";

import {
  Home,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import logoNegocio
  from "../imagenes/ChatGPT Image 20 jul 2026, 11_47_32.png";

import "./SideBar.css";


interface SidebarProps {
  isOpen: boolean;

  setIsOpen: (
    value: boolean
  ) => void;
}


export default function Sidebar({
  isOpen,
  setIsOpen,
}: SidebarProps) {

  const navigate =
    useNavigate();

  const location =
    useLocation();


  /* =========================================
     SINCRONIZAR CON EL TAMAÑO DE LA VENTANA

     Tauri arranca normalmente con una ventana
     menor a 1024px. Si el padre inicializa el
     sidebar cerrado y después se maximiza, el
     estado puede seguir en false.

     Este efecto corrige eso:
     - desktop: sidebar abierto
     - mobile/tablet: sidebar cerrado inicialmente
     - al maximizar/restaurar se sincroniza
  ========================================= */

  useEffect(
    () => {

      function sincronizarSidebar() {

        if (
          window.innerWidth >
          1024
        ) {

          setIsOpen(
            true
          );

        } else {

          setIsOpen(
            false
          );

        }

      }


      sincronizarSidebar();


      window.addEventListener(
        "resize",
        sincronizarSidebar
      );


      return () => {

        window.removeEventListener(
          "resize",
          sincronizarSidebar
        );

      };

    },
    [
      setIsOpen,
    ]
  );


  /* =========================================
     NAVEGAR
  ========================================= */

  function irA(
    ruta: string
  ) {

    navigate(
      ruta
    );


    /*
     * En pantallas chicas cerramos
     * el menú después de navegar.
     */
    if (
      window.innerWidth <=
      1024
    ) {

      setIsOpen(
        false
      );

    }

  }


  /* =========================================
     SABER SI ESTÁ ACTIVO
  ========================================= */

  function estaActivo(
    ruta: string
  ) {

    if (
      ruta === "/"
    ) {

      return (
        location.pathname ===
        "/"
      );

    }


    return location
      .pathname
      .startsWith(
        ruta
      );

  }


  /* =========================================
     OPCIONES
  ========================================= */

  const opciones = [

    {
      nombre:
        "Inicio",

      ruta:
        "/",

      icono:
        Home,
    },

    {
      nombre:
        "Catálogo",

      ruta:
        "/catalogo-producto",

      icono:
        Package,
    },

    {
      nombre:
        "Deudores",

      ruta:
        "/deudores",

      icono:
        Users,
    },

    {
      nombre:
        "Ventas",

      ruta:
        "/caja",

      icono:
        ShoppingCart,
    },

    {
      nombre:
        "Resúmenes",

      ruta:
        "/resumenes",

      icono:
        BarChart3,
    },

  ];


  return (

    <aside
      className={`sidebar ${
        isOpen
          ? "sidebar-abierto"
          : "sidebar-cerrado"
      }`}
    >


      {/* =====================================
          LOGO
      ====================================== */}

      <div
        className="
          sidebar-logo-contenedor
        "
      >

        <img
          src={
            logoNegocio
          }
          alt="Mini Mercado Ruta 11"
          className="
            sidebar-logo
          "
        />

      </div>


      {/* =====================================
          MENÚ
      ====================================== */}

      <nav
        className="
          sidebar-menu
        "
      >

        {opciones.map(
          (
            opcion
          ) => {

            const Icono =
              opcion.icono;


            const activo =
              estaActivo(
                opcion.ruta
              );


            return (

              <button
                key={
                  opcion.ruta
                }
                type="button"
                className={`sidebar-item ${
                  activo
                    ? "sidebar-item-activo"
                    : ""
                }`}
                onClick={() =>
                  irA(
                    opcion.ruta
                  )
                }
              >

                <div
                  className="
                    sidebar-item-contenido
                  "
                >

                  <Icono
                    size={
                      22
                    }
                    strokeWidth={
                      2
                    }
                  />

                  <span>
                    {
                      opcion.nombre
                    }
                  </span>

                </div>

              </button>

            );

          }
        )}

      </nav>


      {/* =====================================
          FOOTER
      ====================================== */}

      <div
        className="
          sidebar-footer
        "
      >

        <strong>
          Mini Mercado Ruta 11
        </strong>

        <span>
          Gestiona tu negocio mejor
        </span>

      </div>

    </aside>

  );

}
