import {
  useEffect,
  useState,
} from "react";

import {
  CButton,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from "@coreui/react";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ReceiptText,
} from "lucide-react";

import type {
  VentaReporte,
} from "./tipos";

interface Props {
  ventas: VentaReporte[];
}

const POR_PAGINA = 10;

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

function fechaHora(
  fecha: string
) {
  return new Date(fecha)
    .toLocaleString(
      "es-AR",
      {
        day:
          "2-digit",
        month:
          "2-digit",
        year:
          "numeric",
        hour:
          "2-digit",
        minute:
          "2-digit",
      }
    );
}

function nombreCliente(
  venta: VentaReporte
) {
  if (
    !venta.cliente_id
  ) {
    return "Venta de mostrador";
  }

  const nombre =
    [
      venta.cliente_nombre,
      venta.cliente_apellido,
    ]
      .filter(Boolean)
      .join(" ");

  if (
    venta.cliente_apodo
  ) {
    return `${nombre} (${venta.cliente_apodo})`;
  }

  return nombre ||
    "Cliente";
}

export default function TablaVentasMensuales({
  ventas,
}: Props) {

  const [
    pagina,
    setPagina,
  ] = useState(1);

  const [
    ventaAbierta,
    setVentaAbierta,
  ] =
    useState<number | null>(
      null
    );

  useEffect(() => {
    setPagina(1);
    setVentaAbierta(null);
  }, [ventas]);

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        ventas.length /
        POR_PAGINA
      )
    );

  const inicio =
    (pagina - 1) *
    POR_PAGINA;

  const ventasPagina =
    ventas.slice(
      inicio,
      inicio +
        POR_PAGINA
    );

  return (
    <div
      className="
        tabla-reporte-wrapper
      "
    >

      <div
        className="
          d-flex
          align-items-center
          gap-2
          mb-3
        "
      >

        <ReceiptText
          size={20}
          color="#2563eb"
        />

        <div>

          <h5
            className="
              mb-0
              fw-bold
            "
          >
            Registro de ventas
          </h5>

          <div
            className="
              text-muted
            "
            style={{
              fontSize:
                "0.82rem",
            }}
          >
            {
              ventas.length
            }{" "}
            ventas coinciden con
            los filtros
          </div>

        </div>

      </div>


      <div
        className="
          table-responsive
          border
          rounded
        "
      >

        <CTable
          align="middle"
          hover
          className="mb-0"
        >

          <CTableHead>

            <CTableRow>

              <CTableHeaderCell>
                Venta
              </CTableHeaderCell>

              <CTableHeaderCell>
                Fecha
              </CTableHeaderCell>

              <CTableHeaderCell>
                Cliente
              </CTableHeaderCell>

              <CTableHeaderCell
                className="
                  text-center
                "
              >
                Productos
              </CTableHeaderCell>

              <CTableHeaderCell
                className="
                  text-center
                "
              >
                Estado
              </CTableHeaderCell>

              <CTableHeaderCell
                className="
                  text-end
                "
              >
                Total
              </CTableHeaderCell>

              <CTableHeaderCell
                className="
                  text-center
                "
              >
                Detalle
              </CTableHeaderCell>

            </CTableRow>

          </CTableHead>


          <CTableBody>

            {
              ventasPagina.length ===
              0
                ? (

                  <CTableRow>

                    <CTableDataCell
                      colSpan={7}
                      className="
                        text-center
                        text-muted
                        py-5
                      "
                    >
                      No hay ventas
                      para mostrar.
                    </CTableDataCell>

                  </CTableRow>

                )
                : ventasPagina.map(
                    (venta) => {

                      const abierta =
                        ventaAbierta ===
                        venta.id;

                      const unidades =
                        venta.detalles
                          .reduce(
                            (
                              total,
                              detalle
                            ) =>
                              total +
                              detalle.cantidad,
                            0
                          );

                      return (
                        <>
                          <CTableRow
                            key={
                              venta.id
                            }
                          >

                            <CTableDataCell>
                              <strong>
                                #{venta.id}
                              </strong>
                            </CTableDataCell>


                            <CTableDataCell>
                              {
                                fechaHora(
                                  venta.fecha_venta
                                )
                              }
                            </CTableDataCell>


                            <CTableDataCell>
                              {
                                nombreCliente(
                                  venta
                                )
                              }
                            </CTableDataCell>


                            <CTableDataCell
                              className="
                                text-center
                              "
                            >
                              {
                                unidades
                              }
                              {" "}
                              unidades
                            </CTableDataCell>


                            <CTableDataCell
                              className="
                                text-center
                              "
                            >

                              <span
                                className={
                                  venta.cuenta_pendiente
                                    ? "badge-estado badge-pendiente"
                                    : "badge-estado badge-cobrada"
                                }
                              >
                                {
                                  venta.cuenta_pendiente
                                    ? "Pendiente"
                                    : "Cobrada"
                                }
                              </span>

                            </CTableDataCell>


                            <CTableDataCell
                              className="
                                text-end
                                fw-bold
                              "
                            >
                              $
                              {
                                dinero(
                                  venta.total
                                )
                              }
                            </CTableDataCell>


                            <CTableDataCell
                              className="
                                text-center
                              "
                            >

                              <CButton
                                color="light"
                                size="sm"
                                onClick={() =>
                                  setVentaAbierta(
                                    abierta
                                      ? null
                                      : venta.id
                                  )
                                }
                              >
                                {
                                  abierta
                                    ? (
                                      <ChevronUp
                                        size={17}
                                      />
                                    )
                                    : (
                                      <ChevronDown
                                        size={17}
                                      />
                                    )
                                }
                              </CButton>

                            </CTableDataCell>

                          </CTableRow>


                          {
                            abierta
                            &&
                            (
                              <CTableRow
                                key={
                                  `detalle-${venta.id}`
                                }
                              >

                                <CTableDataCell
                                  colSpan={7}
                                  className="
                                    p-0
                                  "
                                >

                                  <div
                                    className="
                                      detalle-venta-reporte
                                    "
                                  >

                                    {
                                      venta.detalles
                                        .map(
                                          (
                                            detalle
                                          ) => (

                                            <div
                                              key={
                                                detalle.id
                                              }
                                              className="
                                                detalle-venta-item
                                              "
                                            >

                                              <div>

                                                <strong>
                                                  {
                                                    detalle.producto_nombre
                                                  }
                                                </strong>

                                                <div
                                                  className="
                                                    text-muted
                                                  "
                                                  style={{
                                                    fontSize:
                                                      "0.78rem",
                                                  }}
                                                >
                                                  {
                                                    detalle.cantidad
                                                  }
                                                  {" "}x{" "}
                                                  $
                                                  {
                                                    dinero(
                                                      detalle.precio_unitario
                                                    )
                                                  }
                                                </div>

                                              </div>

                                              <strong>
                                                $
                                                {
                                                  dinero(
                                                    detalle.subtotal
                                                  )
                                                }
                                              </strong>

                                            </div>

                                          )
                                        )
                                    }

                                  </div>

                                </CTableDataCell>

                              </CTableRow>
                            )
                          }

                        </>
                      );
                    }
                  )
            }

          </CTableBody>

        </CTable>

      </div>


      {
        ventas.length >
        POR_PAGINA
        &&
        (
          <div
            className="
              d-flex
              justify-content-between
              align-items-center
              mt-3
            "
          >

            <span
              className="
                text-muted
              "
              style={{
                fontSize:
                  "0.85rem",
              }}
            >
              Página{" "}
              {pagina} de{" "}
              {totalPaginas}
            </span>


            <div
              className="
                d-flex
                gap-2
              "
            >

              <CButton
                color="light"
                size="sm"
                disabled={
                  pagina === 1
                }
                onClick={() =>
                  setPagina(
                    (
                      actual
                    ) =>
                      Math.max(
                        1,
                        actual - 1
                      )
                  )
                }
              >
                <ChevronLeft
                  size={17}
                />
              </CButton>


              <CButton
                color="light"
                size="sm"
                disabled={
                  pagina ===
                  totalPaginas
                }
                onClick={() =>
                  setPagina(
                    (
                      actual
                    ) =>
                      Math.min(
                        totalPaginas,
                        actual + 1
                      )
                  )
                }
              >
                <ChevronRight
                  size={17}
                />
              </CButton>

            </div>

          </div>
        )
      }

    </div>
  );
}
