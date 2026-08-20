import {
  type ChangeEvent,
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
  DollarSign,
  Filter,
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


function dinero(
  valor: number
) {
  return valor
    .toLocaleString(
      "es-AR",
      {
        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2,
      }
    );
}


export default function Resumenes() {

  const ahora =
    new Date();


  const [
    mes,
    setMes,
  ] = useState(
    ahora.getMonth() + 1
  );


  const [
    anio,
    setAnio,
  ] = useState(
    ahora.getFullYear()
  );


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
  ] = useState("");


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
  ] = useState(false);


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );


  useEffect(() => {

    cargarReporte();

  }, [
    mes,
    anio,
  ]);


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


  const aniosDisponibles =
    useMemo(
      () => {

        const desdeBackend =
          reporte
            ?.anios_disponibles ??
          [];


        const conjunto =
          new Set<number>([
            ahora.getFullYear(),
            anio,
            ...desdeBackend,
          ]);


        return Array.from(
          conjunto
        ).sort(
          (a, b) =>
            b - a
        );

      },
      [
        reporte,
        anio,
      ]
    );


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


        return reporte.ventas
          .filter(
            (venta) => {

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


              if (!texto) {
                return true;
              }


              const cliente =
                [
                  venta.cliente_nombre,
                  venta.cliente_apellido,
                  venta.cliente_apodo,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase();


              const productos =
                venta.detalles
                  .map(
                    (detalle) =>
                      detalle.producto_nombre
                  )
                  .join(" ")
                  .toLowerCase();


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


  return (
    <div
      className="
        pagina-reportes
      "
    >

      {/* =====================================
          HEADER
      ====================================== */}

      <div
        className="
          reporte-header
        "
      >

        <div
          className="
            reporte-header-icon
          "
        >

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
            Consultá las ventas
            mensuales, la facturación
            y las deudas pendientes.
          </p>

        </div>

      </div>


      {/* =====================================
          FILTROS
      ====================================== */}

      <CCard
        className="
          reporte-filtros-card
        "
      >

        <CCardBody>

          <div
            className="
              d-flex
              align-items-center
              gap-2
              mb-3
            "
          >

            <Filter
              size={18}
              color="#2563eb"
            />

            <strong>
              Filtros del reporte
            </strong>

          </div>


          <CRow
            className="
              g-3
              align-items-end
            "
          >

            <CCol
              md={2}
            >

              <CFormLabel>
                Mes
              </CFormLabel>


              <CFormSelect
                value={
                  mes
                }
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setMes(
                    Number(
                      e.target.value
                    )
                  )
                }
              >

                {
                  meses.map(
                    (
                      nombre,
                      indice
                    ) => (

                      <option
                        key={
                          nombre
                        }
                        value={
                          indice + 1
                        }
                      >
                        {nombre}
                      </option>

                    )
                  )
                }

              </CFormSelect>

            </CCol>


            <CCol
              md={2}
            >

              <CFormLabel>
                Año
              </CFormLabel>


              <CFormSelect
                value={
                  anio
                }
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setAnio(
                    Number(
                      e.target.value
                    )
                  )
                }
              >

                {
                  aniosDisponibles.map(
                    (
                      item
                    ) => (

                      <option
                        key={
                          item
                        }
                        value={
                          item
                        }
                      >
                        {item}
                      </option>

                    )
                  )
                }

              </CFormSelect>

            </CCol>


            <CCol
              md={3}
            >

              <CFormLabel>
                Estado
              </CFormLabel>


              <CFormSelect
                value={
                  estado
                }
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
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

            </CCol>


            <CCol
              md={5}
            >

              <CFormLabel>
                Buscar en las ventas
              </CFormLabel>


              <CInputGroup>

                <CInputGroupText>

                  <Search
                    size={16}
                  />

                </CInputGroupText>


                <CFormInput
                  value={
                    busqueda
                  }
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setBusqueda(
                      e.target.value
                    )
                  }
                  placeholder="Venta, cliente o producto..."
                />

              </CInputGroup>

            </CCol>

          </CRow>

        </CCardBody>

      </CCard>


      {/* =====================================
          ERROR
      ====================================== */}

      {
        error
        &&
        (
          <div
            className="
              reporte-error
            "
          >
            {error}
          </div>
        )
      }


      {/* =====================================
          CARGANDO
      ====================================== */}

      {
        cargando
        &&
        !reporte
        ? (

          <div
            className="
              reporte-cargando
            "
          >

            <CSpinner
              color="primary"
            />

            <span>
              Cargando reporte...
            </span>

          </div>

        )
        : reporte
          ? (
            <>

              {/* =============================
                  KPIs
              ============================== */}

              <div
                className="
                  reporte-kpis
                "
              >

                <div
                  className="
                    reporte-kpi
                  "
                >

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


                <div
                  className="
                    reporte-kpi
                  "
                >

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


                <div
                  className="
                    reporte-kpi
                  "
                >

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


                <div
                  className="
                    reporte-kpi
                  "
                >

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
                      clientes morosos
                    </span>

                  </div>

                </div>

              </div>


              {/* =============================
                  GRÁFICOS
              ============================== */}

              <CRow
                className="
                  g-3
                  mb-3
                "
              >

                <CCol
                  lg={8}
                >

                  <GraficoVentasPorDia
                    datos={
                      reporte
                        .ventas_por_dia
                    }
                    mes={
                      mes
                    }
                    anio={
                      anio
                    }
                  />

                </CCol>


                <CCol
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


              {/* =============================
                  TABLA
              ============================== */}

              <CCard
                className="
                  reporte-tabla-card
                "
              >

                <CCardBody>

                  <TablaVentasMensuales
                    ventas={
                      ventasFiltradas
                    }
                  />

                </CCardBody>

              </CCard>

            </>
          )
          : null
      }

    </div>
  );
}
