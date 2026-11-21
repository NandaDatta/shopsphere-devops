const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const productRoutes = require("./routes/productRoutes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        service: "product-service",
        status: "healthy"
    });
});

app.use("/api/products", productRoutes);

module.exports = app;