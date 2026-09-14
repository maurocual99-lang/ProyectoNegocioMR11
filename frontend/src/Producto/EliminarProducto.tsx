import {
  useState,
} from "react";

import {
  Trash,
} from "lucide-react";

import {
  CAlert,
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from "@coreui/react";


const API_URL =
  "http://localhost:3000";


type Props = {

  producto: {
    id: number;
    nombre: string;
  };

  recargar:
    () =>
      void
      | Promise<void>;

};


function EliminarProducto({
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
    eliminando,
    setEliminando,
  ] =
    useState(
      false
    );


  const [
    error,
    setError,
  ] =
    useState(
      ""
    );


  async function eliminarProducto() {

    try {

      setEliminando(
        true
      );

      setError(
        ""
      );


      const respuesta =
        await fetch(
          `${API_URL}/productos/id/${producto.id}`,
          {
            method:
              "DELETE",
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
          "No se pudo eliminar el producto."
        );

      }


      await recargar();


      setVisible(
        false
      );

    } catch (
      errorEliminar
    ) {

      console.error(
        "Error en la eliminación:",
        errorEliminar
      );


      setError(
        errorEliminar instanceof Error
          ? errorEliminar.message
          : "No se pudo eliminar el producto."
      );

    } finally {

      setEliminando(
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
            "#dc2626",
        }}
        onClick={() => {

          setError(
            ""
          );

          setVisible(
            true
          );

        }}
      >

        <span
          className="
            d-flex
            justify-content-center
            align-items-center
            gap-2
          "
        >

          <Trash
            size={
              16
            }
          />

          Eliminar

        </span>

      </CButton>


      <CModal
        visible={
          visible
        }
        onClose={() =>
          !eliminando &&
          setVisible(
            false
          )
        }
        alignment="center"
      >

        <CModalHeader>

          <CModalTitle>
            Confirmar eliminación
          </CModalTitle>

        </CModalHeader>


        <CModalBody>

          {
            error &&
            (

              <CAlert
                color="danger"
              >
                {
                  error
                }
              </CAlert>

            )
          }


          ¿Seguro que querés eliminar
          {" "}
          <strong>
            {
              producto.nombre
            }
          </strong>
          ?

        </CModalBody>


        <CModalFooter>

          <CButton
            type="button"
            color="secondary"
            disabled={
              eliminando
            }
            onClick={() =>
              setVisible(
                false
              )
            }
          >
            Cancelar
          </CButton>


          <CButton
            type="button"
            color="danger"
            disabled={
              eliminando
            }
            onClick={() =>
              void eliminarProducto()
            }
          >
            {
              eliminando
                ? "Eliminando..."
                : "Eliminar"
            }
          </CButton>

        </CModalFooter>

      </CModal>

    </>

  );

}


export default EliminarProducto;
