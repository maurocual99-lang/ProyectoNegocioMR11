import {
  TriangleAlert,
  ShoppingCart,
} from "lucide-react";

import {
  CAlert,
  CButton,
} from "@coreui/react";


const categorias = [
  "Bebidas",
  "Kiosco",
  "Fiambres",
  "Almacen",
  "Regaleria",
  "Verduleria",
] as const;


type Categoria =
  (typeof categorias)[number];


interface Producto {
  codigo_barra: string;

  nombre: string;

  precio: number;

  stock: number;

  categoria: Categoria;
}


interface Props {
  productos: Producto[];

  abrirModal: () => void;
}


export default function ListaCompra({
  productos,
  abrirModal,
}: Props) {

  const productosStockBajo =
    productos.filter(
      (producto) =>
        producto.stock <= 3
    );


  /*
   * Si no hay ningún producto
   * con stock bajo no mostramos
   * la alerta.
   */
  if (
    productosStockBajo.length === 0
  ) {
    return null;
  }


  return (

    <CAlert
      color="warning"
      className="
        d-flex
        justify-content-between
        align-items-center
        mb-0
      "
      style={{
        background: "#fffaf0",

        border:
          "1px solid #f5d88b",

        borderRadius:
          "12px",

        padding:
          "14px 18px",
      }}
    >

      {/* IZQUIERDA */}

      <div
        className="
          d-flex
          align-items-center
          gap-3
        "
      >

        <div
          className="
            d-flex
            justify-content-center
            align-items-center
          "
          style={{
            width: "46px",

            height: "46px",

            background:
              "#fff3cd",

            borderRadius:
              "10px",

            flexShrink: 0,
          }}
        >

          <TriangleAlert
            size={27}
            color="#d97706"
          />

        </div>


        <div>

          <div
            style={{
              color:
                "#92400e",

              fontWeight:
                700,
            }}
          >
            Atención: hay productos
            con stock bajo
          </div>


          <div
            style={{
              color:
                "#6b7280",

              fontSize:
                "0.88rem",

              marginTop:
                "2px",
            }}
          >

            Hay{" "}

            {
              productosStockBajo.length
            }

            {" "}productos con 3 unidades
            o menos de stock disponible.

          </div>

        </div>

      </div>


      {/* DERECHA */}

      <CButton
        color="warning"
        variant="outline"

        onClick={
          abrirModal
        }

        className="
          d-flex
          align-items-center
          gap-2
        "

        style={{
          whiteSpace:
            "nowrap",
        }}
      >

        <ShoppingCart
          size={17}
        />

        Ver lista de compra

      </CButton>

    </CAlert>

  );
}