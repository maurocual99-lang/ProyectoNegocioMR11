import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from "@coreui/react";
import {
  Barcode,
  Boxes,
  Calculator,
  DollarSign,
  Package,
  Percent,
  Plus,
  Tag,
  TriangleAlert,
} from "lucide-react";

import "./Producto.css";

type TipoVenta = "UNIDAD" | "PESO";
type ModoPrecio = "CALCULADO" | "MANUAL";

const categorias = [
  "Bebidas",
  "Kiosco",
  "Fiambres",
  "Almacen",
  "Regaleria",
  "Verduleria",
] as const;

type Categoria = (typeof categorias)[number];

interface ProductoPendiente {
  codigo_barra: string | null;
  nombre: string;
  precio: number;
  stock: number;
  categoria: Categoria;
  tipo_venta: TipoVenta;
}

type Props = {
  recargar: () => void | Promise<void>;
};

function dinero(valor: number) {
  return valor.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ProductoCreate({ recargar }: Props) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarPregunta, setMostrarPregunta] = useState(false);
  const [productoPendiente, setProductoPendiente] =
    useState<ProductoPendiente | null>(null);
  const [tipoVenta, setTipoVenta] = useState<TipoVenta>("UNIDAD");
  const [codigoBarra, setCodigoBarra] = useState("");
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<Categoria>(categorias[0]);
  const [stock, setStock] = useState("");
  const [modoPrecio, setModoPrecio] = useState<ModoPrecio>("CALCULADO");
  const [costo, setCosto] = useState("");
  const [ganancia, setGanancia] = useState("63");
  const [precioManual, setPrecioManual] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const precioCalculado = useMemo(
    () => Number(costo || 0) * (1 + Number(ganancia || 0) / 100),
    [costo, ganancia]
  );

  const precioFinal =
    modoPrecio === "MANUAL" ? Number(precioManual || 0) : precioCalculado;

  function limpiarFormulario() {
    setTipoVenta("UNIDAD");
    setCodigoBarra("");
    setNombre("");
    setCategoria(categorias[0]);
    setStock("");
    setModoPrecio("CALCULADO");
    setCosto("");
    setGanancia("63");
    setPrecioManual("");
    setProductoPendiente(null);
    setMostrarPregunta(false);
    setError("");
  }

  function cerrarFormulario() {
    if (guardando) return;
    limpiarFormulario();
    setMostrarFormulario(false);
  }

  async function guardarProducto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");

    if (tipoVenta === "UNIDAD" && !codigoBarra.trim()) {
      setError("Ingresá el código de barras para un producto por unidad.");
      return;
    }

    if (!nombre.trim()) {
      setError("Ingresá el nombre del producto.");
      return;
    }

    if (nombre.trim().length > 120) {
      setError("El nombre puede tener hasta 120 caracteres.");
      return;
    }

    if (!Number.isFinite(Number(stock)) || Number(stock) < 0) {
      setError("Ingresá un stock válido, igual o mayor que cero.");
      return;
    }

    if (
      modoPrecio === "CALCULADO" &&
      (!Number.isFinite(Number(costo)) || Number(costo) < 0 ||
        !Number.isFinite(Number(ganancia)) || Number(ganancia) < 0)
    ) {
      setError("Revisá el costo y el porcentaje de ganancia.");
      return;
    }

    if (!Number.isFinite(precioFinal) || precioFinal <= 0) {
      setError("El precio de venta debe ser mayor que cero.");
      return;
    }

    const nuevoProducto: ProductoPendiente = {
      codigo_barra: codigoBarra.trim() || null,
      nombre: nombre.trim(),
      precio: Number(precioFinal.toFixed(2)),
      stock: Number(stock),
      categoria,
      tipo_venta: tipoVenta,
    };

    try {
      setGuardando(true);
      const respuesta = await fetch("http://127.0.0.1:3000/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoProducto),
      });
      const datos = await respuesta.json().catch(() => ({}));

      if (datos.existe) {
        setProductoPendiente(nuevoProducto);
        setMostrarPregunta(true);
        return;
      }

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudo crear el producto.");
      }

      await recargar();
      limpiarFormulario();
      setMostrarFormulario(false);
    } catch (errorGuardar) {
      setError(
        errorGuardar instanceof Error
          ? errorGuardar.message
          : "No se pudo crear el producto."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function agregarStock() {
    if (!productoPendiente?.codigo_barra) return;

    try {
      setGuardando(true);
      const respuesta = await fetch(
        `http://127.0.0.1:3000/productos/${productoPendiente.codigo_barra}/stock`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stock: productoPendiente.stock }),
        }
      );
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudo actualizar el stock.");
      }

      await recargar();
      limpiarFormulario();
      setMostrarFormulario(false);
    } catch (errorStock) {
      setError(
        errorStock instanceof Error
          ? errorStock.message
          : "No se pudo actualizar el stock."
      );
      setMostrarPregunta(false);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <CButton
        color="primary"
        className="producto-nuevo-boton"
        onClick={() => setMostrarFormulario(true)}
      >
        <Plus size={18} />
        Nuevo producto
      </CButton>

      <CModal
        visible={mostrarFormulario}
        size="lg"
        className="producto-modal-alta"
        alignment="center"
        backdrop="static"
        keyboard={false}
        onClose={cerrarFormulario}
      >
        <CModalHeader closeButton={!guardando} className="producto-modal-header">
          <div className="producto-modal-titulo">
            <span className="producto-modal-icono"><Plus size={23} /></span>
            <div>
              <CModalTitle>Agregar producto</CModalTitle>
              <small>Registrá un nuevo producto en el catálogo</small>
            </div>
          </div>
        </CModalHeader>

        <CForm onSubmit={guardarProducto}>
          <CModalBody className="producto-modal-body">
            <div className="producto-form-grid">
              <div className="producto-campo">
                <CFormLabel>Forma de venta</CFormLabel>
                <CInputGroup>
                  <CInputGroupText><Package size={16} /></CInputGroupText>
                  <CFormSelect
                    value={tipoVenta}
                    onChange={(e) => setTipoVenta(e.target.value as TipoVenta)}
                  >
                    <option value="UNIDAD">Por unidad</option>
                    <option value="PESO">Por peso</option>
                  </CFormSelect>
                </CInputGroup>
              </div>

              <div className="producto-campo">
                <CFormLabel>Nombre</CFormLabel>
                <CInputGroup>
                  <CInputGroupText><Package size={16} /></CInputGroupText>
                  <CFormInput
                    value={nombre}
                    maxLength={120}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNombre(e.target.value)}
                    placeholder="Ej: Galletitas de chocolate rellenas"
                    required
                  />
                </CInputGroup>
                <small className="producto-ayuda">{nombre.length}/120 caracteres</small>
              </div>

              <div className="producto-campo">
                <CFormLabel>Código de barras</CFormLabel>
                <CInputGroup>
                  <CInputGroupText><Barcode size={16} /></CInputGroupText>
                  <CFormInput
                    value={codigoBarra}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCodigoBarra(e.target.value)}
                    placeholder={tipoVenta === "PESO" ? "Opcional" : "Escaneá o escribí el código"}
                    required={tipoVenta === "UNIDAD"}
                    autoFocus
                  />
                </CInputGroup>
              </div>

              <div className="producto-campo">
                <CFormLabel>Categoría</CFormLabel>
                <CInputGroup>
                  <CInputGroupText><Tag size={16} /></CInputGroupText>
                  <CFormSelect
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as Categoria)}
                  >
                    {categorias.map((item) => <option key={item}>{item}</option>)}
                  </CFormSelect>
                </CInputGroup>
              </div>

              <div className="producto-campo producto-campo-ancho">
                <CFormLabel>
                  {tipoVenta === "PESO" ? "Stock inicial (kg)" : "Stock inicial (unidades)"}
                </CFormLabel>
                <CInputGroup>
                  <CInputGroupText><Boxes size={16} /></CInputGroupText>
                  <CFormInput
                    type="number"
                    min="0"
                    step={tipoVenta === "PESO" ? "0.001" : "1"}
                    value={stock}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setStock(e.target.value)}
                    placeholder="0"
                    required
                  />
                </CInputGroup>
              </div>

              <fieldset className="producto-precio-panel producto-campo-ancho">
                <legend>¿Cómo querés definir el precio?</legend>
                <div className="producto-modo-precio">
                  <button
                    type="button"
                    className={modoPrecio === "CALCULADO" ? "activo" : ""}
                    onClick={() => setModoPrecio("CALCULADO")}
                  >
                    <Calculator size={18} />
                    Calcular con costo y ganancia
                  </button>
                  <button
                    type="button"
                    className={modoPrecio === "MANUAL" ? "activo" : ""}
                    onClick={() => setModoPrecio("MANUAL")}
                  >
                    <DollarSign size={18} />
                    Escribir precio de venta
                  </button>
                </div>

                {modoPrecio === "CALCULADO" ? (
                  <div className="producto-precio-grid">
                    <div className="producto-campo">
                      <CFormLabel>Costo del producto</CFormLabel>
                      <CInputGroup>
                        <CInputGroupText><DollarSign size={16} /></CInputGroupText>
                        <CFormInput
                          type="number"
                          min="0"
                          step="0.01"
                          value={costo}
                          onChange={(e) => setCosto(e.target.value)}
                          placeholder="0,00"
                          required
                        />
                      </CInputGroup>
                    </div>
                    <div className="producto-campo">
                      <CFormLabel>Ganancia</CFormLabel>
                      <CInputGroup>
                        <CInputGroupText><Percent size={16} /></CInputGroupText>
                        <CFormInput
                          type="number"
                          min="0"
                          step="0.1"
                          value={ganancia}
                          onChange={(e) => setGanancia(e.target.value)}
                          required
                        />
                      </CInputGroup>
                    </div>
                  </div>
                ) : (
                  <div className="producto-campo">
                    <CFormLabel>
                      {tipoVenta === "PESO" ? "Precio de venta por kg" : "Precio de venta por unidad"}
                    </CFormLabel>
                    <CInputGroup>
                      <CInputGroupText><DollarSign size={16} /></CInputGroupText>
                      <CFormInput
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={precioManual}
                        onChange={(e) => setPrecioManual(e.target.value)}
                        placeholder="0,00"
                        required
                      />
                    </CInputGroup>
                  </div>
                )}

                <div className="producto-precio-resumen">
                  <span>Precio de venta</span>
                  <strong>${dinero(precioFinal)}</strong>
                  <small>
                    {modoPrecio === "CALCULADO"
                      ? `Costo + ${ganancia || 0}% de ganancia`
                      : "Precio ingresado manualmente"}
                  </small>
                </div>
              </fieldset>
            </div>

            {error && <div className="producto-form-error">{error}</div>}
          </CModalBody>

          <CModalFooter className="producto-modal-footer">
            <CButton type="button" color="light" onClick={cerrarFormulario} disabled={guardando}>
              Cancelar
            </CButton>
            <CButton type="submit" color="primary" disabled={guardando}>
              <Plus size={17} />
              {guardando ? "Guardando…" : "Crear producto"}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      <CModal
        visible={mostrarPregunta}
        alignment="center"
        backdrop="static"
        keyboard={false}
        onClose={() => !guardando && setMostrarPregunta(false)}
      >
        <CModalHeader closeButton={!guardando}>
          <div className="producto-modal-titulo producto-modal-advertencia">
            <span className="producto-modal-icono"><TriangleAlert size={23} /></span>
            <div>
              <CModalTitle>Producto existente</CModalTitle>
              <small>Ese código de barras ya está registrado</small>
            </div>
          </div>
        </CModalHeader>
        <CModalBody>
          <p>
            ¿Querés sumar <strong>{productoPendiente?.stock}</strong>{" "}
            {productoPendiente?.tipo_venta === "PESO" ? "kg" : "unidades"}
            {" "}al stock existente?
          </p>
          <div className="producto-codigo-existente">
            <Barcode size={18} />
            {productoPendiente?.codigo_barra}
          </div>
          {error && <div className="producto-form-error">{error}</div>}
        </CModalBody>
        <CModalFooter>
          <CButton color="light" disabled={guardando} onClick={() => setMostrarPregunta(false)}>
            Cancelar
          </CButton>
          <CButton color="primary" disabled={guardando} onClick={() => void agregarStock()}>
            <Plus size={17} />
            {guardando ? "Agregando…" : "Agregar stock"}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
}
