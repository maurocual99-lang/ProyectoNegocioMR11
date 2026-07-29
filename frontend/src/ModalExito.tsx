import { CButton, CModal, CModalBody, CModalHeader, CModalTitle } from "@coreui/react";
import { useState } from "react";

interface ModalExitoProps {
    onEnviar: () => boolean | Promise<boolean>; 
    onExito?: () => void;
    desactivado: boolean;
    textoBoton?: string;
    variante?: string;
    className?: string;
}

function ModalExito({ onEnviar, onExito, desactivado, textoBoton, variante, className }: ModalExitoProps) {
    const [mostrar, setMostrar] = useState(false);

    const [enviando, setEnviando] = useState(false);

    const mostrarModal = async () => {
        setEnviando(true);
        try {
            const exito = await onEnviar();
            if (exito) {
                setMostrar(true);
                setTimeout(() => {
                    setMostrar(false);
                    if (onExito) onExito();
                }, 1500);
            }
        
            } catch {
            alert("Ocurrió un error al ejecutar la acción");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <>
            <CButton color={variante} className={className} disabled={desactivado || enviando} onClick={mostrarModal} >
                {textoBoton}
            </CButton>

            <CModal show={mostrar}>
                <CModalHeader className="bg-success text-white">
                    <CModalTitle>¡Éxito!</CModalTitle>
                </CModalHeader>
                <CModalBody>
                    Operación exitosa!
                </CModalBody>
            </CModal>
        </>
    );
}

export default ModalExito;