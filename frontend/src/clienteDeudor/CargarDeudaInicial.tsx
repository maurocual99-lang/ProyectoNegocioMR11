import { useEffect, useState } from "react";
import {
  CButton,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from "@coreui/react";
import { CircleDollarSign, UserPlus } from "lucide-react";

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  apodo?: string | null;
  telefono?: string | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreada: () => void | Promise<void>;
}

const API_URL = "http://127.0.0.1:3000";

function fechaHoy() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export default function CargarDeudaInicial({
  visible,
  onClose,
  onCreada,
}: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modo, setModo] = useState<"existente" | "nuevo">("existente");
  const [clienteId, setClienteId] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [apodo, setApodo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(fechaHoy());
  const [concepto, setConcepto] = useState("Saldo anterior al sistema");
  const [cargandoClientes, setCargandoClientes] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;

    setError("");
    setNombre("");
    setApellido("");
    setApodo("");
    setTelefono("");
    setMonto("");
    setFecha(fechaHoy());
    setConcepto("Saldo anterior al sistema");
    setCargandoClientes(true);

    void fetch(`${API_URL}/deudores`)
      .then(async (respuesta) => {
        const data = await respuesta.json();
        if (!respuesta.ok) {
          throw new Error(data?.mensaje || "No se pudieron cargar los clientes.");
        }

        const lista: Cliente[] = Array.isArray(data) ? data : [];
        lista.sort((a, b) =>
          `${a.apellido} ${a.nombre}`.localeCompare(
            `${b.apellido} ${b.nombre}`,
            "es"
          )
        );
        setClientes(lista);
        setClienteId(lista[0] ? String(lista[0].id) : "");
        setModo(lista.length > 0 ? "existente" : "nuevo");
      })
      .catch((err) => {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "No se pudieron cargar los clientes."
        );
      })
      .finally(() => setCargandoClientes(false));
  }, [visible]);

  async function guardar() {
    setError("");
    const importe = Number(monto);

    if (!Number.isFinite(importe) || importe <= 0) {
      setError("Ingresá un monto de deuda mayor a cero.");
      return;
    }

    if (modo === "existente" && !clienteId) {
      setError("Seleccioná un cliente.");
      return;
    }

    if (modo === "nuevo" && (!nombre.trim() || !apellido.trim())) {
      setError("Completá el nombre y el apellido del cliente.");
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch(`${API_URL}/ventas/deuda-inicial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: modo === "existente" ? Number(clienteId) : undefined,
          cliente:
            modo === "nuevo"
              ? {
                  nombre: nombre.trim(),
                  apellido: apellido.trim(),
                  apodo: apodo.trim(),
                  telefono: telefono.trim(),
                }
              : undefined,
          monto: importe,
          fecha,
          concepto: concepto.trim(),
        }),
      });
      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data?.mensaje || "No se pudo registrar la deuda.");
      }

      await onCreada();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "No se pudo registrar la deuda.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <CModal visible={visible} alignment="center" onClose={onClose}>
      <CModalHeader>
        <CModalTitle>Cargar deuda anterior</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <div className="deuda-inicial-intro">
          <CircleDollarSign size={23} />
          <div>
            <strong>Saldo con el que comienza el cliente</strong>
            <span>
              No se contará como una venta nueva ni modificará el stock.
            </span>
          </div>
        </div>

        {error && <div className="deudores-error">{error}</div>}

        <div className="deuda-inicial-modos" role="group" aria-label="Tipo de cliente">
          <button
            type="button"
            className={modo === "existente" ? "activo" : ""}
            onClick={() => setModo("existente")}
            disabled={clientes.length === 0}
          >
            Cliente existente
          </button>
          <button
            type="button"
            className={modo === "nuevo" ? "activo" : ""}
            onClick={() => setModo("nuevo")}
          >
            <UserPlus size={15} /> Nuevo cliente
          </button>
        </div>

        {cargandoClientes ? (
          <div className="deuda-inicial-cargando">
            <CSpinner size="sm" /> Cargando clientes...
          </div>
        ) : modo === "existente" ? (
          <div className="mb-3">
            <CFormLabel>Cliente</CFormLabel>
            <CFormSelect
              value={clienteId}
              onChange={(evento) => setClienteId(evento.target.value)}
            >
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.apellido}, {cliente.nombre}
                  {cliente.apodo ? ` (${cliente.apodo})` : ""}
                </option>
              ))}
            </CFormSelect>
          </div>
        ) : (
          <div className="deuda-inicial-nuevo">
            <div>
              <CFormLabel>Nombre *</CFormLabel>
              <CFormInput
                value={nombre}
                maxLength={15}
                onChange={(evento) => setNombre(evento.target.value)}
              />
            </div>
            <div>
              <CFormLabel>Apellido *</CFormLabel>
              <CFormInput
                value={apellido}
                maxLength={15}
                onChange={(evento) => setApellido(evento.target.value)}
              />
            </div>
            <div>
              <CFormLabel>Apodo</CFormLabel>
              <CFormInput
                value={apodo}
                maxLength={15}
                onChange={(evento) => setApodo(evento.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div>
              <CFormLabel>Teléfono de WhatsApp</CFormLabel>
              <CFormInput
                type="tel"
                value={telefono}
                onChange={(evento) => setTelefono(evento.target.value)}
                placeholder="5492215551234"
              />
              <small className="deuda-inicial-ayuda">
                País y área, sin 0 ni 15.
              </small>
            </div>
          </div>
        )}

        <div className="deuda-inicial-datos">
          <div>
            <CFormLabel>Monto adeudado *</CFormLabel>
            <CFormInput
              type="number"
              min="0.01"
              step="0.01"
              value={monto}
              onChange={(evento) => setMonto(evento.target.value)}
              placeholder="$ 0,00"
            />
          </div>
          <div>
            <CFormLabel>Fecha de origen</CFormLabel>
            <CFormInput
              type="date"
              max={fechaHoy()}
              value={fecha}
              onChange={(evento) => setFecha(evento.target.value)}
            />
          </div>
        </div>

        <div className="mt-3">
          <CFormLabel>Concepto o detalle</CFormLabel>
          <CFormTextarea
            rows={2}
            maxLength={160}
            value={concepto}
            onChange={(evento) => setConcepto(evento.target.value)}
            placeholder="Ej: Compras pendientes anteriores"
          />
          <small className="deuda-inicial-ayuda">
            Este texto aparecerá en la cuenta y en el comprobante.
          </small>
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" variant="ghost" onClick={onClose}>
          Cancelar
        </CButton>
        <CButton color="primary" disabled={guardando} onClick={() => void guardar()}>
          {guardando ? "Guardando..." : "Registrar deuda"}
        </CButton>
      </CModalFooter>
    </CModal>
  );
}
