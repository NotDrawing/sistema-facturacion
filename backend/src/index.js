require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/clientes", require("./routes/clientes.routes"));
app.use("/api/productos", require("./routes/productos.routes"));
app.use("/api/facturas", require("./routes/facturas.routes"));

app.use((err, req, res, next) => {
    console.error("Error no manejado:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});