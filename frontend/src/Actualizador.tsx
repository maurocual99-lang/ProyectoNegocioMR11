import { useEffect, useState } from "react";
import { CheckCircle2, Download, RefreshCw, X } from "lucide-react";
import { check, type Update } from "@tauri-apps/plugin-updater";

import logoMr11 from "../imagenes/ChatGPT Image 20 jul 2026, 11_47_32.png";
import "./Actualizador.css";

type EstadoActualizacion = "disponible" | "descargando" | "error";

export default function Actualizador() {
  const [actualizacion, setActualizacion] = useState<Update | null>(null);
  const [estado, setEstado] = useState<EstadoActualizacion>("disponible");
  const [progreso, setProgreso] = useState(0);
  const [detalleError, setDetalleError] = useState("");

  useEffect(() => {
    let activo = true;

    async function buscarActualizacion() {
      try {
        const update = await check();

        if (!activo) {
          await update?.close();
          return;
        }

        if (update) {
          setActualizacion(update);
        }
      } catch (error) {
        // En el navegador de desarrollo no existe el plugin nativo.
        console.error(
          "No se pudo comprobar si existen actualizaciones:",
          error
        );
      }
    }

    void buscarActualizacion();

    return () => {
      activo = false;
    };
  }, []);

  async function posponerActualizacion() {
    if (!actualizacion || estado === "descargando") {
      return;
    }

    await actualizacion.close();
    setActualizacion(null);
  }

  async function instalarActualizacion() {
    if (!actualizacion || estado === "descargando") {
      return;
    }

    setEstado("descargando");
    setDetalleError("");

    let descargado = 0;
    let total = 0;

    try {
      await actualizacion.downloadAndInstall((evento) => {
        if (evento.event === "Started") {
          total = evento.data.contentLength ?? 0;
          setProgreso(total > 0 ? 1 : 0);
          return;
        }

        if (evento.event === "Progress") {
          descargado += evento.data.chunkLength;
          if (total > 0) {
            setProgreso(
              Math.min(99, Math.round((descargado / total) * 100))
            );
          }
          return;
        }

        setProgreso(100);
      });
    } catch (error) {
      console.error("No se pudo instalar la actualización:", error);
      setEstado("error");
      setDetalleError(
        "No se pudo completar la descarga. Revisá la conexión e intentá nuevamente."
      );
    }
  }

  if (!actualizacion) {
    return null;
  }

  const descargando = estado === "descargando";

  return (
    <div className="actualizador-fondo" role="presentation">
      <section
        className="actualizador-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="actualizador-titulo"
        aria-describedby="actualizador-descripcion"
      >
        <div className="actualizador-marca">
          <img src={logoMr11} alt="" />
        </div>

        {!descargando && (
          <button
            type="button"
            className="actualizador-cerrar"
            aria-label="Recordarme más tarde"
            onClick={() => void posponerActualizacion()}
          >
            <X size={20} />
          </button>
        )}

        <div className="actualizador-contenido">
          <span className="actualizador-etiqueta">
            <CheckCircle2 size={16} />
            Actualización disponible
          </span>

          <h2 id="actualizador-titulo">
            Una nueva versión de MR11 está lista
          </h2>

          <p id="actualizador-descripcion" className="actualizador-version">
            Versión {actualizacion.version}
          </p>

          {actualizacion.body && (
            <div className="actualizador-notas">
              <strong>Novedades</strong>
              <p>{actualizacion.body}</p>
            </div>
          )}

          {descargando && (
            <div className="actualizador-progreso" aria-live="polite">
              <div className="actualizador-progreso-texto">
                <span>Descargando e instalando…</span>
                <strong>{progreso > 0 ? `${progreso}%` : "Preparando"}</strong>
              </div>
              <div className="actualizador-barra">
                <span
                  className={progreso === 0 ? "actualizador-barra-indeterminada" : ""}
                  style={progreso > 0 ? { width: `${progreso}%` } : undefined}
                />
              </div>
              <small>MR11 se cerrará y volverá a abrir al terminar.</small>
            </div>
          )}

          {estado === "error" && (
            <p className="actualizador-error" role="alert">
              {detalleError}
            </p>
          )}

          {!descargando && (
            <div className="actualizador-acciones">
              <button
                type="button"
                className="actualizador-btn-secundario"
                onClick={() => void posponerActualizacion()}
              >
                Más tarde
              </button>
              <button
                type="button"
                className="actualizador-btn-principal"
                onClick={() => void instalarActualizacion()}
              >
                {estado === "error" ? <RefreshCw size={18} /> : <Download size={18} />}
                {estado === "error" ? "Reintentar" : "Actualizar ahora"}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
