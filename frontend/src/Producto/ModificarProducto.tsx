import { useEffect, useState } from "react";
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CForm, CFormSelect, CFormInput, CFormLabel } from '@coreui/react'
import { Pencil } from "lucide-react";

const categorias = [
  "Bebidas",
  "Kiosco",
  "Fiambres",
  "Almacen",
  "Regaleria",
  "Verduleria",
] as const;

type Categoria = typeof categorias[number];

interface Producto {
  codigo_barra: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: Categoria;
}
type Props = {
  producto: Producto;        
  recargar: () => void;
};

function ModificarProducto({producto, recargar}: Props) {
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [codigoViejo, setCodigoViejo] = useState("");
  const [codigoNuevo, setCodigoNuevo] = useState("");
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState(0);
  const [ganancia, setGanancia] = useState("63");
  const [stock, setStock] = useState(0);
  const [categoria, setCategoria] = useState("");

  useEffect(() => {

    setCodigoViejo(producto.codigo_barra);
    setCodigoNuevo(producto.codigo_barra);
    setNombre(producto.nombre);
    setPrecio(producto.precio);
    setStock(producto.stock);
    setCategoria(producto.categoria);
  }, [producto]);

  const precioFinal = Number(precio || 0) * (1 + Number(ganancia || 0) / 100);

  async function guardarCambios(e: React.FormEvent) {
    e.preventDefault();
    const productoEditado = {
      codigoViejo,
      codigoNuevo,
      nombre,
      precio: Number(precioFinal.toFixed(2)),
      stock,
      categoria,
    };

    try {
      const res = await fetch("http://localhost:3000/productos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productoEditado),
      });

      if (res.ok) {
          await recargar();
          setMostrarConfirmacion(false);
      } else {
        alert("Error al intentar guardar los cambios.");
      }
    } catch (error) {
      console.error("Error en la petición:", error);
      alert("No se pudo conectar con el servidor.");
    }
  }

  return (
    <>
      <CButton style={{color: "#2563eb"}} className="border-secondary" onClick={() => setMostrarConfirmacion(true)}>
        <div className="d-flex justify-content-center align-items-center gap-2">
          <Pencil size={16}/>  Editar
        </div>
      </CButton >
      <CModal
          visible={mostrarConfirmacion}
          onClose={() => setMostrarConfirmacion(false)}
          size="lg"
          alignment="center"
      >
      <CModalHeader closeButton={false}>
        <CModalTitle>Modificar Producto</CModalTitle>
      </CModalHeader>
        <CModalBody>
          <CForm onSubmit={guardarCambios}  className="producto-form">
            <div className="campo">
              <CFormLabel>Código De Barras</CFormLabel>
              <CFormInput
                value={codigoNuevo}
                onChange={(e) => setCodigoNuevo(e.target.value)}
                required
              />
            </div>
            <div className="campo">
              <CFormLabel>Nombre</CFormLabel>
              <CFormInput
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="campo">
              <CFormLabel>Costo del Producto ($)</CFormLabel>
              <CFormInput
                type="number"
                step="any"
                value={precio}
                onChange={(e) => setPrecio(Number(e.target.value))}
                required
              />
            </div>

            <div className="campo">
              <CFormLabel>Ganancia (%)</CFormLabel>
              <CFormInput
                type="number"
                value={ganancia}
                onChange={(e) => setGanancia(e.target.value)}
                required
              />
            </div>

            <div className="campo">
              <CFormLabel>Precio de Venta ($)</CFormLabel>
              <CFormInput
                type="text"
                value={precioFinal.toFixed(2)}
                readOnly
                className="precio"
                style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
              />
            </div>

            <div className="campo">
              <CFormLabel>Stock</CFormLabel>
              <CFormInput
                type="number"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                required
              />
            </div>

            <div className="campo campo-completo">
              <CFormLabel>Categoría</CFormLabel>
              <CFormSelect
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                required
              >
                <option value="" disabled>Seleccione una categoría</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </CFormSelect>
            </div>

            <CModalFooter className="modal-botones">
              <CButton
                type="button"
                className="btn-volver"
                onClick={() => setMostrarConfirmacion(false)}
              >
                Cancelar
              </CButton>
              <CButton type="submit" className="btn-guardar">
                Guardar
              </CButton>
            </CModalFooter>
          </CForm>
        </CModalBody>
      </CModal>
    </>
  );
}

export default ModificarProducto;