import { useState } from "react";
import "./Producto.css";
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormSelect,
  CFormInput,
  CFormLabel,
} from "@coreui/react";
import { Plus } from "lucide-react";

const categorias = [
  "Bebidas",
  "Kiosco",
  "Fiambres",
  "Almacen",
  "Regaleria",
  "Verduleria",
];

type Props = {
  recargar: () => void;
};

export default function ProductoCreate({ recargar }: Props) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarPregunta, setMostrarPregunta] = useState(false);

  const [productoPendiente, setProductoPendiente] = useState<any>(null);

  const [codigoBarra, setCodigoBarra] = useState("");
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState(categorias[0]);

  const [costo, setCosto] = useState("");
  const [ganancia, setGanancia] = useState("63");
  const [stock, setStock] = useState("");

  const precioFinal =
    Number(costo || 0) * (1 + Number(ganancia || 0) / 100);

  function limpiarFormulario() {
    setCodigoBarra("");
    setNombre("");
    setCategoria(categorias[0]);
    setCosto("");
    setGanancia("63");
    setStock("");
    setProductoPendiente(null);
    setMostrarPregunta(false);
  }

  async function guardarProducto(e: React.FormEvent) {
    e.preventDefault();

    const nuevoProducto = {
      codigo_barra: codigoBarra,
      nombre,
      precio: Number(precioFinal.toFixed(2)),
      stock: Number(stock),
      categoria,
    };

    try {
      const response = await fetch("http://localhost:3000/productos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nuevoProducto),
      });

      const datos = await response.json();

      if (datos.existe) {
        setProductoPendiente(nuevoProducto);
        setMostrarPregunta(true);
        return;
      }

      alert("Producto agregado correctamente.");

      recargar();
      limpiarFormulario();

    } catch (error) {
      console.error(error);
      alert("Error al guardar el producto.");
    }
  }

  async function agregarStock() {
    try {
      await fetch(
        `http://localhost:3000/productos/${productoPendiente.codigo_barra}/stock`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stock: productoPendiente.stock,
          }),
        }
      );

      alert("Stock actualizado.");

      recargar();
      limpiarFormulario();

    } catch (error) {
      console.error(error);
      alert("No se pudo actualizar el stock.");
    }
  }

  return (
    <>
      <CButton
        style={{
          backgroundColor: "#2563eb",
          color: "#fff",
          width: "100%",
          maxWidth: "250px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
        }}
        onClick={() => setMostrarFormulario(true)}
      >
        <Plus size={18} />
        <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>
          Nuevo Producto
        </span>
      </CButton>

      <CModal
        visible={mostrarFormulario}
        size="lg"
        alignment="center"
        onClose={() => setMostrarFormulario(false)}
      >
        <CModalHeader closeButton={false}>
          <CModalTitle>Agregar Producto</CModalTitle>
        </CModalHeader>

        <CModalBody>
          <p>Complete los datos para registrar un nuevo producto.</p>

          <CForm className="producto-form" onSubmit={guardarProducto}>
            <div className="campo">
              <CFormLabel>Código de Barras</CFormLabel>
              <CFormInput
                type="text"
                value={codigoBarra}
                onChange={(e) => setCodigoBarra(e.target.value)}
                required
              />
            </div>

            <div className="campo">
              <CFormLabel>Nombre</CFormLabel>
              <CFormInput
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="campo">
              <CFormLabel>Categoría</CFormLabel>

              <CFormSelect
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </CFormSelect>
            </div>

            <div className="campo">
              <CFormLabel>Costo del Producto ($)</CFormLabel>
              <CFormInput
                min="0"
                step="0.01"
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="campo">
              <CFormLabel>Ganancia (%)</CFormLabel>

              <CFormInput
                min="0"
                step="0.1"
                value={ganancia}
                onChange={(e) => setGanancia(e.target.value)}
                required
              />
            </div>

            <div className="campo">
              <CFormLabel>Precio de Venta ($)</CFormLabel>

              <CFormInput
                value={precioFinal.toFixed(2)}
                readOnly
                className="precio"
              />
            </div>

            <div className="campo campo-completo">
              <CFormLabel>Stock</CFormLabel>

              <CFormInput
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </div>

            <CModalFooter className="botones">
              <CButton
                color="secondary"
                onClick={() => setMostrarFormulario(false)}
              >
                Cancelar
              </CButton>

              <CButton className="btn-guardar" type="submit">
                Crear Producto
              </CButton>
            </CModalFooter>
          </CForm>
        </CModalBody>
      </CModal>

      <CModal
        visible={mostrarPregunta}
        alignment="center"
        onClose={() => setMostrarPregunta(false)}
      >
        <CModalHeader closeButton>
          <CModalTitle>Producto existente</CModalTitle>
        </CModalHeader>

        <CModalBody>
          Ya existe un producto con ese código de barras.
          <br />
          <br />
          ¿Deseás agregar <strong>{stock}</strong> unidades al stock existente?
        </CModalBody>

        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setMostrarPregunta(false)}
          >
            Cancelar
          </CButton>

          <CButton color="primary" onClick={agregarStock}>
            Agregar stock
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
}