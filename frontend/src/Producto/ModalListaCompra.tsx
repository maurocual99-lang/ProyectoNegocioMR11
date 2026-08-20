import { useEffect, useState ,ChangeEvent } from "react";
import Capitalizar from "../Capitalizar";
import ModalExito from "../ModalExito";
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
  ShoppingBag,
  PackageCheck
} from "lucide-react";

import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

import "../ListaDeCompras.css";

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

export default function ModalListaCompra({
  visible,
  onClose,
  productos,
}: Props) {
  const [listaCompra, setListaCompra] = useState<ProductoCompra[]>([]);

  const [busqueda, setBusqueda] = useState("");

  const [pestana, setPestana] = useState<"lista" | "todos">("lista");


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


  const cantidadTotal = listaCompra.reduce(
    (acumulador, producto) =>
      acumulador + producto.cantidadComprar,
    0
  );

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

  function eliminarProducto(codigoBarra: string) {
    setListaCompra((listaAnterior) =>
      listaAnterior.filter(
        (producto) =>
          producto.codigo_barra !== codigoBarra
      )
    );
  }

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

  function vaciarLista() {
    setListaCompra([]);
  }

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


  function descargarPDF(): boolean {
  if (listaCompra.length === 0) {
    return false;
  }

  try {
    const doc = new jsPDF();

    const fecha = new Date().toLocaleDateString("es-AR");

    doc.setFontSize(18);
    doc.text("Lista de Compra", 14, 18);

    doc.setFontSize(11);
    doc.setTextColor(90);
    doc.text("Mini Mercado Ruta 11", 14, 26);

    doc.setFontSize(9);
    doc.text(`Fecha: ${fecha}`, 14, 32);

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

    return true;

  } catch (error) {
    console.error(
      "Error al generar el PDF:",
      error
    );

    return false;
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

      <CModalHeader closeButton>
        <div className="w-100 pe-3">

          <div className="d-flex justify-content-between align-items-start gap-4">

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
                className="contador-lista-compra d-flex justify-content-between align-items-center"
                style={{
                  width: "210px",
                  minHeight: "78px",
                  background: "#eef4ff",
                  border: "1px solid #dbeafe",
                  borderRadius: "10px",
                  padding: "12px 14px",
                }}
              >
                {/* TEXTO */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <span
                    className="text-muted"
                    style={{
                      fontSize: "0.78rem",
                      marginBottom: "3px",
                    }}
                  >
                    Total de productos
                  </span>

                  <span
                    style={{
                      color: "#2563eb",
                      fontSize: "1.6rem",
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {listaCompra.length}
                  </span>
                </div>

                {/* CÍRCULO DEL CARRITO */}
                <div
                  className="d-flex justify-content-center align-items-center"
                  style={{
                    width: "46px",
                    height: "46px",
                    minWidth: "46px",
                    background: "#dbeafe",
                    borderRadius: "50%",
                  }}
                >
                  <ShoppingCart
                    size={21}
                    color="#2563eb"
                  />
                </div>
              </div>

          </div>

        </div>
      </CModalHeader>

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
                                    {Capitalizar(producto.nombre)}
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
                                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
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
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre o código de barras..."
                  />
                </CInputGroup>

              </div>

              {/* RESUMEN: NO SCROLLEA */}
              <div className="resumen-compra">

                <div
                  className="d-flex align-items-center"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  {/* PRODUCTOS */}
                  <div
                    className="d-flex align-items-center gap-3"
                    style={{
                      flex: 1,
                      padding: "14px 18px",
                    }}
                  >
                    <div
                      className="d-flex justify-content-center align-items-center"
                      style={{
                        width: "48px",
                        height: "48px",
                        minWidth: "48px",
                        background: "#f1f5f9",
                        borderRadius: "10px",
                      }}
                    >
                      <ShoppingBag size={21} color="#64748b" />
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: 700,
                        }}
                      >
                        {listaCompra.length} productos
                      </div>

                      <div
                        className="text-muted"
                        style={{
                          fontSize: "0.85rem",
                        }}
                      >
                        en la lista
                      </div>
                    </div>
                  </div>

                  {/* LÍNEA DIVISORIA */}
                  <div
                    style={{
                      width: "1px",
                      height: "55px",
                      background: "#e5e7eb",
                    }}
                  />

                  {/* UNIDADES */}
                  <div
                    className="d-flex align-items-center gap-3"
                    style={{
                      flex: 1,
                      padding: "14px 18px",
                    }}
                  >
                    <div
                      className="d-flex justify-content-center align-items-center"
                      style={{
                        width: "48px",
                        height: "48px",
                        minWidth: "48px",
                        background: "#ecfdf3",
                        borderRadius: "10px",
                      }}
                    >
                      <PackageCheck size={21} color="#16a34a" />
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: 700,
                        }}
                      >
                        {cantidadTotal} unidades
                      </div>

                      <div
                        className="text-muted"
                        style={{
                          fontSize: "0.85rem",
                        }}
                      >
                        cantidad total a comprar
                      </div>
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
                                {Capitalizar(producto.nombre)}
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
        <ModalExito
          onEnviar={descargarPDF}
          onExito={onClose}
          desactivado={listaCompra.length === 0}
          textoBoton={
            <div className="d-flex align-items-center justify-content-center gap-2">
              <Download size={17} />
              <span>Descargar lista</span>
            </div>
          }
          variante="primary"
          className="btn-descargar-lista"
        />
      </CModalFooter>

    </CModal>
  );
}