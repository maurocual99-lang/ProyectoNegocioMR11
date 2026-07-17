import { useState } from "react";
import "./Producto.css";
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CForm, CFormSelect, CFormInput, CFormLabel} from '@coreui/react'


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

export default function ProductoCreate({recargar}:Props) {

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [codigoBarra, setCodigoBarra] = useState("");
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState(categorias[0]);

  const [costo, setCosto] = useState("");
  const [ganancia, setGanancia] = useState("63");
  const [stock, setStock] = useState("");

  const precioFinal =
    Number(costo || 0) * (1 + Number(ganancia || 0) / 100);

  const guardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/productos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigo_barra: codigoBarra,
          nombre,
          precio: Number(precioFinal.toFixed(2)),
          stock: Number(stock),
          categoria,
        }),
  
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar el producto.");
      } else {
        recargar();
      }

      alert("Producto agregado correctamente.");
    } catch (error) {
      console.error(error);
      alert("Error al guardar el producto.");
    }
  };

  return (
    <>
      <CButton color="primary" onClick={() => setMostrarConfirmacion(true)}>
            Agregar
        </CButton >
      <CModal visible={mostrarConfirmacion} size="lg" alignment="center">
        <CModalHeader closeButton={true} onClick={() => setMostrarConfirmacion(false)}>
          <CModalTitle> Agregar Producto</CModalTitle>
        </CModalHeader>
        <CModalBody >
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
              <CButton className="btn-guardar" type="submit">
                Crear Producto
              </CButton>
            </CModalFooter>
          </CForm>
        </CModalBody>
      </CModal>
    </>
  );
}