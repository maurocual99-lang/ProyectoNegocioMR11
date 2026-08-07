import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { CAlert, CButton } from "@coreui/react";

const categorias = [
  "Bebidas",
  "Kiosco",
  "Fiambres",
  "Almacen",
  "Regaleria",
  "Verduleria",
] as const;

type Categoria = typeof categorias[number];

interface Producto {
  codigo_barra: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: Categoria;
}

type Props = {
  productos: Producto[];
  abrirModal: () => void;
};

export default function ListaCompra({ productos, abrirModal }: Props) {
  const [listaCompra, setListaCompra] = useState<Producto[]>([]);

  useEffect(() => {
    setListaCompra(productos.filter((p) => p.stock <= 3));
  }, [productos]);

  if (listaCompra.length === 0) return null;

  return (
    <>
    {listaCompra.length > 0 && (
        <CAlert
        color="warning"
        className="d-flex justify-content-between align-items-center"
        >
        <div className="d-flex align-items-center gap-3">
            <AlertTriangle size={28} />
            <div>
            <strong>Atención: hay productos con stock bajo</strong>
            <br />
            Hay {listaCompra.length} productos con 3 unidades o menos.
            </div>
        </div>

        <CButton color="warning" variant="outline" onClick={abrirModal}>
            Ver lista de compra
        </CButton>
        </CAlert>
        )}
    </>
  );
}