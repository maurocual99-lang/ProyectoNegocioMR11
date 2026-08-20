import { useState, type ChangeEvent } from "react";

import "./Producto.css";

import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormSelect,
  CFormInput,
  CFormLabel,
  CInputGroup,
  CInputGroupText,
} from "@coreui/react";

import {
  Plus,
  Barcode,
  Package,
  Tag,
  DollarSign,
  Percent,
  Boxes,
  TriangleAlert,
} from "lucide-react";


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


interface ProductoPendiente {
  codigo_barra: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: Categoria;
}


type Props = {
  recargar: () => void | Promise<void>;
};


export default function ProductoCreate({
  recargar,
}: Props) {


  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false);


  const [
    mostrarPregunta,
    setMostrarPregunta,
  ] = useState(false);

  const [
    productoPendiente,
    setProductoPendiente,
  ] =
    useState<ProductoPendiente | null>(
      null
    );


  const [
    codigoBarra,
    setCodigoBarra,
  ] = useState("");


  const [
    nombre,
    setNombre,
  ] = useState("");


  const [
    categoria,
    setCategoria,
  ] =
    useState<Categoria>(
      categorias[0]
    );


  const [
    costo,
    setCosto,
  ] = useState("");


  const [
    ganancia,
    setGanancia,
  ] = useState("63");


  const [
    stock,
    setStock,
  ] = useState("");


  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const precioFinal =
    Number(costo || 0) *
    (
      1 +
      Number(ganancia || 0) / 100
    );

  function limpiarFormulario() {

    setCodigoBarra("");

    setNombre("");

    setCategoria(
      categorias[0]
    );

    setCosto("");

    setGanancia("63");

    setStock("");

    setProductoPendiente(
      null
    );

    setMostrarPregunta(
      false
    );
  }

  function cerrarFormulario() {

    limpiarFormulario();

    setMostrarFormulario(
      false
    );
  }

  function cerrarPregunta() {

    setMostrarPregunta(
      false
    );

    setProductoPendiente(
      null
    );
  }

  async function guardarProducto(
    e: React.FormEvent<HTMLFormElement>
  ) {

    e.preventDefault();


    if (!codigoBarra.trim()) {
      alert(
        "El código de barras es obligatorio."
      );

      return;
    }


    if (!nombre.trim()) {
      alert(
        "El nombre es obligatorio."
      );

      return;
    }


    if (Number(costo) < 0) {
      alert(
        "El costo no puede ser negativo."
      );

      return;
    }


    if (Number(ganancia) < 0) {
      alert(
        "La ganancia no puede ser negativa."
      );

      return;
    }


    if (Number(stock) < 0) {
      alert(
        "El stock no puede ser negativo."
      );

      return;
    }


    const nuevoProducto:
      ProductoPendiente = {

      codigo_barra:
        codigoBarra.trim(),

      nombre:
        nombre.trim(),

      precio:
        Number(
          precioFinal.toFixed(2)
        ),

      stock:
        Number(stock),

      categoria,
    };


    try {

      setGuardando(
        true
      );


      const response =
        await fetch(
          "http://localhost:3000/productos",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                nuevoProducto
              ),
          }
        );


      let datos: any = {};


      const contentType =
        response.headers.get(
          "content-type"
        );


      if (
        contentType?.includes(
          "application/json"
        )
      ) {

        datos =
          await response.json();

      }

      if (
        datos.existe
      ) {

        setProductoPendiente(
          nuevoProducto
        );

        setMostrarPregunta(
          true
        );

        return;
      }

      if (
        !response.ok
      ) {

        alert(
          datos.mensaje ||
          "No se pudo crear el producto."
        );

        return;
      }
      await recargar();

      limpiarFormulario();


    } catch (error) {

      console.error(
        "Error al guardar producto:",
        error
      );


      alert(
        "Error al guardar el producto."
      );


    } finally {

      setGuardando(
        false
      );

    }
  }


  async function agregarStock() {

    if (
      !productoPendiente
    ) {
      return;
    }


    try {

      setGuardando(
        true
      );


      const response =
        await fetch(
          `http://localhost:3000/productos/${productoPendiente.codigo_barra}/stock`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                stock:
                  productoPendiente.stock,
              }),
          }
        );


      if (
        !response.ok
      ) {

        let datos: any = {};


        const contentType =
          response.headers.get(
            "content-type"
          );


        if (
          contentType?.includes(
            "application/json"
          )
        ) {

          datos =
            await response.json();

        }


        alert(
          datos.mensaje ||
          "No se pudo actualizar el stock."
        );

        return;
      }


      await recargar();

      limpiarFormulario();


    } catch (error) {

      console.error(
        "Error al actualizar stock:",
        error
      );


      alert(
        "No se pudo actualizar el stock."
      );


    } finally {

      setGuardando(
        false
      );

    }
  }


  return (
    <>

      <CButton
        color="primary"

        onClick={() =>
          setMostrarFormulario(
            true
          )
        }

        style={{
          width:
            "100%",

          maxWidth:
            "250px",

          display:
            "flex",

          justifyContent:
            "center",

          alignItems:
            "center",

          gap:
            "8px",
        }}
      >

        <Plus
          size={18}
        />


        <span
          style={{
            fontSize:
              "0.95rem",

            fontWeight:
              500,
          }}
        >
          Nuevo Producto
        </span>

      </CButton>


      <CModal
        visible={
          mostrarFormulario
        }

        size="lg"

        alignment="center"

        backdrop="static"

        keyboard={false}

        onClose={
          cerrarFormulario
        }
      >

        <CModalHeader
          closeButton
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
                  "46px",

                height:
                  "46px",

                background:
                  "#eef4ff",

                border:
                  "1px solid #dbeafe",

                borderRadius:
                  "10px",

                flexShrink:
                  0,
              }}
            >

              <Plus
                size={23}
                color="#2563eb"
              />

            </div>


            <div>

              <CModalTitle
                style={{
                  fontWeight:
                    700,
                }}
              >
                Agregar Producto
              </CModalTitle>


              <div
                className="
                  text-muted
                "

                style={{
                  fontSize:
                    "0.85rem",

                  marginTop:
                    "2px",
                }}
              >
                Registrá un nuevo producto
                en el catálogo
              </div>

            </div>

          </div>

        </CModalHeader>

        <CModalBody
          style={{
            padding:
              "24px",
          }}
        >

          <CForm
            onSubmit={
              guardarProducto
            }
          >

            <div
              className="
                row
                g-3
              "
            >

              <div
                className="
                  col-md-6
                "
              >

                <CFormLabel>
                  Código de Barras
                </CFormLabel>


                <CInputGroup>

                  <CInputGroupText>

                    <Barcode
                      size={16}
                    />

                  </CInputGroupText>


                  <CFormInput
                    type="text"

                    value={
                      codigoBarra
                    }

                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setCodigoBarra(
                        e.target.value
                      )
                    }

                    placeholder="Ej: 7791234567890"

                    autoFocus

                    required
                  />

                </CInputGroup>

              </div>

              <div
                className="
                  col-md-6
                "
              >

                <CFormLabel>
                  Nombre
                </CFormLabel>


                <CInputGroup>

                  <CInputGroupText>

                    <Package
                      size={16}
                    />

                  </CInputGroupText>


                  <CFormInput
                    type="text"

                    value={
                      nombre
                    }

                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setNombre(
                        e.target.value
                      )
                    }

                    placeholder="Nombre del producto"

                    required
                  />

                </CInputGroup>

              </div>

              <div
                className="
                  col-md-6
                "
              >

                <CFormLabel>
                  Categoría
                </CFormLabel>


                <CInputGroup>

                  <CInputGroupText>

                    <Tag
                      size={16}
                    />

                  </CInputGroupText>


                  <CFormSelect
                    value={
                      categoria
                    }

                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setCategoria(
                        e.target
                          .value as Categoria
                      )
                    }
                  >

                    {
                      categorias.map(
                        (cat) => (

                          <option
                            key={
                              cat
                            }

                            value={
                              cat
                            }
                          >
                            {cat}
                          </option>

                        )
                      )
                    }

                  </CFormSelect>

                </CInputGroup>

              </div>

              <div
                className="
                  col-md-6
                "
              >

                <CFormLabel>
                  Stock Inicial
                </CFormLabel>


                <CInputGroup>

                  <CInputGroupText>

                    <Boxes
                      size={16}
                    />

                  </CInputGroupText>


                  <CFormInput
                    type="number"

                    min="0"

                    step="1"

                    value={
                      stock
                    }

                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setStock(
                        e.target.value
                      )
                    }

                    placeholder="0"

                    required
                  />

                </CInputGroup>

              </div>


              <div
                className="
                  col-md-6
                "
              >

                <CFormLabel>
                  Costo del Producto ($)
                </CFormLabel>


                <CInputGroup>

                  <CInputGroupText>

                    <DollarSign
                      size={16}
                    />

                  </CInputGroupText>


                  <CFormInput
                    type="number"

                    min="0"

                    step="0.01"

                    value={
                      costo
                    }

                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setCosto(
                        e.target.value
                      )
                    }

                    placeholder="0.00"

                    required
                  />

                </CInputGroup>

              </div>

              <div
                className="
                  col-md-6
                "
              >

                <CFormLabel>
                  Ganancia (%)
                </CFormLabel>


                <CInputGroup>

                  <CInputGroupText>

                    <Percent
                      size={16}
                    />

                  </CInputGroupText>


                  <CFormInput
                    type="number"

                    min="0"

                    step="0.1"

                    value={
                      ganancia
                    }

                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setGanancia(
                        e.target.value
                      )
                    }

                    required
                  />

                </CInputGroup>

              </div>

              <div
                className="
                  col-12
                "
              >

                <div
                  className="
                    d-flex
                    justify-content-between
                    align-items-center
                  "

                  style={{
                    background:
                      "#eef4ff",

                    border:
                      "1px solid #dbeafe",

                    borderRadius:
                      "12px",

                    padding:
                      "14px 18px",
                  }}
                >

                  <div>

                    <div
                      className="
                        text-muted
                      "

                      style={{
                        fontSize:
                          "0.82rem",
                      }}
                    >
                      Precio de Venta
                    </div>


                    <div
                      style={{
                        color:
                          "#2563eb",

                        fontSize:
                          "1.6rem",

                        fontWeight:
                          700,
                      }}
                    >
                      $

                      {
                        precioFinal
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

                    </div>


                    <div
                      className="
                        text-muted
                      "

                      style={{
                        fontSize:
                          "0.78rem",

                        marginTop:
                          "2px",
                      }}
                    >
                      Costo +{" "}
                      {ganancia || 0}%
                      {" "}de ganancia
                    </div>

                  </div>


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
                        "#dbeafe",

                      borderRadius:
                        "50%",
                    }}
                  >

                    <DollarSign
                      size={23}
                      color="#2563eb"
                    />

                  </div>

                </div>

              </div>

            </div>

            <CModalFooter
              style={{
                paddingLeft:
                  0,

                paddingRight:
                  0,

                paddingBottom:
                  0,

                marginTop:
                  "22px",
              }}
            >


              <CButton
                type="button"

                color="light"

                onClick={
                  cerrarFormulario
                }

                disabled={
                  guardando
                }

                style={{
                  minWidth:
                    "110px",
                }}
              >
                Cancelar
              </CButton>


              <CButton
                type="submit"

                color="primary"

                disabled={
                  guardando
                }

                style={{
                  minWidth:
                    "160px",
                }}
              >

                <Plus
                  size={17}
                  className="me-2"
                />


                {
                  guardando
                    ? "Creando..."
                    : "Crear Producto"
                }

              </CButton>

            </CModalFooter>

          </CForm>

        </CModalBody>

      </CModal>

      <CModal

        visible={
          mostrarPregunta
        }

        alignment="center"

        backdrop="static"

        keyboard={false}

        onClose={
          cerrarPregunta
        }
      >

        {/* HEADER */}

        <CModalHeader
          closeButton
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
                  "46px",

                height:
                  "46px",

                background:
                  "#fff7ed",

                border:
                  "1px solid #fed7aa",

                borderRadius:
                  "10px",

                flexShrink:
                  0,
              }}
            >

              <TriangleAlert
                size={23}
                color="#ea580c"
              />

            </div>


            <div>

              <CModalTitle
                style={{
                  fontWeight:
                    700,
                }}
              >
                Producto existente
              </CModalTitle>


              <div
                className="
                  text-muted
                "

                style={{
                  fontSize:
                    "0.85rem",

                  marginTop:
                    "2px",
                }}
              >
                El código de barras
                ya está registrado
              </div>

            </div>

          </div>

        </CModalHeader>


        {/* BODY */}

        <CModalBody
          style={{
            padding:
              "24px",
          }}
        >

          <div
            style={{
              color:
                "#475569",

              fontSize:
                "0.95rem",

              lineHeight:
                1.6,
            }}
          >

            Ya existe un producto
            registrado con el código:


            <div
              style={{
                marginTop:
                  "12px",

                padding:
                  "12px 14px",

                background:
                  "#f8fafc",

                border:
                  "1px solid #e5e7eb",

                borderRadius:
                  "10px",
              }}
            >

              <div
                className="
                  d-flex
                  align-items-center
                  gap-2
                "
              >

                <Barcode
                  size={18}
                  color="#2563eb"
                />


                <strong>
                  {
                    productoPendiente
                      ?.codigo_barra
                  }
                </strong>

              </div>

            </div>


            <div
              style={{
                marginTop:
                  "18px",
              }}
            >

              ¿Deseás agregar{" "}


              <strong
                style={{
                  color:
                    "#2563eb",
                }}
              >

                {
                  productoPendiente
                    ?.stock
                }

                {" "}unidades

              </strong>


              {" "}al stock existente?

            </div>

          </div>

        </CModalBody>


        {/* FOOTER */}

        <CModalFooter>

          {/* SOLO CIERRA LA PREGUNTA */}

          <CButton
            color="light"

            disabled={
              guardando
            }

            onClick={
              cerrarPregunta
            }

            style={{
              minWidth:
                "110px",
            }}
          >
            Cancelar
          </CButton>


          {/* SUMA STOCK Y VUELVE AL FORMULARIO */}

          <CButton
            color="primary"

            disabled={
              guardando
            }

            onClick={
              agregarStock
            }

            style={{
              minWidth:
                "150px",
            }}
          >

            <Plus
              size={17}
              className="me-2"
            />


            {
              guardando
                ? "Agregando..."
                : "Agregar stock"
            }

          </CButton>

        </CModalFooter>

      </CModal>

    </>
  );
}