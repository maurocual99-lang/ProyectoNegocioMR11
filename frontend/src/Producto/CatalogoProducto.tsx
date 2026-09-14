import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Barcode,
  Box,
  MoveLeft,
  MoveRight,
  Search,
} from "lucide-react";

import {
  CButton,
  CCard,
  CCardBody,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from "@coreui/react";

import {
  useNavigate,
} from "react-router-dom";

import EliminarProducto
  from "./EliminarProducto";

import ModificarProducto
  from "./ModificarProducto";

import ProductoCreate
  from "./ProductoCreate";

import ListaCompra
  from "./ListaCompra";

import ModalListaCompra
  from "./ModalListaCompra";


const API_URL =
  "http://localhost:3000";


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


type TipoVenta =
  | "UNIDAD"
  | "PESO";


export interface ProductoCatalogo {
  id: number;

  codigo_barra:
    | string
    | null;

  nombre: string;

  precio: number;

  stock: number;

  categoria:
    Categoria;

  tipo_venta:
    TipoVenta;

  activo?:
    boolean;
}


type CampoOrden =
  | "codigo_barra"
  | "nombre"
  | "precio"
  | "stock"
  | "categoria";


type DireccionOrden =
  | "asc"
  | "desc";


const comparadorTexto =
  new Intl.Collator(
    "es",
    {
      sensitivity:
        "base",

      numeric:
        true,
    }
  );


function textoSeguro(
  valor:
    string
    | null
    | undefined
) {

  return String(
    valor ??
    ""
  ).trim();

}


function capitalizar(
  texto:
    string
) {

  const limpio =
    textoSeguro(
      texto
    );

  if (
    !limpio
  ) {
    return "";
  }


  return limpio
    .charAt(
      0
    )
    .toUpperCase()
    +
    limpio
      .slice(
        1
      )
      .toLowerCase();

}


function compararCodigosNoVacios(
  codigoA:
    string,
  codigoB:
    string
) {

  const a =
    codigoA.trim();

  const b =
    codigoB.trim();


  const aNumerico =
    /^\d+$/.test(
      a
    );

  const bNumerico =
    /^\d+$/.test(
      b
    );


  if (
    aNumerico &&
    bNumerico
  ) {

    const normalizadoA =
      a.replace(
        /^0+/,
        ""
      ) ||
      "0";

    const normalizadoB =
      b.replace(
        /^0+/,
        ""
      ) ||
      "0";


    if (
      normalizadoA.length !==
      normalizadoB.length
    ) {

      return (
        normalizadoA.length -
        normalizadoB.length
      );

    }


    const resultado =
      normalizadoA.localeCompare(
        normalizadoB
      );


    if (
      resultado !==
      0
    ) {
      return resultado;
    }


    return a.localeCompare(
      b
    );

  }


  return comparadorTexto.compare(
    a,
    b
  );

}


function Catalogo() {

  const navigate =
    useNavigate();


  const [
    productos,
    setProductos,
  ] =
    useState<
      ProductoCatalogo[]
    >(
      []
    );


  const [
    cargando,
    setCargando,
  ] =
    useState(
      true
    );


  const [
    error,
    setError,
  ] =
    useState(
      ""
    );


  const [
    busqueda,
    setBusqueda,
  ] =
    useState(
      ""
    );


  const [
    categoriaFiltro,
    setCategoriaFiltro,
  ] =
    useState(
      ""
    );


  const [
    ordenarPor,
    setOrdenarPor,
  ] =
    useState<
      CampoOrden
      | ""
    >(
      ""
    );


  const [
    direccion,
    setDireccion,
  ] =
    useState<
      DireccionOrden
    >(
      "asc"
    );


  const [
    pagina,
    setPagina,
  ] =
    useState(
      1
    );


  const productosPorPagina =
    6;


  const [
    mostrarListaCompra,
    setMostrarListaCompra,
  ] =
    useState(
      false
    );


  async function cargarProductos() {

    try {

      setCargando(
        true
      );

      setError(
        ""
      );


      const respuesta =
        await fetch(
          `${API_URL}/productos`
        );


      const data =
        await respuesta.json();


      if (
        !respuesta.ok
      ) {

        throw new Error(
          data?.mensaje ||
          "No se pudo cargar el catálogo."
        );

      }


      const lista:
        ProductoCatalogo[] =
        Array.isArray(
          data
        )
          ? data
          : [];


      setProductos(
        lista.map(
          (
            producto
          ) => ({
            ...producto,

            id:
              Number(
                producto.id
              ),

            codigo_barra:
              textoSeguro(
                producto.codigo_barra
              ) ||
              null,

            nombre:
              textoSeguro(
                producto.nombre
              ),

            precio:
              Number(
                producto.precio
              ),

            stock:
              Number(
                producto.stock
              ),

            tipo_venta:
              producto.tipo_venta ===
              "PESO"
                ? "PESO"
                : "UNIDAD",
          })
        )
      );

    } catch (
      errorCarga
    ) {

      console.error(
        "Error al cargar productos:",
        errorCarga
      );


      setError(
        errorCarga instanceof Error
          ? errorCarga.message
          : "No se pudo cargar el catálogo."
      );

    } finally {

      setCargando(
        false
      );

    }

  }


  useEffect(
    () => {

      void cargarProductos();

    },
    []
  );


  function ordenar(
    campo:
      CampoOrden
  ) {

    if (
      ordenarPor ===
      campo
    ) {

      setDireccion(
        (
          actual
        ) =>
          actual ===
          "asc"
            ? "desc"
            : "asc"
      );

    } else {

      setOrdenarPor(
        campo
      );

      setDireccion(
        "asc"
      );

    }


    setPagina(
      1
    );

  }


  function iconoOrden(
    campo:
      CampoOrden
  ) {

    if (
      ordenarPor !==
      campo
    ) {

      return (
        <ArrowUpDown
          size={
            15
          }
        />
      );

    }


    return direccion ===
      "asc"
      ? (
        <ArrowUp
          size={
            15
          }
        />
      )
      : (
        <ArrowDown
          size={
            15
          }
        />
      );

  }


  const productosFiltrados =
    useMemo(
      () => {

        const textoBusqueda =
          busqueda
            .trim()
            .toLowerCase();


        return productos.filter(
          (
            producto
          ) => {

            const nombre =
              textoSeguro(
                producto.nombre
              )
                .toLowerCase();


            const codigo =
              textoSeguro(
                producto.codigo_barra
              )
                .toLowerCase();


            const coincideBusqueda =
              !textoBusqueda
              ||
              nombre.includes(
                textoBusqueda
              )
              ||
              codigo.includes(
                textoBusqueda
              );


            const coincideCategoria =
              !categoriaFiltro
              ||
              producto.categoria ===
                categoriaFiltro;


            return (
              coincideBusqueda &&
              coincideCategoria
            );

          }
        );

      },
      [
        productos,
        busqueda,
        categoriaFiltro,
      ]
    );


  const productosOrdenados =
    useMemo(
      () => {

        const copia =
          [
            ...productosFiltrados,
          ];


        if (
          !ordenarPor
        ) {

          return copia;

        }


        copia.sort(
          (
            a,
            b
          ) => {

            /*
             * Para código de barras:
             * los productos sin código SIEMPRE van al final.
             * Así tampoco intentamos hacer trim/includes sobre null.
             */
            if (
              ordenarPor ===
              "codigo_barra"
            ) {

              const codigoA =
                textoSeguro(
                  a.codigo_barra
                );

              const codigoB =
                textoSeguro(
                  b.codigo_barra
                );


              if (
                !codigoA &&
                !codigoB
              ) {

                return comparadorTexto.compare(
                  a.nombre,
                  b.nombre
                );

              }


              if (
                !codigoA
              ) {
                return 1;
              }


              if (
                !codigoB
              ) {
                return -1;
              }


              const resultado =
                compararCodigosNoVacios(
                  codigoA,
                  codigoB
                );


              return direccion ===
                "asc"
                ? resultado
                : -resultado;

            }


            let resultado =
              0;


            switch (
              ordenarPor
            ) {

              case "nombre":

                resultado =
                  comparadorTexto.compare(
                    a.nombre,
                    b.nombre
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
                    a.categoria,
                    b.categoria
                  );


                if (
                  resultado ===
                  0
                ) {

                  resultado =
                    comparadorTexto.compare(
                      a.nombre,
                      b.nombre
                    );

                }

                break;

            }


            return direccion ===
              "asc"
              ? resultado
              : -resultado;

          }
        );


        return copia;

      },
      [
        productosFiltrados,
        ordenarPor,
        direccion,
      ]
    );


  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        productosOrdenados.length /
        productosPorPagina
      )
    );


  useEffect(
    () => {

      if (
        pagina >
        totalPaginas
      ) {

        setPagina(
          totalPaginas
        );

      }

    },
    [
      pagina,
      totalPaginas,
    ]
  );


  const indiceInicial =
    (
      pagina -
      1
    )
    *
    productosPorPagina;


  const productosPagina =
    productosOrdenados.slice(
      indiceInicial,
      indiceInicial +
      productosPorPagina
    );


  const headerStyle = {
    background:
      "#2563eb",

    color:
      "#ffffff",

    textAlign:
      "center" as const,

    verticalAlign:
      "middle" as const,

    whiteSpace:
      "nowrap" as const,

    cursor:
      "pointer",
  };


  function encabezado(
    titulo:
      string,
    campo:
      CampoOrden
  ) {

    return (

      <CTableHeaderCell
        style={
          headerStyle
        }
        onClick={() =>
          ordenar(
            campo
          )
        }
      >

        <span
          className="
            d-inline-flex
            align-items-center
            gap-2
          "
        >

          {
            titulo
          }

          {
            iconoOrden(
              campo
            )
          }

        </span>

      </CTableHeaderCell>

    );

  }


  return (

    <div
      style={{
        width:
          "100%",

        minWidth:
          0,

        padding:
          "12px 18px 24px",
      }}
    >

      <div
        style={{
          width:
            "100%",

          maxWidth:
            "1600px",

          margin:
            "0 auto",
        }}
      >

        <header
          className="
            d-flex
            justify-content-between
            align-items-center
            gap-3
            flex-wrap
            mb-3
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
                width:
                  "48px",

                height:
                  "48px",

                background:
                  "#eef4ff",

                border:
                  "1px solid #dbeafe",

                borderRadius:
                  "10px",
              }}
            >

              <Box
                size={
                  28
                }
                color="#2563eb"
              />

            </div>


            <div>

              <h2
                className="
                  mb-1
                  fw-bold
                "
              >
                Catálogo de Productos
              </h2>

              <p
                className="
                  mb-0
                  text-muted
                "
              >
                Gestioná y mantené tu inventario.
              </p>

            </div>

          </div>


          <ProductoCreate
            recargar={
              cargarProductos
            }
          />

        </header>


        <div
          className="
            mb-3
          "
        >

          <ListaCompra
            productos={
              productos as any
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
            productos as any
          }
        />


        <CCard
          className="
            mb-3
          "
        >

          <CCardBody>

            <CForm>

              <div
                className="
                  row
                  g-3
                  align-items-end
                "
              >

                <div
                  className="
                    col-12
                    col-md-3
                  "
                >

                  <CFormLabel>
                    Categoría
                  </CFormLabel>

                  <CFormSelect
                    value={
                      categoriaFiltro
                    }
                    onChange={(
                      event:
                        ChangeEvent<HTMLSelectElement>
                    ) => {

                      setCategoriaFiltro(
                        event.target.value
                      );

                      setPagina(
                        1
                      );

                    }}
                  >

                    <option
                      value=""
                    >
                      Todas las categorías
                    </option>

                    {
                      categorias.map(
                        (
                          categoria
                        ) => (

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
                      )
                    }

                  </CFormSelect>

                </div>


                <div
                  className="
                    col-12
                    col-md-6
                  "
                >

                  <CFormLabel>
                    Buscar producto
                  </CFormLabel>

                  <CInputGroup>

                    <CInputGroupText>

                      <Search
                        size={
                          16
                        }
                      />

                    </CInputGroupText>

                    <CFormInput
                      value={
                        busqueda
                      }
                      onChange={(
                        event:
                          ChangeEvent<HTMLInputElement>
                      ) => {

                        setBusqueda(
                          event.target.value
                        );

                        setPagina(
                          1
                        );

                      }}
                      placeholder="Buscar por nombre o código..."
                    />

                  </CInputGroup>

                </div>


                <div
                  className="
                    col-12
                    col-md-3
                  "
                >

                  <div
                    style={{
                      padding:
                        "12px 14px",

                      background:
                        "#eef4ff",

                      border:
                        "1px solid #dbeafe",

                      borderRadius:
                        "10px",
                    }}
                  >

                    <small
                      className="
                        text-muted
                        d-block
                      "
                    >
                      Total de productos
                    </small>

                    <strong
                      style={{
                        color:
                          "#2563eb",

                        fontSize:
                          "1.45rem",
                      }}
                    >
                      {
                        productos.length
                      }
                    </strong>

                  </div>

                </div>

              </div>

            </CForm>

          </CCardBody>

        </CCard>


        <CCard>

          <CCardBody>

            {
              error &&
              (
                <div
                  className="
                    alert
                    alert-danger
                  "
                >
                  {
                    error
                  }
                </div>
              )
            }


            <div
              style={{
                width:
                  "100%",

                overflowX:
                  "auto",

                border:
                  "1px solid #d8dbe0",

                borderRadius:
                  "8px",
              }}
            >

              <CTable
                align="middle"
                hover
                striped
                responsive
                className="
                  mb-0
                "
              >

                <CTableHead>

                  <CTableRow>

                    {
                      encabezado(
                        "Código de Barras",
                        "codigo_barra"
                      )
                    }

                    {
                      encabezado(
                        "Nombre",
                        "nombre"
                      )
                    }

                    {
                      encabezado(
                        "Precio",
                        "precio"
                      )
                    }

                    {
                      encabezado(
                        "Stock",
                        "stock"
                      )
                    }

                    {
                      encabezado(
                        "Categoría",
                        "categoria"
                      )
                    }

                    <CTableHeaderCell
                      style={{
                        ...headerStyle,

                        cursor:
                          "default",
                      }}
                    >
                      Acción
                    </CTableHeaderCell>

                  </CTableRow>

                </CTableHead>


                <CTableBody>

                  {
                    cargando
                      ? (

                        <CTableRow>

                          <CTableDataCell
                            colSpan={
                              6
                            }
                            className="
                              text-center
                              text-muted
                            "
                            style={{
                              height:
                                "90px",
                            }}
                          >
                            Cargando productos...
                          </CTableDataCell>

                        </CTableRow>

                      )
                      :
                      productosPagina.length ===
                      0
                        ? (

                          <CTableRow>

                            <CTableDataCell
                              colSpan={
                                6
                              }
                              className="
                                text-center
                                text-muted
                              "
                              style={{
                                height:
                                  "90px",
                              }}
                            >
                              No hay productos para mostrar.
                            </CTableDataCell>

                          </CTableRow>

                        )
                        :
                        productosPagina.map(
                          (
                            producto
                          ) => {

                            const codigo =
                              textoSeguro(
                                producto.codigo_barra
                              );


                            return (

                              <CTableRow
                                key={
                                  producto.id
                                }
                              >

                                <CTableDataCell
                                  className="
                                    text-center
                                  "
                                >

                                  {
                                    codigo
                                      ? (

                                        <div
                                          className="
                                            d-inline-flex
                                            align-items-center
                                            gap-2
                                          "
                                        >

                                          <Barcode
                                            size={
                                              18
                                            }
                                            color="#2563eb"
                                          />

                                          <span>
                                            {
                                              codigo
                                            }
                                          </span>

                                        </div>

                                      )
                                      : (

                                        <span
                                          className="
                                            text-muted
                                          "
                                          style={{
                                            fontStyle:
                                              "italic",
                                          }}
                                        >
                                          Sin código
                                        </span>

                                      )
                                  }

                                </CTableDataCell>


                                <CTableDataCell
                                  className="
                                    text-center
                                  "
                                >
                                  {
                                    capitalizar(
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
                                  {
                                    Number(
                                      producto.precio
                                    )
                                      .toLocaleString(
                                        "es-AR",
                                        {
                                          minimumFractionDigits:
                                            2,

                                          maximumFractionDigits:
                                            2,
                                        }
                                      )
                                  }
                                </CTableDataCell>


                                <CTableDataCell
                                  className="
                                    text-center
                                  "
                                >
                                  {
                                    Number(
                                      producto.stock
                                    )
                                      .toLocaleString(
                                        "es-AR",
                                        {
                                          maximumFractionDigits:
                                            3,
                                        }
                                      )
                                  }

                                  {
                                    producto.tipo_venta ===
                                    "PESO"
                                      ? " kg"
                                      : ""
                                  }
                                </CTableDataCell>


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
                                      gap-2
                                      flex-wrap
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
                                      producto={{
                                        id:
                                          producto.id,

                                        nombre:
                                          producto.nombre,
                                      }}
                                      recargar={
                                        cargarProductos
                                      }
                                    />

                                  </div>

                                </CTableDataCell>

                              </CTableRow>

                            );

                          }
                        )
                  }

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
                mt-3
              "
            >

              <span
                className="
                  text-muted
                "
              >

                {
                  productosOrdenados.length ===
                  0
                    ? "No hay productos"
                    : (
                      `Mostrando ${
                        indiceInicial +
                        1
                      }-${
                        Math.min(
                          indiceInicial +
                          productosPorPagina,
                          productosOrdenados.length
                        )
                      } de ${
                        productosOrdenados.length
                      } productos`
                    )
                }

              </span>


              <div
                className="
                  d-flex
                  align-items-center
                  gap-2
                  flex-wrap
                "
              >

                <CButton
                  color="light"
                  size="sm"
                  disabled={
                    pagina <=
                    1
                  }
                  onClick={() =>
                    setPagina(
                      (
                        actual
                      ) =>
                        Math.max(
                          1,
                          actual -
                          1
                        )
                    )
                  }
                >
                  <MoveLeft
                    size={
                      18
                    }
                  />
                </CButton>


                {
                  Array.from(
                    {
                      length:
                        totalPaginas,
                    },
                    (
                      _,
                      index
                    ) => {

                      const numero =
                        index +
                        1;


                      return (

                        <CButton
                          key={
                            numero
                          }
                          size="sm"
                          color={
                            pagina ===
                            numero
                              ? "primary"
                              : "light"
                          }
                          onClick={() =>
                            setPagina(
                              numero
                            )
                          }
                        >
                          {
                            numero
                          }
                        </CButton>

                      );

                    }
                  )
                }


                <CButton
                  color="light"
                  size="sm"
                  disabled={
                    pagina >=
                    totalPaginas
                  }
                  onClick={() =>
                    setPagina(
                      (
                        actual
                      ) =>
                        Math.min(
                          totalPaginas,
                          actual +
                          1
                        )
                    )
                  }
                >
                  <MoveRight
                    size={
                      18
                    }
                  />
                </CButton>


                <CButton
                  color="light"
                  size="sm"
                  type="button"
                  className="
                    d-flex
                    align-items-center
                    gap-2
                  "
                  onClick={() =>
                    navigate(
                      "/"
                    )
                  }
                >
                  <MoveLeft
                    size={
                      17
                    }
                  />

                  Volver al inicio
                </CButton>

              </div>

            </div>

          </CCardBody>

        </CCard>

      </div>

    </div>

  );

}


export default Catalogo;
