import {
  Fragment,
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
  ChevronUp,
  ReceiptText,
} from "lucide-react";

import type {
  DetalleVentaReporte,
  VentaReporte,
} from "./tipos";


interface Props {
  ventas:
    VentaReporte[];
}


function dinero(
  valor:
    number
) {

  return Number(
    valor ||
    0
  ).toLocaleString(
    "es-AR",
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  );

}


function fechaHora(
  fecha:
    string
) {

  return new Date(
    fecha
  )
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
  venta:
    VentaReporte
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
      .filter(
        Boolean
      )
      .join(
        " "
      );


  if (
    venta.cliente_apodo
  ) {

    return nombre
      ? `${nombre} (${venta.cliente_apodo})`
      : venta.cliente_apodo;

  }


  return nombre ||
    "Cliente";

}


function cantidadDetalle(
  detalle:
    DetalleVentaReporte
) {

  const cantidad =
    Number(
      detalle.cantidad ||
      0
    );


  if (
    detalle.tipo_venta ===
    "PESO"
  ) {

    if (
      cantidad < 1
    ) {

      return `${Math.round(
        cantidad *
        1000
      )} g`;

    }


    return `${cantidad.toLocaleString(
      "es-AR",
      {
        maximumFractionDigits:
          3,
      }
    )} kg`;

  }


  return `${cantidad.toLocaleString(
    "es-AR",
    {
      maximumFractionDigits:
        3,
    }
  )} u.`;

}


function estadoVenta(
  venta:
    VentaReporte
) {

  const saldo =
    Number(
      venta.saldo_pendiente ||
      0
    );


  const pagado =
    Number(
      venta.total_pagado ||
      0
    );


  if (
    saldo <= 0
  ) {

    return {
      texto:
        "Cobrada",

      clase:
        "badge-estado badge-cobrada",
    };

  }


  if (
    pagado > 0
  ) {

    return {
      texto:
        "Pago parcial",

      clase:
        "badge-estado badge-pendiente",
    };

  }


  return {
    texto:
      "Pendiente",

    clase:
      "badge-estado badge-pendiente",
  };

}


export default function TablaVentasMensuales({
  ventas,
}: Props) {

  const [
    ventaAbierta,
    setVentaAbierta,
  ] =
    useState<
      number
      | null
    >(
      null
    );


  useEffect(
    () => {

      setVentaAbierta(
        null
      );

    },
    [
      ventas,
    ]
  );


  return (

    <div
      className="
        tabla-reporte-wrapper
      "
    >

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
                  text-end
                "
              >
                Saldo
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
              ventas.length ===
              0
                ? (

                  <CTableRow>

                    <CTableDataCell
                      colSpan={
                        8
                      }
                      className="
                        text-center
                        text-muted
                        py-5
                      "
                    >

                      <ReceiptText
                        size={
                          28
                        }
                        className="
                          mb-2
                        "
                      />

                      <div>
                        No hay ventas
                        para mostrar.
                      </div>

                    </CTableDataCell>

                  </CTableRow>

                )
                :
                ventas.map(
                  (
                    venta
                  ) => {

                    const abierta =
                      ventaAbierta ===
                      venta.id;


                    const estado =
                      estadoVenta(
                        venta
                      );


                    return (

                      <Fragment
                        key={
                          venta.id
                        }
                      >
                        <CTableRow>

                          <CTableDataCell>

                            <strong>
                              #
                              {
                                venta.id
                              }
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
                              venta.detalles.length
                            }

                            {" "}

                            {
                              venta.detalles.length ===
                              1
                                ? "producto"
                                : "productos"
                            }

                          </CTableDataCell>


                          <CTableDataCell
                            className="
                              text-center
                            "
                          >

                            <span
                              className={
                                estado.clase
                              }
                            >
                              {
                                estado.texto
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
                              text-end
                            "
                          >

                            <strong
                              style={{
                                color:
                                  venta.saldo_pendiente >
                                  0
                                    ? "#dc2626"
                                    : "#16a34a",
                              }}
                            >

                              $
                              {
                                dinero(
                                  venta.saldo_pendiente
                                )
                              }

                            </strong>

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
                                      size={
                                        17
                                      }
                                    />
                                  )
                                  : (
                                    <ChevronDown
                                      size={
                                        17
                                      }
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
                                colSpan={
                                  8
                                }
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
                                    venta.detalles.map(
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
                                                cantidadDetalle(
                                                  detalle
                                                )
                                              }

                                              {" × "}

                                              $
                                              {
                                                dinero(
                                                  detalle.precio_unitario
                                                )
                                              }

                                              {
                                                detalle.tipo_venta ===
                                                "PESO"
                                                  ? " / kg"
                                                  : ""
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


                                  {
                                    venta.cliente_id
                                    &&
                                    (
                                      <div
                                        className="
                                          detalle-venta-item
                                        "
                                        style={{
                                          borderTop:
                                            "1px solid #e5e7eb",

                                          marginTop:
                                            "8px",

                                          paddingTop:
                                            "12px",
                                        }}
                                      >

                                        <div>

                                          <strong>
                                            Estado de cuenta
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

                                            Pagado:
                                            {" "}
                                            $
                                            {
                                              dinero(
                                                venta.total_pagado
                                              )
                                            }

                                          </div>

                                        </div>


                                        <strong
                                          style={{
                                            color:
                                              venta.saldo_pendiente >
                                              0
                                                ? "#dc2626"
                                                : "#16a34a",
                                          }}
                                        >

                                          Saldo:
                                          {" "}
                                          $
                                          {
                                            dinero(
                                              venta.saldo_pendiente
                                            )
                                          }

                                        </strong>

                                      </div>
                                    )
                                  }

                                </div>

                              </CTableDataCell>

                            </CTableRow>

                          )
                        }

                      </Fragment>

                    );

                  }
                )
            }

          </CTableBody>

        </CTable>

      </div>

    </div>

  );

}
