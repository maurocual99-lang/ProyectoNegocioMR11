import {
  CCard,
  CCardBody,
} from "@coreui/react";

import {
  BarChart3,
} from "lucide-react";

import type {
  VentaPorDia,
} from "./tipos";

interface Props {
  datos: VentaPorDia[];
  mes: number;
  anio: number;
}

function formatearDineroCorto(
  valor: number
) {
  return new Intl.NumberFormat(
    "es-AR",
    {
      notation: "compact",
      maximumFractionDigits: 1,
    }
  ).format(valor);
}

export default function GraficoVentasPorDia({
  datos,
  mes,
  anio,
}: Props) {

  const cantidadDias =
    new Date(
      anio,
      mes,
      0
    ).getDate();

  const datosCompletos =
    Array.from(
      {
        length:
          cantidadDias,
      },
      (_, indice) => {

        const dia =
          indice + 1;

        const encontrado =
          datos.find(
            (item) =>
              item.dia === dia
          );

        return {
          dia,
          total:
            encontrado?.total ?? 0,
          cantidad_ventas:
            encontrado
              ?.cantidad_ventas ??
            0,
        };
      }
    );

  const maximo =
    Math.max(
      ...datosCompletos.map(
        (item) =>
          item.total
      ),
      1
    );

  return (
    <CCard
      className="
        reporte-grafico-card
        h-100
      "
    >

      <CCardBody>

        <div
          className="
            d-flex
            justify-content-between
            align-items-center
            mb-4
          "
        >

          <div>

            <div
              className="
                d-flex
                align-items-center
                gap-2
              "
            >

              <BarChart3
                size={20}
                color="#2563eb"
              />

              <h5
                className="
                  mb-0
                  fw-bold
                "
              >
                Ventas por día
              </h5>

            </div>

            <div
              className="
                text-muted
                mt-1
              "
              style={{
                fontSize:
                  "0.82rem",
              }}
            >
              Total vendido cada
              día del mes seleccionado
            </div>

          </div>

        </div>


        <div
          className="
            grafico-barras-contenedor
          "
        >

          {
            datosCompletos.map(
              (item) => {

                const porcentaje =
                  item.total === 0
                    ? 0
                    : Math.max(
                        4,
                        (
                          item.total /
                          maximo
                        ) * 100
                      );

                return (
                  <div
                    key={
                      item.dia
                    }
                    className="
                      grafico-columna
                    "
                    title={
                      `Día ${item.dia}: $${item.total.toLocaleString("es-AR")} - ${item.cantidad_ventas} ventas`
                    }
                  >

                    <div
                      className="
                        grafico-valor
                      "
                    >
                      {
                        item.total >
                        0
                          ? formatearDineroCorto(
                              item.total
                            )
                          : ""
                      }
                    </div>

                    <div
                      className="
                        grafico-barra-area
                      "
                    >

                      <div
                        className="
                          grafico-barra
                        "
                        style={{
                          height:
                            `${porcentaje}%`,
                        }}
                      />

                    </div>

                    <div
                      className="
                        grafico-dia
                      "
                    >
                      {
                        item.dia
                      }
                    </div>

                  </div>
                );
              }
            )
          }

        </div>

      </CCardBody>

    </CCard>
  );
}
