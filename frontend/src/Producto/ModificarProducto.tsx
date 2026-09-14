import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";

import {
  Barcode,
  Boxes,
  DollarSign,
  Package,
  Pencil,
  Percent,
  Scale,
  Tag,
} from "lucide-react";

import {
  CAlert,
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from "@coreui/react";


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


interface Producto {
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
}


type Props = {
  producto:
    Producto;

  recargar:
    () =>
      void
      | Promise<void>;
};


function ModificarProducto({
  producto,
  recargar,
}: Props) {

  const [
    visible,
    setVisible,
  ] =
    useState(
      false
    );


  const [
    codigo,
    setCodigo,
  ] =
    useState(
      ""
    );


  const [
    nombre,
    setNombre,
  ] =
    useState(
      ""
    );


  const [
    costo,
    setCosto,
  ] =
    useState(
      0
    );


  const [
    ganancia,
    setGanancia,
  ] =
    useState(
      63
    );


  const [
    stock,
    setStock,
  ] =
    useState(
      0
    );


  const [
    categoria,
    setCategoria,
  ] =
    useState<
      Categoria
    >(
      "Bebidas"
    );


  const [
    tipoVenta,
    setTipoVenta,
  ] =
    useState<
      TipoVenta
    >(
      "UNIDAD"
    );


  const [
    guardando,
    setGuardando,
  ] =
    useState(
      false
    );


  const [
    mensaje,
    setMensaje,
  ] =
    useState<{
      tipo:
        "success"
        | "danger";

      texto:
        string;
    } | null>(
      null
    );


  const precioFinal =
    useMemo(
      () => {

        return Number(
          (
            Number(
              costo ||
              0
            )
            *
            (
              1
              +
              Number(
                ganancia ||
                0
              )
              /
              100
            )
          )
            .toFixed(
              2
            )
        );

      },
      [
        costo,
        ganancia,
      ]
    );


  function cargarDatos() {

    const gananciaInicial =
      63;


    const precioGuardado =
      Number(
        producto.precio ||
        0
      );


    const costoEstimado =
      precioGuardado /
      (
        1
        +
        gananciaInicial /
        100
      );


    setCodigo(
      producto.codigo_barra ??
      ""
    );


    setNombre(
      producto.nombre ??
      ""
    );


    setGanancia(
      gananciaInicial
    );


    setCosto(
      Number(
        costoEstimado
          .toFixed(
            2
          )
      )
    );


    setStock(
      Number(
        producto.stock ||
        0
      )
    );


    setCategoria(
      producto.categoria
    );


    setTipoVenta(
      producto.tipo_venta ===
      "PESO"
        ? "PESO"
        : "UNIDAD"
    );


    setMensaje(
      null
    );

  }


  useEffect(
    () => {

      cargarDatos();

    },
    [
      producto
    ]
  );


  function abrirModal() {

    cargarDatos();

    setVisible(
      true
    );

  }


  function cerrarModal() {

    if (
      guardando
    ) {
      return;
    }


    setVisible(
      false
    );

    setMensaje(
      null
    );

  }


  async function guardarCambios() {

    setMensaje(
      null
    );


    const nombreLimpio =
      nombre.trim();


    const codigoLimpio =
      codigo.trim();


    if (
      !nombreLimpio
    ) {

      setMensaje({
        tipo:
          "danger",

        texto:
          "El nombre es obligatorio.",
      });

      return;

    }


    if (
      tipoVenta ===
      "UNIDAD"
      &&
      !codigoLimpio
    ) {

      setMensaje({
        tipo:
          "danger",

        texto:
          "Los productos por unidad necesitan código de barras.",
      });

      return;

    }


    if (
      costo < 0
      ||
      ganancia < 0
      ||
      stock < 0
    ) {

      setMensaje({
        tipo:
          "danger",

        texto:
          "Costo, ganancia y stock no pueden ser negativos.",
      });

      return;

    }


    try {

      setGuardando(
        true
      );


      const respuesta =
        await fetch(
          `${API_URL}/productos/id/${producto.id}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                codigo_barra:
                  codigoLimpio ||
                  null,

                nombre:
                  nombreLimpio,

                precio:
                  precioFinal,

                stock:
                  Number(
                    stock
                  ),

                categoria,

                tipo_venta:
                  tipoVenta,
              }),
          }
        );


      let data:
        any =
        {};


      const contentType =
        respuesta.headers
          .get(
            "content-type"
          );


      if (
        contentType?.includes(
          "application/json"
        )
      ) {

        data =
          await respuesta.json();

      }


      if (
        !respuesta.ok
      ) {

        throw new Error(
          data?.mensaje ||
          `Error ${respuesta.status} al modificar el producto.`
        );

      }


      await recargar();


      setMensaje({
        tipo:
          "success",

        texto:
          "Producto actualizado correctamente.",
      });


      window.setTimeout(
        () => {

          setVisible(
            false
          );

          setMensaje(
            null
          );

        },
        500
      );

    } catch (
      error
    ) {

      console.error(
        "Error al modificar producto:",
        error
      );


      setMensaje({
        tipo:
          "danger",

        texto:
          error instanceof Error
            ? error.message
            : "No se pudo modificar el producto.",
      });

    } finally {

      setGuardando(
        false
      );

    }

  }


  return (

    <>

      <CButton
        type="button"
        className="
          border-secondary
        "
        style={{
          color:
            "#2563eb",
        }}
        onClick={
          abrirModal
        }
      >

        <span
          className="
            d-flex
            justify-content-center
            align-items-center
            gap-2
          "
        >

          <Pencil
            size={
              16
            }
          />

          Editar

        </span>

      </CButton>


      <CModal
        visible={
          visible
        }
        onClose={
          cerrarModal
        }
        alignment="center"
        size="lg"
        backdrop="static"
      >

        <CModalHeader>

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
              }}
            >

              <Pencil
                size={
                  22
                }
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
                Modificar Producto
              </CModalTitle>

              <div
                className="
                  text-muted
                "
                style={{
                  fontSize:
                    "0.85rem",
                }}
              >
                Actualizá la información del producto.
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

          {
            mensaje &&
            (

              <CAlert
                color={
                  mensaje.tipo
                }
              >
                {
                  mensaje.texto
                }
              </CAlert>

            )
          }


          <CForm
            onSubmit={(
              event
            ) =>
              event.preventDefault()
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
                  col-12
                  col-md-6
                "
              >

                <CFormLabel>
                  Tipo de venta
                </CFormLabel>

                <CInputGroup>

                  <CInputGroupText>

                    <Scale
                      size={
                        16
                      }
                    />

                  </CInputGroupText>

                  <CFormSelect
                    value={
                      tipoVenta
                    }
                    onChange={(
                      event:
                        ChangeEvent<HTMLSelectElement>
                    ) =>
                      setTipoVenta(
                        event.target.value as TipoVenta
                      )
                    }
                  >

                    <option
                      value="UNIDAD"
                    >
                      Por unidad
                    </option>

                    <option
                      value="PESO"
                    >
                      Por peso
                    </option>

                  </CFormSelect>

                </CInputGroup>

              </div>


              <div
                className="
                  col-12
                  col-md-6
                "
              >

                <CFormLabel>
                  Código de Barras
                  {
                    tipoVenta ===
                    "PESO"
                      ? " (opcional)"
                      : ""
                  }
                </CFormLabel>

                <CInputGroup>

                  <CInputGroupText>

                    <Barcode
                      size={
                        16
                      }
                    />

                  </CInputGroupText>

                  <CFormInput
                    type="text"
                    value={
                      codigo
                    }
                    onChange={(
                      event:
                        ChangeEvent<HTMLInputElement>
                    ) =>
                      setCodigo(
                        event.target.value
                      )
                    }
                    placeholder={
                      tipoVenta ===
                      "PESO"
                        ? "Puede quedar vacío"
                        : "Código obligatorio"
                    }
                  />

                </CInputGroup>

              </div>


              <div
                className="
                  col-12
                  col-md-6
                "
              >

                <CFormLabel>
                  Nombre
                </CFormLabel>

                <CInputGroup>

                  <CInputGroupText>

                    <Package
                      size={
                        16
                      }
                    />

                  </CInputGroupText>

                  <CFormInput
                    value={
                      nombre
                    }
                    onChange={(
                      event:
                        ChangeEvent<HTMLInputElement>
                    ) =>
                      setNombre(
                        event.target.value
                      )
                    }
                  />

                </CInputGroup>

              </div>


              <div
                className="
                  col-12
                  col-md-6
                "
              >

                <CFormLabel>
                  Stock
                  {
                    tipoVenta ===
                    "PESO"
                      ? " (kg)"
                      : ""
                  }
                </CFormLabel>

                <CInputGroup>

                  <CInputGroupText>

                    <Boxes
                      size={
                        16
                      }
                    />

                  </CInputGroupText>

                  <CFormInput
                    type="number"
                    min="0"
                    step={
                      tipoVenta ===
                      "PESO"
                        ? "0.001"
                        : "1"
                    }
                    value={
                      stock
                    }
                    onChange={(
                      event:
                        ChangeEvent<HTMLInputElement>
                    ) =>
                      setStock(
                        Number(
                          event.target.value
                        )
                      )
                    }
                  />

                </CInputGroup>

              </div>


              <div
                className="
                  col-12
                  col-md-6
                "
              >

                <CFormLabel>
                  Costo del Producto ($)
                </CFormLabel>

                <CInputGroup>

                  <CInputGroupText>

                    <DollarSign
                      size={
                        16
                      }
                    />

                  </CInputGroupText>

                  <CFormInput
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      costo
                    }
                    onChange={(
                      event:
                        ChangeEvent<HTMLInputElement>
                    ) =>
                      setCosto(
                        Number(
                          event.target.value
                        )
                      )
                    }
                  />

                </CInputGroup>

              </div>


              <div
                className="
                  col-12
                  col-md-6
                "
              >

                <CFormLabel>
                  Ganancia (%)
                </CFormLabel>

                <CInputGroup>

                  <CInputGroupText>

                    <Percent
                      size={
                        16
                      }
                    />

                  </CInputGroupText>

                  <CFormInput
                    type="number"
                    min="0"
                    step="0.1"
                    value={
                      ganancia
                    }
                    onChange={(
                      event:
                        ChangeEvent<HTMLInputElement>
                    ) =>
                      setGanancia(
                        Number(
                          event.target.value
                        )
                      )
                    }
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
                      size={
                        23
                      }
                      color="#2563eb"
                    />

                  </div>

                </div>

              </div>


              <div
                className="
                  col-12
                "
              >

                <CFormLabel>
                  Categoría
                </CFormLabel>

                <CInputGroup>

                  <CInputGroupText>

                    <Tag
                      size={
                        16
                      }
                    />

                  </CInputGroupText>

                  <CFormSelect
                    value={
                      categoria
                    }
                    onChange={(
                      event:
                        ChangeEvent<HTMLSelectElement>
                    ) =>
                      setCategoria(
                        event.target.value as Categoria
                      )
                    }
                  >

                    {
                      categorias.map(
                        (
                          item
                        ) => (

                          <option
                            key={
                              item
                            }
                            value={
                              item
                            }
                          >
                            {
                              item
                            }
                          </option>

                        )
                      )
                    }

                  </CFormSelect>

                </CInputGroup>

              </div>

            </div>

          </CForm>

        </CModalBody>


        <CModalFooter>

          <CButton
            type="button"
            color="light"
            onClick={
              cerrarModal
            }
            disabled={
              guardando
            }
          >
            Cancelar
          </CButton>


          <CButton
            type="button"
            color="primary"
            onClick={() =>
              void guardarCambios()
            }
            disabled={
              guardando
            }
          >

            <span
              className="
                d-flex
                align-items-center
                gap-2
              "
            >

              <Pencil
                size={
                  16
                }
              />

              {
                guardando
                  ? "Guardando..."
                  : "Guardar cambios"
              }

            </span>

          </CButton>

        </CModalFooter>

      </CModal>

    </>

  );

}


export default ModificarProducto;
