import {
  useEffect,
} from "react";

import {
  check,
} from "@tauri-apps/plugin-updater";


export default function Actualizador() {

  useEffect(
    () => {

      let activo =
        true;


      async function buscarActualizacion() {

        try {

          const update =
            await check();


          if (
            !activo ||
            !update
          ) {
            return;
          }


          const instalar =
            window.confirm(
              `Hay una nueva versión de MR11 disponible (${update.version}).\n\n¿Querés instalarla ahora?`
            );


          if (
            !instalar
          ) {

            await update.close();

            return;
          }


          await update.downloadAndInstall();

        } catch (
          error
        ) {

          console.error(
            "No se pudo comprobar si existen actualizaciones:",
            error
          );

        }

      }


      void buscarActualizacion();


      return () => {

        activo =
          false;

      };

    },
    []
  );


  return null;
}