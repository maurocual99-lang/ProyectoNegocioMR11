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
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from "@coreui/react";

import ModalExito from "../ModalExito";
import AgregarDeuda from "../clienteDeudor/AgregarDeuda";
import { generarComprobanteVentaPDF } from "../GeneradorPDF";
import "./VentaProducto.css";

const API_URL = "http://127.0.0.1:3000";
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
  tipo_venta: TipoVenta;
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

function normalizarTexto(valor: string) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function esCategoriaPorPeso(categoria: string) {
  return [
    "verduleria",
    "verduras",
    "frutas",
    "frutas y verduras",
    "fiambres",
  ].includes(normalizarTexto(categoria));
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
    const busqueda = normalizarTexto(busquedaPeso);

    if (!busqueda) {
      return productosPeso;
    }

    return productosPeso.filter(
      (producto) =>
        normalizarTexto(producto.nombre).includes(busqueda) ||
        normalizarTexto(producto.categoria).includes(busqueda)
    );
  }, [busquedaPeso, productosPeso]);

  const gramosNumero = Number(gramos);
  const cantidadKg = Number.isFinite(gramosNumero)
    ? gramosNumero / 1000
    : 0;

  const pesoValido =
    productoPeso !== null &&
    Number.isFinite(gramosNumero) &&
    gramosNumero > 0;

  const cantidadYaEnVenta = productoPeso
    ? Number(
        detalle.find((item) => item.producto_id === productoPeso.id)?.cantidad ||
          0
      )
    : 0;

  const pesoExcedeStock =
    productoPeso !== null &&
    pesoValido &&
    cantidadYaEnVenta + cantidadKg > Number(productoPeso.stock);

  const subtotalPeso =
    productoPeso && pesoValido
      ? cantidadKg * Number(productoPeso.precio)
      : 0;

  function formatearDinero(valor: number) {
    return Number(valor || 0).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatearPeso(kg: number) {
    const peso = Number(kg || 0);

    if (peso < 1) {
      return `${Math.round(peso * 1000)} g`;
    }

    return `${peso.toLocaleString("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    })} kg`;
  }

  function actualizarDesdeRespuesta(data: ResumenResponse) {
    const items = (data.detalle || []).map((item) => ({
      ...item,
      precio_unitario: Number(item.precio_unitario),
      cantidad: Number(item.cantidad),
      subtotal: Number(item.subtotal),
      tipo_venta: item.tipo_venta || "UNIDAD",
    }));

    setDetalle(items);
    setTotal(Number(data.total || 0));
    setCantidadProductos(Number(data.cantidadProductos || 0));
    setCantidadUnidades(Number(data.cantidadUnidades || 0));
    setPesoTotalKg(Number(data.pesoTotalKg || 0));
    setError(data.error || "");
  }

  async function crearVenta(): Promise<number> {
    const respuesta = await fetch(`${API_URL}/ventas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const data = await respuesta.json();

    if (!respuesta.ok || !data?.id) {
      throw new Error(data?.mensaje || "No se pudo iniciar la venta.");
    }

    const id = Number(data.id);
    setVentaId(id);
    return id;
  }

  async function escanear(codigo: string) {
    const codigoLimpio = codigo.trim();
    if (!codigoLimpio) return;

    setError("");

    try {
      let idVenta = ventaId;

      if (!idVenta) {
        idVenta = await crearVenta();
      }

      const respuesta = await fetch(
        `${API_URL}/ventas/${idVenta}/productos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codigo_barra: codigoLimpio }),
        }
      );

      const data: ResumenResponse = await respuesta.json();

      if (!respuesta.ok || data.error) {
        if (data.detalle) {
          actualizarDesdeRespuesta(data);
        }

        setError(
          data.error ||
            data.mensaje ||
            "No se pudo agregar el producto."
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
  }

  function handleKeyDown(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "Enter") {
      evento.preventDefault();
      const codigo = codigoBarra;
      setCodigoBarra("");
      void escanear(codigo);
    }
  }

  async function abrirProductosPeso() {
    setMostrarPeso(true);
    setProductoPeso(null);
    setGramos("");
    setBusquedaPeso("");
    setErrorPeso("");
    setCargandoProductosPeso(true);

    try {
      const respuesta = await fetch(`${API_URL}/productos`);
      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data?.mensaje || "No se pudieron cargar los productos."
        );
      }

      const lista = Array.isArray(data)
        ? data
        : Array.isArray(data?.productos)
          ? data.productos
          : [];

      /*
       * Además de tipo_venta=PESO, incluimos categorías viejas.
       * Así una zanahoria/fiambre creado antes de este cambio
       * también aparece en la búsqueda.
       */
      const disponibles: ProductoPeso[] = lista
        .filter(
          (producto: any) =>
            producto.activo !== false &&
            (producto.tipo_venta === "PESO" ||
              esCategoriaPorPeso(producto.categoria))
        )
        .map((producto: any) => ({
          id: Number(producto.id),
          nombre: String(producto.nombre),
          precio: Number(producto.precio),
          stock: Number(producto.stock),
          categoria: String(producto.categoria || ""),
          tipo_venta: producto.tipo_venta === "PESO" ? "PESO" : "UNIDAD",
          activo: producto.activo,
        }))
        .sort(
          (
            a: ProductoPeso,
            b: ProductoPeso
          ) =>
            a.nombre.localeCompare(
              b.nombre,
              "es"
            )
        );
      setProductosPeso(disponibles);
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
  }

  async function agregarPorPeso() {
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
        )}. Ya hay ${formatearPeso(cantidadYaEnVenta)} en esta venta.`
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

      const respuesta = await fetch(
        `${API_URL}/ventas/${idVenta}/productos-peso`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            producto_id: productoPeso.id,
            cantidad_kg: cantidadKg,
          }),
        }
      );

      const data: ResumenResponse = await respuesta.json();

      if (!respuesta.ok || data.error) {
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
  }

  async function cambiarCantidad(productoId: number, delta: number) {
    if (!ventaId) return;

    setError("");

    try {
      const respuesta = await fetch(
        `${API_URL}/ventas/${ventaId}/productos/${productoId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delta }),
        }
      );

      const data: ResumenResponse = await respuesta.json();

      if (!respuesta.ok || data.error) {
        setError(
          data.error ||
            data.mensaje ||
            "No se pudo actualizar la cantidad."
        );
        return;
      }

      actualizarDesdeRespuesta(data);
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar la cantidad.");
    }
  }

  async function eliminarProducto(productoId: number) {
    if (!ventaId) return;

    setError("");

    try {
      const respuesta = await fetch(
        `${API_URL}/ventas/${ventaId}/productos/${productoId}`,
        { method: "DELETE" }
      );

      const data: ResumenResponse = await respuesta.json();

      if (!respuesta.ok || data.error) {
        setError(
          data.error || data.mensaje || "No se pudo eliminar el producto."
        );
        return;
      }

      actualizarDesdeRespuesta(data);
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el producto.");
    }
  }

  async function finalizarVenta(): Promise<boolean> {
    if (!ventaId || detalle.length === 0) {
      return false;
    }

    setError("");

    try {
      const respuesta = await fetch(
        `${API_URL}/ventas/${ventaId}/finalizar`,
        { method: "POST" }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        setError(data.mensaje || "No se pudo finalizar la venta.");
        return false;
      }

      /*
       * El PDF se genera automáticamente después de que el backend
       * confirma la venta. Si falla el PDF, NO repetimos la venta.
       */
      try {
        await generarComprobanteVentaPDF(
          ventaId,
          detalle.map((item) => ({
            producto_id: item.producto_id,
            nombre: item.nombre,
            tipo_venta: item.tipo_venta,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal,
          })),
          total
        );
      } catch (errorPDF) {
        console.error(
          "La venta se guardó, pero falló el comprobante PDF:",
          errorPDF
        );
      }

      return true;
    } catch (err) {
      console.error(err);
      setError(
        "No se pudo conectar con el servidor para finalizar la venta."
      );
      return false;
    }
  }

  function limpiarVenta() {
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
  }

  return (
    <>
      <div className="venta-page">
        <header className="venta-page-header">
          <div>
            <h1>Ventas</h1>
            <p>
              Escaneá productos o agregá frutas, verduras y fiambres por peso.
            </p>
          </div>
        </header>

        <CCard className="venta-agregar-card">
          <CCardHeader>
            <h3 className="m-0 fw-bold">
              Agregar producto
            </h3>
          </CCardHeader>

          <CCardBody>
            <CForm>
              <div className="venta-agregar-grid">
                <div>
                  <CFormLabel>Código de barras</CFormLabel>

                  <CInputGroup>
                    <CFormInput
                      value={codigoBarra}
                      onChange={(e) => setCodigoBarra(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Escanear o escribir código"
                      autoFocus
                    />
                    <CInputGroupText>
                      <Barcode size={17} />
                    </CInputGroupText>
                  </CInputGroup>
                </div>

                <div className="venta-info-escaner">
                  <Barcode size={20} />
                  <span>Al escanear se suma automáticamente.</span>
                </div>

                <CButton
                  color="primary"
                  variant="outline"
                  className="venta-boton-peso"
                  onClick={() => void abrirProductosPeso()}
                >
                  <Scale size={18} />
                  Producto por peso
                </CButton>
              </div>

              {error && <div className="venta-error">{error}</div>}
            </CForm>
          </CCardBody>
        </CCard>

        <div className="venta-workspace">
          <CCard className="venta-productos-card">
            <CCardHeader>
              <h3 className="m-0 fw-bold">
                Productos en la venta
              </h3>
            </CCardHeader>

            <CCardBody className="venta-productos-body">
              {detalle.length === 0 ? (
                <div className="venta-vacia">
                  <Barcode size={38} />
                  <strong>Todavía no hay productos</strong>
                  <span>
                    Escaneá un código o usá “Producto por peso”.
                  </span>
                </div>
              ) : (
                <div className="venta-tabla-scroll">
                  <CTable align="middle" hover responsive className="mb-0">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Producto</CTableHeaderCell>
                        <CTableHeaderCell>Precio</CTableHeaderCell>
                        <CTableHeaderCell className="text-center">
                          Cantidad
                        </CTableHeaderCell>
                        <CTableHeaderCell>Subtotal</CTableHeaderCell>
                        <CTableHeaderCell className="text-center">
                          Acción
                        </CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>

                    <CTableBody>
                      {detalle.map((item) => {
                        const tipo = item.tipo_venta || "UNIDAD";

                        return (
                          <CTableRow key={item.producto_id}>
                            <CTableDataCell>
                              <strong>{item.nombre}</strong>
                              {tipo === "PESO" && (
                                <small className="venta-tipo-peso">
                                  Venta por peso
                                </small>
                              )}
                            </CTableDataCell>

                            <CTableDataCell className="text-nowrap">
                              ${formatearDinero(item.precio_unitario)}
                              {tipo === "PESO" ? " / kg" : ""}
                            </CTableDataCell>

                            <CTableDataCell>
                              {tipo === "UNIDAD" ? (
                                <div className="venta-cantidad-control">
                                  <CButton
                                    color="light"
                                    size="sm"
                                    onClick={() =>
                                      void cambiarCantidad(
                                        item.producto_id,
                                        -1
                                      )
                                    }
                                  >
                                    <Minus size={14} />
                                  </CButton>

                                  <strong>{item.cantidad}</strong>

                                  <CButton
                                    color="light"
                                    size="sm"
                                    onClick={() =>
                                      void cambiarCantidad(
                                        item.producto_id,
                                        1
                                      )
                                    }
                                  >
                                    <Plus size={14} />
                                  </CButton>
                                </div>
                              ) : (
                                <div className="venta-peso-badge">
                                  <Scale size={14} />
                                  {formatearPeso(item.cantidad)}
                                </div>
                              )}
                            </CTableDataCell>

                            <CTableDataCell className="text-nowrap">
                              ${formatearDinero(item.subtotal)}
                            </CTableDataCell>

                            <CTableDataCell className="text-center">
                              <CButton
                                color="danger"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  void eliminarProducto(item.producto_id)
                                }
                              >
                                <Trash2 size={15} />
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

          <aside className="venta-lateral">
            <CCard className="venta-resumen-card">
              <CCardHeader>
                <h3 className="m-0 fw-bold">
                  Resumen
                </h3>
              </CCardHeader>

              <CCardBody>
                <div className="venta-resumen-fila">
                  <span>Productos</span>
                  <strong>{cantidadProductos}</strong>
                </div>

                <div className="venta-resumen-fila">
                  <span>Unidades</span>
                  <strong>{cantidadUnidades}</strong>
                </div>

                {pesoTotalKg > 0 && (
                  <div className="venta-resumen-fila">
                    <span>Peso</span>
                    <strong>{formatearPeso(pesoTotalKg)}</strong>
                  </div>
                )}

                <div className="venta-total">
                  <span>TOTAL</span>
                  <strong>
                    <DollarSign size={23} />
                    {formatearDinero(total)}
                  </strong>
                </div>

                <ModalExito
                  onEnviar={finalizarVenta}
                  onExito={limpiarVenta}
                  desactivado={!ventaId || detalle.length === 0}
                  textoBoton="Finalizar Venta"
                  variante="success"
                  className="w-100"
                />
              </CCardBody>
            </CCard>

            <div className="venta-deuda-panel">
              <AgregarDeuda ventaId={ventaId} />
            </div>
          </aside>
        </div>
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
              <Search size={17} />
            </CInputGroupText>
            <CFormInput
              value={busquedaPeso}
              onChange={(e) => setBusquedaPeso(e.target.value)}
              placeholder="Zanahoria, tomate, jamón, queso..."
              disabled={cargandoProductosPeso}
            />
          </CInputGroup>

          {cargandoProductosPeso ? (
            <div className="text-center text-secondary py-4">
              Cargando productos...
            </div>
          ) : productosPesoFiltrados.length === 0 ? (
            <div className="venta-peso-sin-resultados">
              {productosPeso.length === 0
                ? "No hay verduras, frutas, fiambres ni productos configurados por peso."
                : "No se encontraron productos con esa búsqueda."}
            </div>
          ) : (
            <div className="venta-peso-productos">
              {productosPesoFiltrados.map((producto) => {
                const seleccionado = productoPeso?.id === producto.id;

                return (
                  <button
                    key={producto.id}
                    type="button"
                    className={`venta-peso-producto ${
                      seleccionado ? "venta-peso-producto-activo" : ""
                    }`}
                    onClick={() => {
                      setProductoPeso(producto);
                      setGramos("");
                      setErrorPeso("");
                    }}
                  >
                    <div className="venta-peso-producto-cabecera">
                      <div>
                        <strong>{producto.nombre}</strong>
                        <small>{producto.categoria}</small>
                      </div>
                      <Scale size={19} />
                    </div>

                    <span className="venta-peso-precio">
                      ${formatearDinero(producto.precio)} / kg
                    </span>
                    <small>Stock: {formatearPeso(producto.stock)}</small>
                  </button>
                );
              })}
            </div>
          )}

          {productoPeso && (
            <div className="venta-peso-carga">
              <div className="venta-peso-seleccion">
                <div>
                  <strong>{productoPeso.nombre}</strong>
                  <span>
                    ${formatearDinero(productoPeso.precio)} por kg
                  </span>
                </div>
                <span>Stock {formatearPeso(productoPeso.stock)}</span>
              </div>

              <CFormLabel>Peso en gramos</CFormLabel>

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

              <div className="venta-peso-atajos">
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
                    {valor >= 1000 ? `${valor / 1000} kg` : `${valor} g`}
                  </CButton>
                ))}
              </div>

              {pesoValido && (
                <div
                  className={`venta-peso-calculo ${
                    pesoExcedeStock ? "venta-peso-calculo-error" : ""
                  }`}
                >
                  {pesoExcedeStock ? (
                    <strong>
                      El peso total supera el stock disponible.
                    </strong>
                  ) : (
                    <>
                      <span>
                        {formatearPeso(cantidadKg)} × $
                        {formatearDinero(productoPeso.precio)}/kg
                      </span>
                      <strong>${formatearDinero(subtotalPeso)}</strong>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {errorPeso && <div className="venta-error mt-3">{errorPeso}</div>}
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
              guardandoPeso || !productoPeso || !pesoValido || pesoExcedeStock
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
