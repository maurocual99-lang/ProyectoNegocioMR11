import { CTableHeaderCell } from "@coreui/react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

interface Props {
  titulo: string;
  campo: string;
  ordenarPor: string;
  direccion: "asc" | "desc";
  ordenar: (campo: any) => void;
}

export default function OrdenarTabla({
  titulo,
  campo,
  ordenarPor,
  direccion,
  ordenar,
}: Props) {
  return (
    <CTableHeaderCell
      onClick={() => ordenar(campo)}
      style={{
        cursor: "pointer",
        textAlign: "center",
        background: "#2563eb",
        color: "#fff",
      }}
    >
      <div className="d-flex justify-content-center align-items-center gap-2">
        {titulo}

        {ordenarPor === campo ? (
          direccion === "asc" ? (
            <ArrowUp size={16} />
          ) : (
            <ArrowDown size={16} />
          )
        ) : (
          <ArrowUpDown size={16} />
        )}
      </div>
    </CTableHeaderCell>
  );
}