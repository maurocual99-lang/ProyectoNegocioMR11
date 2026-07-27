import { useEffect, useState } from "react";
import { Barcode,  Minus, Plus, Check , Trash2, DollarSign, Search, UserPlus   } from "lucide-react";
import { CCard,CFormSwitch ,CCardHeader, CCardBody, CFormLabel, CFormInput ,CRow ,CCol, CInputGroup, CInputGroupText ,CButton,CForm, CTable, CTableHead, CTableRow,CTableHeaderCell,CTableBody, CTableDataCell} from '@coreui/react';
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
const productos = [
  {
    nombre: "Coca Cola 2.25L",
    precio: 3500,
    cantidad: 2,
  },
  {
    nombre: "Papas Lays",
    precio: 1800,
    cantidad: 1,
  },
  {
    nombre: "Yerba Playadito 1kg",
    precio: 5200,
    cantidad: 3,
  },
  {
    nombre: "Yerba Playadito 1kg",
    precio: 5200,
    cantidad: 3,
  },
];

function VentaProducto() {

  return (
  <>
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      padding: "16px"
    }}>
      <header className="header-principal" style={{marginBottom:"12px"}}>
      <div>
        <h1 style={{ marginBottom: "4px" }}>Ventas</h1>
        <p style={{ marginBottom:0 }}>Crear una nueva venta</p>
      </div>
      </header>

      <CCard style={{ marginBottom: "12px" }}>
        <CCardHeader component="h3" className="py-3 fw-bold"  style={{ fontSize: "0.95rem" }}>
          Agregar Producto
        </CCardHeader>
        <CCardBody style={{padding: "12px"}}>
          <CForm >
          <CRow className="g-3 align-items-end">
            <CCol md={5}>
              <CFormLabel style={{ fontSize: "0.9rem", marginBottom: "4px" }}>
                Código de Barras
              </CFormLabel>
                <CInputGroup style={{ height: "36px" }}>

                <CFormInput
                  // // value={codigoBarra}
                  // onChange={(e) => setCodigoBarra(e.target.value)}
                  placeholder="Escanear o escribir codigo"
                  style={{ fontSize: "0.9rem" }}
                /> 
                <CInputGroupText>
                  <Barcode size={16} />
                </CInputGroupText>
              </CInputGroup>
            </CCol>


            <CCol md={7}>
              <div style={{ paddingTop: "24px" }}>
                <div
                  className="d-flex align-items-center p-2"
                  style={{
                    background: "#eef4ff",
                    border: "1px solid #dbeafe",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    height: "36px"
                  }}
                >
                  <Barcode
                    size={20}
                    color="#2563eb"
                    style={{ marginRight: "10px", minWidth: "20px" }}
                  />

                  <div>
                    <span className="fw-bold">
                      Al escanear se suma automáticamente
                    </span>
                  </div>
                </div>
              </div>
            </CCol>
          </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      <div 
      style={{
        display: "flex", gap: "12px"
      }}>
        <CCard style={{ flex: 2, display: "flex", flexDirection: "column", overflow: "hidden"}}>
          <CCardHeader component="h3" className="py-2 fw-bold"
             style={{ fontSize: "0.95rem" }}>
              Productos en la venta
          </CCardHeader>
          <CCardBody  style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: "8px" }}>
             {/* maxHeight ajustado a ~3 filas + header; a partir de la 4ta fila aparece scroll y el thead queda fijo */}
             <div style={{ maxHeight: "172px", overflowY: "auto", marginBottom: "8px", overscrollBehavior: "contain" }}>
              <CTable  align="middle" hover striped style={{ fontSize: "0.85rem", marginBottom: 0, borderCollapse: "separate", borderSpacing: 0 }}>
                <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell scope="col" style={{ position: "sticky", top: 0, zIndex: 2, background: "#fff" }}>Producto</CTableHeaderCell>
                        <CTableHeaderCell scope="col" style={{ position: "sticky", top: 0, zIndex: 2, background: "#fff" }}>Precio Unitario</CTableHeaderCell>
                        <CTableHeaderCell scope="col" 
      style={{ textAlign: "center", position: "sticky", top: 0, zIndex: 2, background: "#fff" }}>Cantidad</CTableHeaderCell>
                        <CTableHeaderCell scope="col" style={{ position: "sticky", top: 0, zIndex: 2, background: "#fff" }}>Subtotal</CTableHeaderCell>
                        <CTableHeaderCell scope="col" style={{width: "60px", textAlign:"center", position: "sticky", top: 0, zIndex: 2, background: "#fff"}}>Acción</CTableHeaderCell>
                      </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {productos.map((producto, index) => (
                      <CTableRow key={index}>
                        <CTableDataCell  style={{fontSize: "0.85rem"}}>{producto.nombre}</CTableDataCell>

                        <CTableDataCell  style={{fontSize: "0.85rem"}}>
                          ${producto.precio}
                        </CTableDataCell>
                        <CTableDataCell>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                overflow: "hidden",
                                height: "30px",
                                background: "#fff"
                              }}
                            >
                              <CButton
                                color="light"
                                size="sm"
                                style={{
                                  border: "none",
                                  borderRight: "1px solid #e5e7eb",
                                  borderRadius: 0,
                                  padding: "3px 8px",
                                }}
                              >
                                <Minus size={12}/>
                              </CButton>

                              <span
                                style={{
                                  width: "35px",
                                  textAlign: "center",
                                  fontSize: "0.85rem",
                                  fontWeight: 500,
                                  background: "#fff"
                                }}
                              >
                                {producto.cantidad}
                              </span>

                              <CButton
                                color="light"
                                size="sm"
                                style={{
                                  border: "none",
                                  borderLeft: "1px solid #e5e7eb",
                                  borderRadius: 0,
                                  padding: "3px 8px",
                                }}
                              >
                                <Plus size={12}/>
                              </CButton>
                            </div>
                          </div>
                        </CTableDataCell>

                        <CTableDataCell style={{fontSize: "0.85rem"}}>
                          ${producto.precio * producto.cantidad}
                        </CTableDataCell>

                        <CTableDataCell style={{ textAlign: "center" }}>
                          <CButton color="danger" variant="outline" size="sm" style={{padding: "2px 6px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center"}}>
                            <Trash2 size={14} color="#dc3545" />
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </div>
          </CCardBody>
          
        </CCard>

        <CCard style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <CCardHeader component="h3" className="py-2 fw-bold text-black">Resumen de la venta</CCardHeader>
            <CCardBody style={{ padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>  
                <div className="ms-3 me-3"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                    fontSize:"0.9rem"
                  }}
                >
                  <span>Cantidad de Productos</span>
                  <strong>8</strong>
                </div>

                <div className="ms-3 me-3"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                    fontSize:"0.9rem"
                  }}
                >
                  <span>Cantidad de Unidades</span>
                  <strong>6</strong>
                </div>

                <hr className="my-3" />

                <div className="ms-3 me-3"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h4 className="fw-bold my-1" style={{ marginBottom: 0 }}>
                    TOTAL
                  </h4>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <DollarSign  size={24} color="#2563eb" style={{ margin: 0 }}/>
                      <h2
                        style={{
                          margin: 0,
                          color: "#2563eb",
                          fontWeight: 700,
                          fontSize: "1.5rem",
                        }}
                      >
                        11.950
                      </h2>
                    </div> 
                </div>
                <CButton className="w-100" color="success" style={{ color: "white", marginTop: "8px" }}>
                  <Check size={16} className="me-2"/> Finalizar Venta
                </CButton>
            </div>
          </CCardBody>  
        </CCard>
      </div>
    
      <CCard className="my-3">
        <CCardHeader  className="fw-bold" style={{ padding: "8px 12px", fontSize: "0.95rem" }}
        >Cliente (Opcional)</CCardHeader>
        <CCardBody style={{ padding: "12px" }}>
          <CRow className="g-3 align-items-end">
            <CCol md={4}>
              <CFormLabel
                style={{ fontWeight: 500, color: "#1f2937", fontSize: "0.9rem", marginBottom: "6px" }}
              >
                ¿El cliente va a pagar después?
              </CFormLabel>

              <div
                style={{
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <CFormSwitch size="lg"/>

                <span
                  style={{
                    fontWeight: 500,
                    color: "#374151",
                    fontSize:"0.9rem"
                  }}
                >
                  Marcar como cliente moroso
                </span>
              </div>
            </CCol>
            <CCol md={4}>
              <CFormLabel style={{ fontSize: "0.9rem", marginBottom: "6px" }}>
                Buscar cliente (por apellido, nombre o apodo)</CFormLabel>
              <CInputGroup style={{ height: "36px" }}>
                <CFormInput
                  placeholder="Ej: Pérez, Juan o Juancito"
                  style={{ fontSize: "0.9rem" }}
                />   
                <CInputGroupText>
                  <Search size={14} />
                </CInputGroupText>
              </CInputGroup>
            </CCol>

            <CCol md={4}>
              
              <div
                className="d-flex align-items-center p-2"
                style={{
                  background: "#eef4ff",
                  border: "1px solid #dbeafe",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  height: "36px"
                }}
              >
                <UserPlus 
                  size={20}
                  color="#2563eb"
                  style={{ marginRight: "10px", minWidth: "20px"  }}
                />

                <div>
                  <div className="fw-bold">¿Primera vez?</div>
                  <div className="text-secondary">Agregalo como moroso</div>
                </div>
              </div>
            </CCol>
          </CRow>
          <CButton color="primary"
            className="w-100 mt-3" style={{ marginTop: "8px" }} size="lm"
          >
            <Plus size={16} className="me-2" />
            Agregar cliente moroso
          </CButton>
        </CCardBody>
      </CCard>
    </div>
  </>
  );
}

export default VentaProducto;