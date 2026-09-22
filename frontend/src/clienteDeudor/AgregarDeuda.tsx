import {
  useEffect,
  useState,
} from "react";

import type {
  KeyboardEvent,
} from "react";

import {
  Plus,
  Search,
  UserPlus,
} from "lucide-react";

import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CFormLabel,
  CFormSwitch,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from "@coreui/react";

import "./AgregarDeuda.css";

interface Props {
  ventaId: number | null;
}

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  apodo?: string | null;
}

type MensajeModal = {
  tipo:
    | ""
    | "error"
    | "exito";
  texto: string;
};

const API_URL =
  "http://127.0.0.1:3000";

function AgregarDeuda({
  ventaId,
}: Props) {
  const [
    esMoroso,
    setEsMoroso,
  ] =
    useState(
      false
    );

  const [
    busqueda,
    setBusqueda,
  ] =
    useState("");

  const [
    resultadosBusqueda,
    setResultadosBusqueda,
  ] =
    useState<Cliente[]>(
      []
    );

  const [
    clienteSeleccionado,
    setClienteSeleccionado,
  ] =
    useState<Cliente | null>(
      null
    );

  const [
    errorBuscar,
    setErrorBuscar,
  ] =
    useState("");

  const [
    asociando,
    setAsociando,
  ] =
    useState(
      false
    );

  const [
    modalVisible,
    setModalVisible,
  ] =
    useState(
      false
    );

  const [
    nuevoNombre,
    setNuevoNombre,
  ] =
    useState("");

  const [
    nuevoApellido,
    setNuevoApellido,
  ] =
    useState("");

  const [
    nuevoApodo,
    setNuevoApodo,
  ] =
    useState("");

  const [
    mensajeModal,
    setMensajeModal,
  ] =
    useState<MensajeModal>({
      tipo: "",
      texto: "",
    });

  useEffect(
    () => {
      setEsMoroso(
        false
      );

      setBusqueda("");

      setResultadosBusqueda(
        []
      );

      setClienteSeleccionado(
        null
      );

      setErrorBuscar(
        ""
      );
    },
    [
      ventaId,
    ]
  );

  function esRespuestaJSON(
    respuesta: Response
  ) {
    return (
      respuesta.headers
        .get(
          "content-type"
        )
        ?.includes(
          "application/json"
        ) ??
      false
    );
  }

  async function asociarCliente(
    cliente:
      Cliente
  ) {
    if (
      !ventaId
    ) {
      setErrorBuscar(
        "Primero agregá al menos un producto para iniciar la venta."
      );

      return false;
    }

    setAsociando(
      true
    );

    try {
      const respuesta =
        await fetch(
          `${API_URL}/ventas/${ventaId}/cliente`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                cliente_id:
                  cliente.id,
              }),
          }
        );

      const data =
        await respuesta.json();

      if (
        !respuesta.ok
      ) {
        throw new Error(
          data?.mensaje ||
            "No se pudo asociar el cliente a la venta."
        );
      }

      setClienteSeleccionado(
        cliente
      );

      setBusqueda(
        `${cliente.apellido} ${cliente.nombre}`
      );

      setResultadosBusqueda(
        []
      );

      setErrorBuscar(
        ""
      );

      return true;
    } catch (
      error
    ) {
      console.error(
        error
      );

      setErrorBuscar(
        error instanceof Error
          ? error.message
          : "No se pudo asociar el cliente."
      );

      return false;
    } finally {
      setAsociando(
        false
      );
    }
  }

  async function quitarCliente() {
    if (
      !ventaId
    ) {
      setClienteSeleccionado(
        null
      );

      setBusqueda("");

      return;
    }

    try {
      await fetch(
        `${API_URL}/ventas/${ventaId}/cliente`,
        {
          method:
            "DELETE",
        }
      );
    } catch (
      error
    ) {
      console.error(
        error
      );
    }

    setClienteSeleccionado(
      null
    );

    setBusqueda("");

    setResultadosBusqueda(
      []
    );
  }

  async function handleCambioMoroso(
    marcado:
      boolean
  ) {
    setEsMoroso(
      marcado
    );

    setErrorBuscar(
      ""
    );

    if (
      !marcado
    ) {
      await quitarCliente();
    }
  }

  async function handleBuscar() {
    const texto =
      busqueda.trim();

    setErrorBuscar(
      ""
    );

    setResultadosBusqueda(
      []
    );

    if (
      !esMoroso
    ) {
      return;
    }

    if (
      !texto
    ) {
      setErrorBuscar(
        "Escribí un nombre, apellido o apodo."
      );

      return;
    }

    try {
      const respuesta =
        await fetch(
          `${API_URL}/deudores/buscarDeudor?texto=${encodeURIComponent(
            texto
          )}`
        );

      if (
        !esRespuestaJSON(
          respuesta
        )
      ) {
        throw new Error(
          "El servidor devolvió una respuesta inválida."
        );
      }

      const data =
        await respuesta.json();

      if (
        !respuesta.ok
      ) {
        throw new Error(
          data?.mensaje ||
            "No se pudo buscar el cliente."
        );
      }

      const lista:
        Cliente[] =
        Array.isArray(
          data
        )
          ? data
          : data
            ? [data]
            : [];

      if (
        lista.length ===
        0
      ) {
        setErrorBuscar(
          "No se encontraron clientes con esa búsqueda."
        );

        return;
      }

      setResultadosBusqueda(
        lista
      );
    } catch (
      error
    ) {
      console.error(
        error
      );

      setErrorBuscar(
        error instanceof Error
          ? error.message
          : "Error de red al buscar el cliente."
      );
    }
  }

  function handleKeyDownBuscar(
    evento:
      KeyboardEvent<HTMLInputElement>
  ) {
    if (
      evento.key ===
      "Enter"
    ) {
      evento.preventDefault();

      void handleBuscar();
    }
  }

  async function handleSeleccionarCliente(
    cliente:
      Cliente
  ) {
    await asociarCliente(
      cliente
    );
  }

  function limpiarModal() {
    setNuevoNombre("");

    setNuevoApellido("");

    setNuevoApodo("");

    setMensajeModal({
      tipo: "",
      texto: "",
    });
  }

  async function handleCrearCliente() {
    setMensajeModal({
      tipo: "",
      texto: "",
    });

    if (
      !nuevoNombre.trim() ||
      !nuevoApellido.trim()
    ) {
      setMensajeModal({
        tipo:
          "error",

        texto:
          "El nombre y el apellido son obligatorios.",
      });

      return;
    }

    try {
      const respuesta =
        await fetch(
          `${API_URL}/deudores`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                nombre:
                  nuevoNombre.trim(),

                apellido:
                  nuevoApellido.trim(),

                apodo:
                  nuevoApodo.trim(),
              }),
          }
        );

      if (
        !esRespuestaJSON(
          respuesta
        )
      ) {
        throw new Error(
          "El servidor devolvió una respuesta inválida."
        );
      }

      const data =
        await respuesta.json();

      if (
        !respuesta.ok
      ) {
        throw new Error(
          data?.mensaje ||
            "No se pudo crear el cliente."
        );
      }

      const clienteCreado:
        Cliente | undefined =
        data.cliente;

      if (
        clienteCreado &&
        esMoroso
      ) {
        const asociado =
          await asociarCliente(
            clienteCreado
          );

        if (
          !asociado
        ) {
          return;
        }
      }

      setMensajeModal({
        tipo:
          "exito",

        texto:
          "Cliente creado correctamente.",
      });

      window.setTimeout(
        () => {
          setModalVisible(
            false
          );

          limpiarModal();
        },
        700
      );
    } catch (
      error
    ) {
      console.error(
        error
      );

      setMensajeModal({
        tipo:
          "error",

        texto:
          error instanceof Error
            ? error.message
            : "Error de red al crear el cliente.",
      });
    }
  }

  return (
    <>
      <CCard className="agregar-deuda-card">
        <CCardHeader className="agregar-deuda-header">
          <span>
            Cliente
          </span>

          {clienteSeleccionado && (
            <span className="agregar-deuda-seleccionado">
              {
                clienteSeleccionado.apellido
              }
              {" "}
              {
                clienteSeleccionado.nombre
              }
            </span>
          )}
        </CCardHeader>

        <CCardBody className="agregar-deuda-body">
          <div className="agregar-deuda-switch">
            <div>
              <strong>
                ¿Paga después?
              </strong>

              <span>
                Marcá esta opción si la venta queda como deuda.
              </span>
            </div>

            <CFormSwitch
              size="lg"
              checked={
                esMoroso
              }
              onChange={(
                evento
              ) =>
                void handleCambioMoroso(
                  evento.target
                    .checked
                )
              }
            />
          </div>

          {esMoroso && (
            <div className="agregar-deuda-busqueda">
              <CFormLabel>
                Buscar cliente
              </CFormLabel>

              <div className="agregar-deuda-busqueda-contenedor">
                <CInputGroup>
                  <CFormInput
                    value={
                      busqueda
                    }
                    onChange={(
                      evento
                    ) => {
                      setBusqueda(
                        evento.target
                          .value
                      );

                      setResultadosBusqueda(
                        []
                      );

                      if (
                        clienteSeleccionado
                      ) {
                        setClienteSeleccionado(
                          null
                        );
                      }
                    }}
                    onKeyDown={
                      handleKeyDownBuscar
                    }
                    placeholder="Nombre, apellido o apodo"
                    disabled={
                      asociando
                    }
                  />

                  <CInputGroupText>
                    <Search
                      size={
                        16
                      }
                    />
                  </CInputGroupText>

                  <CButton
                    type="button"
                    color="primary"
                    variant="outline"
                    disabled={
                      asociando
                    }
                    onClick={() =>
                      void handleBuscar()
                    }
                  >
                    Buscar
                  </CButton>
                </CInputGroup>

                {resultadosBusqueda.length >
                  0 && (
                  <div className="agregar-deuda-resultados">
                    {resultadosBusqueda.map(
                      (
                        cliente
                      ) => (
                        <button
                          type="button"
                          key={
                            cliente.id
                          }
                          onClick={() =>
                            void handleSeleccionarCliente(
                              cliente
                            )
                          }
                        >
                          <strong>
                            {
                              cliente.apellido
                            }
                            ,{" "}
                            {
                              cliente.nombre
                            }
                          </strong>

                          {cliente.apodo && (
                            <span>
                              {
                                cliente.apodo
                              }
                            </span>
                          )}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              {errorBuscar && (
                <div className="agregar-deuda-error">
                  {
                    errorBuscar
                  }
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className="agregar-deuda-nuevo"
            onClick={() => {
              limpiarModal();

              setModalVisible(
                true
              );
            }}
          >
            <UserPlus
              size={
                18
              }
            />

            <span>
              <strong>
                Nuevo cliente
              </strong>

              <small>
                Crealo sin salir de la venta.
              </small>
            </span>

            <Plus
              size={
                17
              }
            />
          </button>
        </CCardBody>
      </CCard>

      <CModal
        visible={
          modalVisible
        }
        alignment="center"
        onClose={() => {
          setModalVisible(
            false
          );

          limpiarModal();
        }}
      >
        <CModalHeader>
          <CModalTitle>
            Agregar nuevo cliente
          </CModalTitle>
        </CModalHeader>

        <CModalBody>
          {mensajeModal.texto && (
            <div
              className={`alert ${
                mensajeModal.tipo ===
                "error"
                  ? "alert-danger"
                  : "alert-success"
              }`}
            >
              {
                mensajeModal.texto
              }
            </div>
          )}

          <div className="mb-3">
            <CFormLabel>
              Nombre *
            </CFormLabel>

            <CFormInput
              value={
                nuevoNombre
              }
              onChange={(
                evento
              ) =>
                setNuevoNombre(
                  evento.target
                    .value
                )
              }
              placeholder="Ej: Juan"
            />
          </div>

          <div className="mb-3">
            <CFormLabel>
              Apellido *
            </CFormLabel>

            <CFormInput
              value={
                nuevoApellido
              }
              onChange={(
                evento
              ) =>
                setNuevoApellido(
                  evento.target
                    .value
                )
              }
              placeholder="Ej: Pérez"
            />
          </div>

          <div>
            <CFormLabel>
              Apodo
            </CFormLabel>

            <CFormInput
              value={
                nuevoApodo
              }
              onChange={(
                evento
              ) =>
                setNuevoApodo(
                  evento.target
                    .value
                )
              }
              placeholder="Opcional"
            />
          </div>
        </CModalBody>

        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setModalVisible(
                false
              );

              limpiarModal();
            }}
          >
            Cancelar
          </CButton>

          <CButton
            color="primary"
            onClick={() =>
              void handleCrearCliente()
            }
          >
            Guardar cliente
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
}

export default AgregarDeuda;
