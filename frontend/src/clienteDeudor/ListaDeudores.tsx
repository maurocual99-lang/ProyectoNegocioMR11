import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  CCard,
  CCardBody,
  CButton,
  CFormCheck,
  CListGroup,
  CListGroupItem,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CSpinner,
} from "@coreui/react";

import {
  User,
  ArrowLeft,
  ReceiptText,
  CheckCircle2,
  WalletCards,
} from "lucide-react";

import {
  generarComprobantePagoPDF,
} from "../GeneradorPDF";

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  apodo?: string;
}


interface DetalleVenta {
  id: number;

  producto_id: number;

  producto_nombre: string;

  cantidad: number;

  precio_unitario:
    string | number;

  subtotal:
    string | number;
}


interface Venta {
  id: number;

  fecha_venta: string;

  total:
    string | number;

  detalles?: DetalleVenta[];
}

function formatearDinero(
  valor: string | number
) {

  return Number(valor)
    .toLocaleString(
      "es-AR",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
}

function formatearFecha(
  fecha: string
) {

  return new Date(fecha)
    .toLocaleDateString(
      "es-AR"
    );
}

export default function ListaDeudores() {

  const navigate =
    useNavigate();

  const [
    clientesMorosos,
    setClientesMorosos,
  ] =
    useState<Cliente[]>([]);


  const [
    clienteSeleccionado,
    setClienteSeleccionado,
  ] =
    useState<Cliente | null>(
      null
    );

  const [
    ventasPendientes,
    setVentasPendientes,
  ] =
    useState<Venta[]>([]);


  const [
    ventasSeleccionadas,
    setVentasSeleccionadas,
  ] =
    useState<number[]>([]);

  const [
    procesandoPago,
    setProcesandoPago,
  ] =
    useState(false);


  const [
    mostrarExito,
    setMostrarExito,
  ] =
    useState(false);

  const API_URL =
    "http://localhost:3000/ventas";

  const ventasElegidas =
    ventasPendientes.filter(
      (venta) =>
        ventasSeleccionadas
          .includes(
            venta.id
          )
    );

  const totalAPagar =
    ventasElegidas.reduce(
      (
        total,
        venta
      ) =>
        total +
        Number(
          venta.total
        ),
      0
    );

  useEffect(
    () => {

      cargarClientesMorosos();

    },
    []
  );


  async function cargarClientesMorosos() {

    try {

      const res =
        await fetch(
          `${API_URL}/deudores`
        );


      if (!res.ok) {

        throw new Error(
          "No se pudieron cargar los clientes."
        );

      }


      const data:
        Cliente[] =
        await res.json();


      setClientesMorosos(
        data
      );


    } catch (error) {

      console.error(
        "Error al cargar clientes morosos:",
        error
      );

    }
  }

  async function seleccionarCliente(
    cliente: Cliente
  ) {

    setClienteSeleccionado(
      cliente
    );


    setVentasSeleccionadas(
      []
    );


    try {

      const res =
        await fetch(
          `${API_URL}/deudas/${cliente.id}`
        );


      if (!res.ok) {

        throw new Error(
          "No se pudieron cargar las deudas."
        );

      }


      const data:
        Venta[] =
        await res.json();


      setVentasPendientes(
        data
      );


    } catch (error) {

      console.error(
        "Error al cargar deudas del cliente:",
        error
      );


      setVentasPendientes(
        []
      );

    }
  }

  function toggleSeleccion(
    ventaId: number
  ) {

    setVentasSeleccionadas(
      (
        ventasActuales
      ) => {

        if (
          ventasActuales
            .includes(
              ventaId
            )
        ) {

          return ventasActuales
            .filter(
              (id) =>
                id !==
                ventaId
            );

        }


        return [
          ...ventasActuales,
          ventaId,
        ];

      }
    );
  }

  async function confirmarPago() {

    if (
      !clienteSeleccionado
      ||
      ventasSeleccionadas
        .length === 0
    ) {

      return;
    }

    const clientePago = {
      ...clienteSeleccionado,
    };


    const ventasPago =
      ventasPendientes
        .filter(
          (venta) =>
            ventasSeleccionadas
              .includes(
                venta.id
              )
        );


    try {

      setProcesandoPago(
        true
      );


      const res =
        await fetch(
          `${API_URL}/pagar`,
          {

            method:
              "PUT",

            headers: {

              "Content-Type":
                "application/json",

            },

            body:
              JSON.stringify({

                ventas_ids:
                  ventasSeleccionadas,

              }),

          }
        );


      let data: any =
        {};


      const contentType =
        res.headers.get(
          "content-type"
        );


      if (
        contentType?.includes(
          "application/json"
        )
      ) {

        data =
          await res.json();

      }


      if (
        !res.ok
      ) {

        throw new Error(
          data.mensaje ||
          "No se pudo registrar el pago."
        );

      }

      await generarComprobantePagoPDF(
        clientePago,
        ventasPago
      );


      setMostrarExito(
        true
      );

      setClienteSeleccionado(
        null
      );


      setVentasPendientes(
        []
      );


      setVentasSeleccionadas(
        []
      );

      await cargarClientesMorosos();


    } catch (error) {

      console.error(
        "Error al registrar pago:",
        error
      );


      alert(
        error instanceof Error

          ? error.message

          : "No se pudo registrar el pago."
      );


    } finally {

      setProcesandoPago(
        false
      );

    }
  }

  if (
    !clienteSeleccionado
  ) {

    return (
      <>

        <div
          style={{
            width:
              "100%",

            maxWidth:
              "1050px",

            margin:
              "0 auto",

            padding:
              "20px",
          }}
        >

          <CCard
            className="
              shadow-sm
              border-0
            "

            style={{
              borderRadius:
                "14px",
            }}
          >

            <CCardBody
              style={{
                padding:
                  "24px",
              }}
            >

              <div
                className="
                  d-flex
                  align-items-center
                  justify-content-between
                  mb-4
                "
              >

                <div
                  className="
                    d-flex
                    align-items-center
                    gap-3
                  "
                >

                  <CButton
                    color="light"

                    onClick={() =>
                      navigate(-1)
                    }

                    style={{
                      width:
                        "42px",

                      height:
                        "42px",

                      display:
                        "flex",

                      justifyContent:
                        "center",

                      alignItems:
                        "center",
                    }}
                  >

                    <ArrowLeft
                      size={18}
                    />

                  </CButton>


                  {/* LOGUITO USUARIO */}

                  <div
                    className="
                      d-flex
                      justify-content-center
                      align-items-center
                    "

                    style={{
                      width:
                        "48px",

                      height:
                        "48px",

                      background:
                        "#eef4ff",

                      border:
                        "1px solid #dbeafe",

                      borderRadius:
                        "10px",
                    }}
                  >

                    <User
                      size={25}
                      color="#2563eb"
                    />

                  </div>


                  <div>

                    <h4
                      className="
                        mb-1
                        fw-bold
                      "
                    >
                      Clientes con Deuda Activa
                    </h4>


                    <div
                      className="
                        text-muted
                      "

                      style={{
                        fontSize:
                          "0.88rem",
                      }}
                    >
                      Seleccioná un cliente para
                      consultar y registrar sus pagos
                    </div>

                  </div>

                </div>


                <div
                  className="
                    d-flex
                    justify-content-center
                    align-items-center
                  "

                  style={{
                    minWidth:
                      "150px",

                    padding:
                      "10px 16px",

                    background:
                      "#eef4ff",

                    border:
                      "1px solid #dbeafe",

                    borderRadius:
                      "10px",

                    color:
                      "#2563eb",

                    fontWeight:
                      700,
                  }}
                >
                  {
                    clientesMorosos.length
                  }{" "}
                  deudores
                </div>

              </div>

              {
                clientesMorosos.length ===
                0
                  ? (

                    <div
                      className="
                        text-center
                        py-5
                      "
                    >

                      <CheckCircle2
                        size={42}
                        color="#16a34a"
                      />


                      <div
                        className="
                          fw-bold
                          mt-3
                        "
                      >
                        No hay clientes con deuda
                      </div>


                      <div
                        className="
                          text-muted
                          mt-1
                        "
                      >
                        Todas las cuentas están al día.
                      </div>

                    </div>

                  )
                  : (

                    <CListGroup>

                      {
                        clientesMorosos.map(
                          (
                            cliente
                          ) => (

                            <CListGroupItem
                              key={
                                cliente.id
                              }

                              component="button"

                              onClick={() =>
                                seleccionarCliente(
                                  cliente
                                )
                              }

                              className="
                                d-flex
                                align-items-center
                                justify-content-between
                                p-3
                              "

                              style={{
                                cursor:
                                  "pointer",
                              }}
                            >

                              <div
                                className="
                                  d-flex
                                  align-items-center
                                  gap-3
                                "
                              >

                                {/* LOGUITO DEL USUARIO */}

                                <div
                                  className="
                                    d-flex
                                    justify-content-center
                                    align-items-center
                                  "

                                  style={{
                                    width:
                                      "44px",

                                    height:
                                      "44px",

                                    background:
                                      "#eef4ff",

                                    borderRadius:
                                      "50%",

                                    flexShrink:
                                      0,
                                  }}
                                >

                                  <User
                                    size={21}
                                    color="#2563eb"
                                  />

                                </div>


                                <div>

                                  <div
                                    className="
                                      fw-bold
                                    "
                                  >
                                    {
                                      cliente.apellido
                                    }
                                    ,{" "}
                                    {
                                      cliente.nombre
                                    }
                                  </div>


                                  {
                                    cliente.apodo
                                    &&
                                    (

                                      <div
                                        className="
                                          text-muted
                                        "

                                        style={{
                                          fontSize:
                                            "0.82rem",
                                        }}
                                      >
                                        Alias:{" "}
                                        {
                                          cliente.apodo
                                        }
                                      </div>

                                    )
                                  }

                                </div>

                              </div>


                              <CButton
                                color="primary"
                                variant="outline"
                                size="sm"
                              >
                                Ver deudas
                              </CButton>

                            </CListGroupItem>

                          )
                        )
                      }

                    </CListGroup>

                  )
              }

            </CCardBody>

          </CCard>

        </div>


        <CModal
          visible={
            mostrarExito
          }

          alignment="center"

          backdrop="static"

          onClose={() =>
            setMostrarExito(
              false
            )
          }
        >

          <CModalHeader>

            <CModalTitle
              className="
                d-flex
                align-items-center
                gap-2
              "
            >

              <CheckCircle2
                size={23}
                color="#16a34a"
              />

              Pago registrado

            </CModalTitle>

          </CModalHeader>


          <CModalBody>

            <div
              className="
                text-center
                py-3
              "
            >

              <div
                className="
                  d-flex
                  justify-content-center
                  align-items-center
                  mx-auto
                  mb-3
                "

                style={{
                  width:
                    "60px",

                  height:
                    "60px",

                  background:
                    "#ecfdf3",

                  borderRadius:
                    "50%",
                }}
              >

                <ReceiptText
                  size={30}
                  color="#16a34a"
                />

              </div>


              <h5
                className="
                  fw-bold
                "
              >
                ¡Pago registrado correctamente!
              </h5>


              <p
                className="
                  text-muted
                  mb-0
                "
              >
                El comprobante PDF se generó
                automáticamente y ya podés enviárselo
                al cliente.
              </p>

            </div>

          </CModalBody>


          <CModalFooter>

            <CButton
              color="primary"

              onClick={() =>
                setMostrarExito(
                  false
                )
              }
            >
              Cerrar
            </CButton>

          </CModalFooter>

        </CModal>

      </>
    );
  }


  return (
    <div
      style={{
        width:
          "100%",

        maxWidth:
          "1050px",

        margin:
          "0 auto",

        padding:
          "20px",
      }}
    >

      <CCard
        className="
          shadow-sm
          border-0
        "

        style={{
          borderRadius:
            "14px",
        }}
      >

        <CCardBody
          style={{
            padding:
              "24px",
          }}
        >
          <div
            className="
              d-flex
              justify-content-between
              align-items-center
              mb-4
              gap-3
            "
          >

            <div
              className="
                d-flex
                align-items-center
                gap-3
              "
            >

              <CButton
                color="light"

                onClick={() => {

                  setClienteSeleccionado(
                    null
                  );

                  setVentasSeleccionadas(
                    []
                  );

                }}

                style={{
                  width:
                    "42px",

                  height:
                    "42px",

                  display:
                    "flex",

                  justifyContent:
                    "center",

                  alignItems:
                    "center",
                }}
              >

                <ArrowLeft
                  size={18}
                />

              </CButton>

              <div
                className="
                  d-flex
                  justify-content-center
                  align-items-center
                "

                style={{
                  width:
                    "50px",

                  height:
                    "50px",

                  minWidth:
                    "50px",

                  background:
                    "#eef4ff",

                  border:
                    "1px solid #dbeafe",

                  borderRadius:
                    "50%",
                }}
              >

                <User
                  size={25}
                  color="#2563eb"
                />

              </div>


              <div>

                <div
                  className="
                    text-muted
                  "

                  style={{
                    fontSize:
                      "0.8rem",
                  }}
                >
                  Cobrando a
                </div>


                <h4
                  className="
                    fw-bold
                    mb-0
                  "
                >
                  {
                    clienteSeleccionado.nombre
                  }{" "}
                  {
                    clienteSeleccionado.apellido
                  }
                </h4>


                {
                  clienteSeleccionado.apodo
                  &&
                  (

                    <div
                      className="
                        text-muted
                      "

                      style={{
                        fontSize:
                          "0.82rem",
                      }}
                    >
                      Alias:{" "}
                      {
                        clienteSeleccionado.apodo
                      }
                    </div>

                  )
                }

              </div>

            </div>

            <div
              style={{
                minWidth:
                  "210px",

                padding:
                  "12px 16px",

                background:
                  "#eef4ff",

                border:
                  "1px solid #dbeafe",

                borderRadius:
                  "12px",
              }}
            >

              <div
                className="
                  text-muted
                "

                style={{
                  fontSize:
                    "0.78rem",
                }}
              >
                Total seleccionado
              </div>


              <div
                style={{
                  color:
                    "#2563eb",

                  fontSize:
                    "1.45rem",

                  fontWeight:
                    700,
                }}
              >
                $
                {
                  formatearDinero(
                    totalAPagar
                  )
                }
              </div>

            </div>

          </div>


          {/* =================================
              DEUDAS
          ================================== */}

          {
            ventasPendientes.length ===
              0
              ? (

                <div
                  className="
                    text-center
                    text-muted
                    py-5
                  "
                >
                  Este cliente ya no tiene ventas
                  pendientes.
                </div>

              )
              : (

                <div>

                  {
                    ventasPendientes.map(
                      (
                        venta
                      ) => {

                        const seleccionada =
                          ventasSeleccionadas
                            .includes(
                              venta.id
                            );


                        return (

                          <div
                            key={
                              venta.id
                            }

                            className="
                              p-3
                              mb-3
                            "

                            style={{
                              border:
                                seleccionada
                                  ? "1px solid #93c5fd"
                                  : "1px solid #e5e7eb",

                              borderRadius:
                                "12px",

                              background:
                                seleccionada
                                  ? "#f8fbff"
                                  : "#fff",

                              transition:
                                "0.2s",
                            }}
                          >

                            <div
                              className="
                                d-flex
                                justify-content-between
                                align-items-center
                                gap-3
                              "
                            >

                              <CFormCheck
                                id={
                                  `venta-${venta.id}`
                                }

                                checked={
                                  seleccionada
                                }

                                onChange={() =>
                                  toggleSeleccion(
                                    venta.id
                                  )
                                }

                                label={
                                  `Venta #${venta.id} - ${formatearFecha(
                                    venta.fecha_venta
                                  )}`
                                }
                              />


                              <div
                                style={{
                                  color:
                                    "#dc2626",

                                  fontWeight:
                                    700,

                                  fontSize:
                                    "1.05rem",
                                }}
                              >
                                $
                                {
                                  formatearDinero(
                                    venta.total
                                  )
                                }
                              </div>

                            </div>

                            {
                              venta.detalles
                              &&
                              venta.detalles.length >
                                0
                              &&
                              (

                                <div
                                  style={{
                                    marginTop:
                                      "14px",

                                    marginLeft:
                                      "28px",

                                    background:
                                      "#f8fafc",

                                    border:
                                      "1px solid #e5e7eb",

                                    borderRadius:
                                      "10px",

                                    overflow:
                                      "hidden",
                                  }}
                                >

                                  <div
                                    style={{
                                      padding:
                                        "10px 14px",

                                      fontSize:
                                        "0.82rem",

                                      fontWeight:
                                        700,

                                      color:
                                        "#475569",

                                      borderBottom:
                                        "1px solid #e5e7eb",
                                    }}
                                  >
                                    Detalle de productos
                                  </div>


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
                                            d-flex
                                            justify-content-between
                                            align-items-center
                                            gap-3
                                          "

                                          style={{
                                            padding:
                                              "9px 14px",

                                            borderBottom:
                                              "1px solid #f1f5f9",
                                          }}
                                        >

                                          <div>

                                            <div
                                              style={{
                                                fontWeight:
                                                  600,
                                              }}
                                            >
                                              {
                                                detalle.producto_nombre
                                              }
                                            </div>


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
                                              }{" "}
                                              x $
                                              {
                                                formatearDinero(
                                                  detalle.precio_unitario
                                                )
                                              }
                                            </div>

                                          </div>


                                          <strong>
                                            $
                                            {
                                              formatearDinero(
                                                detalle.subtotal
                                              )
                                            }
                                          </strong>

                                        </div>

                                      )
                                    )
                                  }

                                </div>

                              )
                            }

                          </div>

                        );

                      }
                    )
                  }

                </div>

              )
          }


          <div
            className="
              d-flex
              justify-content-between
              align-items-center
              gap-4
              mt-4
              pt-3
            "

            style={{
              borderTop:
                "1px solid #e5e7eb",
            }}
          >

            <div
              className="
                d-flex
                align-items-center
                gap-3
              "
            >

              <div
                className="
                  d-flex
                  justify-content-center
                  align-items-center
                "

                style={{
                  width:
                    "48px",

                  height:
                    "48px",

                  background:
                    "#eef4ff",

                  borderRadius:
                    "10px",
                }}
              >

                <WalletCards
                  size={23}
                  color="#2563eb"
                />

              </div>


              <div>

                <div
                  className="
                    text-muted
                  "

                  style={{
                    fontSize:
                      "0.8rem",
                  }}
                >
                  Total a pagar
                </div>


                <div
                  style={{
                    fontSize:
                      "1.45rem",

                    fontWeight:
                      700,

                    color:
                      "#2563eb",
                  }}
                >
                  $
                  {
                    formatearDinero(
                      totalAPagar
                    )
                  }
                </div>

              </div>

            </div>


            <CButton
              color="success"

              disabled={
                ventasSeleccionadas
                  .length === 0
                ||
                procesandoPago
              }

              onClick={
                confirmarPago
              }

              style={{
                minWidth:
                  "270px",

                minHeight:
                  "44px",
              }}
            >

              {
                procesandoPago
                  ? (
                    <>

                      <CSpinner
                        size="sm"
                        className="me-2"
                      />

                      Procesando pago...

                    </>
                  )
                  : (
                    <>

                      <ReceiptText
                        size={18}
                        className="me-2"
                      />

                      Confirmar pago y generar PDF

                    </>
                  )
              }

            </CButton>

          </div>

        </CCardBody>

      </CCard>

    </div>
  );
}