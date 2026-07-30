import { useState } from "react";
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton  } from '@coreui/react'
import { Trash } from "lucide-react";

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
        <CButton  style={{color: "#fe0000"}} className="border-secondary" onClick={() => setMostrarConfirmacion(true)}>
            <div className="d-flex justify-content-center align-items-center gap-2">
              <Trash size={16}/>Eliminar
            </div>
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