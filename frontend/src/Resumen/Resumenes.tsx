import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CCard,
  CCardBody,
  CCol,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
} from "@coreui/react";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  ReceiptText,
  Search,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

import GraficoVentasPorDia
  from "./GraficoVentasPorDia";

import GraficoEstadoVentas
  from "./GraficoEstadoVentas";

import TablaVentasMensuales
  from "./TablaVentasMensuales";

import {
  obtenerReporteMensual,
} from "./reportesApi";

import type {
  EstadoFiltro,
  ReporteMensual,
} from "./tipos";

import "./Resumenes.css";


/* ======================================================
   MESES
====================================================== */

const meses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];


/* ======================================================
   CONFIGURACIÓN DE PAGINACIÓN
====================================================== */

const VENTAS_POR_PAGINA = 8;


/* ======================================================
   FORMATEAR DINERO
====================================================== */

function dinero(
  valor: number
) {
  return valor.toLocaleString(
    "es-AR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}


/* ======================================================
   COMPONENTE
====================================================== */

export default function Resumenes() {

  const fechaActual =
    new Date();

  const mesActual =
    fechaActual.getMonth() + 1;

  const anioActual =
    fechaActual.getFullYear();


  /* ====================================================
     PERÍODO
  ==================================================== */

  const [
    mes,
    setMes,
  ] =
    useState(
      mesActual
    );


  const [
    anio,
    setAnio,
  ] =
    useState(
      anioActual
    );


  /* ====================================================
     FILTROS DE LA TABLA
  ==================================================== */

  const [
    estado,
    setEstado,
  ] =
    useState<EstadoFiltro>(
      "todas"
    );


  const [
    busqueda,
    setBusqueda,
  ] =
    useState("");


  /* ====================================================
     PAGINACIÓN
  ==================================================== */

  const [
    paginaActual,
    setPaginaActual,
  ] =
    useState(1);


  /* ====================================================
     REPORTE
  ==================================================== */

  const [
    reporte,
    setReporte,
  ] =
    useState<ReporteMensual | null>(
      null
    );


  const [
    cargando,
    setCargando,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );


  /* ====================================================
     CARGAR REPORTE
  ==================================================== */

  useEffect(
    () => {

      cargarReporte();

    },
    [
      mes,
      anio,
    ]
  );


  async function cargarReporte() {

    try {

      setCargando(true);

      setError(null);


      const datos =
        await obtenerReporteMensual(
          mes,
          anio
        );


      setReporte(
        datos
      );


    } catch (error) {

      console.error(
        "Error al cargar reporte:",
        error
      );


      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el reporte."
      );


    } finally {

      setCargando(false);

    }
  }


  /* ====================================================
     AÑOS DISPONIBLES
  ==================================================== */

  const aniosDisponibles =
    useMemo(
      () => {

        const desdeBackend =
          reporte
            ?.anios_disponibles
          ??
          [];


        const conjunto =
          new Set<number>([
            anioActual,
            anio,
            ...desdeBackend,
          ]);


        return Array
          .from(
            conjunto
          )
          .sort(
            (
              a,
              b
            ) =>
              b - a
          );

      },
      [
        reporte,
        anio,
        anioActual,
      ]
    );


  /* ====================================================
     VENTAS FILTRADAS

     Estado y búsqueda SOLO afectan
     al registro de ventas.
  ==================================================== */

  const ventasFiltradas =
    useMemo(
      () => {

        if (!reporte) {
          return [];
        }


        const texto =
          busqueda
            .trim()
            .toLowerCase();


        return reporte
          .ventas
          .filter(
            (venta) => {

              /* =========================
                 ESTADO
              ========================= */

              if (
                estado ===
                  "cobradas"
                &&
                venta.cuenta_pendiente
              ) {

                return false;

              }


              if (
                estado ===
                  "pendientes"
                &&
                !venta.cuenta_pendiente
              ) {

                return false;

              }


              /* =========================
                 SIN BÚSQUEDA
              ========================= */

              if (!texto) {

                return true;

              }


              /* =========================
                 CLIENTE
              ========================= */

              const cliente =
                [
                  venta.cliente_nombre,
                  venta.cliente_apellido,
                  venta.cliente_apodo,
                ]
                  .filter(
                    Boolean
                  )
                  .join(" ")
                  .toLowerCase();


              /* =========================
                 PRODUCTOS
              ========================= */

              const productos =
                venta.detalles
                  .map(
                    (detalle) =>
                      detalle
                        .producto_nombre
                  )
                  .join(" ")
                  .toLowerCase();


              /* =========================
                 RESULTADO
              ========================= */

              return (

                venta.id
                  .toString()
                  .includes(
                    texto
                  )

                ||

                cliente.includes(
                  texto
                )

                ||

                productos.includes(
                  texto
                )

              );

            }
          );

      },
      [
        reporte,
        estado,
        busqueda,
      ]
    );


  /* ====================================================
     VOLVER A PÁGINA 1 SI CAMBIAN FILTROS
  ==================================================== */

  useEffect(
    () => {

      setPaginaActual(1);

    },
    [
      mes,
      anio,
      estado,
      busqueda,
    ]
  );


  /* ====================================================
     TOTAL DE PÁGINAS
  ==================================================== */

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        ventasFiltradas.length
        /
        VENTAS_POR_PAGINA
      )
    );


  /* ====================================================
     CORREGIR PÁGINA SI QUEDA FUERA DE RANGO
  ==================================================== */

  useEffect(
    () => {

      if (
        paginaActual >
        totalPaginas
      ) {

        setPaginaActual(
          totalPaginas
        );

      }

    },
    [
      paginaActual,
      totalPaginas,
    ]
  );


  /* ====================================================
     VENTAS DE LA PÁGINA ACTUAL
  ==================================================== */

  const ventasPaginadas =
    useMemo(
      () => {

        const inicio =
          (
            paginaActual - 1
          )
          *
          VENTAS_POR_PAGINA;


        const fin =
          inicio
          +
          VENTAS_POR_PAGINA;


        return ventasFiltradas
          .slice(
            inicio,
            fin
          );

      },
      [
        ventasFiltradas,
        paginaActual,
      ]
    );


  /* ====================================================
     RANGO QUE SE ESTÁ MOSTRANDO
  ==================================================== */

  const desde =
    ventasFiltradas.length === 0
      ? 0
      : (
          paginaActual - 1
        )
        *
        VENTAS_POR_PAGINA
        +
        1;


  const hasta =
    Math.min(
      paginaActual
        *
        VENTAS_POR_PAGINA,

      ventasFiltradas.length
    );


  /* ====================================================
     PÁGINAS VISIBLES

     Máximo 5 botones para no romper
     el diseño en pantallas chicas.
  ==================================================== */

  const paginasVisibles =
    useMemo(
      () => {

        const paginas:
          number[] =
          [];


        let inicio =
          Math.max(
            1,
            paginaActual - 2
          );


        let fin =
          Math.min(
            totalPaginas,
            inicio + 4
          );


        if (
          fin - inicio < 4
        ) {

          inicio =
            Math.max(
              1,
              fin - 4
            );

        }


        for (
          let pagina = inicio;
          pagina <= fin;
          pagina++
        ) {

          paginas.push(
            pagina
          );

        }


        return paginas;

      },
      [
        paginaActual,
        totalPaginas,
      ]
    );


  /* ====================================================
     CAMBIAR PÁGINA
  ==================================================== */

  function cambiarPagina(
    nuevaPagina: number
  ) {

    if (
      nuevaPagina < 1
      ||
      nuevaPagina >
        totalPaginas
    ) {

      return;

    }


    setPaginaActual(
      nuevaPagina
    );


    /*
     * Hace que al cambiar de página
     * volvamos suavemente hacia la tabla.
     */

    setTimeout(
      () => {

        document
          .getElementById(
            "registro-ventas"
          )
          ?.scrollIntoView({
            behavior:
              "smooth",

            block:
              "start",
          });

      },
      50
    );
  }


  /* ====================================================
     RENDER
  ==================================================== */

  return (

    <div className="pagina-reportes">


      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="reporte-header">

        <div className="reporte-header-icon">

          <TrendingUp
            size={28}
            color="#2563eb"
          />

        </div>


        <div>

          <h2
            className="
              mb-1
              fw-bold
            "
          >
            Resúmenes y Reportes
          </h2>


          <p
            className="
              text-muted
              mb-0
            "
          >
            Consultá las ventas mensuales,
            la facturación y las deudas
            pendientes.
          </p>

        </div>

      </div>


      {/* ==================================================
          PERÍODO
      ================================================== */}

      <CCard className="reporte-filtros-card">

        <CCardBody>

          <div className="reporte-filtros-titulo">

            <CalendarDays
              size={18}
              color="#2563eb"
            />

            <strong>
              Período del reporte
            </strong>

          </div>


          <CRow className="g-3">

            {/* MES */}

            <CCol
              xs={12}
              sm={6}
              md={4}
              lg={3}
            >

              <CFormLabel>
                Mes
              </CFormLabel>


              <CFormSelect
                value={mes}
                onChange={(e) =>
                  setMes(
                    Number(
                      e.target.value
                    )
                  )
                }
              >

                {meses.map(
                  (
                    nombre,
                    indice
                  ) => (

                    <option
                      key={nombre}
                      value={
                        indice + 1
                      }
                    >
                      {nombre}
                    </option>

                  )
                )}

              </CFormSelect>

            </CCol>


            {/* AÑO */}

            <CCol
              xs={12}
              sm={6}
              md={4}
              lg={3}
            >

              <CFormLabel>
                Año
              </CFormLabel>


              <CFormSelect
                value={anio}
                onChange={(e) =>
                  setAnio(
                    Number(
                      e.target.value
                    )
                  )
                }
              >

                {aniosDisponibles.map(
                  (item) => (

                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>

                  )
                )}

              </CFormSelect>

            </CCol>

          </CRow>

        </CCardBody>

      </CCard>


      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (

        <div className="reporte-error">

          {error}

        </div>

      )}


      {/* ==================================================
          CARGANDO
      ================================================== */}

      {cargando && !reporte ? (

        <div className="reporte-cargando">

          <CSpinner
            color="primary"
          />

          <span>
            Cargando reporte...
          </span>

        </div>

      ) : reporte ? (

        <>


          {/* =================================================
              KPIs
          ================================================= */}

          <div className="reporte-kpis">


            {/* FACTURACIÓN */}

            <div className="reporte-kpi">

              <div
                className="
                  reporte-kpi-icon
                  kpi-verde
                "
              >

                <DollarSign
                  size={22}
                />

              </div>


              <div>

                <small>
                  Facturación del mes
                </small>

                <strong>
                  $
                  {
                    dinero(
                      reporte
                        .resumen
                        .total_vendido
                    )
                  }
                </strong>

              </div>

            </div>


            {/* VENTAS */}

            <div className="reporte-kpi">

              <div
                className="
                  reporte-kpi-icon
                  kpi-azul
                "
              >

                <ReceiptText
                  size={22}
                />

              </div>


              <div>

                <small>
                  Ventas realizadas
                </small>

                <strong>
                  {
                    reporte
                      .resumen
                      .cantidad_ventas
                  }
                </strong>

              </div>

            </div>


            {/* COBRADO */}

            <div className="reporte-kpi">

              <div
                className="
                  reporte-kpi-icon
                  kpi-celeste
                "
              >

                <WalletCards
                  size={22}
                />

              </div>


              <div>

                <small>
                  Total cobrado
                </small>

                <strong>
                  $
                  {
                    dinero(
                      reporte
                        .resumen
                        .total_cobrado
                    )
                  }
                </strong>

              </div>

            </div>


            {/* PENDIENTE */}

            <div className="reporte-kpi">

              <div
                className="
                  reporte-kpi-icon
                  kpi-naranja
                "
              >

                <CalendarDays
                  size={22}
                />

              </div>


              <div>

                <small>
                  Pendiente del mes
                </small>

                <strong>
                  $
                  {
                    dinero(
                      reporte
                        .resumen
                        .total_pendiente_mes
                    )
                  }
                </strong>

              </div>

            </div>


            {/* DEUDA TOTAL */}

            <div
              className="
                reporte-kpi
                reporte-kpi-deuda
              "
            >

              <div
                className="
                  reporte-kpi-icon
                  kpi-rojo
                "
              >

                <Users
                  size={22}
                />

              </div>


              <div>

                <small>
                  Deuda total actual
                </small>

                <strong>
                  $
                  {
                    dinero(
                      reporte
                        .deuda_actual
                        .total_deuda
                    )
                  }
                </strong>

                <span>

                  {
                    reporte
                      .deuda_actual
                      .clientes_morosos
                  }

                  {" "}

                  {
                    reporte
                      .deuda_actual
                      .clientes_morosos === 1
                      ? "cliente moroso"
                      : "clientes morosos"
                  }

                </span>

              </div>

            </div>

          </div>


          {/* =================================================
              GRÁFICOS
          ================================================= */}

          <CRow
            className="
              g-3
              mb-3
            "
          >

            <CCol
              xs={12}
              lg={8}
            >

              <GraficoVentasPorDia
                datos={
                  reporte
                    .ventas_por_dia
                }
                mes={mes}
                anio={anio}
              />

            </CCol>


            <CCol
              xs={12}
              lg={4}
            >

              <GraficoEstadoVentas
                totalCobrado={
                  reporte
                    .resumen
                    .total_cobrado
                }
                totalPendiente={
                  reporte
                    .resumen
                    .total_pendiente_mes
                }
              />

            </CCol>

          </CRow>


          {/* =================================================
              REGISTRO
          ================================================= */}

          <CCard
            id="registro-ventas"
            className="reporte-tabla-card"
          >

            <CCardBody>


              {/* =============================================
                  CABECERA
              ============================================= */}

              <div className="registro-ventas-header">

                <div>

                  <div className="registro-ventas-titulo">

                    <ReceiptText
                      size={20}
                      color="#2563eb"
                    />

                    <h4>
                      Registro de ventas
                    </h4>

                  </div>


                  <p>
                    Consultá y filtrá las ventas
                    realizadas durante el período
                    seleccionado.
                  </p>

                </div>


                <div className="registro-contador">

                  {ventasFiltradas.length}

                  <span>

                    {ventasFiltradas.length === 1
                      ? " venta"
                      : " ventas"
                    }

                  </span>

                </div>

              </div>


              {/* =============================================
                  FILTROS
              ============================================= */}

              <div className="filtros-registro">

                {/* ESTADO */}

                <div className="filtro-estado">

                  <CFormLabel>
                    Estado
                  </CFormLabel>


                  <CFormSelect
                    value={estado}
                    onChange={(e) =>
                      setEstado(
                        e.target
                          .value as EstadoFiltro
                      )
                    }
                  >

                    <option value="todas">
                      Todas las ventas
                    </option>

                    <option value="cobradas">
                      Cobradas
                    </option>

                    <option value="pendientes">
                      Pendientes
                    </option>

                  </CFormSelect>

                </div>


                {/* BÚSQUEDA */}

                <div className="filtro-busqueda">

                  <CFormLabel>
                    Buscar en el registro
                  </CFormLabel>


                  <CInputGroup>

                    <CInputGroupText>

                      <Search
                        size={16}
                      />

                    </CInputGroupText>


                    <CFormInput
                      value={busqueda}
                      onChange={(e) =>
                        setBusqueda(
                          e.target.value
                        )
                      }
                      placeholder="Venta, cliente o producto..."
                    />

                  </CInputGroup>

                </div>

              </div>


              {/* =============================================
                  TABLA PAGINADA
              ============================================= */}

              <div className="registro-tabla-contenedor">

                <TablaVentasMensuales
                  ventas={
                    ventasPaginadas
                  }
                />

              </div>


              {/* =============================================
                  PAGINACIÓN
              ============================================= */}

              {ventasFiltradas.length > 0 && (

                <div className="paginacion-reportes">


                  {/* INFORMACIÓN */}

                  <div className="paginacion-info">

                    Mostrando

                    <strong>
                      {" "}
                      {desde}
                      –
                      {hasta}
                      {" "}
                    </strong>

                    de

                    <strong>
                      {" "}
                      {
                        ventasFiltradas
                          .length
                      }
                      {" "}
                    </strong>

                    ventas

                  </div>


                  {/* BOTONES */}

                  <div className="paginacion-controles">

                    <button
                      type="button"
                      className="paginacion-boton paginacion-anterior"
                      disabled={
                        paginaActual === 1
                      }
                      onClick={() =>
                        cambiarPagina(
                          paginaActual - 1
                        )
                      }
                    >

                      <ChevronLeft
                        size={17}
                      />

                      <span>
                        Anterior
                      </span>

                    </button>


                    <div className="paginacion-numeros">

                      {paginasVisibles.map(
                        (pagina) => (

                          <button
                            key={pagina}
                            type="button"
                            className={`paginacion-boton paginacion-numero ${
                              paginaActual ===
                                pagina
                                ? "paginacion-activa"
                                : ""
                            }`}
                            onClick={() =>
                              cambiarPagina(
                                pagina
                              )
                            }
                          >
                            {pagina}
                          </button>

                        )
                      )}

                    </div>


                    <button
                      type="button"
                      className="paginacion-boton paginacion-siguiente"
                      disabled={
                        paginaActual ===
                        totalPaginas
                      }
                      onClick={() =>
                        cambiarPagina(
                          paginaActual + 1
                        )
                      }
                    >

                      <span>
                        Siguiente
                      </span>

                      <ChevronRight
                        size={17}
                      />

                    </button>

                  </div>


                  <div className="paginacion-pagina">

                    Página
                    {" "}
                    <strong>
                      {paginaActual}
                    </strong>
                    {" "}
                    de
                    {" "}
                    <strong>
                      {totalPaginas}
                    </strong>

                  </div>

                </div>

              )}

            </CCardBody>

          </CCard>

        </>

      ) : null}

    </div>
  );
}