import {
  ChangeEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import EliminarProducto from "./EliminarProducto";
import ModificarProducto from "./ModificarProducto";
import ProductoCreate from "./ProductoCreate";

import OrdenarTabla from "../OrdenarTabla";
import Capitalizar from "../Capitalizar";

import ListaCompra from "./ListaCompra";
import ModalListaCompra from "./ModalListaCompra";

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
  (typeof categorias)[number];


interface Producto {
  codigo_barra: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: Categoria;
}


const comparadorTexto =
  new Intl.Collator(
    "es",
    {
      sensitivity: "base",
    }
  );

function compararCodigoBarras(
  codigoA: string,
  codigoB: string
) {
  const a = codigoA.trim();
  const b = codigoB.trim();

  if (
    /^\d+$/.test(a) &&
    /^\d+$/.test(b)
  ) {

    const numeroA =
      a.replace(/^0+/, "") || "0";

    const numeroB =
      b.replace(/^0+/, "") || "0";

    if (
      numeroA.length !==
      numeroB.length
    ) {
      return (
        numeroA.length -
        numeroB.length
      );
    }

    const resultado =
      numeroA.localeCompare(
        numeroB
      );


    if (resultado !== 0) {
      return resultado;
    }

    return a.localeCompare(b);
  }

  return a.localeCompare(
    b,
    "es",
    {
      numeric: true,
      sensitivity: "base",
    }
  );
}

function Catalogo() {

  const navigate =
    useNavigate();

  const catalogoRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const tablaDisponibleRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const [
    alturaCatalogo,
    setAlturaCatalogo,
  ] = useState<number | null>(
    null
  );


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
    productosPorPagina,
    setProductosPorPagina,
  ] = useState(4);


  const [
    ordenarPor,
    setOrdenarPor,
  ] = useState<
    keyof Producto | ""
  >("");


  const [
    direccion,
    setDireccion,
  ] = useState<
    "asc" | "desc"
  >("asc");

  const [
    mostrarListaCompra,
    setMostrarListaCompra,
  ] = useState(false);

  useEffect(() => {

    cargarProductos();

  }, []);


  async function cargarProductos() {

    try {

      const res =
        await fetch(
          "http://localhost:3000/productos"
        );


      if (!res.ok) {

        throw new Error(
          "Error al buscar productos"
        );

      }


      const datos =
        await res.json();


      setProductos(
        datos
      );

    } catch (error) {

      console.error(
        "Error al cargar productos:",
        error
      );

    }
  }

  useLayoutEffect(() => {

    function calcularAltura() {

      if (!catalogoRef.current) {
        return;
      }


      const posicionSuperior =
        catalogoRef.current
          .getBoundingClientRect()
          .top;


      const alturaDisponible =
        window.innerHeight -
        posicionSuperior;


      setAlturaCatalogo(
        Math.max(
          0,
          alturaDisponible
        )
      );
    }


    calcularAltura();


    window.addEventListener(
      "resize",
      calcularAltura
    );


    return () => {

      window.removeEventListener(
        "resize",
        calcularAltura
      );

    };

  }, []);

  useEffect(() => {

    const elemento =
      tablaDisponibleRef.current;


    if (!elemento) {
      return;
    }

    const tabla = elemento;


    function calcularCantidadFilas() {

      const alturaDisponible =
        tabla.clientHeight;

      const altoEncabezado = 45;

      const altoFila = 59;


      const espacioParaFilas =
        alturaDisponible -
        altoEncabezado;


      let cantidad =
        Math.floor(
          espacioParaFilas /
          altoFila
        );

      cantidad =
        Math.max(
          1,
          cantidad
        );

      cantidad =
        Math.min(
          12,
          cantidad
        );


      setProductosPorPagina(
        (cantidadActual) => {

          if (
            cantidadActual ===
            cantidad
          ) {
            return cantidadActual;
          }


          return cantidad;
        }
      );
    }

    const observer =
      new ResizeObserver(
        calcularCantidadFilas
      );


    observer.observe(
      elemento
    );


    calcularCantidadFilas();


    return () => {

      observer.disconnect();

    };

  }, []);

  function ordenar(
    columna: keyof Producto
  ) {

    if (
      ordenarPor === columna
    ) {

      setDireccion(
        direccion === "asc"
          ? "desc"
          : "asc"
      );

    } else {

      setOrdenarPor(
        columna
      );

      setDireccion(
        "asc"
      );

    }


    setPagina(1);
  }

  const productosFiltrados =
    productos.filter(
      (producto) => {

        const textoBusqueda =
          busqueda
            .trim()
            .toLowerCase();


        const coincideBusqueda =
          producto.nombre
            .toLowerCase()
            .includes(
              textoBusqueda
            )
          ||
          producto.codigo_barra
            .includes(
              busqueda.trim()
            );


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


  const productosOrdenados =
    [...productosFiltrados]
      .sort(
        (a, b) => {

          if (!ordenarPor) {
            return 0;
          }


          let resultado = 0;


          switch (
            ordenarPor
          ) {

            case "codigo_barra":

              resultado =
                compararCodigoBarras(
                  a.codigo_barra,
                  b.codigo_barra
                );

              break;

            case "nombre":

              resultado =
                comparadorTexto.compare(
                  a.nombre.trim(),
                  b.nombre.trim()
                );

              break;

            case "precio":

              resultado =
                Number(
                  a.precio
                )
                -
                Number(
                  b.precio
                );

              break;

            case "stock":

              resultado =
                Number(
                  a.stock
                )
                -
                Number(
                  b.stock
                );

              break;

            case "categoria":

              resultado =
                comparadorTexto.compare(
                  a.categoria.trim(),
                  b.categoria.trim()
                );

              if (
                resultado === 0
              ) {

                resultado =
                  comparadorTexto.compare(
                    a.nombre.trim(),
                    b.nombre.trim()
                  );

              }

              break;


            default:

              resultado = 0;
          }


          return (
            direccion === "asc"
              ? resultado
              : -resultado
          );
        }
      );


  const totalPaginas =
    Math.ceil(
      productosOrdenados.length
      /
      productosPorPagina
    );

  useEffect(() => {

    if (
      totalPaginas === 0
    ) {

      if (
        pagina !== 1
      ) {
        setPagina(1);
      }

      return;
    }


    if (
      pagina > totalPaginas
    ) {

      setPagina(
        totalPaginas
      );

    }

  }, [
    totalPaginas,
    pagina,
  ]);


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
        ref={catalogoRef}

        style={{

          height:
            alturaCatalogo !== null
              ? `${alturaCatalogo}px`
              : "100%",

          maxHeight:
            alturaCatalogo !== null
              ? `${alturaCatalogo}px`
              : "100%",

          overflow:
            "hidden",

          display:
            "flex",

          justifyContent:
            "center",

          padding:
            "12px 24px",

          boxSizing:
            "border-box",
        }}
      >

        <div
          style={{
            width:
              "100%",

            maxWidth:
              "1400px",

            height:
              "100%",

            minHeight:
              0,

            display:
              "flex",

            flexDirection:
              "column",

            gap:
              "12px",

            overflow:
              "hidden",
          }}
        >


          <header
            className="
              d-flex
              justify-content-between
              align-items-center
              gap-3
            "

            style={{
              flex:
                "0 0 auto",
            }}
          >

            {/* IZQUIERDA */}

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
                  width:
                    "48px",

                  height:
                    "48px",

                  background:
                    "#eef4ff",

                  border:
                    "1px solid #dbeafe",

                  borderRadius:
                    "8px",

                  flexShrink:
                    0,
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
                  tu inventario de productos
                </p>

              </div>

            </div>


            {/* NUEVO PRODUCTO */}

            <ProductoCreate
              recargar={
                cargarProductos
              }
            />

          </header>

          <div
            style={{
              flex:
                "0 0 auto",
            }}
          >

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

          </div>


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

          <CCard
            style={{
              flex:
                "0 0 auto",
            }}
          >

            <CCardBody>

              <CForm>

                <CRow
                  className="
                    align-items-end
                    g-3
                  "
                >
                <CCol
                    xs={12}
                    md={3}
                  >

                    <CFormLabel>
                      Categoría
                    </CFormLabel>


                    <CFormSelect
                      value={
                        categoriaFiltro
                      }

                      onChange={(
                        e:
                          ChangeEvent<HTMLSelectElement>
                      ) => {

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
                            {categoria}
                          </option>

                        )
                      )}

                    </CFormSelect>

                  </CCol>

                  <CCol
                    xs={12}
                    md={5}
                  >

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

                        onChange={(
                          e:
                            ChangeEvent<HTMLInputElement>
                        ) => {

                          setBusqueda(
                            e.target.value
                          );

                          setPagina(1);

                        }}

                        placeholder="Buscar por nombre o código..."
                      />

                    </CInputGroup>

                  </CCol>


                  <CCol
                    xs={12}
                    md={4}
                  >

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

          <CCard
            style={{
              flex:
                "1 1 0",

              minHeight:
                0,

              overflow:
                "hidden",
            }}
          >

            <CCardBody
              style={{
                height:
                  "100%",

                minHeight:
                  0,

                display:
                  "flex",

                flexDirection:
                  "column",

                overflow:
                  "hidden",

                padding:
                  "16px",
              }}
            >

              <div
                ref={
                  tablaDisponibleRef
                }

                style={{
                  flex:
                    "1 1 0",

                  minHeight:
                    0,

                  overflow:
                    "hidden",

                  border:
                    "1px solid #d8dbe0",

                  borderRadius:
                    "6px",
                }}
              >

                <CTable
                  align="middle"
                  hover
                  striped
                  responsive

                  className="mb-0"

                  style={{
                    width:
                      "100%",
                  }}
                >

                  <CTableHead>

                    <CTableRow
                      style={{
                        height:
                          "45px",
                      }}
                    >

                      <OrdenarTabla
                        titulo="Código de Barras"
                        campo="codigo_barra"

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
                        titulo="Categoría"
                        campo="categoria"

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

                          verticalAlign:
                            "middle",

                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        Acción
                      </CTableHeaderCell>

                    </CTableRow>

                  </CTableHead>


                  <CTableBody>

                    {productosPagina.length ===
                    0 ? (

                      <CTableRow>

                        <CTableDataCell
                          colSpan={6}

                          className="
                            text-center
                            text-muted
                          "

                          style={{
                            height:
                              "59px",

                            verticalAlign:
                              "middle",
                          }}
                        >
                          No hay productos
                          para mostrar.
                        </CTableDataCell>

                      </CTableRow>

                    ) : (

                      productosPagina.map(
                        (producto) => (

                          <CTableRow
                            key={
                              producto.codigo_barra
                            }

                            style={{
                              height:
                                "59px",
                            }}
                          >

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


                            <CTableDataCell
                              className="
                                text-center
                              "
                            >

                              $

                              {Number(
                                producto.precio
                              ).toLocaleString(
                                "es-AR",
                                {
                                  minimumFractionDigits:
                                    2,

                                  maximumFractionDigits:
                                    2,
                                }
                              )}

                            </CTableDataCell>


                            <CTableDataCell
                              className="
                                text-center
                              "
                            >

                              {producto.stock <=
                              3 ? (

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

                              ) : (

                                producto.stock

                              )}

                            </CTableDataCell>


                            {/* =================
                                CATEGORÍA
                            ================== */}

                            <CTableDataCell
                              className="
                                text-center
                              "
                            >
                              {
                                producto.categoria
                              }
                            </CTableDataCell>


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
                      )

                    )}

                  </CTableBody>

                </CTable>

              </div>

              <div
                className="
                  d-flex
                  justify-content-between
                  align-items-center
                  gap-3
                  flex-wrap
                "

                style={{
                  flex:
                    "0 0 auto",

                  paddingTop:
                    "12px",
                }}
              >

                {/* MOSTRANDO */}

                <span
                  className="
                    text-muted
                  "

                  style={{
                    fontSize:
                      "0.9rem",
                  }}
                >

                  {productosFiltrados.length ===
                  0
                    ? "No hay productos"

                    : (
                      <>

                        Mostrando{" "}

                        {
                          indiceInicial +
                          1
                        }

                        -

                        {
                          Math.min(
                            indiceFinal,
                            productosFiltrados.length
                          )
                        }

                        {" "}de{" "}

                        {
                          productosFiltrados.length
                        }

                        {" "}productos

                      </>
                    )
                  }

                </span>


                {/* DERECHA */}

                <div
                  className="
                    d-flex
                    align-items-center
                    gap-3
                  "
                >

                  {/* PAGINACIÓN */}

                  <div
                    className="
                      d-flex
                      align-items-center
                      gap-2
                    "
                  >

                    {/* ANTERIOR */}

                    <CButton
                      color="light"

                      size="sm"

                      disabled={
                        pagina === 1
                      }

                      onClick={() =>
                        setPagina(
                          (
                            paginaActual
                          ) =>
                            Math.max(
                              1,
                              paginaActual -
                              1
                            )
                        )
                      }
                    >

                      <MoveLeft
                        size={18}
                      />

                    </CButton>


                    {/* NÚMEROS */}

                    {Array.from(
                      {
                        length:
                          totalPaginas,
                      },

                      (_, index) => {

                        const numeroPagina =
                          index + 1;


                        return (

                          <CButton
                            key={
                              numeroPagina
                            }

                            size="sm"

                            color={
                              pagina ===
                              numeroPagina
                                ? "primary"
                                : "light"
                            }

                            onClick={() =>
                              setPagina(
                                numeroPagina
                              )
                            }
                          >
                            {
                              numeroPagina
                            }
                          </CButton>

                        );
                      }
                    )}


                    {/* SIGUIENTE */}

                    <CButton
                      color="light"

                      size="sm"

                      disabled={
                        totalPaginas ===
                          0
                        ||
                        pagina ===
                          totalPaginas
                      }

                      onClick={() =>
                        setPagina(
                          (
                            paginaActual
                          ) =>
                            Math.min(
                              totalPaginas,
                              paginaActual +
                              1
                            )
                        )
                      }
                    >

                      <MoveRight
                        size={18}
                      />

                    </CButton>

                  </div>


                  {/* VOLVER */}

                  <CButton
                    color="light"

                    size="sm"

                    className="
                      d-flex
                      align-items-center
                      gap-2
                    "

                    type="button"

                    onClick={() =>
                      navigate("/")
                    }
                  >

                    <MoveLeft
                      size={17}
                    />

                    Volver al inicio

                  </CButton>

                </div>

              </div>

            </CCardBody>

          </CCard>

        </div>

      </div>

    </>
  );
}


export default Catalogo;