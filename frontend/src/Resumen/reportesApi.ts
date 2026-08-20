import type {
  ReporteMensual,
} from "./tipos";

const API_URL =
  "http://localhost:3000/reportes";


export async function obtenerReporteMensual(
  mes: number,
  anio: number
): Promise<ReporteMensual> {

  const respuesta =
    await fetch(
      `${API_URL}/mensual?mes=${mes}&anio=${anio}`
    );

  let datos: any = {};


  const contentType =
    respuesta.headers.get(
      "content-type"
    );


  if (
    contentType?.includes(
      "application/json"
    )
  ) {

    datos =
      await respuesta.json();

  }


  if (!respuesta.ok) {

    throw new Error(
      datos.mensaje ||
      "No se pudo cargar el reporte."
    );

  }


  return datos as ReporteMensual;
}