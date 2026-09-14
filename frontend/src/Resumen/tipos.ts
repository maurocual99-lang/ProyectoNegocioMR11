export type TipoVentaReporte =
  | "UNIDAD"
  | "PESO";


export interface DetalleVentaReporte {

  id: number;

  producto_id: number;

  producto_nombre: string;

  tipo_venta:
    TipoVentaReporte;

  cantidad: number;

  precio_unitario: number;

  subtotal: number;

}


export interface DeudorReporte {

  id: number;

  nombre: string;

  apellido: string;

  apodo:
    string
    | null;

  ventas_pendientes:
    number;

  deuda_total:
    number;

}


export interface VentaReporte {

  id: number;

  fecha_venta:
    string;

  total:
    number;

  saldo_pendiente:
    number;

  total_pagado:
    number;

  cuenta_pendiente:
    boolean;

  cliente_id:
    number
    | null;

  cliente_nombre:
    string
    | null;

  cliente_apellido:
    string
    | null;

  cliente_apodo:
    string
    | null;

  detalles:
    DetalleVentaReporte[];

}


export interface VentaPorDia {

  dia: number;

  cantidad_ventas:
    number;

  total: number;

}


export interface PagoMensualReporte {

  id: number;

  fecha_pago:
    string;

  total:
    number;

  cliente_id:
    number
    | null;

  cliente_nombre:
    string
    | null;

  cliente_apellido:
    string
    | null;

  cliente_apodo:
    string
    | null;

}


export interface ReporteMensual {

  periodo: {

    mes: number;

    anio: number;

  };


  deudores:
    DeudorReporte[];


  resumen: {

    cantidad_ventas:
      number;

    total_vendido:
      number;

    /*
     * Dinero que realmente entró a caja
     * durante el mes seleccionado:
     *
     * ventas cobradas en el momento
     * +
     * pagos de deudas recibidos ese mes.
     */
    total_cobrado:
      number;


    /*
     * Saldo que HOY queda pendiente
     * de ventas originadas en el mes.
     */
    total_pendiente_mes:
      number;


    /*
     * Desglose del control de caja.
     */
    ventas_contado_mes:
      number;

    pagos_deuda_mes:
      number;

    total_caja_mes:
      number;

  };


  deuda_actual: {

    /*
     * Total que los clientes morosos
     * deben actualmente, sin filtrar
     * por el mes elegido.
     */
    total_deuda:
      number;

    ventas_pendientes:
      number;

    clientes_morosos:
      number;

  };


  ventas_por_dia:
    VentaPorDia[];


  /*
   * Registro exacto de todas las
   * ventas finalizadas del mes.
   */
  ventas:
    VentaReporte[];


  /*
   * Pagos de deudas que efectivamente
   * ingresaron a caja en ese mes.
   */
  pagos_mes:
    PagoMensualReporte[];


  anios_disponibles:
    number[];

}


export type EstadoFiltro =
  | "todas"
  | "cobradas"
  | "pendientes";
