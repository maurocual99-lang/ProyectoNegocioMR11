import { useEffect, useState } from "react";
import {
  CButton,
  CFormInput,
  CFormLabel,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from "@coreui/react";
import { ContactRound } from "lucide-react";

export interface ClienteEditable {
  id: number;
  nombre: string;
  apellido: string;
  apodo?: string | null;
  telefono?: string | null;
}

interface Props {
  cliente: ClienteEditable | null;
  onClose: () => void;
  onActualizado: (cliente: ClienteEditable) => void;
}

const API_URL = "http://127.0.0.1:3000/deudores";

export default function EditarCliente({
  cliente,
  onClose,
  onActualizado,
}: Props) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [apodo, setApodo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cliente) return;

    setNombre(cliente.nombre);
    setApellido(cliente.apellido);
    setApodo(cliente.apodo || "");
    setTelefono(cliente.telefono || "");
    setError("");
  }, [cliente]);

  async function guardar() {
    if (!cliente) return;

    if (!nombre.trim() || !apellido.trim()) {
      setError("El nombre y el apellido son obligatorios.");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      const respuesta = await fetch(`${API_URL}/${cliente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          apodo: apodo.trim(),
          telefono: telefono.trim(),
        }),
      });
      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data?.mensaje || "No se pudieron guardar los cambios.");
      }

      onActualizado(data.cliente);
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No se pudieron guardar los cambios."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <CModal visible={cliente !== null} alignment="center" onClose={onClose}>
      <CModalHeader>
        <CModalTitle>Modificar cliente</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <div className="editar-cliente-intro">
          <ContactRound size={22} />
          <span>
            Los cambios se usarán en sus deudas, comprobantes y mensajes de
            WhatsApp.
          </span>
        </div>

        {error && <div className="deudores-error">{error}</div>}

        <div className="editar-cliente-grid">
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
              maxLength={20}
              onChange={(evento) => setTelefono(evento.target.value)}
              placeholder="Ej: 5492215551234"
            />
            <small>País y área, sin 0 ni 15. Puede dejarse vacío.</small>
          </div>
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" variant="ghost" onClick={onClose}>
          Cancelar
        </CButton>
        <CButton color="primary" disabled={guardando} onClick={() => void guardar()}>
          {guardando ? "Guardando..." : "Guardar cambios"}
        </CButton>
      </CModalFooter>
    </CModal>
  );
}

