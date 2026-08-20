import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

import logoNegocio
  from "../../imagenes/ChatGPT Image 20 jul 2026, 11_47_32.png";


export interface ClienteComprobantePDF {
  id: number;
  nombre: string;
  apellido: string;
  apodo?: string;
}


export interface DetalleVentaComprobantePDF {
  id: number;
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: string | number;
  subtotal: string | number;
}


export interface VentaComprobantePDF {
  id: number;
  fecha_venta: string;
  total: string | number;
  detalles?: DetalleVentaComprobantePDF[];
}


export interface ProductoListaCompraPDF {
  codigo_barra: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
  cantidadComprar: number;
}


function formatearDinero(
  valor: string | number
) {
  return Number(valor).toLocaleString(
    "es-AR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}


function formatearFecha(
  fecha: string
) {
  return new Date(fecha).toLocaleDateString(
    "es-AR"
  );
}


function imagenADataURL(
  src: string
): Promise<string> {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const imagen =
        new Image();


      imagen.onload =
        () => {

          const canvas =
            document.createElement(
              "canvas"
            );


          canvas.width =
            imagen.naturalWidth;


          canvas.height =
            imagen.naturalHeight;


          const context =
            canvas.getContext(
              "2d"
            );


          if (!context) {

            reject(
              new Error(
                "No se pudo leer el logo."
              )
            );

            return;
          }


          context.drawImage(
            imagen,
            0,
            0
          );


          resolve(
            canvas.toDataURL(
              "image/png"
            )
          );

        };


      imagen.onerror =
        () => {

          reject(
            new Error(
              "No se pudo cargar el logo."
            )
          );

        };


      imagen.src =
        src;
    }
  );
}

function dibujarIconoUsuario(
    doc: jsPDF,
    x: number,
    y: number
  ) {

    doc.setFillColor(
      219,
      234,
      254
    );


    doc.circle(
      x,
      y,
      7,
      "F"
    );

    doc.setDrawColor(
      37,
      99,
      235
    );


    doc.setLineWidth(
      0.7
    );

    doc.circle(
      x,
      y - 2,
      2,
      "S"
    );

    doc.ellipse(
      x,
      y + 3,
      3.8,
      2.4,
      "S"
    );
  }

export async function generarComprobantePagoPDF(
    cliente: ClienteComprobantePDF,
    ventas: VentaComprobantePDF[]
  ) {

    const doc =
      new jsPDF({
        orientation:
          "portrait",

        unit:
          "mm",

        format:
          "a4",
      });


    const fechaActual =
      new Date();


    const fechaTexto =
      fechaActual
        .toLocaleDateString(
          "es-AR"
        );


    const horaTexto =
      fechaActual
        .toLocaleTimeString(
          "es-AR",
          {
            hour:
              "2-digit",

            minute:
              "2-digit",
          }
        );

    try {

      const logoBase64 =
        await imagenADataURL(
          logoNegocio
        );

      doc.addImage(
        logoBase64,
        "PNG",
        14,
        10,
        22,
        29
      );


    } catch (error) {

      console.error(
        "No se pudo agregar el logo al PDF:",
        error
      );

    }

    doc.setTextColor(
      30,
      41,
      59
    );


    doc.setFont(
      "helvetica",
      "bold"
    );


    doc.setFontSize(
      17
    );


    doc.text(
      "Mini Mercado Ruta 11",
      43,
      18
    );


    doc.setFont(
      "helvetica",
      "normal"
    );


    doc.setFontSize(
      10
    );


    doc.setTextColor(
      100,
      116,
      139
    );


    doc.text(
      "Comprobante de pago",
      43,
      24
    );


    doc.text(
      "Cuenta corriente de cliente",
      43,
      29
    );

    doc.setFillColor(
      236,
      253,
      243
    );


    doc.roundedRect(
      157,
      13,
      38,
      13,
      3,
      3,
      "F"
    );


    doc.setTextColor(
      21,
      128,
      61
    );


    doc.setFont(
      "helvetica",
      "bold"
    );


    doc.setFontSize(
      10
    );


    doc.text(
      "PAGO REGISTRADO",
      176,
      21,
      {
        align:
          "center",
      }
    );

    doc.setDrawColor(
      226,
      232,
      240
    );


    doc.line(
      14,
      43,
      196,
      43
    );

    doc.setFillColor(
      248,
      250,
      252
    );


    doc.roundedRect(
      14,
      49,
      182,
      30,
      3,
      3,
      "F"
    );

    dibujarIconoUsuario(
      doc,
      27,
      64
    );


    doc.setFont(
      "helvetica",
      "normal"
    );


    doc.setTextColor(
      100,
      116,
      139
    );


    doc.setFontSize(
      8.5
    );


    doc.text(
      "CLIENTE",
      39,
      57
    );


    doc.setFont(
      "helvetica",
      "bold"
    );


    doc.setTextColor(
      30,
      41,
      59
    );


    doc.setFontSize(
      12
    );


    doc.text(
      `${cliente.nombre} ${cliente.apellido}`,
      39,
      64
    );


    if (
      cliente.apodo
    ) {

      doc.setFont(
        "helvetica",
        "normal"
      );


      doc.setTextColor(
        100,
        116,
        139
      );


      doc.setFontSize(
        9
      );


      doc.text(
        `Alias: ${cliente.apodo}`,
        39,
        70
      );

    }

    doc.setFont(
      "helvetica",
      "normal"
    );


    doc.setTextColor(
      100,
      116,
      139
    );


    doc.setFontSize(
      8.5
    );


    doc.text(
      "FECHA DEL PAGO",
      130,
      57
    );


    doc.setFont(
      "helvetica",
      "bold"
    );


    doc.setTextColor(
      30,
      41,
      59
    );


    doc.setFontSize(
      10
    );


    doc.text(
      fechaTexto,
      130,
      64
    );


    doc.setFont(
      "helvetica",
      "normal"
    );


    doc.setTextColor(
      100,
      116,
      139
    );


    doc.text(
      horaTexto,
      130,
      70
    );

    doc.setFillColor(
      239,
      246,
      255
    );


    doc.roundedRect(
      14,
      85,
      88,
      23,
      3,
      3,
      "F"
    );


    doc.setTextColor(
      100,
      116,
      139
    );


    doc.setFont(
      "helvetica",
      "normal"
    );


    doc.setFontSize(
      8.5
    );


    doc.text(
      "VENTAS ABONADAS",
      20,
      93
    );


    doc.setTextColor(
      37,
      99,
      235
    );


    doc.setFont(
      "helvetica",
      "bold"
    );


    doc.setFontSize(
      14
    );


    doc.text(
      ventas.length.toString(),
      20,
      102
    );

    doc.setFillColor(
      239,
      246,
      255
    );


    doc.roundedRect(
      108,
      85,
      88,
      23,
      3,
      3,
      "F"
    );


    doc.setTextColor(
      100,
      116,
      139
    );


    doc.setFont(
      "helvetica",
      "normal"
    );


    doc.setFontSize(
      8.5
    );


    doc.text(
      "TOTAL PAGADO",
      114,
      93
    );


    const totalPagado =
      ventas.reduce(
        (
          acumulado,
          venta
        ) =>
          acumulado +
          Number(
            venta.total
          ),
        0
      );


    doc.setTextColor(
      37,
      99,
      235
    );


    doc.setFont(
      "helvetica",
      "bold"
    );


    doc.setFontSize(
      14
    );


    doc.text(
      `$ ${formatearDinero(
        totalPagado
      )}`,
      114,
      102
    );

    let posicionY =
      119;


    ventas.forEach(
      (
        venta,
        indiceVenta
      ) => {

        if (
          posicionY >
          245
        ) {

          doc.addPage();

          posicionY =
            20;
        }

        doc.setFillColor(
          37,
          99,
          235
        );


        doc.roundedRect(
          14,
          posicionY,
          182,
          11,
          2,
          2,
          "F"
        );


        doc.setTextColor(
          255,
          255,
          255
        );


        doc.setFont(
          "helvetica",
          "bold"
        );


        doc.setFontSize(
          9.5
        );


        doc.text(
          `Venta #${venta.id}`,
          19,
          posicionY + 7
        );


        doc.setFont(
          "helvetica",
          "normal"
        );


        doc.text(
          formatearFecha(
            venta.fecha_venta
          ),
          191,
          posicionY + 7,
          {
            align:
              "right",
          }
        );

        const detalle =
          venta.detalles ?? [];


        const filas =
          detalle.length > 0

            ? detalle.map(
                (
                  producto
                ) => [

                  producto
                    .producto_nombre,

                  producto
                    .cantidad
                    .toString(),

                  `$ ${formatearDinero(
                    producto
                      .precio_unitario
                  )}`,

                  `$ ${formatearDinero(
                    producto
                      .subtotal
                  )}`,
                ]
              )

            : [
                [
                  "Sin detalle disponible",
                  "-",
                  "-",
                  "-",
                ],
              ];


        autoTable(
          doc,
          {

            startY:
              posicionY + 13,

            margin: {
              left:
                14,

              right:
                14,
            },

            head: [
              [
                "Producto",
                "Cantidad",
                "Precio unitario",
                "Subtotal",
              ],
            ],

            body:
              filas,

            theme:
              "grid",

            styles: {

              fontSize:
                8.5,

              cellPadding:
                3,

              textColor:
                [
                  51,
                  65,
                  85,
                ],

              lineColor:
                [
                  226,
                  232,
                  240,
                ],

              lineWidth:
                0.2,
            },

            headStyles: {

              fillColor:
                [
                  248,
                  250,
                  252,
                ],

              textColor:
                [
                  71,
                  85,
                  105,
                ],

              fontStyle:
                "bold",
            },

            columnStyles: {

              0: {
                cellWidth:
                  76,
              },

              1: {
                cellWidth:
                  24,

                halign:
                  "center",
              },

              2: {
                cellWidth:
                  38,

                halign:
                  "right",
              },

              3: {
                cellWidth:
                  40,

                halign:
                  "right",
              },
            },
          }
        );

        const finalTabla =
          (
            doc as any
          ).lastAutoTable
            .finalY;

        doc.setFont(
          "helvetica",
          "bold"
        );


        doc.setTextColor(
          30,
          41,
          59
        );


        doc.setFontSize(
          9.5
        );


        doc.text(
          "Total de la venta:",
          145,
          finalTabla + 7,
          {
            align:
              "right",
          }
        );


        doc.setTextColor(
          37,
          99,
          235
        );


        doc.text(
          `$ ${formatearDinero(
            venta.total
          )}`,
          192,
          finalTabla + 7,
          {
            align:
              "right",
          }
        );


        posicionY =
          finalTabla + 16;

        if (
          indiceVenta <
          ventas.length - 1
        ) {

          posicionY +=
            4;

        }

      }
    );


    if (
      posicionY >
      250
    ) {

      doc.addPage();

      posicionY =
        25;
    }


    doc.setFillColor(
      239,
      246,
      255
    );


    doc.roundedRect(
      108,
      posicionY,
      88,
      22,
      3,
      3,
      "F"
    );


    doc.setTextColor(
      71,
      85,
      105
    );


    doc.setFont(
      "helvetica",
      "normal"
    );


    doc.setFontSize(
      9
    );


    doc.text(
      "TOTAL ABONADO",
      114,
      posicionY + 8
    );


    doc.setTextColor(
      37,
      99,
      235
    );


    doc.setFont(
      "helvetica",
      "bold"
    );


    doc.setFontSize(
      15
    );


    doc.text(
      `$ ${formatearDinero(
        totalPagado
      )}`,
      190,
      posicionY + 16,
      {
        align:
          "right",
      }
    );

    const cantidadPaginas =
      doc.getNumberOfPages();


    for (
      let pagina = 1;
      pagina <=
      cantidadPaginas;
      pagina++
    ) {

      doc.setPage(
        pagina
      );


      doc.setDrawColor(
        226,
        232,
        240
      );


      doc.line(
        14,
        282,
        196,
        282
      );


      doc.setFont(
        "helvetica",
        "normal"
      );


      doc.setFontSize(
        7.5
      );


      doc.setTextColor(
        148,
        163,
        184
      );


      doc.text(
        "Mini Mercado Ruta 11 - Comprobante de pago de cuenta corriente",
        14,
        288
      );


      doc.text(
        `Página ${pagina} de ${cantidadPaginas}`,
        196,
        288,
        {
          align:
            "right",
        }
      );

    }


    /* ==================================================
       NOMBRE ARCHIVO
    ================================================== */

    const nombreCliente =
      `${cliente.apellido}-${cliente.nombre}`
        .toLowerCase()
        .normalize(
          "NFD"
        )
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .replace(
          /[^a-z0-9-]/g,
          "-"
        );


    const fechaArchivo =
      fechaActual
        .toISOString()
        .slice(
          0,
          10
        );


    doc.save(
      `comprobante-pago-${nombreCliente}-${fechaArchivo}.pdf`
    );
  }

export function generarListaCompraPDF(
  listaCompra: ProductoListaCompraPDF[]
): boolean {
  const cantidadTotal =
    listaCompra.reduce(
      (acumulador, producto) =>
        acumulador + producto.cantidadComprar,
      0
    );


    if (
      listaCompra.length === 0
    ) {
      return false;
    }

    try {

      const doc =
        new jsPDF();

      const fecha =
        new Date()
          .toLocaleDateString(
            "es-AR"
          );

      doc.setFontSize(18);

      doc.text(
        "Lista de Compra",
        14,
        18
      );

      doc.setFontSize(11);

      doc.setTextColor(90);

      doc.text(
        "Mini Mercado Ruta 11",
        14,
        26
      );

      doc.setFontSize(9);

      doc.text(
        `Fecha: ${fecha}`,
        14,
        32
      );

      doc.setFontSize(10);

      doc.setTextColor(30);

      doc.text(
        `Productos: ${listaCompra.length}`,
        14,
        39
      );

      doc.text(
        `Unidades totales a comprar: ${cantidadTotal}`,
        70,
        39
      );

      autoTable(doc, {

        startY: 45,

        head: [
          [
            "Producto",
            "Código",
            "Stock actual",
            "Cantidad a comprar",
            "Categoría",
          ],
        ],

        body:
          listaCompra.map(
            (producto) => [
              producto.nombre,
              producto.codigo_barra,
              producto.stock.toString(),
              producto
                .cantidadComprar
                .toString(),
              producto.categoria,
            ]
          ),

        styles: {
          fontSize: 9,
          cellPadding: 3,
        },

        headStyles: {
          fillColor:
            [37, 99, 235],
          textColor:
            [255, 255, 255],
        },

        alternateRowStyles: {
          fillColor:
            [248, 250, 252],
        },

        columnStyles: {

          0: {
            cellWidth: 42,
          },

          1: {
            cellWidth: 38,
          },

          2: {
            halign: "center",
          },

          3: {
            halign: "center",
          },

          4: {
            halign: "center",
          },
        },
      });

      const nombreFecha =
        fecha.replace(
          /\//g,
          "-"
        );

      doc.save(
        `lista-compra-${nombreFecha}.pdf`
      );

      return true;

    } catch (error) {

      console.error(
        "Error al generar el PDF:",
        error
      );

      return false;
    }
  
}