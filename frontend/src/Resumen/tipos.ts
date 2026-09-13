export interface DetalleVentaReporte {
  id: number;
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}
export interface DeudorReporte {
  id: number;
  nombre: string;
  apellido: string;
  apodo: string | null;
  ventas_pendientes: number;
  deuda_total: number;
}

export interface VentaReporte {
  id: number;
  fecha_venta: string;
  total: number;
  cuenta_pendiente: boolean;

  cliente_id: number | null;
  cliente_nombre: string | null;
  cliente_apellido: string | null;
  cliente_apodo: string | null;

  detalles:
    DetalleVentaReporte[];
}

export interface VentaPorDia {
  dia: number;
  cantidad_ventas: number;
  total: number;
}

export interface ReporteMensual {
  periodo: {
    mes: number;
    anio: number;
  };

  deudores: DeudorReporte[];
  resumen: {
    cantidad_ventas: number;
    total_vendido: number;
    total_cobrado: number;
    total_pendiente_mes: number;
  };

  deuda_actual: {
    total_deuda: number;
    ventas_pendientes: number;
    clientes_morosos: number;
  };

  ventas_por_dia:
    VentaPorDia[];

  ventas:
    VentaReporte[];

  anios_disponibles:
    number[];
}

export type EstadoFiltro =
  | "todas"
  | "cobradas"
  | "pendientes";
