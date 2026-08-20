import {
  CCard,
  CCardBody,
} from "@coreui/react";

import {
  CircleDollarSign,
} from "lucide-react";

interface Props {
  totalCobrado: number;
  totalPendiente: number;
}

function dinero(
  valor: number
) {
  return valor.toLocaleString(
    "es-AR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

export default function GraficoEstadoVentas({
  totalCobrado,
  totalPendiente,
}: Props) {

  const total =
    totalCobrado +
    totalPendiente;

  const porcentajeCobrado =
    total === 0
      ? 0
      : (
          totalCobrado /
          total
        ) * 100;

  const radio = 50;

  const circunferencia =
    2 *
    Math.PI *
    radio;

  const largoCobrado =
    (
      porcentajeCobrado /
      100
    ) *
    circunferencia;

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
            align-items-center
            gap-2
            mb-3
          "
        >

          <CircleDollarSign
            size={20}
            color="#2563eb"
          />

          <div>

            <h5
              className="
                mb-0
                fw-bold
              "
            >
              Estado del importe
            </h5>

            <div
              className="
                text-muted
              "
              style={{
                fontSize:
                  "0.82rem",
              }}
            >
              Cobrado vs. pendiente
              de las ventas del mes
            </div>

          </div>

        </div>


        <div
          className="
            estado-grafico-layout
          "
        >

          <div
            className="
              donut-wrapper
            "
          >

            <svg
              viewBox="0 0 130 130"
              className="
                donut-svg
              "
            >

              <circle
                cx="65"
                cy="65"
                r={radio}
                fill="none"
                stroke="#ffedd5"
                strokeWidth="16"
              />

              <circle
                cx="65"
                cy="65"
                r={radio}
                fill="none"
                stroke="#22c55e"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={
                  `${largoCobrado} ${
                    circunferencia -
                    largoCobrado
                  }`
                }
                transform="
                  rotate(-90 65 65)
                "
              />

            </svg>


            <div
              className="
                donut-centro
              "
            >

              <strong>
                {
                  porcentajeCobrado
                    .toFixed(0)
                }%
              </strong>

              <span>
                cobrado
              </span>

            </div>

          </div>


          <div
            className="
              estado-leyenda
            "
          >

            <div
              className="
                estado-item
              "
            >

              <span
                className="
                  estado-punto
                  estado-punto-cobrado
                "
              />

              <div>

                <small>
                  Cobrado
                </small>

                <strong>
                  ${dinero(
                    totalCobrado
                  )}
                </strong>

              </div>

            </div>


            <div
              className="
                estado-item
              "
            >

              <span
                className="
                  estado-punto
                  estado-punto-pendiente
                "
              />

              <div>

                <small>
                  Pendiente
                </small>

                <strong>
                  ${dinero(
                    totalPendiente
                  )}
                </strong>

              </div>

            </div>

          </div>

        </div>

      </CCardBody>

    </CCard>
  );
}
