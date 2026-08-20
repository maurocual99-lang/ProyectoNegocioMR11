const express = require("express");
const cors = require("cors");

require("dotenv").config();
require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensaje: "Backend funcionando correctamente 🚀",
  });
});

const productosRouter =
  require("./routes/producto");

const ventaRouter =
  require("./routes/venta");

const deudoresRouter =
  require("./routes/clienteDeudor");

const reporteRouter =
  require("./routes/reporte");

app.use(
  "/productos",
  productosRouter
);

app.use(
  "/ventas",
  ventaRouter
);

app.use(
  "/deudores",
  deudoresRouter
);

app.use(
  "/reportes",
  reporteRouter
);

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Servidor iniciado en http://localhost:${PORT}`
  );
});
