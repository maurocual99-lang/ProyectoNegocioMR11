import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import logoMr11 from "../imagenes/ChatGPT Image 20 jul 2026, 11_47_32.png";

export interface ClienteComprobantePDF {
  id: number;
  nombre: string;
  apellido: string;
  apodo?: string | null;
}

export interface DetalleVentaComprobantePDF {
  id?: number;
  producto_id: number;
  producto_nombre: string;
  tipo_venta?: "UNIDAD" | "PESO";
  cantidad: number | string;
  precio_unitario: number | string;
  subtotal: number | string;
}

export interface VentaComprobantePDF {
  id: number;
  fecha_venta: string;
  total: number | string;
  saldo_antes?: number | string;
  monto_pagado?: number | string;
  es_saldo_inicial?: boolean;
  concepto?: string | null;
  detalles?: DetalleVentaComprobantePDF[];
}

export interface ResumenPagoComprobantePDF {
  deudaAntes: number | string;
  totalPagado: number | string;
  saldoDespues: number | string;
}

export interface DetalleComprobanteVentaPDF {
  producto_id: number;
  nombre: string;
  tipo_venta?: "UNIDAD" | "PESO";
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface ProductoListaCompraPDF {
  codigo_barra?: string | null;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
  cantidadComprar: number;
}

function dinero(valor: number | string) {
  return Number(valor || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fechaArgentina(fecha: string | Date) {
  const valor = fecha instanceof Date ? fecha : new Date(fecha);
  return valor.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function horaArgentina(fecha: Date) {
  return fecha.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function nombreSeguro(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cantidadTexto(
  cantidadOriginal: number | string,
  tipoVenta?: "UNIDAD" | "PESO"
) {
  const cantidad = Number(cantidadOriginal || 0);

  if (tipoVenta !== "PESO") {
    return `${cantidad}`;
  }

  if (cantidad < 1) {
    return `${Math.round(cantidad * 1000)} g`;
  }

  return `${cantidad.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })} kg`;
}

function descargar(doc: jsPDF, nombreArchivo: string) {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.style.display = "none";

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
}

function cargarLogo(): Promise<string | null> {
  return new Promise((resolve) => {
    const imagen = new Image();

    imagen.onload = () => {
      try {
        const lienzo = document.createElement("canvas");
        lienzo.width = imagen.naturalWidth;
        lienzo.height = imagen.naturalHeight;
        const contexto = lienzo.getContext("2d");

        if (!contexto) {
          resolve(null);
          return;
        }

        contexto.drawImage(imagen, 0, 0);
        resolve(lienzo.toDataURL("image/png"));
      } catch (error) {
        console.warn("No se pudo preparar el logo para el PDF:", error);
        resolve(null);
      }
    };

    imagen.onerror = () => resolve(null);
    imagen.src = logoMr11;
  });
}

function tarjetaResumen(
  doc: jsPDF,
  x: number,
  y: number,
  ancho: number,
  etiqueta: string,
  valor: number | string,
  colorFondo: [number, number, number],
  colorTexto: [number, number, number]
) {
  doc.setFillColor(...colorFondo);
  doc.roundedRect(x, y, ancho, 25, 2.5, 2.5, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(etiqueta, x + 5, y + 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...colorTexto);
  doc.text(`$ ${dinero(valor)}`, x + 5, y + 18);
}

function encabezado(
  doc: jsPDF,
  titulo: string,
  subtitulo: string
) {
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Mini Mercado Ruta 11", 14, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(subtitulo, 14, 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(titulo, 196, 14, { align: "right" });

  const ahora = new Date();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    `${fechaArgentina(ahora)} - ${horaArgentina(ahora)}`,
    196,
    21,
    { align: "right" }
  );

  doc.setTextColor(15, 23, 42);
}

function pie(doc: jsPDF, texto: string) {
  const paginas = doc.getNumberOfPages();

  for (let pagina = 1; pagina <= paginas; pagina++) {
    doc.setPage(pagina);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 282, 196, 282);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);

    doc.text(texto, 14, 288);
    doc.text(`Página ${pagina} de ${paginas}`, 196, 288, {
      align: "right",
    });
  }

  doc.setTextColor(15, 23, 42);
}

export async function generarComprobantePagoPDF(
  cliente: ClienteComprobantePDF,
  ventas: VentaComprobantePDF[],
  resumen?: ResumenPagoComprobantePDF
): Promise<void> {
  if (!cliente || ventas.length === 0) {
    throw new Error(
      "No hay información suficiente para generar el comprobante de pago."
    );
  }

  const doc = new jsPDF();
  const logo = await cargarLogo();

  const totalPagado = ventas.reduce(
    (acumulado, venta) =>
      acumulado +
      Number(
        venta.monto_pagado !== undefined
          ? venta.monto_pagado
          : venta.total
      ),
    0
  );

  const deudaAntes = Number(
    resumen?.deudaAntes ??
      ventas.reduce(
        (acumulado, venta) => acumulado + Number(venta.saldo_antes ?? venta.total),
        0
      )
  );
  const saldoDespues = Number(
    resumen?.saldoDespues ?? Math.max(deudaAntes - totalPagado, 0)
  );
  const ahora = new Date();

  doc.setFillColor(14, 165, 166);
  doc.rect(0, 0, 210, 3, "F");

  if (logo) {
    doc.addImage(logo, "PNG", 14, 8, 21, 24);
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("MINIMERCADO RUTA 11", logo ? 42 : 14, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Comprobante de cuenta corriente", logo ? 42 : 14, 23);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("COMPROBANTE DE PAGO", 196, 15, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`${fechaArgentina(ahora)} · ${horaArgentina(ahora)}`, 196, 22, {
    align: "right",
  });

  doc.setDrawColor(203, 213, 225);
  doc.line(14, 36, 196, 36);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("CLIENTE", 14, 44);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${cliente.apellido}, ${cliente.nombre}`, 14, 51);
  if (cliente.apodo) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Apodo: ${cliente.apodo}`, 14, 57);
  }

  tarjetaResumen(doc, 14, 65, 57, "DEUDA ANTES", deudaAntes, [248, 250, 252], [51, 65, 85]);
  tarjetaResumen(doc, 76.5, 65, 57, "PAGÓ HOY", resumen?.totalPagado ?? totalPagado, [240, 253, 244], [21, 128, 61]);
  tarjetaResumen(doc, 139, 65, 57, "FALTA PAGAR", saldoDespues, [255, 247, 237], [194, 65, 12]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Detalle de lo abonado", 14, 102);

  let y = 109;

  for (const venta of ventas) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    const montoPagado = Number(venta.monto_pagado ?? venta.total);
    const saldoAntesVenta = Number(venta.saldo_antes ?? venta.total);
    const saldoDespuesVenta = Math.max(saldoAntesVenta - montoPagado, 0);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, 182, 15, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(
      venta.es_saldo_inicial ? "Deuda anterior" : `Compra #${venta.id}`,
      19,
      y + 9.5
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(fechaArgentina(venta.fecha_venta), 191, y + 9.5, { align: "right" });

    y += 19;

    if (venta.detalles && venta.detalles.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Producto", "Cantidad", "Precio unitario", "Subtotal"]],
        body: venta.detalles.map((detalle) => [
          detalle.producto_nombre,
          cantidadTexto(detalle.cantidad, detalle.tipo_venta),
          `$ ${dinero(detalle.precio_unitario)}`,
          `$ ${dinero(detalle.subtotal)}`,
        ]),
        margin: { left: 14, right: 14, bottom: 22 },
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 3,
          textColor: [51, 65, 85],
          lineColor: [226, 232, 240],
          lineWidth: 0.15,
        },
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [51, 65, 85],
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [252, 252, 253] },
        columnStyles: {
          0: { cellWidth: 82 },
          1: { halign: "center", cellWidth: 28 },
          2: { halign: "right", cellWidth: 36 },
          3: { halign: "right", cellWidth: 36 },
        },
      });
      y = ((doc as any).lastAutoTable?.finalY ?? y + 15) + 4;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const lineas = doc.splitTextToSize(
        venta.concepto || "Saldo anterior al sistema",
        172
      );
      doc.text(lineas, 19, y + 2);
      y += Math.max(12, lineas.length * 5 + 5);
    }

    autoTable(doc, {
      startY: y,
      body: [[
        `Total compra\n$ ${dinero(venta.total)}`,
        `Saldo anterior\n$ ${dinero(saldoAntesVenta)}`,
        `Pagó\n$ ${dinero(montoPagado)}`,
        `Queda\n$ ${dinero(saldoDespuesVenta)}`,
      ]],
      margin: { left: 14, right: 14, bottom: 22 },
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        cellPadding: 3.5,
        fillColor: [248, 250, 252],
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "right" },
        2: { halign: "right", textColor: [21, 128, 61], fontStyle: "bold" },
        3: { halign: "right", textColor: [194, 65, 12], fontStyle: "bold" },
      },
    });

    y = ((doc as any).lastAutoTable?.finalY ?? y + 16) + 9;
  }

  if (y > 255) {
    doc.addPage();
    y = 30;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    saldoDespues > 0
      ? `Después de este pago queda un saldo pendiente de $ ${dinero(saldoDespues)}.`
      : "La cuenta quedó saldada con este pago.",
    14,
    y
  );

  pie(doc, "Mini Mercado Ruta 11 - Comprobante de pago");

  const fechaArchivo = new Date().toISOString().slice(0, 10);

  descargar(
    doc,
    `comprobante-pago-${nombreSeguro(
      `${cliente.apellido}-${cliente.nombre}`
    )}-${fechaArchivo}.pdf`
  );
}

export async function generarComprobanteVentaPDF(
  ventaId: number,
  detalle: DetalleComprobanteVentaPDF[],
  total: number
): Promise<void> {
  if (!ventaId || detalle.length === 0) {
    throw new Error(
      "No hay información suficiente para generar el comprobante de venta."
    );
  }

  const doc = new jsPDF();

  encabezado(doc, `VENTA #${ventaId}`, "Comprobante de venta");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Fecha: ${fechaArgentina(new Date())}`, 14, 44);
  doc.setTextColor(15, 23, 42);

  autoTable(doc, {
    startY: 52,
    head: [["Producto", "Cantidad", "Precio", "Subtotal"]],
    body: detalle.map((item) => [
      item.nombre,
      cantidadTexto(item.cantidad, item.tipo_venta),
      `$ ${dinero(item.precio_unitario)}`,
      `$ ${dinero(item.subtotal)}`,
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
    },
    columnStyles: {
      1: { halign: "center", cellWidth: 32 },
      2: { halign: "right", cellWidth: 38 },
      3: { halign: "right", cellWidth: 38 },
    },
  });

  let y = ((doc as any).lastAutoTable?.finalY ?? 60) + 12;

  if (y > 250) {
    doc.addPage();
    y = 30;
  }

  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, y, 182, 25, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(10);
  doc.text("TOTAL", 20, y + 10);

  doc.setFontSize(17);
  doc.text(`$ ${dinero(total)}`, 190, y + 11, {
    align: "right",
  });

  doc.setTextColor(15, 23, 42);
  pie(doc, "Mini Mercado Ruta 11 - Comprobante de venta");

  descargar(
    doc,
    `venta-${ventaId}-${new Date().toISOString().slice(0, 10)}.pdf`
  );
}

export function generarListaCompraPDF(
  listaCompra: ProductoListaCompraPDF[]
): boolean {
  if (!Array.isArray(listaCompra) || listaCompra.length === 0) {
    return false;
  }

  try {
    const doc = new jsPDF();

    encabezado(doc, "LISTA DE COMPRA", "Productos a reponer");

    autoTable(doc, {
      startY: 46,
      head: [["Código", "Producto", "Categoría", "Stock", "Comprar"]],
      body: listaCompra.map((producto) => [
        producto.codigo_barra || "Sin código",
        producto.nombre,
        producto.categoria,
        String(producto.stock),
        String(producto.cantidadComprar),
      ]),
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
      },
      columnStyles: {
        3: { halign: "center" },
        4: { halign: "center" },
      },
    });

    pie(doc, "Mini Mercado Ruta 11 - Lista de compra");

    descargar(
      doc,
      `lista-compra-${new Date().toISOString().slice(0, 10)}.pdf`
    );

    return true;
  } catch (error) {
    console.error("Error al generar lista de compra PDF:", error);
    return false;
  }
}
