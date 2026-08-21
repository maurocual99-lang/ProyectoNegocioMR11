import {
  BarChart3,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";


/* ======================================================
   TIPOS
====================================================== */

type VentaDia = {
  dia: number;
  cantidad_ventas: number;
  total: number;
};


type Props = {
  datos: VentaDia[];
  mes: number;
  anio: number;
};


/* ======================================================
   CONSTANTES
====================================================== */

const nombresMeses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];


/* ======================================================
   FORMATEAR DINERO
====================================================== */

function dinero(
  valor: number
) {

  return new Intl.NumberFormat(
    "es-AR",
    {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }
  ).format(valor);
}


/* ======================================================
   DINERO CORTO PARA EJE Y
====================================================== */

function dineroCorto(
  valor: number
) {

  if (
    valor >= 1_000_000
  ) {

    return `$${(
      valor /
      1_000_000
    ).toFixed(1)}M`;

  }


  if (
    valor >= 1000
  ) {

    return `$${Math.round(
      valor / 1000
    )}k`;

  }


  return `$${Math.round(
    valor
  )}`;
}


/* ======================================================
   COMPONENTE
====================================================== */

export default function GraficoVentasPorDia({
  datos,
  mes,
  anio,
}: Props) {

  /* ====================================================
     CANTIDAD DE DÍAS DEL MES
  ==================================================== */

  const cantidadDias =
    new Date(
      anio,
      mes,
      0
    ).getDate();


  /* ====================================================
     COMPLETAMOS LOS DÍAS QUE NO TIENEN VENTAS

     De esta forma siempre tenemos:
     1, 2, 3 ... 30/31
  ==================================================== */

  const datosCompletos =
    Array.from(
      {
        length:
          cantidadDias,
      },
      (
        _,
        indice
      ) => {

        const dia =
          indice + 1;


        const encontrado =
          datos.find(
            (item) =>
              Number(
                item.dia
              ) === dia
          );


        return {

          dia,

          cantidad_ventas:
            Number(
              encontrado
                ?.cantidad_ventas
              ??
              0
            ),

          total:
            Number(
              encontrado
                ?.total
              ??
              0
            ),

        };

      }
    );


  /* ====================================================
     TOTALES
  ==================================================== */

  const totalMes =
    datosCompletos.reduce(
      (
        acumulado,
        item
      ) =>
        acumulado +
        item.total,
      0
    );


  const cantidadVentas =
    datosCompletos.reduce(
      (
        acumulado,
        item
      ) =>
        acumulado +
        item.cantidad_ventas,
      0
    );


  const diasConVentas =
    datosCompletos.filter(
      (item) =>
        item.total > 0
    );


  /* ====================================================
     MEJOR DÍA
  ==================================================== */

  const mejorDia =
    diasConVentas.length > 0
      ? diasConVentas.reduce(
          (
            mejor,
            actual
          ) =>
            actual.total >
            mejor.total
              ? actual
              : mejor
        )
      : null;


  /* ====================================================
     SIN VENTAS
  ==================================================== */

  const sinVentas =
    totalMes === 0;


  /* ====================================================
     SVG

     Usamos viewBox, por eso se adapta
     automáticamente al ancho disponible.
  ==================================================== */

  const anchoGrafico =
    1000;

  const altoGrafico =
    330;


  const paddingIzquierda =
    72;

  const paddingDerecha =
    24;

  const paddingArriba =
    30;

  const paddingAbajo =
    50;


  const anchoUtil =
    anchoGrafico -
    paddingIzquierda -
    paddingDerecha;


  const altoUtil =
    altoGrafico -
    paddingArriba -
    paddingAbajo;


  /* ====================================================
     ESCALA Y
  ==================================================== */

  const maxTotalReal =
    Math.max(
      ...datosCompletos.map(
        (item) =>
          item.total
      ),
      0
    );


  /*
   * Dejamos un pequeño margen arriba
   * para que el punto más alto no toque
   * el borde.
   */
  const maxTotal =
    maxTotalReal > 0
      ? maxTotalReal * 1.15
      : 1;


  /* ====================================================
     POSICIÓN X
  ==================================================== */

  function obtenerX(
    indice: number
  ) {

    if (
      cantidadDias <= 1
    ) {

      return paddingIzquierda;

    }


    return (
      paddingIzquierda
      +
      (
        indice /
        (
          cantidadDias - 1
        )
      )
      *
      anchoUtil
    );
  }


  /* ====================================================
     POSICIÓN Y
  ==================================================== */

  function obtenerY(
    total: number
  ) {

    return (
      paddingArriba
      +
      altoUtil
      -
      (
        total /
        maxTotal
      )
      *
      altoUtil
    );
  }


  /* ====================================================
     PUNTOS
  ==================================================== */

  const puntos =
    datosCompletos.map(
      (
        item,
        indice
      ) => ({

        ...item,

        x:
          obtenerX(
            indice
          ),

        y:
          obtenerY(
            item.total
          ),

      })
    );


  /* ====================================================
     PATH DE LA LÍNEA
  ==================================================== */

  const lineaPath =
    puntos
      .map(
        (
          punto,
          indice
        ) => {

          const comando =
            indice === 0
              ? "M"
              : "L";


          return `${comando} ${punto.x} ${punto.y}`;

        }
      )
      .join(" ");


  /* ====================================================
     ÁREA DEBAJO DE LA LÍNEA
  ==================================================== */

  const areaPath =
    puntos.length > 0
      ? `
          M ${puntos[0].x}
            ${paddingArriba + altoUtil}

          ${puntos
            .map(
              (
                punto,
                indice
              ) => {

                const comando =
                  indice === 0
                    ? "L"
                    : "L";


                return `
                  ${comando}
                  ${punto.x}
                  ${punto.y}
                `;

              }
            )
            .join(" ")
          }

          L ${
            puntos[
              puntos.length - 1
            ].x
          }
          ${
            paddingArriba +
            altoUtil
          }

          Z
        `
      : "";


  /* ====================================================
     LÍNEAS DEL EJE Y
  ==================================================== */

  const niveles =
    [
      0,
      0.25,
      0.5,
      0.75,
      1,
    ];


  /* ====================================================
     DÍAS QUE MOSTRAMOS EN EL EJE X

     No mostramos los 31 números porque
     vuelve a quedar cargado.

     Mostramos:
     1, 5, 10, 15, 20, 25 y último.
  ==================================================== */

  const diasEtiqueta =
    new Set<number>([
      1,
      5,
      10,
      15,
      20,
      25,
      cantidadDias,
    ]);


  return (

    <div className="ventas-dia-card">


      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="ventas-dia-header">

        <div className="ventas-dia-titulo">

          <div className="ventas-dia-icono">

            <BarChart3
              size={21}
            />

          </div>


          <div>

            <h3>
              Ventas por día
            </h3>

            <p>
              {
                nombresMeses[
                  mes - 1
                ]
              }
              {" "}
              {anio}
            </p>

          </div>

        </div>


        <div className="ventas-dia-total">

          <small>
            Total del mes
          </small>

          <strong>
            {
              dinero(
                totalMes
              )
            }
          </strong>

        </div>

      </div>


      {/* ==================================================
          MINI RESUMEN
      ================================================== */}

      <div className="ventas-dia-resumen">

        <div className="ventas-dia-resumen-item">

          <ShoppingCart
            size={16}
          />

          <div>

            <small>
              Ventas
            </small>

            <strong>
              {cantidadVentas}
            </strong>

          </div>

        </div>


        <div className="ventas-dia-resumen-item">

          <TrendingUp
            size={16}
          />

          <div>

            <small>
              Días con ventas
            </small>

            <strong>
              {diasConVentas.length}
            </strong>

          </div>

        </div>


        <div className="ventas-dia-resumen-item ventas-dia-mejor">

          <BarChart3
            size={16}
          />

          <div>

            <small>
              Mejor día
            </small>

            <strong>

              {mejorDia
                ? `Día ${mejorDia.dia} · ${dinero(
                    mejorDia.total
                  )}`
                : "Sin ventas"
              }

            </strong>

          </div>

        </div>

      </div>


      {/* ==================================================
          GRÁFICO / VACÍO
      ================================================== */}

      {sinVentas ? (

        <div className="ventas-dia-vacio">

          <div className="ventas-dia-vacio-icono">

            <BarChart3
              size={31}
            />

          </div>

          <strong>
            No hubo ventas
            en este período
          </strong>

          <span>
            Cuando se registren ventas,
            aparecerán acá.
          </span>

        </div>

      ) : (

        <div className="ventas-dia-grafico-contenedor">


          <svg
            className="ventas-dia-svg"
            viewBox={`0 0 ${anchoGrafico} ${altoGrafico}`}
            role="img"
            aria-label={
              `Ventas diarias de ${
                nombresMeses[
                  mes - 1
                ]
              } de ${anio}`
            }
          >


            {/* =============================================
                GRADIENTE
            ============================================= */}

            <defs>

              <linearGradient
                id="ventasAreaGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >

                <stop
                  offset="0%"
                  stopColor="#2563eb"
                  stopOpacity="0.24"
                />

                <stop
                  offset="100%"
                  stopColor="#2563eb"
                  stopOpacity="0.015"
                />

              </linearGradient>

            </defs>


            {/* =============================================
                CUADRÍCULA Y
            ============================================= */}

            {niveles.map(
              (nivel) => {

                const y =
                  paddingArriba
                  +
                  altoUtil
                  -
                  nivel
                  *
                  altoUtil;


                const valor =
                  nivel
                  *
                  maxTotal;


                return (

                  <g
                    key={nivel}
                  >

                    <line
                      x1={
                        paddingIzquierda
                      }
                      y1={y}
                      x2={
                        anchoGrafico -
                        paddingDerecha
                      }
                      y2={y}
                      className="
                        ventas-dia-grid-line
                      "
                    />


                    <text
                      x={
                        paddingIzquierda -
                        12
                      }
                      y={y + 4}
                      textAnchor="end"
                      className="
                        ventas-dia-eje-texto
                      "
                    >
                      {
                        dineroCorto(
                          valor
                        )
                      }
                    </text>

                  </g>

                );

              }
            )}


            {/* =============================================
                ÁREA
            ============================================= */}

            <path
              d={areaPath}
              fill="url(#ventasAreaGradient)"
            />


            {/* =============================================
                LÍNEA
            ============================================= */}

            <path
              d={lineaPath}
              fill="none"
              stroke="#2563eb"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />


            {/* =============================================
                EJE X
            ============================================= */}

            {puntos.map(
              (
                punto
              ) => {

                if (
                  !diasEtiqueta.has(
                    punto.dia
                  )
                ) {

                  return null;

                }


                return (

                  <text
                    key={
                      `dia-${punto.dia}`
                    }
                    x={punto.x}
                    y={
                      altoGrafico -
                      16
                    }
                    textAnchor="middle"
                    className="
                      ventas-dia-eje-texto
                    "
                  >
                    {punto.dia}
                  </text>

                );

              }
            )}


            {/* =============================================
                PUNTOS CON VENTAS

                Solo mostramos círculo si ese
                día efectivamente vendió.
            ============================================= */}

            {puntos
              .filter(
                (punto) =>
                  punto.total > 0
              )
              .map(
                (punto) => (

                  <g
                    key={
                      `punto-${punto.dia}`
                    }
                    className="
                      ventas-dia-punto-grupo
                    "
                  >

                    {/* Área grande invisible
                        para facilitar hover */}

                    <circle
                      cx={punto.x}
                      cy={punto.y}
                      r="16"
                      fill="transparent"
                    />


                    <circle
                      cx={punto.x}
                      cy={punto.y}
                      r="6"
                      className="
                        ventas-dia-punto
                      "
                    />


                    {/* TOOLTIP */}

                    <g
                      className="
                        ventas-dia-tooltip
                      "
                    >

                      <rect
                        x={
                          Math.min(
                            Math.max(
                              punto.x - 71,
                              paddingIzquierda
                            ),
                            anchoGrafico - 165
                          )
                        }
                        y={
                          Math.max(
                            4,
                            punto.y - 76
                          )
                        }
                        width="145"
                        height="56"
                        rx="9"
                        className="
                          ventas-dia-tooltip-fondo
                        "
                      />


                      <text
                        x={
                          Math.min(
                            Math.max(
                              punto.x,
                              paddingIzquierda + 71
                            ),
                            anchoGrafico - 93
                          )
                        }
                        y={
                          Math.max(
                            22,
                            punto.y - 55
                          )
                        }
                        textAnchor="middle"
                        className="
                          ventas-dia-tooltip-dia
                        "
                      >
                        Día {punto.dia}
                      </text>


                      <text
                        x={
                          Math.min(
                            Math.max(
                              punto.x,
                              paddingIzquierda + 71
                            ),
                            anchoGrafico - 93
                          )
                        }
                        y={
                          Math.max(
                            41,
                            punto.y - 36
                          )
                        }
                        textAnchor="middle"
                        className="
                          ventas-dia-tooltip-total
                        "
                      >
                        {
                          dinero(
                            punto.total
                          )
                        }
                      </text>


                      <text
                        x={
                          Math.min(
                            Math.max(
                              punto.x,
                              paddingIzquierda + 71
                            ),
                            anchoGrafico - 93
                          )
                        }
                        y={
                          Math.max(
                            56,
                            punto.y - 21
                          )
                        }
                        textAnchor="middle"
                        className="
                          ventas-dia-tooltip-cantidad
                        "
                      >
                        {
                          punto.cantidad_ventas
                        }
                        {" "}
                        {
                          punto.cantidad_ventas === 1
                            ? "venta"
                            : "ventas"
                        }
                      </text>

                    </g>

                  </g>

                )
              )
            }

          </svg>

        </div>

      )}

    </div>
  );
}