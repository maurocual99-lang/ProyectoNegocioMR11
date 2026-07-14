const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensaje: "Backend funcionando correctamente 🚀"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

const productosRouter = require("./routes/producto");
app.use("/productos",productosRouter);
