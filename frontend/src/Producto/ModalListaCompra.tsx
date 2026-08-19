import { useEffect, useState } from "react";

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

import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

import "../ListaDeCompras.css";

/* ================================
   TIPOS
================================ */

const categorias = [
  "Bebidas",
  "Kiosco",
  "Fiambres",
  "Almacen",
  "Regaleria",
  "Verduleria",
] as const;

type Categoria = (typeof categorias)[number];

interface Producto {
  codigo_barra: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: Categoria;
}

interface ProductoCompra extends Producto {
  cantidadComprar: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  productos: Producto[];
}

/* ================================
   COMPONENTE
================================ */

export default function ModalListaCompra({
  visible,
  onClose,
  productos,
}: Props) {
  const [listaCompra, setListaCompra] = useState<ProductoCompra[]>([]);

  const [busqueda, setBusqueda] = useState("");

  const [pestana, setPestana] = useState<"lista" | "todos">("lista");

  /* ================================
     PRODUCTOS STOCK BAJO
  ================================ */

  useEffect(() => {
    if (!visible) return;

    const productosStockBajo: ProductoCompra[] = productos
      .filter((producto) => producto.stock <= 3)
      .map((producto) => ({
        ...producto,
        cantidadComprar: 1,
      }));

    setListaCompra((listaActual) => {
      const nuevaLista = [...listaActual];

      productosStockBajo.forEach((producto) => {
        const yaExiste = nuevaLista.some(
          (item) => item.codigo_barra === producto.codigo_barra
        );

        if (!yaExiste) {
          nuevaLista.push(producto);
        }
      });

      return nuevaLista;
    });
  }, [visible, productos]);

  /* ================================
     BÚSQUEDA
  ================================ */

  const productosBuscados = productos.filter((producto) => {
    if (!busqueda.trim()) return false;

    const texto = busqueda.toLowerCase();

    return (
      producto.nombre.toLowerCase().includes(texto) ||
      producto.codigo_barra.includes(busqueda)
    );
  });

  /* ================================
     TOTAL UNIDADES
  ================================ */

  const cantidadTotal = listaCompra.reduce(
    (acumulador, producto) =>
      acumulador + producto.cantidadComprar,
    0
  );

  /* ================================
     AGREGAR PRODUCTO
  ================================ */

  function agregarProducto(producto: Producto) {
    const yaExiste = listaCompra.some(
      (item) => item.codigo_barra === producto.codigo_barra
    );

    if (yaExiste) return;

    const nuevoProducto: ProductoCompra = {
      ...producto,
      cantidadComprar: 1,
    };

    setListaCompra((listaAnterior) => [
      ...listaAnterior,
      nuevoProducto,
    ]);

    setBusqueda("");
    setPestana("lista");
  }

  /* ================================
     ELIMINAR PRODUCTO
  ================================ */

  function eliminarProducto(codigoBarra: string) {
    setListaCompra((listaAnterior) =>
      listaAnterior.filter(
        (producto) =>
          producto.codigo_barra !== codigoBarra
      )
    );
  }

  /* ================================
     CAMBIAR CANTIDAD
  ================================ */

  function cambiarCantidad(
    codigoBarra: string,
    cantidad: number
  ) {
    if (cantidad < 1) return;

    setListaCompra((listaAnterior) =>
      listaAnterior.map((producto) =>
        producto.codigo_barra === codigoBarra
          ? {
              ...producto,
              cantidadComprar: cantidad,
            }
          : producto
      )
    );
  }

  /* ================================
     VACIAR LISTA
  ================================ */

  function vaciarLista() {
    setListaCompra([]);
  }

  /* ================================
     COLORES POR CATEGORÍA
  ================================ */

  function colorCategoria(categoria: Categoria) {
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

  /* ================================
     ICONOS POR CATEGORÍA
  ================================ */

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

  /* ================================
     DESCARGAR PDF
  ================================ */

  function descargarPDF() {
    if (listaCompra.length === 0) return;

    const doc = new jsPDF();

    const fecha = new Date().toLocaleDateString("es-AR");

    /* Título */

    doc.setFontSize(18);

    doc.text(
      "Lista de Compra",
      14,
      18
    );

    /* Negocio */

    doc.setFontSize(11);
    doc.setTextColor(90);

    doc.text(
      "Mini Mercado Ruta 11",
      14,
      26
    );

    /* Fecha */

    doc.setFontSize(9);

    doc.text(
      `Fecha: ${fecha}`,
      14,
      32
    );

    /* Resumen */

    doc.setFontSize(10);
    doc.setTextColor(30);

    doc.text(
      `Productos: ${listaCompra.length}`,
      14,
      39
    );

    doc.text(
      `Unidades totales a comprar: ${cantidadTotal}`,
      70,
      39
    );

    /* Tabla */

    autoTable(doc, {
      startY: 45,

      head: [
        [
          "Producto",
          "Código",
          "Stock actual",
          "Cantidad a comprar",
          "Categoría",
        ],
      ],

      body: listaCompra.map((producto) => [
        producto.nombre,
        producto.codigo_barra,
        producto.stock.toString(),
        producto.cantidadComprar.toString(),
        producto.categoria,
      ]),

      styles: {
        fontSize: 9,
        cellPadding: 3,
      },

      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
      },

      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },

      columnStyles: {
        0: {
          cellWidth: 42,
        },

        1: {
          cellWidth: 38,
        },

        2: {
          halign: "center",
        },

        3: {
          halign: "center",
        },

        4: {
          halign: "center",
        },
      },
    });

    const nombreFecha = fecha.replace(/\//g, "-");

    doc.save(
      `lista-compra-${nombreFecha}.pdf`
    );
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

      <CModalHeader closeButton>
        <div className="w-100 pe-3">

          <div className="d-flex justify-content-between align-items-start gap-4">

            {/* IZQUIERDA */}

            <div className="d-flex align-items-start gap-3">

              <ShoppingCart
                size={30}
                color="#2563eb"
                style={{
                  marginTop: "3px",
                  flexShrink: 0,
                }}
              />

              <div>

                <CModalTitle
                  style={{
                    fontSize: "1.45rem",
                    fontWeight: 700,
                  }}
                >
                  Lista de Compra
                </CModalTitle>

                <p
                  className="text-muted mb-0 mt-2"
                  style={{
                    fontSize: "0.88rem",
                    lineHeight: 1.5,
                  }}
                >
                  Esta lista se genera automáticamente
                  con productos con stock bajo.
                  <br />

                  También podés agregar otros productos
                  que quieras comprar.
                </p>

              </div>

            </div>

            {/* CONTADOR */}

            <div
              className="contador-lista-compra"
            >

              <div>

                <div
                  className="text-muted"
                  style={{
                    fontSize: "0.78rem",
                  }}
                >
                  Total de productos
                </div>

                <div
                  style={{
                    color: "#2563eb",
                    fontSize: "1.6rem",
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  {listaCompra.length}
                </div>

              </div>

              <div className="contador-lista-icono">

                <ShoppingCart
                  size={21}
                  color="#2563eb"
                />

              </div>

            </div>

          </div>

        </div>
      </CModalHeader>


        {/* =========================================
          BODY
        ========================================= */}
        <CModalBody className="lista-compra-body">

          {/* PESTAÑAS */}
          <div className="lista-compra-tabs">

            <button
              type="button"
              className={`boton-pestana ${
                pestana === "lista" ? "boton-pestana-activa" : ""
              }`}
              onClick={() => setPestana("lista")}
            >
              Productos en la lista ({listaCompra.length})
            </button>

            <button
              type="button"
              className={`boton-pestana ${
                pestana === "todos" ? "boton-pestana-activa" : ""
              }`}
              onClick={() => setPestana("todos")}
            >
              Todos los productos
            </button>

          </div>

          {pestana === "lista" && (
            <div className="lista-compra-panel">

              {/* ÚNICAMENTE ESTA ZONA TIENE SCROLL */}
              <div className="tabla-lista-scroll">

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

                      <CTableHeaderCell className="text-center">
                        Stock Actual
                      </CTableHeaderCell>

                      <CTableHeaderCell className="text-center">
                        Cantidad a Comprar
                      </CTableHeaderCell>

                      <CTableHeaderCell className="text-center">
                        Categoría
                      </CTableHeaderCell>

                      <CTableHeaderCell className="text-center">
                        Acciones
                      </CTableHeaderCell>

                    </CTableRow>
                  </CTableHead>

                  <CTableBody>

                    {listaCompra.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell
                          colSpan={5}
                          className="text-center text-muted py-4"
                        >
                          No hay productos en la lista.
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      listaCompra.map((producto) => {
                        const colores = colorCategoria(producto.categoria);

                        return (
                          <CTableRow key={producto.codigo_barra}>

                            {/* PRODUCTO */}
                            <CTableDataCell>
                              <div className="d-flex align-items-center gap-3">

                                <div
                                  className="d-flex justify-content-center align-items-center"
                                  style={{
                                    width: "42px",
                                    height: "42px",
                                    minWidth: "42px",
                                    borderRadius: "10px",
                                    background: colores.fondo,
                                  }}
                                >
                                  {iconoCategoria(producto.categoria)}
                                </div>

                                <div>
                                  <div style={{ fontWeight: 600 }}>
                                    {producto.nombre}
                                  </div>

                                  <div
                                    className="text-muted"
                                    style={{ fontSize: "0.78rem" }}
                                  >
                                    {producto.codigo_barra}
                                  </div>
                                </div>

                              </div>
                            </CTableDataCell>

                            {/* STOCK */}
                            <CTableDataCell className="text-center">
                              <span
                                className="stock-badge"
                                style={{
                                  background:
                                    producto.stock <= 3
                                      ? "#fff7ed"
                                      : "#ecfdf3",
                                  color:
                                    producto.stock <= 3
                                      ? "#ea580c"
                                      : "#15803d",
                                }}
                              >
                                {producto.stock}
                              </span>
                            </CTableDataCell>

                            {/* CANTIDAD */}
                            <CTableDataCell>
                              <CFormInput
                                type="number"
                                min={1}
                                value={producto.cantidadComprar}
                                onChange={(e) =>
                                  cambiarCantidad(
                                    producto.codigo_barra,
                                    Number(e.target.value)
                                  )
                                }
                                style={{
                                  width: "110px",
                                  margin: "auto",
                                  textAlign: "center",
                                }}
                              />
                            </CTableDataCell>

                            {/* CATEGORÍA */}
                            <CTableDataCell className="text-center">
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "5px 12px",
                                  borderRadius: "999px",
                                  background: colores.fondo,
                                  color: colores.texto,
                                }}
                              >
                                {iconoCategoria(producto.categoria, 16)}
                                {producto.categoria}
                              </span>
                            </CTableDataCell>

                            {/* ELIMINAR */}
                            <CTableDataCell className="text-center">
                              <CButton
                                color="danger"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  eliminarProducto(producto.codigo_barra)
                                }
                              >
                                <Trash2 size={16} />
                              </CButton>
                            </CTableDataCell>

                          </CTableRow>
                        );
                      })
                    )}

                  </CTableBody>
                </CTable>

              </div>

              {/* BUSCADOR: NO SCROLLEA */}
              <div className="buscador-lista-compra">

                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: "7px",
                  }}
                >
                  Agregar otro producto
                </div>

                <CInputGroup>
                  <CInputGroupText>
                    <Search size={16} />
                  </CInputGroupText>

                  <CFormInput
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre o código de barras..."
                  />
                </CInputGroup>

              </div>

              {/* RESUMEN: NO SCROLLEA */}
              <div className="resumen-compra">

                <div className="d-flex gap-5">

                  <div>
                    <strong>
                      {listaCompra.length} productos
                    </strong>

                    <div
                      className="text-muted"
                      style={{ fontSize: "0.8rem" }}
                    >
                      en la lista
                    </div>
                  </div>

                  <div>
                    <strong>
                      {cantidadTotal} unidades
                    </strong>

                    <div
                      className="text-muted"
                      style={{ fontSize: "0.8rem" }}
                    >
                      cantidad total a comprar
                    </div>
                  </div>

                </div>

                <CButton
                  color="primary"
                  variant="outline"
                  onClick={vaciarLista}
                >
                  <Trash2 size={16} className="me-2" />
                  Vaciar lista
                </CButton>

              </div>

            </div>
          )}

        {/* =========================================
            PESTAÑA TODOS LOS PRODUCTOS
        ========================================= */}

        {pestana === "todos" && (
          <div className="lista-compra-panel">

            {/* TABLA CON SCROLL */}
            <div className="tabla-lista-scroll">

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

                    <CTableHeaderCell className="text-center">
                      Stock
                    </CTableHeaderCell>

                    <CTableHeaderCell className="text-center">
                      Categoría
                    </CTableHeaderCell>

                    <CTableHeaderCell className="text-center">
                      Acción
                    </CTableHeaderCell>

                  </CTableRow>
                </CTableHead>

                <CTableBody>

                  {productos.map((producto) => {

                    const colores =
                      colorCategoria(producto.categoria);

                    const estaEnLista =
                      listaCompra.some(
                        (item) =>
                          item.codigo_barra ===
                          producto.codigo_barra
                      );

                    return (
                      <CTableRow
                        key={producto.codigo_barra}
                      >

                        {/* PRODUCTO */}
                        <CTableDataCell>

                          <div className="d-flex align-items-center gap-3">

                            <div
                              className="d-flex justify-content-center align-items-center"
                              style={{
                                width: "42px",
                                height: "42px",
                                minWidth: "42px",
                                borderRadius: "10px",
                                background: colores.fondo,
                              }}
                            >
                              {iconoCategoria(
                                producto.categoria
                              )}
                            </div>

                            <div>

                              <div
                                style={{
                                  fontWeight: 600,
                                }}
                              >
                                {producto.nombre}
                              </div>

                              <div
                                className="text-muted"
                                style={{
                                  fontSize: "0.78rem",
                                }}
                              >
                                {producto.codigo_barra}
                              </div>

                            </div>

                          </div>

                        </CTableDataCell>


                        {/* STOCK */}
                        <CTableDataCell className="text-center">

                          <span
                            className="stock-badge"
                            style={{
                              background:
                                producto.stock <= 3
                                  ? "#fff7ed"
                                  : "#ecfdf3",

                              color:
                                producto.stock <= 3
                                  ? "#ea580c"
                                  : "#15803d",
                            }}
                          >
                            {producto.stock}
                          </span>

                        </CTableDataCell>


                        {/* CATEGORÍA */}
                        <CTableDataCell className="text-center">

                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "5px 12px",
                              borderRadius: "999px",
                              background: colores.fondo,
                              color: colores.texto,
                            }}
                          >

                            {iconoCategoria(
                              producto.categoria,
                              16
                            )}

                            {producto.categoria}

                          </span>

                        </CTableDataCell>


                        {/* AGREGAR */}
                        <CTableDataCell className="text-center">

                          <CButton
                            color="primary"
                            variant={
                              estaEnLista
                                ? "outline"
                                : undefined
                            }
                            size="sm"
                            disabled={estaEnLista}
                            onClick={() =>
                              agregarProducto(producto)
                            }
                            className="d-inline-flex align-items-center gap-1"
                          >

                            <Plus size={15} />

                            {estaEnLista
                              ? "Agregado"
                              : "Agregar"}

                          </CButton>

                        </CTableDataCell>

                      </CTableRow>
                    );
                  })}

                </CTableBody>

              </CTable>

            </div>

          </div>
        )}
        </CModalBody>


      {/* =========================================
          FOOTER FIJO
      ========================================= */}

      <CModalFooter className="footer-lista-compra">

        <CButton
          color="light"
          onClick={onClose}
          style={{
            minWidth: "120px",
          }}
        >
          Cerrar
        </CButton>

        <CButton
          color="primary"
          onClick={descargarPDF}
          disabled={
            listaCompra.length === 0
          }
          style={{
            minWidth: "200px",
          }}
        >

          <Download
            size={17}
            className="me-2"
          />

          Descargar lista

        </CButton>

      </CModalFooter>

    </CModal>
  );
}