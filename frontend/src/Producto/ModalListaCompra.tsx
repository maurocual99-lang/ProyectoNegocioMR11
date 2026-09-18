import {
  useEffect,
  useState,
  ChangeEvent,
} from "react";

import Capitalizar from "../Capitalizar";
import ModalExito from "../ModalExito";

import {
  generarListaCompraPDF,
} from "../GeneradorPDF";

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
  CFormInput,
  CInputGroup,
  CInputGroupText,
} from "@coreui/react";

import {
  ShoppingCart,
  Search,
  Trash2,
  Download,
  Plus,
  CupSoda,
  Candy,
  Beef,
  Package,
  Gift,
  Carrot,
} from "lucide-react";

import "../ListaDeCompras.css";


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


interface ProductoCompra
  extends Producto {
  cantidadComprar: number;
}


interface Props {
  visible: boolean;
  onClose: () => void;
  productos: Producto[];
}


export default function ModalListaCompra({
  visible,
  onClose,
  productos,
}: Props) {

  const [
    listaCompra,
    setListaCompra,
  ] = useState<ProductoCompra[]>([]);

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    pestana,
    setPestana,
  ] = useState<
    "lista" | "todos"
  >("lista");


  /* =============================================
     CARGA AUTOMÁTICA DE STOCK BAJO
  ============================================= */

  useEffect(() => {

    if (!visible) return;

    const productosStockBajo:
      ProductoCompra[] =
      productos
        .filter(
          (producto) =>
            producto.stock <= 3
        )
        .map((producto) => ({
          ...producto,
          cantidadComprar: 1,
        }));

    setListaCompra(
      productosStockBajo
    );

    setBusqueda("");

    setPestana("lista");

  }, [visible, productos]);


  /* =============================================
     TOTAL DE UNIDADES
  ============================================= */

  const cantidadTotal =
    listaCompra.reduce(
      (
        acumulador,
        producto
      ) =>
        acumulador +
        producto.cantidadComprar,
      0
    );


  /* =============================================
     FILTRADO DEL BUSCADOR
  ============================================= */

  const productosFiltrados =
    productos.filter(
      (producto) => {

        const termino =
          busqueda
            .trim()
            .toLowerCase();

        if (!termino)
          return true;

        return (
          producto.nombre
            .toLowerCase()
            .includes(termino) ||

          producto.codigo_barra
            .toLowerCase()
            .includes(termino)
        );
      }
    );


  /* =============================================
     AGREGAR PRODUCTO
  ============================================= */

  function agregarProducto(
    producto: Producto
  ) {

    const yaExiste =
      listaCompra.some(
        (item) =>
          item.codigo_barra ===
          producto.codigo_barra
      );

    if (yaExiste) return;

    const nuevoProducto:
      ProductoCompra = {
      ...producto,
      cantidadComprar: 1,
    };

    setListaCompra(
      (listaAnterior) => [
        ...listaAnterior,
        nuevoProducto,
      ]
    );

    setBusqueda("");

    setPestana("lista");
  }


  /* =============================================
     ELIMINAR PRODUCTO
  ============================================= */

  function eliminarProducto(
    codigoBarra: string
  ) {

    setListaCompra(
      (listaAnterior) =>
        listaAnterior.filter(
          (producto) =>
            producto.codigo_barra !==
            codigoBarra
        )
    );
  }


  /* =============================================
     CAMBIAR CANTIDAD
  ============================================= */

  function cambiarCantidad(
    codigoBarra: string,
    cantidad: number
  ) {

    if (cantidad < 1) return;

    setListaCompra(
      (listaAnterior) =>
        listaAnterior.map(
          (producto) =>
            producto.codigo_barra ===
            codigoBarra
              ? {
                  ...producto,
                  cantidadComprar:
                    cantidad,
                }
              : producto
        )
    );
  }


  /* =============================================
     VACIAR LISTA
  ============================================= */

  function vaciarLista() {
    setListaCompra([]);
  }


  /* =============================================
     COLORES DE CATEGORÍA
  ============================================= */

  function colorCategoria(
    categoria: Categoria
  ) {

    switch (categoria) {

      case "Bebidas":
        return {
          fondo: "#eef4ff",
          texto: "#2563eb",
        };

      case "Kiosco":
        return {
          fondo: "#ecfdf3",
          texto: "#15803d",
        };

      case "Fiambres":
        return {
          fondo: "#fff1f2",
          texto: "#e11d48",
        };

      case "Almacen":
        return {
          fondo: "#fff7e6",
          texto: "#d97706",
        };

      case "Regaleria":
        return {
          fondo: "#f5f3ff",
          texto: "#7c3aed",
        };

      case "Verduleria":
        return {
          fondo: "#ecfdf3",
          texto: "#15803d",
        };
    }
  }


  /* =============================================
     ICONOS DE CATEGORÍA
  ============================================= */

  function iconoCategoria(
    categoria: Categoria,
    size = 19
  ) {

    switch (categoria) {

      case "Bebidas":
        return (
          <CupSoda
            size={size}
            color="#2563eb"
          />
        );

      case "Kiosco":
        return (
          <Candy
            size={size}
            color="#16a34a"
          />
        );

      case "Fiambres":
        return (
          <Beef
            size={size}
            color="#ef4444"
          />
        );

      case "Almacen":
        return (
          <Package
            size={size}
            color="#d97706"
          />
        );

      case "Regaleria":
        return (
          <Gift
            size={size}
            color="#9333ea"
          />
        );

      case "Verduleria":
        return (
          <Carrot
            size={size}
            color="#16a34a"
          />
        );
    }
  }


  return (

    <CModal
      visible={visible}
      onClose={onClose}
      alignment="center"
      size="xl"
      backdrop="static"
      className="modal-lista-compra"
    >

      {/* =============================================
          HEADER
      ============================================= */}

      <CModalHeader closeButton>

        <div className="lista-compra-header">

          <ShoppingCart
            size={28}
            className="lista-compra-header-icono"
          />

          <div className="lista-compra-header-texto">

            <CModalTitle>
              Lista de Compra
            </CModalTitle>

            <p>
              Los productos con stock bajo
              se agregan automáticamente.
              También podés agregar otros
              productos manualmente.
            </p>

          </div>

        </div>

      </CModalHeader>


      {/* =============================================
          BODY
      ============================================= */}

      <CModalBody
        className="lista-compra-body"
      >

        {/* =============================================
            PESTAÑAS
        ============================================= */}

        <div
          className="lista-compra-tabs"
        >

          <button
            type="button"
            className={`boton-pestana ${
              pestana === "lista"
                ? "boton-pestana-activa"
                : ""
            }`}
            onClick={() =>
              setPestana("lista")
            }
          >

            Lista de compra

            {listaCompra.length > 0 && (
              <span className="contador-pestana">
                {listaCompra.length}
              </span>
            )}

          </button>


          <button
            type="button"
            className={`boton-pestana ${
              pestana === "todos"
                ? "boton-pestana-activa"
                : ""
            }`}
            onClick={() =>
              setPestana("todos")
            }
          >
            Todos los productos
          </button>

        </div>


        {/* =============================================
            PESTAÑA LISTA
        ============================================= */}

        {pestana === "lista" && (

          <div
            className="lista-compra-panel"
          >

            {/* =============================================
                TABLA
            ============================================= */}

            <div
              className={`tabla-lista-scroll ${
                listaCompra.length === 0
                  ? "vacia"
                  : ""
              }`}
            >

              <CTable
                align="middle"
                hover={
                  listaCompra.length > 0
                }
                className="mb-0 tabla-lista-compra"
              >

                <CTableHead>

                  <CTableRow>

                    <CTableHeaderCell>
                      Producto
                    </CTableHeaderCell>

                    <CTableHeaderCell
                      className="text-center"
                    >
                      Stock
                    </CTableHeaderCell>

                    <CTableHeaderCell
                      className="text-center"
                    >
                      Cantidad
                    </CTableHeaderCell>

                    <CTableHeaderCell
                      className="text-center"
                    >
                      Categoría
                    </CTableHeaderCell>

                    <CTableHeaderCell
                      className="text-center"
                    >
                      Acción
                    </CTableHeaderCell>

                  </CTableRow>

                </CTableHead>


                <CTableBody>

                  {listaCompra.length ===
                  0 ? (

                    <CTableRow>

                      <CTableDataCell
                        colSpan={5}
                        className="celda-lista-vacia"
                      >

                        <div className="lista-vacia">

                          <ShoppingCart
                            size={23}
                            className="lista-vacia-icono"
                          />

                          <strong>
                            La lista está vacía
                          </strong>

                          <span>
                            Agregá productos desde
                            "Todos los productos".
                          </span>

                        </div>

                      </CTableDataCell>

                    </CTableRow>

                  ) : (

                    listaCompra.map(
                      (producto) => {

                        const colores =
                          colorCategoria(
                            producto.categoria
                          );

                        return (

                          <CTableRow
                            key={
                              producto.codigo_barra
                            }
                          >

                            {/* PRODUCTO */}

                            <CTableDataCell>

                              <div className="producto-tabla">

                                <div
                                  className="producto-icono"
                                  style={{
                                    background:
                                      colores.fondo,
                                  }}
                                >
                                  {iconoCategoria(
                                    producto.categoria
                                  )}
                                </div>

                                <div className="producto-info">

                                  <strong>
                                    {Capitalizar(
                                      producto.nombre
                                    )}
                                  </strong>

                                  <span>
                                    {
                                      producto.codigo_barra
                                    }
                                  </span>

                                </div>

                              </div>

                            </CTableDataCell>


                            {/* STOCK */}

                            <CTableDataCell
                              className="text-center"
                            >

                              <span
                                className="stock-badge"
                                style={{
                                  background:
                                    producto.stock <=
                                    3
                                      ? "#fff7ed"
                                      : "#ecfdf3",

                                  color:
                                    producto.stock <=
                                    3
                                      ? "#ea580c"
                                      : "#15803d",
                                }}
                              >
                                {
                                  producto.stock
                                }
                              </span>

                            </CTableDataCell>


                            {/* CANTIDAD */}

                            <CTableDataCell>

                              <CFormInput
                                type="number"
                                min={1}
                                value={
                                  producto.cantidadComprar
                                }
                                onChange={(
                                  e: ChangeEvent<HTMLInputElement>
                                ) =>
                                  cambiarCantidad(
                                    producto.codigo_barra,
                                    Number(
                                      e.target.value
                                    )
                                  )
                                }
                                className="cantidad-compra-input"
                              />

                            </CTableDataCell>


                            {/* CATEGORÍA */}

                            <CTableDataCell
                              className="text-center"
                            >

                              <span
                                className="categoria-badge"
                                style={{
                                  background:
                                    colores.fondo,

                                  color:
                                    colores.texto,
                                }}
                              >

                                {iconoCategoria(
                                  producto.categoria,
                                  15
                                )}

                                {
                                  producto.categoria
                                }

                              </span>

                            </CTableDataCell>


                            {/* ELIMINAR */}

                            <CTableDataCell
                              className="text-center"
                            >

                              <CButton
                                color="danger"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  eliminarProducto(
                                    producto.codigo_barra
                                  )
                                }
                              >
                                <Trash2
                                  size={15}
                                />
                              </CButton>

                            </CTableDataCell>

                          </CTableRow>

                        );
                      }
                    )
                  )}

                </CTableBody>

              </CTable>

            </div>


            {/* =============================================
                BUSCADOR
            ============================================= */}

            <div
              className="buscador-lista-compra"
            >

              <span className="buscador-lista-compra-label">
                Agregar producto
              </span>

              <CInputGroup>

                <CInputGroupText>
                  <Search
                    size={16}
                  />
                </CInputGroupText>

                <CFormInput
                  value={busqueda}
                  onChange={(
                    e: ChangeEvent<HTMLInputElement>
                  ) =>
                    setBusqueda(
                      e.target.value
                    )
                  }
                  onFocus={() => {
                    if (
                      productos.length > 0
                    ) {
                      setPestana("todos");
                    }
                  }}
                  placeholder="Buscar por nombre o código de barras..."
                />

              </CInputGroup>

            </div>


            {/* =============================================
                RESUMEN
            ============================================= */}

            <div
              className="resumen-compra"
            >

              <div
                className="resumen-compra-info"
              >

                <span>
                  <strong>
                    {
                      listaCompra.length
                    }
                  </strong>{" "}
                  productos
                </span>

                <span className="resumen-separador">
                  •
                </span>

                <span>
                  <strong>
                    {
                      cantidadTotal
                    }
                  </strong>{" "}
                  unidades
                </span>

              </div>


              <CButton
                color="danger"
                variant="outline"
                size="sm"
                className="btn-vaciar"
                onClick={
                  vaciarLista
                }
                disabled={
                  listaCompra.length ===
                  0
                }
              >

                <Trash2
                  size={15}
                />

                Vaciar lista

              </CButton>

            </div>

          </div>

        )}


        {/* =============================================
            PESTAÑA TODOS LOS PRODUCTOS
        ============================================= */}

        {pestana === "todos" && (

          <div
            className="lista-compra-panel"
          >

            {/* BUSCADOR */}

            <div
              className="buscador-lista-compra buscador-todos"
            >

              <CInputGroup>

                <CInputGroupText>
                  <Search
                    size={16}
                  />
                </CInputGroupText>

                <CFormInput
                  autoFocus
                  value={busqueda}
                  onChange={(
                    e: ChangeEvent<HTMLInputElement>
                  ) =>
                    setBusqueda(
                      e.target.value
                    )
                  }
                  placeholder="Buscar producto..."
                />

              </CInputGroup>

            </div>


            {/* TABLA */}

            <div
              className="tabla-lista-scroll tabla-todos-productos"
            >

              <CTable
                align="middle"
                hover
                className="mb-0 tabla-lista-compra"
              >

                <CTableHead>

                  <CTableRow>

                    <CTableHeaderCell>
                      Producto
                    </CTableHeaderCell>

                    <CTableHeaderCell
                      className="text-center"
                    >
                      Stock
                    </CTableHeaderCell>

                    <CTableHeaderCell
                      className="text-center"
                    >
                      Categoría
                    </CTableHeaderCell>

                    <CTableHeaderCell
                      className="text-center"
                    >
                      Acción
                    </CTableHeaderCell>

                  </CTableRow>

                </CTableHead>


                <CTableBody>

                  {productosFiltrados.length ===
                  0 ? (

                    <CTableRow>

                      <CTableDataCell
                        colSpan={4}
                        className="sin-resultados"
                      >
                        No se encontraron productos.
                      </CTableDataCell>

                    </CTableRow>

                  ) : (

                    productosFiltrados.map(
                      (producto) => {

                        const colores =
                          colorCategoria(
                            producto.categoria
                          );

                        const estaEnLista =
                          listaCompra.some(
                            (item) =>
                              item.codigo_barra ===
                              producto.codigo_barra
                          );

                        return (

                          <CTableRow
                            key={
                              producto.codigo_barra
                            }
                          >

                            {/* PRODUCTO */}

                            <CTableDataCell>

                              <div className="producto-tabla">

                                <div
                                  className="producto-icono"
                                  style={{
                                    background:
                                      colores.fondo,
                                  }}
                                >
                                  {iconoCategoria(
                                    producto.categoria
                                  )}
                                </div>

                                <div className="producto-info">

                                  <strong>
                                    {Capitalizar(
                                      producto.nombre
                                    )}
                                  </strong>

                                  <span>
                                    {
                                      producto.codigo_barra
                                    }
                                  </span>

                                </div>

                              </div>

                            </CTableDataCell>


                            {/* STOCK */}

                            <CTableDataCell
                              className="text-center"
                            >

                              <span
                                className="stock-badge"
                                style={{
                                  background:
                                    producto.stock <=
                                    3
                                      ? "#fff7ed"
                                      : "#ecfdf3",

                                  color:
                                    producto.stock <=
                                    3
                                      ? "#ea580c"
                                      : "#15803d",
                                }}
                              >
                                {
                                  producto.stock
                                }
                              </span>

                            </CTableDataCell>


                            {/* CATEGORÍA */}

                            <CTableDataCell
                              className="text-center"
                            >

                              <span
                                className="categoria-badge"
                                style={{
                                  background:
                                    colores.fondo,

                                  color:
                                    colores.texto,
                                }}
                              >

                                {iconoCategoria(
                                  producto.categoria,
                                  15
                                )}

                                {
                                  producto.categoria
                                }

                              </span>

                            </CTableDataCell>


                            {/* AGREGAR */}

                            <CTableDataCell
                              className="text-center"
                            >

                              <CButton
                                color="primary"
                                variant={
                                  estaEnLista
                                    ? "outline"
                                    : undefined
                                }
                                size="sm"
                                disabled={
                                  estaEnLista
                                }
                                onClick={() =>
                                  agregarProducto(
                                    producto
                                  )
                                }
                                className="boton-agregar-producto"
                              >

                                <Plus
                                  size={15}
                                />

                                {estaEnLista
                                  ? "Agregado"
                                  : "Agregar"}

                              </CButton>

                            </CTableDataCell>

                          </CTableRow>

                        );
                      }
                    )
                  )}

                </CTableBody>

              </CTable>

            </div>

          </div>

        )}

      </CModalBody>


      {/* =============================================
          FOOTER
      ============================================= */}

      <CModalFooter
        className="footer-lista-compra"
      >

        <CButton
          color="light"
          onClick={onClose}
          className="btn-cerrar-lista"
        >
          Cerrar
        </CButton>


        <ModalExito
          onEnviar={() =>
            generarListaCompraPDF(
              listaCompra
            )
          }
          onExito={onClose}
          desactivado={
            listaCompra.length ===
            0
          }
          textoBoton={

            <div className="boton-descargar-contenido">

              <Download
                size={16}
              />

              <span>
                Descargar lista
              </span>

            </div>

          }
          variante="primary"
          className="btn-descargar-lista"
        />

      </CModalFooter>

    </CModal>
  );
}