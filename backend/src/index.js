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

const reporteRouter =
  require("./routes/reporte");

const productosRouter =
  require("./routes/producto");

const ventaRouter =
  require("./routes/venta");

const deudoresRouter =
  require("./routes/clienteDeudor");

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

const inicioRouter =
  require("./routes/inicio");


  app.use(
  "/inicio",
  inicioRouter
);
const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Servidor iniciado en http://localhost:${PORT}`
  );
});
