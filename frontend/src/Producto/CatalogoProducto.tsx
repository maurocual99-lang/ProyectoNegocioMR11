import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EliminarProducto from "./EliminarProducto";
import ModificarProducto from "./ModificarProducto";
import ProductoCreate from "./ProductoCreate";
import { Barcode, Box, MoveLeft, Search } from "lucide-react";
import { CRow, CCol,CFormInput, CFormLabel, CFormSelect, CTable,CTableDataCell ,CTableHead ,CTableBody ,CTableRow,CTableHeaderCell ,CButton, CForm, CInputGroup, CInputGroupText, CCard, CCardBody} from '@coreui/react';
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
    <>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1000px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <header className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center gap-3">
              <div
                  className="d-flex align-items-center p-2"
                    style={{
                      width: "48px",
                      height: "48px",
                      backgroundColor: "#eef4ff",
                      borderColor: "#dbeafe",
                      borderStyle: "solid",
                      borderWidth: "1px",
                      borderRadius: "8px",
                    }}
                  >
                <Box size={32} color="#2563eb" />
              </div>      
              <div>
                <h2 className="mb-1 fw-bold" style={{ fontSize: "1.8rem" }}>
                  Catálogo de Productos
                </h2>
                <p
                  className="mb-0 text-muted"
                  style={{ fontSize: "0.95rem" }}
                >
                  Gestioná y mantené tu inventario de productos
                </p>
              </div>
            </div>
            <ProductoCreate recargar={cargarProductos}/>
          </header>
          <CCard>
            <CCardBody>
              <CForm >
                <CRow className="align-items-end mb-4">

                  <CCol md={3}>
                    <CFormLabel>Categoría</CFormLabel>
                    <CFormSelect>
                      <option value="">Todas las categorías</option>
                      {categorias.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={5}>
                    <CFormLabel>Buscar Producto</CFormLabel>
                    <CInputGroup>
                      <CInputGroupText>
                        <Search size={16} />
                      </CInputGroupText>

                      <CFormInput
                        placeholder="Buscar por nombre o código de barras..."
                      />
                    </CInputGroup>
                  </CCol>

                  <CCol md={4}>
                    <div
                      className="d-flex justify-content-between align-items-center p-3"
                      style={{
                        background: "#eef4ff",
                        border: "1px solid #dbeafe",
                        borderRadius: "12px",
                      }}
                    >
                      <div>
                        <p
                          className="mb-1 text-muted"
                          style={{ fontSize: "0.85rem" }}
                        >
                          Total de Productos
                        </p>

                        <h4
                          className="mb-0 fw-bold"
                          style={{ color: "#2563eb" }}
                        >
                          26
                        </h4>
                      </div>

                      <div
                        className="d-flex justify-content-center align-items-center"
                        style={{
                          width: "52px",
                          height: "52px",
                          background: "#dbeafe",
                          borderRadius: "50%",
                        }}
                      >
                        <Box size={26} color="#2563eb" />
                      </div>
                    </div>
                  </CCol>

                </CRow>
              </CForm>
            </CCardBody>
          </CCard>
          <CCard>
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
              <div className="d-flex justify-content-end mt-3">
                <CButton
                  className="btn-volver"
                  type="button"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  onClick={() => navigate("/")}
                >
                  <MoveLeft size={18}></MoveLeft> 
                  <span style={{ fontSize: "0.95rem"}}>
                    Volver al inicio
                  </span>
                </CButton>
              </div>

          </CCardBody>
        </CCard>
        </div>
      </div>
    </>
  );
}

export default Catalogo;