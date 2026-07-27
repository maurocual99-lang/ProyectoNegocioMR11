import { useState } from "react";
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton  } from '@coreui/react'

type Props = {
  producto: string;        
  recargar: () => void;
};

function EliminarProducto({producto, recargar}: Props) {
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const eliminarProducto = async () => {
    try {
      const respuesta = await fetch(`http://localhost:3000/productos/${producto}`, {
        method: "PUT",
      });

      if (!respuesta.ok) {
        throw new Error("El servidor falló al intentar eliminar el producto");
      }

      recargar();
      setMostrarConfirmacion(false);

    } catch (error) {
      console.error("Error en la eliminación:", error);
    }
  };

  return (
    <>
        <CButton   color="danger" className="border-secondary" onClick={() => setMostrarConfirmacion(true)}>
            Eliminar
            <i className="fa-solid fa-trash" style={{ fontSize: '18px', color: "rgba(163, 32, 52, 1)" }}></i>
        </CButton >

        <CModal visible={mostrarConfirmacion} onClose={() => setMostrarConfirmacion(false)}>
          <CModalHeader closeButton>
                <CModalTitle>Confirmar eliminación</CModalTitle>
            </CModalHeader>
                <CModalBody>¿Seguro que querés eliminar este producto?</CModalBody>
            <CModalFooter>
                <CButton  color="secondary" onClick={() => setMostrarConfirmacion(false)}>
                    Cancelar
                </CButton >
                <CButton  color="danger" onClick={eliminarProducto}>
                    Eliminar
                </CButton >
            </CModalFooter>
        </CModal>
    </>
  );
}

export default EliminarProducto;