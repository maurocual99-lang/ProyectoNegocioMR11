import { useEffect, useState, type ChangeEvent } from "react";
import ModalExito from "../ModalExito";
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
  Pencil,
  Barcode,
  Package,
  DollarSign,
  Percent,
  Boxes,
  Tag,
} from "lucide-react";

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

type Props = {
  producto: Producto;
  recargar: () => void | Promise<void>;
};

function ModificarProducto({
  producto,
  recargar,
}: Props) {
  const [mostrarConfirmacion, setMostrarConfirmacion] =
    useState(false);

  const [codigoViejo, setCodigoViejo] = useState("");
  const [codigoNuevo, setCodigoNuevo] = useState("");

  const [nombre, setNombre] = useState("");

  // Ahora diferenciamos costo del precio final
  const [costo, setCosto] = useState<number>(0);

  const [ganancia, setGanancia] =
    useState<number>(63);

  const [stock, setStock] =
    useState<number>(0);

  const [categoria, setCategoria] =
    useState<Categoria>("Bebidas");

  const [guardando, setGuardando] =
    useState(false);

  const precioFinal =
    Number(costo || 0) *
    (1 + Number(ganancia || 0) / 100);

  useEffect(() => {
    cargarDatosProducto();
  }, [producto]);

  function cargarDatosProducto() {
    const gananciaInicial = 63;

    const precioGuardado =
      Number(producto.precio);

    const costoEstimado =
      precioGuardado /
      (1 + gananciaInicial / 100);

    setCodigoViejo(producto.codigo_barra);

    setCodigoNuevo(producto.codigo_barra);

    setNombre(producto.nombre);

    setGanancia(gananciaInicial);

    setCosto(
      Number(costoEstimado.toFixed(2))
    );

    setStock(Number(producto.stock));

    setCategoria(producto.categoria);
  }

  function abrirModal() {
    cargarDatosProducto();
    setMostrarConfirmacion(true);
  }

  function cerrarModal() {
    cargarDatosProducto();
    setMostrarConfirmacion(false);
  }

  async function guardarCambios(): Promise<boolean> {
    if (!codigoNuevo.trim()) {
      alert("El código de barras es obligatorio.");
      return false;
    }

    if (!nombre.trim()) {
      alert("El nombre es obligatorio.");
      return false;
    }

    if (costo < 0) {
      alert("El costo no puede ser negativo.");
      return false;
    }

    if (ganancia < 0) {
      alert("La ganancia no puede ser negativa.");
      return false;
    }

    if (stock < 0) {
      alert("El stock no puede ser negativo.");
      return false;
    }

    const productoEditado = {
      codigoViejo: codigoViejo.trim(),
      codigoNuevo: codigoNuevo.trim(),
      nombre: nombre.trim(),

      precio: Number(
        precioFinal.toFixed(2)
      ),

      stock: Number(stock),
      categoria,
    };

    try {
      const res = await fetch(
        "http://localhost:3000/productos",
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(
            productoEditado
          ),
        }
      );

      let data: any = {};

      const contentType =
        res.headers.get("content-type");

      if (
        contentType?.includes(
          "application/json"
        )
      ) {
        data = await res.json();
      }

      console.log(
        "RESPUESTA MODIFICAR:",
        data
      );

      if (!res.ok) {
        alert(
          data.mensaje ||
            `Error ${res.status} al modificar el producto`
        );

        return false;
      }

      await recargar();

      // NO cerramos acá el modal
      // ModalExito lo va a cerrar después.
      return true;

    } catch (error) {
      console.error(
        "Error al modificar producto:",
        error
      );

      alert(
        "No se pudo conectar con el servidor."
      );

      return false;
    }
  }

  return (
    <>
      <CButton
        className="border-secondary"
        style={{
          color: "#2563eb",
        }}
        onClick={abrirModal}
      >
        <div className="d-flex justify-content-center align-items-center gap-2">
          <Pencil size={16} />

          <span>Editar</span>
        </div>
      </CButton>

      <CModal
        visible={mostrarConfirmacion}
        onClose={cerrarModal}
        alignment="center"
        size="lg"
        backdrop="static"
      >

        <CModalHeader>
          <div className="d-flex align-items-center gap-3">

            <div
              className="d-flex justify-content-center align-items-center"
              style={{
                width: "46px",
                height: "46px",

                background: "#eef4ff",

                border:
                  "1px solid #dbeafe",

                borderRadius: "10px",
              }}
            >
              <Pencil
                size={22}
                color="#2563eb"
              />
            </div>

            <div>
              <CModalTitle
                style={{
                  fontWeight: 700,
                }}
              >
                Modificar Producto
              </CModalTitle>

              <div
                className="text-muted"
                style={{
                  fontSize: "0.85rem",
                  marginTop: "2px",
                }}
              >
                Actualizá la información
                del producto
              </div>
            </div>

          </div>
        </CModalHeader>

        <CModalBody
          style={{
            padding: "24px",
          }}
        >
          <CForm
              onSubmit={(e) => e.preventDefault()}
            >
            <div className="row g-3">

              {/* CÓDIGO DE BARRAS */}

              <div className="col-md-6">
                <CFormLabel>
                  Código de Barras
                </CFormLabel>

                <CInputGroup>
                  <CInputGroupText>
                    <Barcode size={16} />
                  </CInputGroupText>

                  <CFormInput
                    type="text"
                    value={codigoNuevo}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setCodigoNuevo(
                        e.target.value
                      )
                    }
                    required
                  />
                </CInputGroup>
              </div>

              {/* NOMBRE */}

              <div className="col-md-6">
                <CFormLabel>
                  Nombre
                </CFormLabel>

                <CInputGroup>
                  <CInputGroupText>
                    <Package size={16} />
                  </CInputGroupText>

                  <CFormInput
                    value={nombre}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setNombre(
                        e.target.value
                      )
                    }
                    required
                  />
                </CInputGroup>
              </div>

              {/* COSTO */}

              <div className="col-md-6">
                <CFormLabel>
                  Costo del Producto ($)
                </CFormLabel>

                <CInputGroup>
                  <CInputGroupText>
                    <DollarSign size={16} />
                  </CInputGroupText>

                  <CFormInput
                    type="number"
                    min="0"
                    step="0.01"
                    value={costo}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setCosto(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    required
                  />
                </CInputGroup>
              </div>

              {/* GANANCIA */}

              <div className="col-md-6">
                <CFormLabel>
                  Ganancia (%)
                </CFormLabel>

                <CInputGroup>
                  <CInputGroupText>
                    <Percent size={16} />
                  </CInputGroupText>

                  <CFormInput
                    type="number"
                    min="0"
                    step="0.1"
                    value={ganancia}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setGanancia(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    required
                  />
                </CInputGroup>
              </div>

              <div className="col-12">

                <div
                  className="d-flex justify-content-between align-items-center"
                  style={{
                    background: "#eef4ff",

                    border:
                      "1px solid #dbeafe",

                    borderRadius: "12px",

                    padding:
                      "14px 18px",
                  }}
                >

                  <div>
                    <div
                      className="text-muted"
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
                      {precioFinal.toLocaleString(
                        "es-AR",
                        {
                          minimumFractionDigits:
                            2,

                          maximumFractionDigits:
                            2,
                        }
                      )}
                    </div>
                  </div>

                  <div
                    className="d-flex justify-content-center align-items-center"
                    style={{
                      width: "48px",

                      height: "48px",

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

              {/* STOCK */}

              <div className="col-md-6">
                <CFormLabel>
                  Stock
                </CFormLabel>

                <CInputGroup>
                  <CInputGroupText>
                    <Boxes size={16} />
                  </CInputGroupText>

                  <CFormInput
                    type="number"
                    min="0"
                    step="1"
                    value={stock}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setStock(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    required
                  />
                </CInputGroup>
              </div>

              {/* CATEGORÍA */}

              <div className="col-md-6">
                <CFormLabel>
                  Categoría
                </CFormLabel>

                <CInputGroup>
                  <CInputGroupText>
                    <Tag size={16} />
                  </CInputGroupText>

                  <CFormSelect
                    value={categoria}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setCategoria(
                        e.target
                          .value as Categoria
                      )
                    }
                    required
                  >
                    {categorias.map(
                      (cat) => (
                        <option
                          key={cat}
                          value={cat}
                        >
                          {cat}
                        </option>
                      )
                    )}
                  </CFormSelect>
                </CInputGroup>
              </div>

            </div>

            <CModalFooter
              style={{
                paddingLeft: 0,
                paddingRight: 0,
                paddingBottom: 0,

                marginTop: "22px",
              }}
            >
              <CButton
                type="button"
                color="light"
                onClick={cerrarModal}
                disabled={guardando}
                style={{
                  minWidth: "110px",
                }}
              >
                Cancelar
              </CButton>

              <ModalExito
                onEnviar={guardarCambios}
                onExito={() => {
                  setMostrarConfirmacion(false);
                }}
                desactivado={false}
                variante="primary"
                className="btn-guardar-producto"
                textoBoton={
                  <div className="d-flex align-items-center justify-content-center gap-2">
                    <Pencil size={16} />
                    <span>Guardar cambios</span>
                  </div>
                }
              />
            </CModalFooter>

          </CForm>
        </CModalBody>
      </CModal>
    </>
  );
}

export default ModificarProducto;