import { useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import {
  Barcode,
  DollarSign,
  Minus,
  Plus,
  Scale,
  Search,
  Trash2,
} from "lucide-react";
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from "@coreui/react";

import ModalExito from "../ModalExito";
import AgregarDeuda from "../clienteDeudor/AgregarDeuda";

const API_URL = "http://localhost:3000";

type TipoVenta = "UNIDAD" | "PESO";

interface DetalleItem {
  producto_id: number;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
  tipo_venta?: TipoVenta;
}

interface ProductoPeso {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
  tipo_venta: "PESO";
  activo?: boolean;
}

interface ResumenResponse {
  existe?: boolean;
  detalle?: DetalleItem[];
  total?: number;
  cantidadProductos?: number;
  cantidadUnidades?: number;
  pesoTotalKg?: number;
  error?: string;
  mensaje?: string;
}

function VentaProducto() {
  const [ventaId, setVentaId] = useState<number | null>(null);
  const [codigoBarra, setCodigoBarra] = useState("");
  const [detalle, setDetalle] = useState<DetalleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [cantidadProductos, setCantidadProductos] = useState(0);
  const [cantidadUnidades, setCantidadUnidades] = useState(0);
  const [pesoTotalKg, setPesoTotalKg] = useState(0);
  const [error, setError] = useState("");

  const [mostrarPeso, setMostrarPeso] = useState(false);
  const [productosPeso, setProductosPeso] = useState<ProductoPeso[]>([]);
  const [productoPeso, setProductoPeso] = useState<ProductoPeso | null>(null);
  const [gramos, setGramos] = useState("");
  const [busquedaPeso, setBusquedaPeso] = useState("");
  const [cargandoProductosPeso, setCargandoProductosPeso] = useState(false);
  const [guardandoPeso, setGuardandoPeso] = useState(false);
  const [errorPeso, setErrorPeso] = useState("");

  const productosPesoFiltrados = useMemo(() => {
    const busqueda = busquedaPeso.trim().toLocaleLowerCase("es-AR");

    if (!busqueda) {
      return productosPeso;
    }

    return productosPeso.filter((producto) => {
      const nombre = producto.nombre.toLocaleLowerCase("es-AR");
      const categoria = String(producto.categoria || "").toLocaleLowerCase("es-AR");

      return nombre.includes(busqueda) || categoria.includes(busqueda);
    });
  }, [busquedaPeso, productosPeso]);

  const gramosNumero = Number(gramos);
  const cantidadKg = Number.isFinite(gramosNumero) ? gramosNumero / 1000 : 0;

  const pesoValido =
    productoPeso !== null &&
    Number.isFinite(gramosNumero) &&
    gramosNumero > 0;

  const pesoExcedeStock =
    productoPeso !== null &&
    pesoValido &&
    cantidadKg > Number(productoPeso.stock);

  const subtotalPeso =
    productoPeso && pesoValido
      ? cantidadKg * Number(productoPeso.precio)
      : 0;

  const formatearDinero = (valor: number) =>
    Number(valor || 0).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatearPeso = (kg: number) => {
    const peso = Number(kg || 0);

    if (peso < 1) {
      return `${Math.round(peso * 1000)} g`;
    }

    return `${peso.toLocaleString("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    })} kg`;
  };

  const actualizarDesdeRespuesta = (data: ResumenResponse) => {
    const detalleNormalizado = (data.detalle || []).map((item) => ({
      ...item,
      precio_unitario: Number(item.precio_unitario),
      cantidad: Number(item.cantidad),
      subtotal: Number(item.subtotal),
      tipo_venta: item.tipo_venta || "UNIDAD",
    }));

    setDetalle(detalleNormalizado);
    setTotal(Number(data.total || 0));
    setCantidadProductos(Number(data.cantidadProductos || 0));
    setCantidadUnidades(Number(data.cantidadUnidades || 0));
    setPesoTotalKg(Number(data.pesoTotalKg || 0));
    setError(data.error || "");
  };

  const crearVenta = async (): Promise<number> => {
    const res = await fetch(`${API_URL}/ventas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const data = await res.json();

    if (!res.ok || !data?.id) {
      throw new Error(data?.mensaje || "No se pudo iniciar la venta.");
    }

    const id = Number(data.id);
    setVentaId(id);

    return id;
  };

  const escanear = async (codigo: string) => {
    const codigoLimpio = codigo.trim();

    if (!codigoLimpio) {
      return;
    }

    setError("");

    try {
      let idVenta = ventaId;

      if (!idVenta) {
        idVenta = await crearVenta();
      }

      const res = await fetch(`${API_URL}/ventas/${idVenta}/productos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigo_barra: codigoLimpio,
        }),
      });

      const data: ResumenResponse = await res.json();

      if (!res.ok || data.error) {
        if (data.detalle) {
          actualizarDesdeRespuesta(data);
        }

        setError(
          data.error ||
            data.mensaje ||
            "Hubo un error al agregar el producto."
        );
        return;
      }

      if (!data.existe) {
        setError(
          `No se encontró ningún producto con el código "${codigoLimpio}".`
        );
        return;
      }

      actualizarDesdeRespuesta(data);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo conectar con el servidor."
      );
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const codigo = codigoBarra;
      setCodigoBarra("");

      void escanear(codigo);
    }
  };

  const abrirProductosPeso = async () => {
    setMostrarPeso(true);
    setProductoPeso(null);
    setGramos("");
    setBusquedaPeso("");
    setErrorPeso("");
    setCargandoProductosPeso(true);

    try {
      const res = await fetch(`${API_URL}/productos`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.mensaje || "No se pudieron cargar los productos."
        );
      }

      const listaProductos = Array.isArray(data)
        ? data
        : Array.isArray(data?.productos)
          ? data.productos
          : [];

      const vendidosPorPeso: ProductoPeso[] = listaProductos
        .filter(
          (producto: any) =>
            producto.tipo_venta === "PESO" && producto.activo !== false
        )
        .map((producto: any) => ({
          id: Number(producto.id),
          nombre: String(producto.nombre),
          precio: Number(producto.precio),
          stock: Number(producto.stock),
          categoria: String(producto.categoria || ""),
          tipo_venta: "PESO" as const,
          activo: producto.activo,
        }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

      setProductosPeso(vendidosPorPeso);
    } catch (err) {
      console.error(err);
      setProductosPeso([]);
      setErrorPeso(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los productos por peso."
      );
    } finally {
      setCargandoProductosPeso(false);
    }
  };

  const agregarPorPeso = async () => {
    if (!productoPeso) {
      setErrorPeso("Seleccioná un producto.");
      return;
    }

    if (!pesoValido) {
      setErrorPeso("Ingresá un peso válido.");
      return;
    }

    if (pesoExcedeStock) {
      setErrorPeso(
        `No hay stock suficiente. Disponible: ${formatearPeso(
          Number(productoPeso.stock)
        )}.`
      );
      return;
    }

    setGuardandoPeso(true);
    setErrorPeso("");
    setError("");

    try {
      let idVenta = ventaId;

      if (!idVenta) {
        idVenta = await crearVenta();
      }

      const res = await fetch(
        `${API_URL}/ventas/${idVenta}/productos-peso`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            producto_id: productoPeso.id,
            cantidad_kg: cantidadKg,
          }),
        }
      );

      const data: ResumenResponse = await res.json();

      if (!res.ok || data.error) {
        setErrorPeso(
          data.error ||
            data.mensaje ||
            "No se pudo agregar el producto por peso."
        );
        return;
      }

      actualizarDesdeRespuesta(data);

      setMostrarPeso(false);
      setProductoPeso(null);
      setGramos("");
      setBusquedaPeso("");
      setErrorPeso("");
    } catch (err) {
      console.error(err);
      setErrorPeso(
        err instanceof Error
          ? err.message
          : "No se pudo conectar con el servidor."
      );
    } finally {
      setGuardandoPeso(false);
    }
  };

  const cambiarCantidad = async (
    producto_id: number,
    delta: number
  ) => {
    if (!ventaId) {
      return;
    }

    setError("");

    try {
      const res = await fetch(
        `${API_URL}/ventas/${ventaId}/productos/${producto_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ delta }),
        }
      );

      const data: ResumenResponse = await res.json();

      if (!res.ok || data.error) {
        setError(
          data.error ||
            data.mensaje ||
            "Hubo un error al actualizar la cantidad."
        );
        return;
      }

      actualizarDesdeRespuesta(data);
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar la cantidad.");
    }
  };

  const eliminarProducto = async (producto_id: number) => {
    if (!ventaId) {
      return;
    }

    setError("");

    try {
      const res = await fetch(
        `${API_URL}/ventas/${ventaId}/productos/${producto_id}`,
        {
          method: "DELETE",
        }
      );

      const data: ResumenResponse = await res.json();

      if (!res.ok || data.error) {
        setError(
          data.error ||
            data.mensaje ||
            "No se pudo eliminar el producto."
        );
        return;
      }

      actualizarDesdeRespuesta(data);
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el producto.");
    }
  };

  const finalizarVenta = async (): Promise<boolean> => {
    if (!ventaId || detalle.length === 0) {
      return false;
    }

    setError("");

    try {
      const res = await fetch(`${API_URL}/ventas/${ventaId}/finalizar`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.mensaje || "No se pudo finalizar la venta.");
        return false;
      }

      return true;
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor para finalizar la venta.");
      return false;
    }
  };

  const limpiarVenta = () => {
    setVentaId(null);
    setCodigoBarra("");
    setDetalle([]);
    setTotal(0);
    setCantidadProductos(0);
    setCantidadUnidades(0);
    setPesoTotalKg(0);
    setError("");

    setMostrarPeso(false);
    setProductoPeso(null);
    setGramos("");
    setBusquedaPeso("");
    setErrorPeso("");
  };

  return (
    <>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          padding: "16px",
        }}
      >
        <header
          className="header-principal"
          style={{ marginBottom: "12px" }}
        >
          <div>
            <h1 style={{ marginBottom: "4px" }}>Ventas</h1>
            <p style={{ marginBottom: 0 }}>Crear una nueva venta</p>
          </div>
        </header>

        <CCard style={{ marginBottom: "12px" }}>
          <CCardHeader
            component="h3"
            className="py-3 fw-bold"
            style={{ fontSize: "0.95rem" }}
          >
            Agregar Producto
          </CCardHeader>

          <CCardBody style={{ padding: "12px" }}>
            <CForm>
              <CRow className="g-3 align-items-end">
                <CCol lg={5}>
                  <CFormLabel
                    style={{
                      fontSize: "0.9rem",
                      marginBottom: "4px",
                    }}
                  >
                    Código de Barras
                  </CFormLabel>

                  <CInputGroup style={{ height: "36px" }}>
                    <CFormInput
                      value={codigoBarra}
                      onChange={(e) => setCodigoBarra(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Escanear o escribir código"
                      style={{ fontSize: "0.9rem" }}
                      autoFocus
                    />

                    <CInputGroupText>
                      <Barcode size={16} />
                    </CInputGroupText>
                  </CInputGroup>
                </CCol>

                <CCol lg={4}>
                  <div
                    className="d-flex align-items-center p-2"
                    style={{
                      background: "#eef4ff",
                      border: "1px solid #dbeafe",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      minHeight: "36px",
                    }}
                  >
                    <Barcode
                      size={20}
                      color="#2563eb"
                      style={{
                        marginRight: "10px",
                        minWidth: "20px",
                      }}
                    />

                    <span className="fw-bold">
                      Al escanear se suma automáticamente
                    </span>
                  </div>
                </CCol>

                <CCol lg={3}>
                  <CButton
                    color="primary"
                    variant="outline"
                    onClick={() => void abrirProductosPeso()}
                    className="w-100"
                    style={{
                      minHeight: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <Scale size={17} />
                    Producto por peso
                  </CButton>
                </CCol>
              </CRow>

              {error && (
                <p
                  style={{
                    color: "#dc3545",
                    fontSize: "0.85rem",
                    marginTop: "8px",
                    marginBottom: 0,
                  }}
                >
                  {error}
                </p>
              )}
            </CForm>
          </CCardBody>
        </CCard>

        <div className="d-flex flex-column flex-lg-row gap-3">
          <CCard
            style={{
              flex: 2,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <CCardHeader
              component="h3"
              className="py-2 fw-bold"
              style={{ fontSize: "0.95rem" }}
            >
              Productos en la venta
            </CCardHeader>

            <CCardBody
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                padding: "8px",
              }}
            >
              {detalle.length === 0 ? (
                <p
                  className="text-secondary text-center my-4"
                  style={{ fontSize: "0.9rem" }}
                >
                  Escaneá un código de barras o agregá un producto por peso.
                </p>
              ) : (
                <div
                  style={{
                    maxHeight: "260px",
                    overflowY: "auto",
                    overflowX: "auto",
                    marginBottom: "8px",
                    overscrollBehavior: "contain",
                  }}
                >
                  <CTable
                    align="middle"
                    hover
                    striped
                    responsive
                    style={{
                      fontSize: "0.85rem",
                      marginBottom: 0,
                      borderCollapse: "separate",
                      borderSpacing: 0,
                    }}
                  >
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell
                          scope="col"
                          style={{
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                            background: "#fff",
                          }}
                        >
                          Producto
                        </CTableHeaderCell>

                        <CTableHeaderCell
                          scope="col"
                          style={{
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                            background: "#fff",
                          }}
                        >
                          Precio
                        </CTableHeaderCell>

                        <CTableHeaderCell
                          scope="col"
                          style={{
                            textAlign: "center",
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                            background: "#fff",
                          }}
                        >
                          Cantidad
                        </CTableHeaderCell>

                        <CTableHeaderCell
                          scope="col"
                          style={{
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                            background: "#fff",
                          }}
                        >
                          Subtotal
                        </CTableHeaderCell>

                        <CTableHeaderCell
                          scope="col"
                          style={{
                            width: "60px",
                            textAlign: "center",
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                            background: "#fff",
                          }}
                        >
                          Acción
                        </CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>

                    <CTableBody>
                      {detalle.map((item) => {
                        const tipoVenta = item.tipo_venta || "UNIDAD";

                        return (
                          <CTableRow key={item.producto_id}>
                            <CTableDataCell
                              style={{ fontSize: "0.85rem" }}
                            >
                              <div className="fw-semibold">{item.nombre}</div>

                              {tipoVenta === "PESO" && (
                                <small className="text-secondary">
                                  Venta por peso
                                </small>
                              )}
                            </CTableDataCell>

                            <CTableDataCell
                              style={{
                                fontSize: "0.85rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              ${formatearDinero(item.precio_unitario)}
                              {tipoVenta === "PESO" ? " / kg" : ""}
                            </CTableDataCell>

                            <CTableDataCell>
                              {tipoVenta === "UNIDAD" ? (
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
                                      background: "#fff",
                                    }}
                                  >
                                    <CButton
                                      color="light"
                                      size="sm"
                                      onClick={() =>
                                        void cambiarCantidad(
                                          item.producto_id,
                                          -1
                                        )
                                      }
                                      style={{
                                        border: "none",
                                        borderRight:
                                          "1px solid #e5e7eb",
                                        borderRadius: 0,
                                        padding: "3px 8px",
                                      }}
                                    >
                                      <Minus size={12} />
                                    </CButton>

                                    <span
                                      style={{
                                        minWidth: "38px",
                                        textAlign: "center",
                                        fontSize: "0.85rem",
                                        fontWeight: 500,
                                        background: "#fff",
                                      }}
                                    >
                                      {item.cantidad}
                                    </span>

                                    <CButton
                                      color="light"
                                      size="sm"
                                      onClick={() =>
                                        void cambiarCantidad(
                                          item.producto_id,
                                          1
                                        )
                                      }
                                      style={{
                                        border: "none",
                                        borderLeft:
                                          "1px solid #e5e7eb",
                                        borderRadius: 0,
                                        padding: "3px 8px",
                                      }}
                                    >
                                      <Plus size={12} />
                                    </CButton>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "center",
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      background: "#eef4ff",
                                      border: "1px solid #dbeafe",
                                      color: "#1d4ed8",
                                      borderRadius: "999px",
                                      padding: "4px 10px",
                                      fontWeight: 600,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    <Scale size={14} />
                                    {formatearPeso(item.cantidad)}
                                  </span>
                                </div>
                              )}
                            </CTableDataCell>

                            <CTableDataCell
                              style={{
                                fontSize: "0.85rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              ${formatearDinero(item.subtotal)}
                            </CTableDataCell>

                            <CTableDataCell
                              style={{ textAlign: "center" }}
                            >
                              <CButton
                                color="danger"
                                variant="outline"
                                size="sm"
                                style={{
                                  padding: "2px 6px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                onClick={() =>
                                  void eliminarProducto(
                                    item.producto_id
                                  )
                                }
                              >
                                <Trash2 size={14} color="#dc3545" />
                              </CButton>
                            </CTableDataCell>
                          </CTableRow>
                        );
                      })}
                    </CTableBody>
                  </CTable>
                </div>
              )}
            </CCardBody>
          </CCard>

          <CCard
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CCardHeader
              component="h3"
              className="py-2 fw-bold text-black"
            >
              Resumen de la venta
            </CCardHeader>

            <CCardBody
              style={{
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  className="ms-3 me-3"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                    fontSize: "0.9rem",
                  }}
                >
                  <span>Cantidad de Productos</span>
                  <strong>{cantidadProductos}</strong>
                </div>

                <div
                  className="ms-3 me-3"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                    fontSize: "0.9rem",
                  }}
                >
                  <span>Cantidad de Unidades</span>
                  <strong>{cantidadUnidades}</strong>
                </div>

                {pesoTotalKg > 0 && (
                  <div
                    className="ms-3 me-3"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      fontSize: "0.9rem",
                    }}
                  >
                    <span>Peso total</span>
                    <strong>{formatearPeso(pesoTotalKg)}</strong>
                  </div>
                )}

                <hr className="my-3" />

                <div
                  className="ms-3 me-3"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h4 className="fw-bold my-1" style={{ marginBottom: 0 }}>
                    TOTAL
                  </h4>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <DollarSign
                      size={24}
                      color="#2563eb"
                      style={{ margin: 0 }}
                    />

                    <h2
                      style={{
                        margin: 0,
                        color: "#2563eb",
                        fontWeight: 700,
                        fontSize: "1.5rem",
                      }}
                    >
                      {formatearDinero(total)}
                    </h2>
                  </div>
                </div>

                <ModalExito
                  onEnviar={finalizarVenta}
                  onExito={limpiarVenta}
                  desactivado={!ventaId || detalle.length === 0}
                  textoBoton="Finalizar Venta"
                  variante="success"
                  className="w-100"
                />
              </div>
            </CCardBody>
          </CCard>
        </div>

        <AgregarDeuda ventaId={ventaId} />
      </div>

      <CModal
        visible={mostrarPeso}
        onClose={() => {
          if (!guardandoPeso) {
            setMostrarPeso(false);
            setErrorPeso("");
          }
        }}
        alignment="center"
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>Agregar producto por peso</CModalTitle>
        </CModalHeader>

        <CModalBody>
          <CFormLabel>Buscar producto</CFormLabel>

          <CInputGroup className="mb-3">
            <CInputGroupText>
              <Search size={16} />
            </CInputGroupText>

            <CFormInput
              value={busquedaPeso}
              onChange={(e) => setBusquedaPeso(e.target.value)}
              placeholder="Ej: zanahoria, jamón, queso..."
              disabled={cargandoProductosPeso}
            />
          </CInputGroup>

          {cargandoProductosPeso ? (
            <div className="text-secondary text-center py-4">
              Cargando productos...
            </div>
          ) : productosPesoFiltrados.length === 0 ? (
            <div
              className="text-secondary text-center py-4"
              style={{
                border: "1px dashed #d1d5db",
                borderRadius: "10px",
              }}
            >
              {productosPeso.length === 0
                ? "No hay productos configurados para venta por peso."
                : "No se encontraron productos con esa búsqueda."}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "10px",
                maxHeight: "230px",
                overflowY: "auto",
                paddingRight: "4px",
              }}
            >
              {productosPesoFiltrados.map((producto) => {
                const seleccionado = productoPeso?.id === producto.id;

                return (
                  <button
                    key={producto.id}
                    type="button"
                    onClick={() => {
                      setProductoPeso(producto);
                      setGramos("");
                      setErrorPeso("");
                    }}
                    style={{
                      textAlign: "left",
                      border: seleccionado
                        ? "2px solid #2563eb"
                        : "1px solid #dbe3ee",
                      background: seleccionado ? "#eef4ff" : "#fff",
                      borderRadius: "10px",
                      padding: "12px",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#172033",
                          }}
                        >
                          {producto.nombre}
                        </div>

                        {producto.categoria && (
                          <small className="text-secondary">
                            {producto.categoria}
                          </small>
                        )}
                      </div>

                      <Scale
                        size={18}
                        color={seleccionado ? "#2563eb" : "#64748b"}
                      />
                    </div>

                    <div
                      style={{
                        marginTop: "8px",
                        fontWeight: 700,
                        color: "#2563eb",
                      }}
                    >
                      ${formatearDinero(producto.precio)} / kg
                    </div>

                    <small className="text-secondary">
                      Stock: {formatearPeso(producto.stock)}
                    </small>
                  </button>
                );
              })}
            </div>
          )}

          {productoPeso && (
            <div
              style={{
                marginTop: "18px",
                paddingTop: "18px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  marginBottom: "12px",
                  padding: "12px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                }}
              >
                <div className="fw-bold">{productoPeso.nombre}</div>

                <div
                  className="text-secondary"
                  style={{ fontSize: "0.9rem" }}
                >
                  ${formatearDinero(productoPeso.precio)} por kg · Stock{" "}
                  {formatearPeso(productoPeso.stock)}
                </div>
              </div>

              <CFormLabel>Peso</CFormLabel>

              <CInputGroup>
                <CFormInput
                  type="number"
                  min="1"
                  step="1"
                  value={gramos}
                  onChange={(e) => {
                    setGramos(e.target.value);
                    setErrorPeso("");
                  }}
                  placeholder="Ej: 350"
                  autoFocus
                />

                <CInputGroupText>gramos</CInputGroupText>
              </CInputGroup>

              <div className="d-flex gap-2 mt-3 flex-wrap">
                {[100, 250, 500, 1000, 2000].map((valor) => (
                  <CButton
                    key={valor}
                    type="button"
                    color="light"
                    onClick={() => {
                      setGramos(String(valor));
                      setErrorPeso("");
                    }}
                  >
                    {valor >= 1000
                      ? `${valor / 1000} kg`
                      : `${valor} g`}
                  </CButton>
                ))}
              </div>

              {pesoValido && (
                <div
                  style={{
                    marginTop: "18px",
                    padding: "14px",
                    borderRadius: "10px",
                    background: pesoExcedeStock ? "#fff1f2" : "#eef4ff",
                    border: pesoExcedeStock
                      ? "1px solid #fecdd3"
                      : "1px solid #dbeafe",
                  }}
                >
                  {pesoExcedeStock ? (
                    <div style={{ color: "#be123c", fontWeight: 600 }}>
                      El peso supera el stock disponible (
                      {formatearPeso(productoPeso.stock)}).
                    </div>
                  ) : (
                    <>
                      <div>
                        {formatearPeso(cantidadKg)} × $
                        {formatearDinero(productoPeso.precio)} / kg
                      </div>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "3px",
                          fontSize: "1.4rem",
                          color: "#2563eb",
                        }}
                      >
                        Total: ${formatearDinero(subtotalPeso)}
                      </strong>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {errorPeso && (
            <p
              style={{
                color: "#dc3545",
                fontSize: "0.85rem",
                marginTop: "12px",
                marginBottom: 0,
              }}
            >
              {errorPeso}
            </p>
          )}
        </CModalBody>

        <CModalFooter>
          <CButton
            color="light"
            disabled={guardandoPeso}
            onClick={() => {
              setMostrarPeso(false);
              setErrorPeso("");
            }}
          >
            Cancelar
          </CButton>

          <CButton
            color="primary"
            disabled={
              guardandoPeso ||
              !productoPeso ||
              !pesoValido ||
              pesoExcedeStock
            }
            onClick={() => void agregarPorPeso()}
          >
            {guardandoPeso ? "Agregando..." : "Agregar a la venta"}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
}

export default VentaProducto;
