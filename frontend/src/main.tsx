import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import '@coreui/coreui/dist/css/coreui.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
