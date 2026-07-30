import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EliminarProducto from "./EliminarProducto";
import ModificarProducto from "./ModificarProducto";
import ProductoCreate from "./ProductoCreate";
import { Barcode} from "lucide-react";
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
            <div className="rounded overflow-hidden border">
              <CTable align="middle" responsive hover striped>
                <CTableHead color="#2563eb">
                  <CTableRow>
                    <CTableHeaderCell scope="col"  style={{ textAlign: "center", position: "sticky", top: 0, zIndex: 2, background: "#2563eb",color: "#fff"  }}>Código De Barras</CTableHeaderCell>
                    <CTableHeaderCell scope="col" style={{ textAlign: "center", position: "sticky", top: 0, zIndex: 2, background: "#2563eb",color: "#fff"  }}>Nombre</CTableHeaderCell>
                    <CTableHeaderCell scope="col" style={{ textAlign: "center", position: "sticky", top: 0, zIndex: 2, background: "#2563eb",color: "#fff"  }}>Precio</CTableHeaderCell>
                    <CTableHeaderCell scope="col" style={{ textAlign: "center", position: "sticky", top: 0, zIndex: 2, background: "#2563eb",color: "#fff"  }}>Stock</CTableHeaderCell>
                    <CTableHeaderCell scope="col"  style={{ textAlign: "center", position: "sticky", top: 0, zIndex: 2, background: "#2563eb",color: "#fff"  }}>Categoría</CTableHeaderCell>
                    <CTableHeaderCell scope="col"  style={{ textAlign: "center", position: "sticky", top: 0, zIndex: 2, background: "#2563eb",color: "#fff"  }}>Acción</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {productos.map((producto) => (
                    <CTableRow  key={producto.codigo_barra}>
                      <CTableDataCell  style={{ textAlign: "center", position: "sticky", top: 0, zIndex: 2}}>
                        <div className="d-flex justify-content-center align-items-center gap-2">
                          <Barcode size={20} color="#2563eb" />
                          <span>{producto.codigo_barra}</span>
                        </div>
                      </CTableDataCell>
                      <CTableDataCell style={{ textAlign: "center", position: "sticky", top: 0, zIndex: 2 }}>{producto.nombre}</CTableDataCell>
                      <CTableDataCell  style={{ textAlign: "center", position: "sticky", top: 0, zIndex: 2 }}>{producto.precio}</CTableDataCell>
                      <CTableDataCell  style={{ textAlign: "center", position: "sticky", top: 0, zIndex: 2  }}>{producto.stock}</CTableDataCell>
                      <CTableDataCell  style={{ textAlign: "center", position: "sticky", top: 0, zIndex: 2}}>{producto.categoria}</CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex justify-content-center align-items-center gap-3">
                          <ModificarProducto producto={producto} recargar={cargarProductos}/>
                          <EliminarProducto producto={producto.codigo_barra} recargar={cargarProductos}/>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
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