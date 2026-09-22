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
import "./ListaDeudores.css";

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  apodo?: string | null;
  ventas_pendientes?: number;
  deuda_total?: number | string;
}

interface DetalleVenta {
  id: number;
  producto_id: number;
  producto_nombre: string;
  tipo_venta?: "UNIDAD" | "PESO";
  cantidad: number | string;
  precio_unitario: number | string;
  subtotal: number | string;
}

interface Venta {
  id: number;
  fecha_venta: string;
  total: number | string;
  saldo_pendiente?: number | string;
  total_pagado?: number | string;
  detalles?: DetalleVenta[];
}

type MontosPago = Record<number, string>;

const API_URL = "http://127.0.0.1:3000/ventas";

function dinero(valor: number | string) {
  return Number(valor || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatearFecha(valor: string) {
  return new Date(valor).toLocaleDateString("es-AR");
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

function formatearCantidad(detalle: DetalleVenta) {
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

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente | null>(null);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [seleccionadas, setSeleccionadas] = useState<number[]>([]);
  const [montos, setMontos] = useState<MontosPago>({});

  const [cargandoClientes, setCargandoClientes] = useState(true);
  const [cargandoDeudas, setCargandoDeudas] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  const [mostrarExito, setMostrarExito] = useState(false);
  const [montoUltimoPago, setMontoUltimoPago] = useState(0);
  const [pdfGenerado, setPdfGenerado] = useState(false);

  useEffect(() => {
    void cargarClientes();
  }, []);

  async function cargarClientes() {
    setCargandoClientes(true);
    setError("");

    try {
      const respuesta = await fetch(`${API_URL}/deudores`);
      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data?.mensaje || "No se pudieron cargar los deudores."
        );
      }

      setClientes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los deudores."
      );
    } finally {
      setCargandoClientes(false);
    }
  }

  async function seleccionarCliente(cliente: Cliente) {
    setClienteSeleccionado(cliente);
    setVentas([]);
    setSeleccionadas([]);
    setMontos({});
    setError("");
    setCargandoDeudas(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/deudas/${cliente.id}`
      );
      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data?.mensaje || "No se pudieron cargar las deudas."
        );
      }

      const normalizadas: Venta[] = (
        Array.isArray(data) ? data : []
      ).map((venta: any) => ({
        ...venta,
        total: Number(venta.total),
        saldo_pendiente: Number(
          venta.saldo_pendiente ?? venta.total
        ),
        total_pagado: Number(venta.total_pagado ?? 0),
        detalles: (venta.detalles || []).map((detalle: any) => ({
          ...detalle,
          cantidad: Number(detalle.cantidad),
          precio_unitario: Number(detalle.precio_unitario),
          subtotal: Number(detalle.subtotal),
        })),
      }));

      setVentas(normalizadas);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las deudas."
      );
    } finally {
      setCargandoDeudas(false);
    }
  }

  function volverAClientes() {
    setClienteSeleccionado(null);
    setVentas([]);
    setSeleccionadas([]);
    setMontos({});
    setError("");
  }

  function toggleVenta(venta: Venta) {
    if (seleccionadas.includes(venta.id)) {
      setSeleccionadas((actuales) =>
        actuales.filter((id) => id !== venta.id)
      );

      setMontos((actuales) => {
        const copia = { ...actuales };
        delete copia[venta.id];
        return copia;
      });

      return;
    }

    setSeleccionadas((actuales) => [...actuales, venta.id]);

    setMontos((actuales) => ({
      ...actuales,
      [venta.id]: obtenerSaldo(venta).toFixed(2),
    }));
  }

  function cambiarMonto(venta: Venta, valor: string) {
    if (valor === "") {
      setMontos((actuales) => ({
        ...actuales,
        [venta.id]: "",
      }));
      return;
    }

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return;
    }

    const limitado = Math.min(
      Math.max(numero, 0),
      obtenerSaldo(venta)
    );

    setMontos((actuales) => ({
      ...actuales,
      [venta.id]: String(limitado),
    }));
  }

  const totalAPagar = useMemo(
    () =>
      seleccionadas.reduce(
        (acumulado, ventaId) =>
          acumulado + Number(montos[ventaId] || 0),
        0
      ),
    [seleccionadas, montos]
  );

  const deudaCliente = useMemo(
    () =>
      ventas.reduce(
        (acumulado, venta) => acumulado + obtenerSaldo(venta),
        0
      ),
    [ventas]
  );

  const saldoDespues = Math.max(deudaCliente - totalAPagar, 0);

  const pagoValido =
    clienteSeleccionado !== null &&
    seleccionadas.length > 0 &&
    totalAPagar > 0 &&
    seleccionadas.every((ventaId) => {
      const venta = ventas.find((item) => item.id === ventaId);

      if (!venta) {
        return false;
      }

      const monto = Number(montos[ventaId] || 0);

      return monto > 0 && monto <= obtenerSaldo(venta);
    });

  async function confirmarPago() {
    if (!clienteSeleccionado || !pagoValido) {
      setError(
        "Seleccioná al menos una venta e ingresá un monto válido."
      );
      return;
    }

    const aplicaciones = seleccionadas.map((ventaId) => ({
      venta_id: ventaId,
      monto: Number(montos[ventaId]),
    }));

    const ventasPDF = ventas
      .filter((venta) => seleccionadas.includes(venta.id))
      .map((venta) => ({
        id: venta.id,
        fecha_venta: venta.fecha_venta,
        total: venta.total,
        saldo_antes: obtenerSaldo(venta),
        monto_pagado: Number(montos[venta.id]),
        detalles: venta.detalles,
      }));

    setProcesando(true);
    setError("");
    setPdfGenerado(false);

    try {
      const respuesta = await fetch(`${API_URL}/pagar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente_id: clienteSeleccionado.id,
          aplicaciones,
        }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data?.mensaje || "No se pudo registrar el pago."
        );
      }

      /*
       * El pago ya fue confirmado en backend.
       * El PDF se descarga automáticamente una sola vez.
       */
      let generado = false;

      try {
        await generarComprobantePagoPDF(
          {
            id: clienteSeleccionado.id,
            nombre: clienteSeleccionado.nombre,
            apellido: clienteSeleccionado.apellido,
            apodo: clienteSeleccionado.apodo,
          },
          ventasPDF
        );
        generado = true;
      } catch (errorPDF) {
        console.error(
          "El pago se registró, pero falló el PDF:",
          errorPDF
        );
      }

      setPdfGenerado(generado);
      setMontoUltimoPago(totalAPagar);
      setMostrarExito(true);

      setClienteSeleccionado(null);
      setVentas([]);
      setSeleccionadas([]);
      setMontos({});

      await cargarClientes();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar el pago."
      );
    } finally {
      setProcesando(false);
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
        <CModalTitle>Pago registrado</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <div className="deudores-exito">
          <div className="deudores-exito-icono">
            <CheckCircle2 size={34} />
          </div>

          <h5>¡Pago registrado correctamente!</h5>
          <span>Importe abonado</span>
          <strong>${dinero(montoUltimoPago)}</strong>

          <p>
            {pdfGenerado
              ? "El comprobante PDF se descargó automáticamente."
              : "El pago quedó registrado, pero no se pudo descargar el PDF. Revisá las dependencias de jsPDF."}
          </p>
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton
          color="primary"
          onClick={() => setMostrarExito(false)}
        >
          Cerrar
        </CButton>
      </CModalFooter>
    </CModal>
  );

  if (!clienteSeleccionado) {
    return (
      <>
        <div className="deudores-page">
          <CCard className="deudores-card-principal">
            <CCardBody>
              <div className="deudores-header">
                <div className="deudores-header-titulo">
                  <CButton
                    color="light"
                    className="deudores-volver"
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft size={18} />
                  </CButton>

                  <div className="deudores-icono">
                    <User size={25} />
                  </div>

                  <div>
                    <h2>Clientes con Deuda Activa</h2>
                    <p>
                      Seleccioná un cliente para consultar sus deudas y
                      registrar pagos totales o parciales.
                    </p>
                  </div>
                </div>

                <div className="deudores-contador">
                  {clientes.length}{" "}
                  {clientes.length === 1 ? "deudor" : "deudores"}
                </div>
              </div>

              {error && <div className="deudores-error">{error}</div>}

              {cargandoClientes ? (
                <div className="deudores-cargando">
                  <CSpinner color="primary" />
                  <span>Cargando deudores...</span>
                </div>
              ) : clientes.length === 0 ? (
                <div className="deudores-vacio">
                  <CheckCircle2 size={42} />
                  <strong>No hay clientes con deuda</strong>
                  <span>Todas las cuentas están al día.</span>
                </div>
              ) : (
                <div className="deudores-clientes-grid">
                  {clientes.map((cliente) => (
                    <button
                      type="button"
                      key={cliente.id}
                      className="deudores-cliente"
                      onClick={() => void seleccionarCliente(cliente)}
                    >
                      <div className="deudores-cliente-icono">
                        <User size={21} />
                      </div>

                      <div className="deudores-cliente-datos">
                        <strong>
                          {cliente.apellido}, {cliente.nombre}
                        </strong>
                        {cliente.apodo && <span>{cliente.apodo}</span>}
                      </div>

                      <div className="deudores-cliente-resumen">
                        {cliente.deuda_total !== undefined && (
                          <strong>${dinero(cliente.deuda_total)}</strong>
                        )}
                        <span>Ver deudas</span>
                      </div>
                    </button>
                  ))}
                </div>
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
      <div className="deudores-page">
        <div className="deudores-detalle-header">
          <CButton
            color="light"
            className="deudores-volver"
            onClick={volverAClientes}
          >
            <ArrowLeft size={18} />
          </CButton>

          <div className="deudores-detalle-identidad">
            <div className="deudores-icono">
              <User size={24} />
            </div>

            <div>
              <h2>
                {clienteSeleccionado.apellido},{" "}
                {clienteSeleccionado.nombre}
              </h2>
              <p>
                Elegí qué ventas o qué importe querés cobrar.
              </p>
            </div>
          </div>

          <div className="deudores-deuda-total">
            <span>Deuda actual</span>
            <strong>${dinero(deudaCliente)}</strong>
          </div>
        </div>

        {error && <div className="deudores-error">{error}</div>}

        <div className="deudores-workspace">
          <CCard className="deudores-ventas-card">
            <CCardBody>
              <div className="deudores-seccion-titulo">
                <div>
                  <ReceiptText size={20} />
                  <strong>Ventas pendientes</strong>
                </div>
                <span>
                  {ventas.length} {ventas.length === 1 ? "venta" : "ventas"}
                </span>
              </div>

              {cargandoDeudas ? (
                <div className="deudores-cargando">
                  <CSpinner color="primary" />
                  <span>Cargando deudas...</span>
                </div>
              ) : ventas.length === 0 ? (
                <div className="deudores-vacio">
                  <CheckCircle2 size={42} />
                  <strong>Este cliente no tiene deuda</strong>
                </div>
              ) : (
                <div className="deudores-ventas-scroll">
                  {ventas.map((venta) => {
                    const estaSeleccionada = seleccionadas.includes(
                      venta.id
                    );
                    const saldoVenta = obtenerSaldo(venta);
                    const monto = Number(montos[venta.id] || 0);
                    const saldoPosterior = Math.max(
                      saldoVenta - monto,
                      0
                    );

                    return (
                      <div
                        key={venta.id}
                        className={`deudores-venta ${
                          estaSeleccionada
                            ? "deudores-venta-activa"
                            : ""
                        }`}
                      >
                        <div className="deudores-venta-cabecera">
                          <CFormCheck
                            checked={estaSeleccionada}
                            onChange={() => toggleVenta(venta)}
                            aria-label={`Seleccionar venta ${venta.id}`}
                          />

                          <div className="deudores-venta-info">
                            <strong>Venta #{venta.id}</strong>
                            <span>{formatearFecha(venta.fecha_venta)}</span>
                          </div>

                          <div className="deudores-venta-saldo">
                            <span>Saldo</span>
                            <strong>${dinero(saldoVenta)}</strong>
                          </div>
                        </div>

                        <div className="deudores-venta-montos">
                          <div>
                            <span>Importe original</span>
                            <strong>${dinero(venta.total)}</strong>
                          </div>

                          <div>
                            <span>Ya pagado</span>
                            <strong className="texto-verde">
                              ${dinero(obtenerPagado(venta))}
                            </strong>
                          </div>

                          <div>
                            <span>Pendiente</span>
                            <strong className="texto-rojo">
                              ${dinero(saldoVenta)}
                            </strong>
                          </div>
                        </div>

                        {venta.detalles && venta.detalles.length > 0 && (
                          <div className="deudores-detalles-productos">
                            {venta.detalles.map((detalle) => (
                              <span key={detalle.id}>
                                {detalle.producto_nombre} ·{" "}
                                {formatearCantidad(detalle)}
                              </span>
                            ))}
                          </div>
                        )}

                        {estaSeleccionada && (
                          <div className="deudores-pago-venta">
                            <div>
                              <CFormLabel>Monto que paga</CFormLabel>
                              <CInputGroup>
                                <CInputGroupText>$</CInputGroupText>
                                <CFormInput
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  max={saldoVenta}
                                  value={montos[venta.id] ?? ""}
                                  onChange={(e) =>
                                    cambiarMonto(venta, e.target.value)
                                  }
                                />
                              </CInputGroup>
                            </div>

                            <div className="deudores-saldo-despues-venta">
                              <span>Queda debiendo</span>
                              <strong>${dinero(saldoPosterior)}</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CCardBody>
          </CCard>

          <aside className="deudores-pago-card">
            <CCard>
              <CCardBody>
                <div className="deudores-pago-titulo">
                  <WalletCards size={22} />
                  <h3>Registrar pago</h3>
                </div>

                <div className="deudores-resumen-pago">
                  <div>
                    <span>Deuda actual</span>
                    <strong>${dinero(deudaCliente)}</strong>
                  </div>

                  <div>
                    <span>Ventas seleccionadas</span>
                    <strong>{seleccionadas.length}</strong>
                  </div>

                  <div className="deudores-resumen-pago-destacado">
                    <span>Pago a registrar</span>
                    <strong>${dinero(totalAPagar)}</strong>
                  </div>

                  <div>
                    <span>Saldo después</span>
                    <strong>${dinero(saldoDespues)}</strong>
                  </div>
                </div>

                <CButton
                  color="success"
                  className="w-100 mt-3"
                  disabled={!pagoValido || procesando}
                  onClick={() => void confirmarPago()}
                >
                  {procesando ? "Registrando..." : "Confirmar pago"}
                </CButton>

                <small className="deudores-pdf-ayuda">
                  Al confirmar, el comprobante PDF se genera y descarga
                  automáticamente.
                </small>
              </CCardBody>
            </CCard>
          </aside>
        </div>
      </div>

      {modalExito}
    </>
  );
}
