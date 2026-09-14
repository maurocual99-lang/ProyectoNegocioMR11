import React from "react";
import ReactDOM from "react-dom/client";

/*
 * IMPORTANTE:
 * Los estilos globales de librerías se cargan PRIMERO.
 * Después App carga los estilos propios del proyecto.
 */
import "@coreui/coreui/dist/css/coreui.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import App from "./App";


ReactDOM
  .createRoot(
    document.getElementById(
      "root"
    ) as HTMLElement
  )
  .render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
