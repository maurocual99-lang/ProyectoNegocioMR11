import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EliminarProducto from "./EliminarProducto";
import ModificarProducto from "./ModificarProducto";
import ProductoCreate from "./ProductoCreate";
import { CCard, CCardHeader, CCardBody, CTable,CTableDataCell ,CTableHead ,CTableBody ,CTableRow,CTableHeaderCell ,CButton} from '@coreui/react';
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

function Catalogo() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState<Producto[]>([]);

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    try {
      const res = await fetch("http://localhost:3000/productos");
      if (!res.ok) throw new Error("Error al buscar productos");
      const datos = await res.json();
      setProductos(datos);
    } catch (error) {
      console.error(error);
    }
  }

  return (
  <div style={{ 
      display: "flex",
      justifyContent: "center",    // Centra horizontalmente
      alignItems: "center",        // Centra verticalmente
      minHeight: "100vh",          // Fuerza a que ocupe toda la pantalla
      width: "100%",
      backgroundColor: "#f8f9fa",  // Forzamos un fondo gris muy claro (estilo CoreUI) en toda la pantalla
      padding: "20px"
    }}>
    <div style={{ width: "100%", maxWidth: "1000px" }}> 
      <CCard className="shadow-sm">
        <CCardHeader component="h3" className="py-3">Catálogo de Productos </CCardHeader>
          <CCardBody>
            <CTable align="middle" responsive hover striped>
              <CTableHead color="dark">
                <CTableRow>
                  <CTableHeaderCell scope="col">Código De Barras</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Nombre</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Precio</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Stock</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Categoría</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Acción</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {productos.map((producto) => (
                  <CTableRow key={producto.codigo_barra}>
                    <CTableDataCell>{producto.codigo_barra}</CTableDataCell>
                    <CTableDataCell>{producto.nombre}</CTableDataCell>
                    <CTableDataCell>{producto.precio}</CTableDataCell>
                    <CTableDataCell>{producto.stock}</CTableDataCell>
                    <CTableDataCell>{producto.categoria}</CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex justify-content-center gap-2">
                        <ModificarProducto producto={producto} recargar={cargarProductos}/>
                        <EliminarProducto producto={producto.codigo_barra} recargar={cargarProductos}/>
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
            <div className="d-flex justify-content-end gap-2 mt-4">
        
              <ProductoCreate recargar={cargarProductos}/>
              <CButton
                className="btn-volver"
                type="button"
                onClick={() => navigate("/")}
              >
                Volver
              </CButton>
            </div>
        </CCardBody>
      </CCard>
    </div> 
  </div>
  );
}

export default Catalogo;