import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EliminarProducto from "./EliminarProducto";
import ModificarProducto from "./ModificarProducto";
import ProductoCreate from "./ProductoCreate";
import { Barcode, Box, MoveLeft, MoveRight, Search } from "lucide-react";
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
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [pagina, setPagina] = useState(1);

  const productosPorPagina = 10;

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

  const productosFiltrados = productos.filter((producto)=>{
    const coincideBusqueda =
      producto.nombre.toLocaleLowerCase().includes(busqueda.toLowerCase()) ||
      producto.codigo_barra.includes(busqueda);

    const coincideCategoria =
      categoriaFiltro === "" ||
      producto.categoria === categoriaFiltro;

    return coincideBusqueda && coincideCategoria
  });

  const indiceInicial = (pagina - 1) * productosPorPagina;
  const indiceFinal = indiceInicial + productosPorPagina;

  const productosPagina = productosFiltrados.slice(
    indiceInicial,
    indiceFinal
  );

  const totalPaginas = Math.ceil(
    productosFiltrados.length / productosPorPagina
  );


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
                    <CFormSelect
                      value={categoriaFiltro}
                      onChange={(e)=>{
                        setCategoriaFiltro(e.target.value);
                        setPagina(1);
                      }}
                    >
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
                        value={busqueda}
                        onChange={(e)=>{
                          setBusqueda(e.target.value);
                          setPagina(1);
                        }}
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
                          {productosFiltrados.length}
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
                  {productosPagina.map((producto) => (
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
            <div className="d-flex justify-content-between aling-items-center mt-4">

                  <span className="text-muted">
                    Mostrando {indiceInicial+1}-
                    {Math.min(indiceFinal,productosFiltrados.length)} de {productosFiltrados.length} productos
                      
                  </span>

                  <div className="d-flex gap-2">
                    <CButton 
                      color="light"
                      disable={pagina===1}
                      onClick={()=>setPagina(pagina-1)}
                    >
                      <MoveLeft></MoveLeft>
                    </CButton>

                    {Array.from({length: totalPaginas}, (_,i) =>(
                      <CButton
                        key={i}
                        color={pagina===i + 1? "primary": "light"}
                        onClick={()=> setPagina(i+1)}
                      >
                        {i+1}
                      </CButton>
                    ))}

                    <CButton
                      color="light"
                      disable={pagina===totalPaginas}
                      onClick={()=> setPagina(pagina+1)}
                    >
                      <MoveRight></MoveRight>
                    </CButton>
                  </div>
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