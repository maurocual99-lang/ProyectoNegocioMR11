import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import EliminarProducto
  from "./EliminarProducto";

import ModificarProducto
  from "./ModificarProducto";

import ProductoCreate
  from "./ProductoCreate";

import OrdenarTabla
  from "../OrdenarTabla";

import Capitalizar
  from "../Capitalizar";

import ListaCompra
  from "./ListaCompra";

import ModalListaCompra
  from "./ModalListaCompra";

import {
  Barcode,
  Box,
  MoveLeft,
  MoveRight,
  Search,
} from "lucide-react";

import {
  CRow,
  CCol,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CTable,
  CTableDataCell,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CButton,
  CForm,
  CInputGroup,
  CInputGroupText,
  CCard,
  CCardBody,
} from "@coreui/react";


const categorias = [
  "Bebidas",
  "Kiosco",
  "Fiambres",
  "Almacen",
  "Regaleria",
  "Verduleria",
] as const;


type Categoria =
  typeof categorias[number];


interface Producto {
  codigo_barra: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: Categoria;
}


function Catalogo() {

  const navigate = useNavigate();

  const [
    productos,
    setProductos,
  ] = useState<Producto[]>([]);


  const [
    busqueda,
    setBusqueda,
  ] = useState("");


  const [
    categoriaFiltro,
    setCategoriaFiltro,
  ] = useState("");


  const [
    pagina,
    setPagina,
  ] = useState(1);


  const [
    ordenarPor,
    setOrdenarPor,
  ] =
    useState<
      keyof Producto | ""
    >("");


  const [
    direccion,
    setDireccion,
  ] =
    useState<
      "asc" | "desc"
    >("asc");


  const [
    mostrarListaCompra,
    setMostrarListaCompra,
  ] = useState(false);


  const productosPorPagina = 10;


  useEffect(() => {
    cargarProductos();
  }, []);


  async function cargarProductos() {

    try {

      const res = await fetch(
        "http://localhost:3000/productos"
      );

      if (!res.ok) {
        throw new Error(
          "Error al buscar productos"
        );
      }

      const datos =
        await res.json();

      setProductos(datos);

    } catch (error) {

      console.error(error);

    }

  }


  /*
   * Ordenar columnas.
   */
  function ordenar(
    columna: keyof Producto
  ) {

    if (ordenarPor === columna) {

      setDireccion(
        direccion === "asc"
          ? "desc"
          : "asc"
      );

    } else {

      setOrdenarPor(columna);

      setDireccion("asc");

    }

  }


  /*
   * FILTRADO
   */
  const productosFiltrados =
    productos.filter(
      (producto) => {

        const coincideBusqueda =
          producto.nombre
            .toLowerCase()
            .includes(
              busqueda.toLowerCase()
            )
          ||
          producto.codigo_barra
            .includes(busqueda);


        const coincideCategoria =
          categoriaFiltro === ""
          ||
          producto.categoria ===
            categoriaFiltro;


        return (
          coincideBusqueda &&
          coincideCategoria
        );
      }
    );


  /*
   * ORDENAMIENTO
   */
  const productosOrdenados =
    [...productosFiltrados].sort(
      (a, b) => {

        if (!ordenarPor) {
          return 0;
        }


        const valorA =
          a[ordenarPor];

        const valorB =
          b[ordenarPor];


        if (valorA < valorB) {

          return direccion === "asc"
            ? -1
            : 1;

        }


        if (valorA > valorB) {

          return direccion === "asc"
            ? 1
            : -1;

        }


        return 0;
      }
    );


  /*
   * PAGINACIÓN
   */
  const totalPaginas =
    Math.ceil(
      productosOrdenados.length
      /
      productosPorPagina
    );


  const indiceInicial =
    (pagina - 1)
    *
    productosPorPagina;


  const indiceFinal =
    indiceInicial
    +
    productosPorPagina;


  const productosPagina =
    productosOrdenados.slice(
      indiceInicial,
      indiceFinal
    );


  return (
    <>

      <div
        style={{
          minHeight: "100vh",

          display: "flex",

          justifyContent:
            "center",

          padding: "16px",
        }}
      >

        <div
          style={{
            width: "100%",

            maxWidth: "1000px",

            display: "flex",

            flexDirection:
              "column",

            gap: "16px",
          }}
        >

          {/* ================= HEADER ================= */}

          <header
            className="
              d-flex
              justify-content-between
              align-items-center
            "
          >

            <div
              className="
                d-flex
                align-items-center
                gap-3
              "
            >

              <div
                className="
                  d-flex
                  justify-content-center
                  align-items-center
                "
                style={{
                  width: "48px",

                  height: "48px",

                  background:
                    "#eef4ff",

                  border:
                    "1px solid #dbeafe",

                  borderRadius:
                    "8px",
                }}
              >

                <Box
                  size={30}
                  color="#2563eb"
                />

              </div>


              <div>

                <h2
                  className="
                    mb-1
                    fw-bold
                  "
                  style={{
                    fontSize:
                      "1.8rem",
                  }}
                >
                  Catálogo de Productos
                </h2>


                <p
                  className="
                    mb-0
                    text-muted
                  "
                  style={{
                    fontSize:
                      "0.95rem",
                  }}
                >
                  Gestioná y mantené
                  tu inventario de
                  productos
                </p>

              </div>

            </div>


            <ProductoCreate
              recargar={
                cargarProductos
              }
            />

          </header>


          {/* =============== ALERTA =============== */}

          <ListaCompra

            productos={
              productos
            }

            abrirModal={() =>
              setMostrarListaCompra(
                true
              )
            }

          />


          {/* ================ MODAL ================ */}

          <ModalListaCompra

            visible={
              mostrarListaCompra
            }

            onClose={() =>
              setMostrarListaCompra(
                false
              )
            }

            productos={
              productos
            }

          />


          {/* ================ FILTROS ================ */}

          <CCard>

            <CCardBody>

              <CForm>

                <CRow
                  className="
                    align-items-end
                    g-3
                  "
                >

                  {/* CATEGORÍA */}

                  <CCol md={3}>

                    <CFormLabel>
                      Categoría
                    </CFormLabel>

                    <CFormSelect

                      value={
                        categoriaFiltro
                      }

                      onChange={(e: ChangeEvent<HTMLSelectElement>) => {

                        setCategoriaFiltro(
                          e.target.value
                        );

                        setPagina(1);

                      }}
                    >

                      <option value="">
                        Todas las categorías
                      </option>


                      {categorias.map(
                        (categoria) => (

                          <option
                            key={
                              categoria
                            }
                            value={
                              categoria
                            }
                          >
                            {
                              categoria
                            }
                          </option>

                        )
                      )}

                    </CFormSelect>

                  </CCol>


                  {/* BUSCADOR */}

                  <CCol md={5}>

                    <CFormLabel>
                      Buscar Producto
                    </CFormLabel>


                    <CInputGroup>

                      <CInputGroupText>

                        <Search
                          size={16}
                        />

                      </CInputGroupText>


                      <CFormInput

                        value={
                          busqueda
                        }

                        onChange={(e: ChangeEvent<HTMLSelectElement>) => {

                          setBusqueda(
                            e.target.value
                          );

                          setPagina(1);

                        }}

                        placeholder="
                          Buscar por nombre o código...
                        "
                      />

                    </CInputGroup>

                  </CCol>


                  {/* TOTAL */}

                  <CCol md={4}>

                    <div
                      className="
                        d-flex
                        justify-content-between
                        align-items-center
                        p-3
                      "
                      style={{
                        background:
                          "#eef4ff",

                        border:
                          "1px solid #dbeafe",

                        borderRadius:
                          "12px",
                      }}
                    >

                      <div>

                        <p
                          className="
                            mb-1
                            text-muted
                          "
                          style={{
                            fontSize:
                              "0.85rem",
                          }}
                        >
                          Total de Productos
                        </p>


                        <h4
                          className="
                            mb-0
                            fw-bold
                          "
                          style={{
                            color:
                              "#2563eb",
                          }}
                        >
                          {
                            productos.length
                          }
                        </h4>

                      </div>


                      <div
                        className="
                          d-flex
                          justify-content-center
                          align-items-center
                        "
                        style={{
                          width:
                            "52px",

                          height:
                            "52px",

                          background:
                            "#dbeafe",

                          borderRadius:
                            "50%",
                        }}
                      >

                        <Box
                          size={26}
                          color="#2563eb"
                        />

                      </div>

                    </div>

                  </CCol>

                </CRow>

              </CForm>

            </CCardBody>

          </CCard>


          {/* ================= TABLA ================= */}

          <CCard>

            <CCardBody>

              <div
                className="
                  rounded
                  overflow-hidden
                  border
                "
              >

                <CTable
                  align="middle"
                  responsive
                  hover
                  striped
                  className="mb-0"
                >

                  <CTableHead>

                    <CTableRow>

                      <OrdenarTabla
                        titulo="
                          Código de Barras
                        "
                        campo="
                          codigo_barra
                        "
                        ordenarPor={
                          ordenarPor
                        }
                        direccion={
                          direccion
                        }
                        ordenar={
                          ordenar
                        }
                      />


                      <OrdenarTabla
                        titulo="Nombre"
                        campo="nombre"
                        ordenarPor={
                          ordenarPor
                        }
                        direccion={
                          direccion
                        }
                        ordenar={
                          ordenar
                        }
                      />


                      <OrdenarTabla
                        titulo="Precio"
                        campo="precio"
                        ordenarPor={
                          ordenarPor
                        }
                        direccion={
                          direccion
                        }
                        ordenar={
                          ordenar
                        }
                      />


                      <OrdenarTabla
                        titulo="Stock"
                        campo="stock"
                        ordenarPor={
                          ordenarPor
                        }
                        direccion={
                          direccion
                        }
                        ordenar={
                          ordenar
                        }
                      />


                      <OrdenarTabla
                        titulo="
                          Categoría
                        "
                        campo="
                          categoria
                        "
                        ordenarPor={
                          ordenarPor
                        }
                        direccion={
                          direccion
                        }
                        ordenar={
                          ordenar
                        }
                      />


                      <CTableHeaderCell
                        style={{
                          textAlign:
                            "center",

                          background:
                            "#2563eb",

                          color:
                            "white",
                        }}
                      >
                        Acción
                      </CTableHeaderCell>

                    </CTableRow>

                  </CTableHead>


                  <CTableBody>

                    {productosPagina.map(
                      (producto) => (

                        <CTableRow
                          key={
                            producto.codigo_barra
                          }
                        >

                          {/* CÓDIGO */}

                          <CTableDataCell>

                            <div
                              className="
                                d-flex
                                justify-content-center
                                align-items-center
                                gap-2
                              "
                            >

                              <Barcode
                                size={20}
                                color="#2563eb"
                              />

                              <span>
                                {
                                  producto.codigo_barra
                                }
                              </span>

                            </div>

                          </CTableDataCell>


                          {/* NOMBRE */}

                          <CTableDataCell
                            className="
                              text-center
                            "
                          >
                            {
                              Capitalizar(
                                producto.nombre
                              )
                            }
                          </CTableDataCell>


                          {/* PRECIO */}

                          <CTableDataCell
                            className="
                              text-center
                            "
                          >
                            ${Number(
                              producto.precio
                            ).toFixed(2)}
                          </CTableDataCell>


                          {/* STOCK */}

                          <CTableDataCell
                            className="
                              text-center
                            "
                          >

                            {producto.stock <= 3
                              ? (
                                <span
                                  style={{
                                    color:
                                      "#ea580c",

                                    fontWeight:
                                      600,
                                  }}
                                >
                                  {
                                    producto.stock
                                  }
                                  {" "}
                                  ¡Stock bajo!
                                </span>
                              )
                              : producto.stock
                            }

                          </CTableDataCell>


                          {/* CATEGORÍA */}

                          <CTableDataCell
                            className="
                              text-center
                            "
                          >
                            {
                              producto.categoria
                            }
                          </CTableDataCell>


                          {/* ACCIONES */}

                          <CTableDataCell>

                            <div
                              className="
                                d-flex
                                justify-content-center
                                align-items-center
                                gap-3
                              "
                            >

                              <ModificarProducto

                                producto={
                                  producto
                                }

                                recargar={
                                  cargarProductos
                                }

                              />


                              <EliminarProducto

                                producto={
                                  producto.codigo_barra
                                }

                                recargar={
                                  cargarProductos
                                }

                              />

                            </div>

                          </CTableDataCell>

                        </CTableRow>

                      )
                    )}

                  </CTableBody>

                </CTable>

              </div>


              {/* ============== PAGINACIÓN ============== */}

              <div
                className="
                  d-flex
                  justify-content-between
                  align-items-center
                  mt-4
                "
              >

                <span
                  className="
                    text-muted
                  "
                  style={{
                    fontSize:
                      "0.9rem",
                  }}
                >

                  {productosFiltrados.length === 0
                    ? "No hay productos"
                    : (
                      <>
                        Mostrando{" "}
                        {indiceInicial + 1}
                        -
                        {Math.min(
                          indiceFinal,
                          productosFiltrados.length
                        )}
                        {" "}de{" "}
                        {
                          productosFiltrados.length
                        }
                        {" "}productos
                      </>
                    )
                  }

                </span>


                <div
                  className="
                    d-flex
                    gap-2
                  "
                >

                  <CButton
                    color="light"

                    disabled={
                      pagina === 1
                    }

                    onClick={() =>
                      setPagina(
                        pagina - 1
                      )
                    }
                  >

                    <MoveLeft
                      size={18}
                    />

                  </CButton>


                  {Array.from(
                    {
                      length:
                        totalPaginas
                    },
                    (_, index) => (

                      <CButton

                        key={index}

                        color={
                          pagina ===
                          index + 1
                            ? "primary"
                            : "light"
                        }

                        onClick={() =>
                          setPagina(
                            index + 1
                          )
                        }
                      >
                        {index + 1}
                      </CButton>

                    )
                  )}


                  <CButton
                    color="light"

                    disabled={
                      pagina ===
                      totalPaginas
                      ||
                      totalPaginas === 0
                    }

                    onClick={() =>
                      setPagina(
                        pagina + 1
                      )
                    }
                  >

                    <MoveRight
                      size={18}
                    />

                  </CButton>

                </div>

              </div>


              {/* ============== VOLVER ============== */}

              <div
                className="
                  d-flex
                  justify-content-end
                  mt-3
                "
              >

                <CButton
                  className="
                    btn-volver
                  "

                  type="button"

                  onClick={() =>
                    navigate("/")
                  }

                  style={{
                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    gap:
                      "8px",
                  }}
                >

                  <MoveLeft
                    size={18}
                  />

                  Volver al inicio

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