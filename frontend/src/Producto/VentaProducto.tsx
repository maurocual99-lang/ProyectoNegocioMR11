import { useEffect, useState, useRef } from "react";
import { Barcode, Minus, Plus, Check, Trash2, DollarSign } from "lucide-react";
import { CCard, CCardHeader, CCardBody, CFormLabel, CFormInput, CRow, CCol, CInputGroup, CInputGroupText, CButton, CForm, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell } from '@coreui/react';


import AgregarDeuda from "../clienteDeudor/AgregarDeuda"; 

interface DetalleItem {
  producto_id: number;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
}

interface ResumenResponse {
  existe?: boolean;
  detalle?: DetalleItem[];
  total?: number;
  cantidadProductos?: number;
  cantidadUnidades?: number;
  error?: string;
  mensaje?: string;
}

function VentaProducto() {
  const [ventaId, setVentaId] = useState<number | null>(null);
  const [codigoBarra, setCodigoBarra] = useState<string>("");
  const [detalle, setDetalle] = useState<DetalleItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [cantidadProductos, setCantidadProductos] = useState<number>(0);
  const [cantidadUnidades, setCantidadUnidades] = useState<number>(0);
  const [error, setError] = useState<string>("");

  const ventaCreada = useRef(false);

  useEffect(() => {
    if (ventaCreada.current) return;
    ventaCreada.current = true;

    const iniciarVenta = async () => {
      // Si ya había una venta en curso (de un montaje/remontaje anterior), la reusamos
      // en vez de crear una nueva. Esto evita ventas duplicadas por StrictMode o remounts.
      const ventaGuardada = sessionStorage.getItem("venta_en_curso");
      if (ventaGuardada) {
        const id = Number(ventaGuardada);
        setVentaId(id);
        // Traemos el estado real desde el backend, no confiamos en estado local viejo
        const res = await fetch(`http://localhost:3000/ventas/${id}`);
        if (res.ok) {
          const data: ResumenResponse = await res.json();
          actualizarDesdeRespuesta(data);
        }
        return;
      }

      const res = await fetch(`http://localhost:3000/ventas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const venta = await res.json();
      sessionStorage.setItem("venta_en_curso", String(venta.id));
      setVentaId(venta.id);
    };
    iniciarVenta();
  }, []);

  const actualizarDesdeRespuesta = (data: ResumenResponse) => {
    setDetalle(data.detalle || []);
    setTotal(data.total || 0);
    setCantidadProductos(data.cantidadProductos || 0);
    setCantidadUnidades(data.cantidadUnidades || 0);
    setError(data.error || "");
  };

  const escanear = async (codigo: string) => {
    if (!codigo.trim() || !ventaId) return;

    const res = await fetch(`http://localhost:3000/ventas/${ventaId}/productos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo_barra: codigo })
    });
    const data: ResumenResponse = await res.json();

    if (!res.ok) {
      setError(data.mensaje || "Hubo un error en el servidor al agregar el producto.");
      return;
    }

    if (!data.existe) {
      setError(`No se encontró ningún producto con el código "${codigo}"`);
      return;
    }

    actualizarDesdeRespuesta(data);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      escanear(codigoBarra);
      setCodigoBarra("");
    }
  };

  const cambiarCantidad = async (producto_id: number, delta: number) => {
    const res = await fetch(`http://localhost:3000/ventas/${ventaId}/productos/${producto_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta })
    });
    const data: ResumenResponse = await res.json();

    if (!res.ok) {
      setError(data.mensaje || "Hubo un error en el servidor al actualizar la cantidad.");
      return;
    }

    actualizarDesdeRespuesta(data);
  };

  const eliminarProducto = async (producto_id: number) => {
    const res = await fetch(`http://localhost:3000/ventas/${ventaId}/productos/${producto_id}`, {
      method: "DELETE"
    });
    const data: ResumenResponse = await res.json();
    actualizarDesdeRespuesta(data);
  };

  const finalizarVenta = async () => {
    if (!ventaId || detalle.length === 0) return;

    const res = await fetch(`http://localhost:3000/ventas/${ventaId}/finalizar`, { method: "POST" });
    const data: ResumenResponse = await res.json();

    if (!res.ok) {
      setError(data.mensaje || "No se pudo finalizar la venta.");
      return;
    }

    // Venta confirmada: se limpia la persistida y se arranca una nueva
    sessionStorage.removeItem("venta_en_curso");
    setVentaId(null);
    setDetalle([]);
    setTotal(0);
    setCantidadProductos(0);
    setCantidadUnidades(0);
    setError("");

    const nuevaVentaRes = await fetch(`http://localhost:3000/ventas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const nuevaVenta = await nuevaVentaRes.json();
    sessionStorage.setItem("venta_en_curso", String(nuevaVenta.id));
    setVentaId(nuevaVenta.id);
  };

  return (
    <>
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",  
        padding: "16px"
      }}>
        <header className="header-principal" style={{ marginBottom: "12px" }}>
          <div>
            <h1 style={{ marginBottom: "4px" }}>Ventas</h1>
            <p style={{ marginBottom: 0 }}>Crear una nueva venta</p>
          </div>
        </header>

        <CCard style={{ marginBottom: "12px" }}>
          <CCardHeader component="h3" className="py-3 fw-bold" style={{ fontSize: "0.95rem" }}>
            Agregar Producto
          </CCardHeader>
          <CCardBody style={{ padding: "12px" }}>
            <CForm>
              <CRow className="g-3 align-items-end">
                <CCol md={5}>
                  <CFormLabel style={{ fontSize: "0.9rem", marginBottom: "4px" }}>
                    Código de Barras
                  </CFormLabel>
                  <CInputGroup style={{ height: "36px" }}>
                    <CFormInput
                      value={codigoBarra}
                      onChange={(e) => setCodigoBarra(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Escanear o escribir codigo"
                      style={{ fontSize: "0.9rem" }}
                    />
                    <CInputGroupText>
                      <Barcode size={16} />
                    </CInputGroupText>
                  </CInputGroup>
                  {error && (
                    <p style={{ color: "#dc3545", fontSize: "0.8rem", marginTop: "4px", marginBottom: 0 }}>
                      {error}
                    </p>
                  )}
                </CCol>

                <CCol md={7}>
                  <div style={{ paddingTop: "24px" }}>
                    <div
                      className="d-flex align-items-center p-2"
                      style={{
                        background: "#eef4ff",
                        border: "1px solid #dbeafe",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        height: "36px"
                      }}
                    >
                      <Barcode
                        size={20}
                        color="#2563eb"
                        style={{ marginRight: "10px", minWidth: "20px" }}
                      />
                      <div>
                        <span className="fw-bold">
                          Al escanear se suma automáticamente
                        </span>
                      </div>
                    </div>
                  </div>
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

       <div className="d-flex flex-column flex-lg-row gap-3">
          <CCard style={{ flex: 2, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <CCardHeader component="h3" className="py-2 fw-bold" style={{ fontSize: "0.95rem" }}>
              Productos en la venta
            </CCardHeader>
            <CCardBody style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: "8px" }}>
              {detalle.length === 0 ? (
                <p className="text-secondary text-center my-4" style={{ fontSize: "0.9rem" }}>
                  Escaneá un código de barras para agregar productos
                </p>
              ) : (
                <div style={{ maxHeight: "172px", overflowY: "auto", marginBottom: "8px", overscrollBehavior: "contain" }}>
                  <CTable align="middle" hover striped style={{ fontSize: "0.85rem", marginBottom: 0, borderCollapse: "separate", borderSpacing: 0 }}>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell scope="col" style={{ position: "sticky", top: 0, zIndex: 2, background: "#fff" }}>Producto</CTableHeaderCell>
                        <CTableHeaderCell scope="col" style={{ position: "sticky", top: 0, zIndex: 2, background: "#fff" }}>Precio Unitario</CTableHeaderCell>
                        <CTableHeaderCell scope="col" style={{ textAlign: "center", position: "sticky", top: 0, zIndex: 2, background: "#fff" }}>Cantidad</CTableHeaderCell>
                        <CTableHeaderCell scope="col" style={{ position: "sticky", top: 0, zIndex: 2, background: "#fff" }}>Subtotal</CTableHeaderCell>
                        <CTableHeaderCell scope="col" style={{ width: "60px", textAlign: "center", position: "sticky", top: 0, zIndex: 2, background: "#fff" }}>Acción</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {detalle.map((item) => (
                        <CTableRow key={item.producto_id}>
                          <CTableDataCell style={{ fontSize: "0.85rem" }}>{item.nombre}</CTableDataCell>
                          <CTableDataCell style={{ fontSize: "0.85rem" }}>
                            ${item.precio_unitario}
                          </CTableDataCell>
                          <CTableDataCell>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  border: "1px solid #d1d5db",
                                  borderRadius: "6px",
                                  overflow: "hidden",
                                  height: "30px",
                                  background: "#fff"
                                }}
                              >
                                <CButton
                                  color="light"
                                  size="sm"
                                  onClick={() => cambiarCantidad(item.producto_id, -1)}
                                  style={{
                                    border: "none",
                                    borderRight: "1px solid #e5e7eb",
                                    borderRadius: 0,
                                    padding: "3px 8px",
                                  }}
                                >
                                  <Minus size={12} />
                                </CButton>
                                <span
                                  style={{
                                    width: "35px",
                                    textAlign: "center",
                                    fontSize: "0.85rem",
                                    fontWeight: 500,
                                    background: "#fff"
                                  }}
                                >
                                  {item.cantidad}
                                </span>
                                <CButton
                                  color="light"
                                  size="sm"
                                  style={{
                                    border: "none",
                                    borderLeft: "1px solid #e5e7eb",
                                    borderRadius: 0,
                                    padding: "3px 8px",
                                  }}
                                  onClick={() => cambiarCantidad(item.producto_id, 1)}
                                >
                                  <Plus size={12} />
                                </CButton>
                              </div>
                            </div>
                          </CTableDataCell>
                          <CTableDataCell style={{ fontSize: "0.85rem" }}>
                            ${item.subtotal}
                          </CTableDataCell>
                          <CTableDataCell style={{ textAlign: "center" }}>
                            <CButton
                              color="danger"
                              variant="outline"
                              size="sm"
                              style={{
                                padding: "2px 6px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                              onClick={() => eliminarProducto(item.producto_id)}
                            >
                              <Trash2 size={14} color="#dc3545" />
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>
              )}
            </CCardBody>
          </CCard>

          <CCard style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <CCardHeader component="h3" className="py-2 fw-bold text-black">Resumen de la venta</CCardHeader>
            <CCardBody style={{ padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div className="ms-3 me-3"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                    fontSize: "0.9rem"
                  }}
                >
                  <span>Cantidad de Productos</span>
                  <strong>{cantidadProductos}</strong>
                </div>

                <div className="ms-3 me-3"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                    fontSize: "0.9rem"
                  }}
                >
                  <span>Cantidad de Unidades</span>
                  <strong>{cantidadUnidades}</strong>
                </div>

                <hr className="my-3" />

                <div className="ms-3 me-3"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h4 className="fw-bold my-1" style={{ marginBottom: 0 }}>
                    TOTAL
                  </h4>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <DollarSign size={24} color="#2563eb" style={{ margin: 0 }} />
                    <h2
                      style={{
                        margin: 0,
                        color: "#2563eb",
                        fontWeight: 700,
                        fontSize: "1.5rem",
                      }}
                    >
                      {Number(total).toFixed(2)}
                    </h2>
                  </div>
                </div>
                <CButton onClick={finalizarVenta} className="w-100" color="success" style={{ color: "white", marginTop: "8px" }}>
                  <Check size={16} className="me-2" /> Finalizar Venta
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        </div>

        <AgregarDeuda 
          ventaId={ventaId} />

      </div>
    </>
  );
}

export default VentaProducto;