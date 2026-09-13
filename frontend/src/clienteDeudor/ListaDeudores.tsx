import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CButton,
  CCard,
  CCardBody,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CInputGroup,
  CInputGroupText,
  CListGroup,
  CListGroupItem,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from "@coreui/react";
import {
  ArrowLeft,
  CheckCircle2,
  ReceiptText,
  User,
  WalletCards,
} from "lucide-react";

import { generarComprobantePagoPDF } from "../GeneradorPDF";

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
  tipo_venta?: "UNIDAD" | "PESO";
  cantidad: number | string;
  precio_unitario: string | number;
  subtotal: string | number;
}

interface Venta {
  id: number;
  fecha_venta: string;
  total: string | number;

  // Nuevos campos para deuda parcial.
  // Los dejamos opcionales para que la pantalla no explote
  // si todavía existe alguna respuesta vieja del backend.
  saldo_pendiente?: string | number;
  total_pagado?: string | number;

  detalles?: DetalleVenta[];
}

type MontosPago = Record<number, string>;

const API_URL = "http://localhost:3000/ventas";

function formatearDinero(valor: string | number) {
  return Number(valor || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-AR");
}

function obtenerSaldo(venta: Venta) {
  return Number(
    venta.saldo_pendiente !== undefined
      ? venta.saldo_pendiente
      : venta.total
  );
}

function obtenerPagado(venta: Venta) {
  if (venta.total_pagado !== undefined) {
    return Number(venta.total_pagado);
  }

  return Math.max(Number(venta.total) - obtenerSaldo(venta), 0);
}

function formatearCantidadDetalle(detalle: DetalleVenta) {
  const cantidad = Number(detalle.cantidad);

  if (detalle.tipo_venta !== "PESO") {
    return `${cantidad}`;
  }

  if (cantidad < 1) {
    return `${Math.round(cantidad * 1000)} g`;
  }

  return `${cantidad.toLocaleString("es-AR", {
    maximumFractionDigits: 3,
  })} kg`;
}

export default function ListaDeudores() {
  const navigate = useNavigate();

  const [clientesMorosos, setClientesMorosos] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente | null>(null);
  const [ventasPendientes, setVentasPendientes] = useState<Venta[]>([]);

  const [ventasSeleccionadas, setVentasSeleccionadas] = useState<number[]>([]);
  const [montosPago, setMontosPago] = useState<MontosPago>({});

  const [cargandoClientes, setCargandoClientes] = useState(true);
  const [cargandoDeudas, setCargandoDeudas] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);

  const [mostrarExito, setMostrarExito] = useState(false);
  const [montoUltimoPago, setMontoUltimoPago] = useState(0);
  const [error, setError] = useState("");

  const totalDeudaCliente = useMemo(
    () =>
      ventasPendientes.reduce(
        (acumulado, venta) => acumulado + obtenerSaldo(venta),
        0
      ),
    [ventasPendientes]
  );

  const totalAPagar = useMemo(
    () =>
      ventasSeleccionadas.reduce((acumulado, ventaId) => {
        const monto = Number(montosPago[ventaId] || 0);
        return acumulado + (Number.isFinite(monto) ? monto : 0);
      }, 0),
    [ventasSeleccionadas, montosPago]
  );

  useEffect(() => {
    void cargarClientesMorosos();
  }, []);

  async function cargarClientesMorosos() {
    setCargandoClientes(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/deudores`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.mensaje || "No se pudieron cargar los clientes.");
      }

      setClientesMorosos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar clientes morosos:", err);
      setClientesMorosos([]);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los clientes con deuda."
      );
    } finally {
      setCargandoClientes(false);
    }
  }

  async function seleccionarCliente(cliente: Cliente) {
    setClienteSeleccionado(cliente);
    setVentasSeleccionadas([]);
    setMontosPago({});
    setVentasPendientes([]);
    setError("");
    setCargandoDeudas(true);

    try {
      const res = await fetch(`${API_URL}/deudas/${cliente.id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.mensaje || "No se pudieron cargar las deudas.");
      }

      const ventas: Venta[] = Array.isArray(data) ? data : [];

      setVentasPendientes(
        ventas.map((venta) => ({
          ...venta,
          total: Number(venta.total),
          saldo_pendiente:
            venta.saldo_pendiente !== undefined
              ? Number(venta.saldo_pendiente)
              : Number(venta.total),
          total_pagado:
            venta.total_pagado !== undefined
              ? Number(venta.total_pagado)
              : Math.max(
                  Number(venta.total) -
                    Number(
                      venta.saldo_pendiente !== undefined
                        ? venta.saldo_pendiente
                        : venta.total
                    ),
                  0
                ),
          detalles: venta.detalles?.map((detalle) => ({
            ...detalle,
            cantidad: Number(detalle.cantidad),
            precio_unitario: Number(detalle.precio_unitario),
            subtotal: Number(detalle.subtotal),
          })),
        }))
      );
    } catch (err) {
      console.error("Error al cargar deudas del cliente:", err);
      setVentasPendientes([]);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las deudas del cliente."
      );
    } finally {
      setCargandoDeudas(false);
    }
  }

  function volverAClientes() {
    setClienteSeleccionado(null);
    setVentasPendientes([]);
    setVentasSeleccionadas([]);
    setMontosPago({});
    setError("");
  }

  function toggleSeleccion(venta: Venta) {
    const yaSeleccionada = ventasSeleccionadas.includes(venta.id);

    if (yaSeleccionada) {
      setVentasSeleccionadas((actuales) =>
        actuales.filter((id) => id !== venta.id)
      );

      setMontosPago((actuales) => {
        const copia = { ...actuales };
        delete copia[venta.id];
        return copia;
      });

      return;
    }

    const saldo = obtenerSaldo(venta);

    setVentasSeleccionadas((actuales) => [...actuales, venta.id]);
    setMontosPago((actuales) => ({
      ...actuales,
      [venta.id]: saldo.toFixed(2),
    }));
  }

  function cambiarMontoPago(venta: Venta, valor: string) {
    // Permite borrar el input para volver a escribirlo.
    if (valor === "") {
      setMontosPago((actuales) => ({
        ...actuales,
        [venta.id]: "",
      }));
      return;
    }

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return;
    }

    const saldo = obtenerSaldo(venta);
    const limitado = Math.min(Math.max(numero, 0), saldo);

    setMontosPago((actuales) => ({
      ...actuales,
      [venta.id]: String(limitado),
    }));
  }

  function pagarSaldoCompleto(venta: Venta) {
    setMontosPago((actuales) => ({
      ...actuales,
      [venta.id]: obtenerSaldo(venta).toFixed(2),
    }));
  }

  function validarPago() {
    if (!clienteSeleccionado || ventasSeleccionadas.length === 0) {
      return "Seleccioná al menos una venta.";
    }

    for (const ventaId of ventasSeleccionadas) {
      const venta = ventasPendientes.find((item) => item.id === ventaId);

      if (!venta) {
        return "Una de las ventas seleccionadas ya no está disponible.";
      }

      const monto = Number(montosPago[ventaId]);
      const saldo = obtenerSaldo(venta);

      if (!Number.isFinite(monto) || monto <= 0) {
        return `Ingresá un monto válido para la venta #${venta.id}.`;
      }

      if (monto > saldo) {
        return `El pago de la venta #${venta.id} no puede superar su saldo pendiente.`;
      }
    }

    return null;
  }

  async function confirmarPago() {
    const mensajeValidacion = validarPago();

    if (mensajeValidacion) {
      setError(mensajeValidacion);
      return;
    }

    if (!clienteSeleccionado) {
      return;
    }

    const clientePago = { ...clienteSeleccionado };

    const aplicaciones = ventasSeleccionadas.map((ventaId) => ({
      venta_id: ventaId,
      monto: Number(montosPago[ventaId]),
    }));

    // El GeneradorPDF actual calcula el total usando venta.total.
    // Para que un pago parcial no figure como si se hubiese abonado
    // la venta completa, le pasamos como total el monto efectivamente pagado.
    const ventasParaPDF = ventasPendientes
      .filter((venta) => ventasSeleccionadas.includes(venta.id))
      .map((venta) => {
        const montoPagado = Number(montosPago[venta.id]);
        const esPagoTotal =
          Math.abs(montoPagado - obtenerSaldo(venta)) < 0.005;

        return {
          id: venta.id,
          fecha_venta: venta.fecha_venta,
          total: montoPagado,
          // Si el pago es parcial evitamos mostrar el detalle completo
          // como si todo ese detalle hubiese sido cancelado.
          detalles: esPagoTotal ? venta.detalles : undefined,
        };
      });

    setProcesandoPago(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/pagar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente_id: clienteSeleccionado.id,
          aplicaciones,
        }),
      });

      let data: any = {};
      const contentType = res.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        data = await res.json();
      }

      if (!res.ok) {
        throw new Error(data?.mensaje || "No se pudo registrar el pago.");
      }

      try {
        await generarComprobantePagoPDF(clientePago, ventasParaPDF);
      } catch (pdfError) {
        // El pago ya quedó guardado. Si falla el PDF no debemos intentar
        // cobrar nuevamente al cliente.
        console.error("El pago se registró, pero falló el PDF:", pdfError);
      }

      setMontoUltimoPago(totalAPagar);
      setMostrarExito(true);

      setClienteSeleccionado(null);
      setVentasPendientes([]);
      setVentasSeleccionadas([]);
      setMontosPago({});

      await cargarClientesMorosos();
    } catch (err) {
      console.error("Error al registrar pago:", err);
      setError(
        err instanceof Error ? err.message : "No se pudo registrar el pago."
      );
    } finally {
      setProcesandoPago(false);
    }
  }

  const modalExito = (
    <CModal
      visible={mostrarExito}
      alignment="center"
      backdrop="static"
      onClose={() => setMostrarExito(false)}
    >
      <CModalHeader>
        <CModalTitle className="d-flex align-items-center gap-2">
          <CheckCircle2 size={23} color="#16a34a" />
          Pago registrado
        </CModalTitle>
      </CModalHeader>

      <CModalBody>
        <div className="text-center py-3">
          <div
            className="d-flex justify-content-center align-items-center mx-auto mb-3"
            style={{
              width: "60px",
              height: "60px",
              background: "#ecfdf3",
              borderRadius: "50%",
            }}
          >
            <ReceiptText size={30} color="#16a34a" />
          </div>

          <h5 className="fw-bold">¡Pago registrado correctamente!</h5>

          <p className="text-muted mb-2">
            Se registró un pago de
          </p>

          <div
            style={{
              color: "#16a34a",
              fontSize: "1.55rem",
              fontWeight: 800,
            }}
          >
            ${formatearDinero(montoUltimoPago)}
          </div>

          <p className="text-muted mt-3 mb-0" style={{ fontSize: "0.88rem" }}>
            El saldo del cliente fue actualizado. También se intentó generar el
            comprobante PDF del pago.
          </p>
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton color="primary" onClick={() => setMostrarExito(false)}>
          Cerrar
        </CButton>
      </CModalFooter>
    </CModal>
  );

  if (!clienteSeleccionado) {
    return (
      <>
        <div
          style={{
            width: "100%",
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "20px",
          }}
        >
          <CCard
            className="shadow-sm border-0"
            style={{ borderRadius: "14px" }}
          >
            <CCardBody style={{ padding: "24px" }}>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div className="d-flex align-items-center gap-3">
                  <CButton
                    color="light"
                    onClick={() => navigate(-1)}
                    style={{
                      width: "42px",
                      height: "42px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <ArrowLeft size={18} />
                  </CButton>

                  <div
                    className="d-flex justify-content-center align-items-center"
                    style={{
                      width: "48px",
                      height: "48px",
                      background: "#eef4ff",
                      border: "1px solid #dbeafe",
                      borderRadius: "10px",
                    }}
                  >
                    <User size={25} color="#2563eb" />
                  </div>

                  <div>
                    <h4 className="mb-1 fw-bold">Clientes con Deuda Activa</h4>
                    <div
                      className="text-muted"
                      style={{ fontSize: "0.88rem" }}
                    >
                      Seleccioná un cliente para consultar sus deudas y registrar
                      pagos totales o parciales.
                    </div>
                  </div>
                </div>

                <div
                  className="d-flex justify-content-center align-items-center"
                  style={{
                    minWidth: "150px",
                    padding: "10px 16px",
                    background: "#eef4ff",
                    border: "1px solid #dbeafe",
                    borderRadius: "10px",
                    color: "#2563eb",
                    fontWeight: 700,
                  }}
                >
                  {clientesMorosos.length} deudores
                </div>
              </div>

              {error && (
                <div
                  className="mb-3"
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "#fff1f2",
                    border: "1px solid #fecdd3",
                    color: "#be123c",
                    fontSize: "0.88rem",
                  }}
                >
                  {error}
                </div>
              )}

              {cargandoClientes ? (
                <div className="text-center py-5">
                  <CSpinner color="primary" />
                  <div className="text-muted mt-3">Cargando clientes...</div>
                </div>
              ) : clientesMorosos.length === 0 ? (
                <div className="text-center py-5">
                  <CheckCircle2 size={42} color="#16a34a" />
                  <div className="fw-bold mt-3">No hay clientes con deuda</div>
                  <div className="text-muted mt-1">
                    Todas las cuentas están al día.
                  </div>
                </div>
              ) : (
                <CListGroup>
                  {clientesMorosos.map((cliente) => (
                    <CListGroupItem
                      key={cliente.id}
                      component="button"
                      onClick={() => void seleccionarCliente(cliente)}
                      className="d-flex align-items-center justify-content-between p-3"
                      style={{ cursor: "pointer" }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="d-flex justify-content-center align-items-center"
                          style={{
                            width: "44px",
                            height: "44px",
                            background: "#eef4ff",
                            borderRadius: "50%",
                            flexShrink: 0,
                          }}
                        >
                          <User size={21} color="#2563eb" />
                        </div>

                        <div>
                          <div className="fw-bold">
                            {cliente.apellido}, {cliente.nombre}
                          </div>

                          {cliente.apodo && (
                            <div
                              className="text-muted"
                              style={{ fontSize: "0.82rem" }}
                            >
                              Alias: {cliente.apodo}
                            </div>
                          )}
                        </div>
                      </div>

                      <CButton color="primary" variant="outline" size="sm">
                        Ver deudas
                      </CButton>
                    </CListGroupItem>
                  ))}
                </CListGroup>
              )}
            </CCardBody>
          </CCard>
        </div>

        {modalExito}
      </>
    );
  }

  return (
    <>
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "20px",
        }}
      >
        <CCard className="shadow-sm border-0" style={{ borderRadius: "14px" }}>
          <CCardBody style={{ padding: "24px" }}>
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
              <div className="d-flex align-items-center gap-3">
                <CButton
                  color="light"
                  onClick={volverAClientes}
                  style={{
                    width: "42px",
                    height: "42px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ArrowLeft size={18} />
                </CButton>

                <div
                  className="d-flex justify-content-center align-items-center"
                  style={{
                    width: "50px",
                    height: "50px",
                    minWidth: "50px",
                    background: "#eef4ff",
                    border: "1px solid #dbeafe",
                    borderRadius: "50%",
                  }}
                >
                  <User size={25} color="#2563eb" />
                </div>

                <div>
                  <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                    Cuenta corriente
                  </div>

                  <h4 className="fw-bold mb-0">
                    {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}
                  </h4>

                  {clienteSeleccionado.apodo && (
                    <div className="text-muted" style={{ fontSize: "0.82rem" }}>
                      Alias: {clienteSeleccionado.apodo}
                    </div>
                  )}
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2">
                <div
                  style={{
                    minWidth: "175px",
                    padding: "10px 14px",
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                    borderRadius: "12px",
                  }}
                >
                  <div className="text-muted" style={{ fontSize: "0.76rem" }}>
                    Deuda actual
                  </div>
                  <div
                    style={{
                      color: "#dc2626",
                      fontSize: "1.25rem",
                      fontWeight: 700,
                    }}
                  >
                    ${formatearDinero(totalDeudaCliente)}
                  </div>
                </div>

                <div
                  style={{
                    minWidth: "175px",
                    padding: "10px 14px",
                    background: "#eef4ff",
                    border: "1px solid #dbeafe",
                    borderRadius: "12px",
                  }}
                >
                  <div className="text-muted" style={{ fontSize: "0.76rem" }}>
                    Pago seleccionado
                  </div>
                  <div
                    style={{
                      color: "#2563eb",
                      fontSize: "1.25rem",
                      fontWeight: 700,
                    }}
                  >
                    ${formatearDinero(totalAPagar)}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div
                className="mb-3"
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "#fff1f2",
                  border: "1px solid #fecdd3",
                  color: "#be123c",
                  fontSize: "0.88rem",
                }}
              >
                {error}
              </div>
            )}

            {cargandoDeudas ? (
              <div className="text-center py-5">
                <CSpinner color="primary" />
                <div className="text-muted mt-3">Cargando deudas...</div>
              </div>
            ) : ventasPendientes.length === 0 ? (
              <div className="text-center text-muted py-5">
                <CheckCircle2 size={42} color="#16a34a" />
                <div className="fw-bold mt-3 text-dark">
                  Este cliente ya no tiene deuda pendiente
                </div>
              </div>
            ) : (
              <div>
                {ventasPendientes.map((venta) => {
                  const seleccionada = ventasSeleccionadas.includes(venta.id);
                  const saldo = obtenerSaldo(venta);
                  const pagado = obtenerPagado(venta);
                  const montoIngresado = Number(montosPago[venta.id] || 0);
                  const saldoLuegoDelPago = Math.max(saldo - montoIngresado, 0);

                  return (
                    <div
                      key={venta.id}
                      className="p-3 mb-3"
                      style={{
                        border: seleccionada
                          ? "1px solid #93c5fd"
                          : "1px solid #e5e7eb",
                        borderRadius: "12px",
                        background: seleccionada ? "#f8fbff" : "#fff",
                        transition: "0.2s",
                      }}
                    >
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <CFormCheck
                          id={`venta-${venta.id}`}
                          checked={seleccionada}
                          onChange={() => toggleSeleccion(venta)}
                          label={`Venta #${venta.id} - ${formatearFecha(
                            venta.fecha_venta
                          )}`}
                        />

                        <div style={{ textAlign: "right" }}>
                          <div
                            className="text-muted"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Saldo pendiente
                          </div>
                          <div
                            style={{
                              color: "#dc2626",
                              fontWeight: 700,
                              fontSize: "1.08rem",
                            }}
                          >
                            ${formatearDinero(saldo)}
                          </div>
                        </div>
                      </div>

                      <div
                        className="d-flex flex-wrap gap-4 mt-3"
                        style={{ fontSize: "0.85rem" }}
                      >
                        <div>
                          <span className="text-muted">Importe original: </span>
                          <strong>${formatearDinero(venta.total)}</strong>
                        </div>

                        <div>
                          <span className="text-muted">Ya pagado: </span>
                          <strong style={{ color: "#16a34a" }}>
                            ${formatearDinero(pagado)}
                          </strong>
                        </div>
                      </div>

                      {venta.detalles && venta.detalles.length > 0 && (
                        <div
                          style={{
                            marginTop: "14px",
                            marginLeft: "28px",
                            background: "#f8fafc",
                            border: "1px solid #e5e7eb",
                            borderRadius: "10px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              padding: "10px 14px",
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              color: "#475569",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            Detalle de productos
                          </div>

                          {venta.detalles.map((detalle) => (
                            <div
                              key={detalle.id}
                              className="d-flex justify-content-between align-items-center gap-3"
                              style={{
                                padding: "9px 14px",
                                borderBottom: "1px solid #f1f5f9",
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 600 }}>
                                  {detalle.producto_nombre}
                                </div>

                                <div
                                  className="text-muted"
                                  style={{ fontSize: "0.78rem" }}
                                >
                                  {formatearCantidadDetalle(detalle)} × $
                                  {formatearDinero(detalle.precio_unitario)}
                                  {detalle.tipo_venta === "PESO" ? "/kg" : ""}
                                </div>
                              </div>

                              <strong>
                                ${formatearDinero(detalle.subtotal)}
                              </strong>
                            </div>
                          ))}
                        </div>
                      )}

                      {seleccionada && (
                        <div
                          style={{
                            marginTop: "16px",
                            paddingTop: "16px",
                            borderTop: "1px solid #dbeafe",
                          }}
                        >
                          <div className="d-flex flex-wrap align-items-end gap-3">
                            <div style={{ flex: "1 1 260px" }}>
                              <CFormLabel
                                htmlFor={`monto-${venta.id}`}
                                className="fw-semibold"
                              >
                                Monto que paga de esta venta
                              </CFormLabel>

                              <CInputGroup>
                                <CInputGroupText>$</CInputGroupText>
                                <CFormInput
                                  id={`monto-${venta.id}`}
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  max={saldo}
                                  value={montosPago[venta.id] ?? ""}
                                  onChange={(e) =>
                                    cambiarMontoPago(venta, e.target.value)
                                  }
                                />
                              </CInputGroup>
                            </div>

                            <CButton
                              color="primary"
                              variant="outline"
                              onClick={() => pagarSaldoCompleto(venta)}
                            >
                              Pagar saldo completo
                            </CButton>
                          </div>

                          <div
                            className="d-flex flex-wrap justify-content-between gap-2 mt-3"
                            style={{ fontSize: "0.84rem" }}
                          >
                            <span className="text-muted">
                              Podés pagar todo o solamente una parte.
                            </span>

                            <span>
                              Saldo después del pago: {" "}
                              <strong
                                style={{
                                  color:
                                    saldoLuegoDelPago === 0
                                      ? "#16a34a"
                                      : "#dc2626",
                                }}
                              >
                                ${formatearDinero(saldoLuegoDelPago)}
                              </strong>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div
              className="d-flex flex-wrap justify-content-between align-items-center gap-4 mt-4 pt-3"
              style={{ borderTop: "1px solid #e5e7eb" }}
            >
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex justify-content-center align-items-center"
                  style={{
                    width: "48px",
                    height: "48px",
                    background: "#eef4ff",
                    borderRadius: "10px",
                  }}
                >
                  <WalletCards size={23} color="#2563eb" />
                </div>

                <div>
                  <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                    Total a registrar
                  </div>
                  <div
                    style={{
                      fontSize: "1.45rem",
                      fontWeight: 700,
                      color: "#2563eb",
                    }}
                  >
                    ${formatearDinero(totalAPagar)}
                  </div>
                </div>
              </div>

              <CButton
                color="success"
                disabled={
                  ventasSeleccionadas.length === 0 ||
                  totalAPagar <= 0 ||
                  procesandoPago
                }
                onClick={() => void confirmarPago()}
                style={{
                  minWidth: "270px",
                  minHeight: "44px",
                }}
              >
                {procesandoPago ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Procesando pago...
                  </>
                ) : (
                  <>
                    <ReceiptText size={18} className="me-2" />
                    Confirmar pago y generar PDF
                  </>
                )}
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      </div>

      {modalExito}
    </>
  );
}
