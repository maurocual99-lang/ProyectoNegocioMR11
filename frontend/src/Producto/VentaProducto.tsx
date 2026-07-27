import { useEffect, useState } from "react";
import { Barcode,  Minus, Plus, Search, Trash2, DollarSign  } from "lucide-react";
import { CCard, CCardHeader, CCardBody, CFormLabel, CFormInput ,CRow ,CCol, CInputGroup, CInputGroupText ,CButton,CForm, CTable, CTableHead, CTableRow,CTableHeaderCell,CTableBody, CTableDataCell} from '@coreui/react';
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
];

function VentaProducto() {


  return (
  <>
    <header className="header-principal">
    <div>
      <h1>Ventas</h1>
      <p>Crear una nueva venta</p>
    </div>
    </header>
    <section>
      <CCard>
        <CCardHeader component="h3" className="py-3 text-black">Agregar Producto</CCardHeader>
        <CCardBody>
          <CForm >
          <CRow>

            <CCol md={4}>
              <CFormLabel>Código de Barras</CFormLabel>
                <CInputGroup>

                <CFormInput
                  // // value={codigoBarra}
                  // onChange={(e) => setCodigoBarra(e.target.value)}
                  placeholder="Escanear o escribir codigo"
                /> 
                <CInputGroupText>
                  <Barcode size={18} />
                </CInputGroupText>
              </CInputGroup>
            </CCol>

            <CCol md={2}>
              <CFormLabel>Cantidad</CFormLabel>
              <CInputGroup>

              <CButton
                color="secondary"
                // onClick={() =>
                //   setCantidad((c) => Math.max(1, c - 1))
                // }
              >
                <Minus size={10}/>
              </CButton>

              <CFormInput
                type="number"
                // value={cantidad}
                // onChange={(e) => setCantidad(Number(e.target.value))}
                className="text-center"
              />

              <CButton
                color="secondary"
                // onClick={() =>
                //   setCantidad((c) => c + 1)
                // }
              >
                <Plus size={10}/>
              </CButton>

            </CInputGroup>
            </CCol>

            <CCol md={4}>
               <div >
                <CFormLabel>Buscar Producto</CFormLabel>
                <small className="text-secondary"> (Opcional)</small>
              </div>

              <CInputGroup>

              <CFormInput
                placeholder="Buscar por nombre..."
              />

              <CInputGroupText>
                <Search size={14}/>
              </CInputGroupText>

            </CInputGroup>
            </CCol>

          </CRow>
          </CForm>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <CButton color="primary">
             <Plus size={18}/> Agregar
            </CButton>
          </div>
        </CCardBody>
      </CCard>
    </section>

    <section 
    style={{
      display: "flex",
      gap: "20px",
    }}>
      <CCard style={{ flex: 2 }}>
         <CCardHeader component="h3" className="py-3 text-black">Productos en la venta</CCardHeader>
         <CCardBody>
           <CTable align="middle" responsive hover striped>
            <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col">Producto</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Precio Unitario</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Cantidad</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Subtotal</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Acción</CTableHeaderCell>
                  </CTableRow>
              </CTableHead>
              <CTableBody>
                {productos.map((producto, index) => (
                  <CTableRow key={index}>
                    <CTableDataCell>{producto.nombre}</CTableDataCell>

                    <CTableDataCell>
                      ${producto.precio}
                    </CTableDataCell>

                      <div
                        style={{
                          display: "flex-center",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <CButton color="secondary" size="sm">
                          <Minus size={10}/>
                        </CButton>

                        <span>{producto.cantidad}</span>

                        <CButton color="primary" size="sm">
                          <Plus size={10}/>  
                        </CButton>
                      </div>

                    <CTableDataCell>
                      ${producto.precio * producto.cantidad}
                    </CTableDataCell>

                    <CTableDataCell>
                      <CButton color="danger" variant="outline" size="sm">
                        <Trash2 size={16} color="#dc3545" />
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <CButton color="primary" variant="outline">
              <Trash2 size={18}/> Vaciar Venta
              </CButton>
            </div>
         </CCardBody>
        
      </CCard>

      <CCard style={{ flex: 1 }}>
         <CCardHeader component="h3" className="py-3 text-black">Resumen de la venta</CCardHeader>
          <div className="ms-3 me-3"
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "15px",
            }}
          >
            <span>Cantidad de Productos</span>
            <strong>8</strong>
          </div>

          <div className="ms-3 me-3"
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "10px",
            }}
          >
            <span>Cantidad de Unidades</span>
            <strong>6</strong>
          </div>

          <hr className="mx-3 my-2" />

          <div className="ms-3 me-3"
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "10px",
            }}
          >
            <span>SubTotal</span>
            <strong style={{ display: "flex", alignItems: "center", gap: "2px" }}> 
              <DollarSign size={16} />11.950
            </strong>
          </div>

          <hr className="mx-3 my-2" />

          
      </CCard>
    </section>
  </>
  );
}

export default VentaProducto;