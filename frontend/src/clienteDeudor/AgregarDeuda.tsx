import { useState, useEffect } from "react";
import { Search, UserPlus, Plus } from "lucide-react";
import { 
  CCard, 
  CCardHeader, 
  CCardBody, 
  CFormLabel, 
  CFormSwitch, 
  CRow, 
  CCol, 
  CInputGroup, 
  CFormInput, 
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter
} from '@coreui/react';

interface Props {
    ventaId: number | null;
}

function AgregarDeuda({ventaId}:Props) {
  const [esMoroso, setEsMoroso] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([]); 
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
  const [errorBuscar, setErrorBuscar] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoApellido, setNuevoApellido] = useState("");
  const [nuevoApodo, setNuevoApodo] = useState("");
  const [mensajeModal, setMensajeModal] = useState({ tipo: "", texto: "" });

  // Si la venta activa cambia (venta nueva, o se corrigió una duplicada), el cliente
  // seleccionado localmente ya no es válido para esta venta: se resetea todo.
  useEffect(() => {
    setEsMoroso(false);
    setBusqueda("");
    setResultadosBusqueda([]);
    setClienteSeleccionado(null);
    setErrorBuscar("");
  }, [ventaId]);

  const esRespuestaJSON = (res: Response) => {
    const contentType = res.headers.get("content-type");
    return contentType && contentType.includes("application/json");
  };

  const handleBuscar = async () => {
    setErrorBuscar("");
    setResultadosBusqueda([]); 
    setClienteSeleccionado(null);

    if (!busqueda.trim()) return;

    try {
      const url = `http://localhost:3000/deudores/buscarDeudor?texto=${encodeURIComponent(busqueda)}`;
      const res = await fetch(url);
      
      if (!esRespuestaJSON(res)) {
        setErrorBuscar("Error de ruta en el servidor. Verifica que el endpoint exista.");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setErrorBuscar(data.mensaje || "No se encontró el cliente.");
        return;
      }

      if (Array.isArray(data)) {
        if (data.length > 0) {
          setResultadosBusqueda(data); 
        } else {
          setErrorBuscar("No se encontraron clientes con ese nombre o apellido.");
        }
      } else if (data) {
        setResultadosBusqueda([data]);
      }
      
    } catch (error) {
      console.error(error);
      setErrorBuscar("Error de red al intentar buscar el cliente.");
    }
  };

  const handleKeyDownBuscar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBuscar();
    }
  };

  const handleSeleccionarCliente = async (cliente: any) => {
    setClienteSeleccionado(cliente);
    setBusqueda(`${cliente.apellido} ${cliente.nombre}`);
    setResultadosBusqueda([]);
    setErrorBuscar("");

    if (esMoroso && ventaId) {
      try {
        await fetch(`http://localhost:3000/ventas/${ventaId}/cliente`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cliente_id: cliente.id,
            cuenta_pendiente: true,
          }),
        });
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleCrearCliente = async () => {
    setMensajeModal({ tipo: "", texto: "" });

    if (!nuevoNombre || !nuevoApellido) {
      setMensajeModal({ tipo: "error", texto: "El nombre y el apellido son obligatorios." });
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/deudores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoNombre,
          apellido: nuevoApellido,
          apodo: nuevoApodo
        })
      });

      if (!esRespuestaJSON(res)) {
        setMensajeModal({ tipo: "error", texto: "Error del servidor. Verifica la ruta /deudores." });
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setMensajeModal({ tipo: "error", texto: data.mensaje || "Error al crear el cliente." });
        return;
      }

      setMensajeModal({ tipo: "exito", texto: data.mensaje });
      
      const clienteCreado = data.cliente;
      
      if (clienteCreado) {
          setClienteSeleccionado(clienteCreado); 
          if (esMoroso && ventaId) {
            await fetch(`http://localhost:3000/ventas/${ventaId}/cliente`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                cliente_id: clienteCreado.id,
                cuenta_pendiente: true,
              }),
            });
            const nombreMostrar = `${clienteCreado.apellido} ${clienteCreado.nombre}`;
            setBusqueda(nombreMostrar);
          } else {
            setBusqueda(`${nuevoApellido} ${nuevoNombre}`);
          }
      }
      
      setTimeout(() => {
        setModalVisible(false);
        setNuevoNombre("");
        setNuevoApellido("");
        setNuevoApodo("");
        setMensajeModal({ tipo: "", texto: "" });
      }, 1500);

    } catch (error) {
      console.error(error);
      setMensajeModal({ tipo: "error", texto: "Error de red al intentar crear el cliente." });
    }
  };

  return (
    <>
      <CCard className="my-3">
        <CCardHeader className="fw-bold d-flex justify-content-between align-items-center" style={{ padding: "8px 12px", fontSize: "0.95rem" }}>
          <span>Cliente (Opcional)</span>
          {clienteSeleccionado && (
            <span className="badge bg-success text-white">
              Seleccionado: {clienteSeleccionado.apellido} {clienteSeleccionado.nombre}
            </span>
          )}
        </CCardHeader>
        <CCardBody style={{ padding: "12px" }}>
          <CRow className="g-3 align-items-end">
            
            {/* SWITCH MOROSO */}
            <CCol md={4}>
              <CFormLabel style={{ fontWeight: 500, color: "#1f2937", fontSize: "0.9rem", marginBottom: "6px" }}>
                ¿El cliente va a pagar después?
              </CFormLabel>
              <div style={{ height: "36px", display: "flex", alignItems: "center", gap: "8px" }}>
                <CFormSwitch 
                  size="lg" 
                  checked={esMoroso} 
                  onChange={(e) => setEsMoroso(e.target.checked)}
                />
                <span style={{ fontWeight: 500, color: "#374151", fontSize: "0.9rem" }}>
                  Marcar como cliente moroso
                </span>
              </div>
            </CCol>
            
            <CCol md={4}>
              <CFormLabel style={{ fontSize: "0.9rem", marginBottom: "6px" }}>
                Buscar cliente
              </CFormLabel>
              <div style={{ position: "relative" }}>
                <CInputGroup style={{ height: "36px" }}>
                  <CFormInput
                    value={busqueda}
                    onChange={(e) => {
                      setBusqueda(e.target.value);
                      setResultadosBusqueda([]); 
                      if (clienteSeleccionado) setClienteSeleccionado(null); 
                    }}
                    onKeyDown={handleKeyDownBuscar}
                    placeholder="Ej: Pérez Juan"
                    style={{ fontSize: "0.9rem" }}
                    disabled={!esMoroso}
                  />
                  <CButton 
                    type="button" 
                    color="secondary" 
                    variant="outline" 
                    onClick={handleBuscar}
                    disabled={!esMoroso}
                  >
                    <Search size={14} />
                  </CButton>
                </CInputGroup>
                
                {resultadosBusqueda.length > 0 && (
                  <ul 
                    className="list-group position-absolute w-100 shadow-sm" 
                    style={{ 
                      top: "100%", 
                      left: 0,
                      zIndex: 1000, 
                      maxHeight: "200px", 
                      overflowY: "auto",
                      marginTop: "4px"
                    }}
                  >
                    {resultadosBusqueda.map((cliente, index) => (
                      <li
                        key={cliente.id || cliente._id || index}
                        className="list-group-item list-group-item-action"
                        style={{ cursor: "pointer", fontSize: "0.9rem", padding: "8px 12px" }}
                        onClick={() => handleSeleccionarCliente(cliente)}
                      >
                        <div className="fw-bold">{cliente.apellido}, {cliente.nombre}</div>
                        {cliente.apodo && (
                          <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                            Apodo: {cliente.apodo}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {errorBuscar && <div className="text-danger mt-1" style={{ fontSize: "0.8rem" }}>{errorBuscar}</div>}
            </CCol>

            {/* Crear cliente nuevo: siempre habilitado, independiente del switch de moroso */}
            <CCol md={4}>
              <div
                className="d-flex align-items-center p-2"
                style={{
                  background: "#eef4ff",
                  border: "1px solid #dbeafe",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  height: "36px",
                  cursor: "pointer"
                }}
              >
                <UserPlus
                  size={20}
                  color="#2563eb"
                  style={{ marginRight: "10px", minWidth: "20px" }}
                />
                <div>
                  <div className="fw-bold">¿Primera vez?</div>
                  <div className="text-secondary">Agregalo como moroso</div>
                </div>
              </div>
            </CCol>
          </CRow>
          
          <CButton 
            color="primary"
            className="w-100 mt-3" 
            style={{ marginTop: "8px" }} 
            size="sm"
            onClick={() => setModalVisible(true)}
          >
            <Plus size={16} className="me-2" />
            Agregar Nuevo Cliente
          </CButton>
        </CCardBody>
      </CCard>

      <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader onClose={() => setModalVisible(false)}>
          <CModalTitle>Agregar Nuevo Cliente</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {mensajeModal.texto && (
            <div className={`alert ${mensajeModal.tipo === "error" ? "alert-danger" : "alert-success"}`} style={{ fontSize: "0.9rem" }}>
              {mensajeModal.texto}
            </div>
          )}
          <div className="mb-3">
            <CFormLabel>Nombre *</CFormLabel>
            <CFormInput 
              value={nuevoNombre} 
              onChange={(e) => setNuevoNombre(e.target.value)} 
              placeholder="Ej: Juan" 
            />
          </div>
          <div className="mb-3">
            <CFormLabel>Apellido *</CFormLabel>
            <CFormInput 
              value={nuevoApellido} 
              onChange={(e) => setNuevoApellido(e.target.value)} 
              placeholder="Ej: Pérez" 
            />
          </div>
          <div className="mb-3">
            <CFormLabel>Apodo (Opcional)</CFormLabel>
            <CFormInput 
              value={nuevoApodo} 
              onChange={(e) => setNuevoApodo(e.target.value)} 
              placeholder="Ej: Juancito" 
            />
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModalVisible(false)}>
            Cancelar
          </CButton>
          <CButton color="primary" onClick={handleCrearCliente}>
            Guardar Cliente
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
}

export default AgregarDeuda;