import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

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
  detalles?: DetalleVentaComprobantePDF[];
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
  ventas: VentaComprobantePDF[]
): Promise<void> {
  if (!cliente || ventas.length === 0) {
    throw new Error(
      "No hay información suficiente para generar el comprobante de pago."
    );
  }

  const doc = new jsPDF();

  encabezado(
    doc,
    "COMPROBANTE DE PAGO",
    "Cuenta corriente / pago total o parcial"
  );

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

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Cliente", 14, 43);

  doc.setFont("helvetica", "normal");
  doc.text(`${cliente.apellido}, ${cliente.nombre}`, 14, 50);

  if (cliente.apodo) {
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8.5);
    doc.text(`Apodo: ${cliente.apodo}`, 14, 56);
    doc.setTextColor(15, 23, 42);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Total abonado", 196, 43, { align: "right" });

  doc.setTextColor(22, 163, 74);
  doc.setFontSize(16);
  doc.text(`$ ${dinero(totalPagado)}`, 196, 51, {
    align: "right",
  });
  doc.setTextColor(15, 23, 42);

  autoTable(doc, {
    startY: 64,
    head: [["Venta", "Fecha", "Importe original", "Saldo previo", "Pago"]],
    body: ventas.map((venta) => [
      `#${venta.id}`,
      fechaArgentina(venta.fecha_venta),
      `$ ${dinero(venta.total)}`,
      venta.saldo_antes !== undefined
        ? `$ ${dinero(venta.saldo_antes)}`
        : "-",
      `$ ${dinero(
        venta.monto_pagado !== undefined
          ? venta.monto_pagado
          : venta.total
      )}`,
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
      0: { cellWidth: 22 },
      1: { cellWidth: 30 },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
  });

  let y = ((doc as any).lastAutoTable?.finalY ?? 64) + 10;

  for (const venta of ventas) {
    if (!venta.detalles || venta.detalles.length === 0) {
      continue;
    }

    if (y > 235) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Detalle de venta #${venta.id}`, 14, y);

    autoTable(doc, {
      startY: y + 4,
      head: [["Producto", "Cantidad", "Precio", "Subtotal"]],
      body: venta.detalles.map((detalle) => [
        detalle.producto_nombre,
        cantidadTexto(detalle.cantidad, detalle.tipo_venta),
        `$ ${dinero(detalle.precio_unitario)}`,
        `$ ${dinero(detalle.subtotal)}`,
      ]),
      styles: {
        font: "helvetica",
        fontSize: 7.5,
        cellPadding: 2.5,
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [30, 41, 59],
      },
      columnStyles: {
        1: { halign: "center", cellWidth: 28 },
        2: { halign: "right", cellWidth: 34 },
        3: { halign: "right", cellWidth: 34 },
      },
    });

    y = ((doc as any).lastAutoTable?.finalY ?? y + 15) + 8;
  }

  if (y > 245) {
    doc.addPage();
    y = 30;
  }

  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y, 182, 25, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(22, 101, 52);
  doc.text("TOTAL PAGADO", 20, y + 10);

  doc.setFontSize(16);
  doc.text(`$ ${dinero(totalPagado)}`, 190, y + 11, {
    align: "right",
  });

  doc.setTextColor(15, 23, 42);
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
