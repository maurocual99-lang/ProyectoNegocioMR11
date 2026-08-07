import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
} from "@coreui/react";

type Categoria =
  | "Bebidas"
  | "Kiosco"
  | "Fiambres"
  | "Almacen"
  | "Regaleria"
  | "Verduleria";

interface Producto {
  codigo_barra: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: Categoria;
}

type Props = {
  visible: boolean;
  onClose: () => void;
  productos: Producto[];
};

export default function ModalListaCompra({
  visible,
  onClose,
  productos,
}: Props) {
  return (
    <CModal visible={visible} size="lg" onClose={onClose}>
      <CModalHeader closeButton>
        <CModalTitle>Lista de compra</CModalTitle>
      </CModalHeader>

      <CModalBody>
        {productos.length === 0 ? (
          <p>No hay productos para reponer.</p>
        ) : (
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Producto</CTableHeaderCell>
                <CTableHeaderCell>Stock</CTableHeaderCell>
                <CTableHeaderCell>Categoría</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {productos.map((producto) => (
                <CTableRow key={producto.codigo_barra}>
                  <CTableDataCell>{producto.nombre}</CTableDataCell>
                  <CTableDataCell>{producto.stock}</CTableDataCell>
                  <CTableDataCell>{producto.categoria}</CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        )}
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Cerrar
        </CButton>

        <CButton color="primary">
          Descargar PDF
        </CButton>
      </CModalFooter>
    </CModal>
  );
}