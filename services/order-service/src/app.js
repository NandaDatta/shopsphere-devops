const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const orderRoutes = require("./routes/orderRoutes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        service: "order-service",
        status: "healthy"
    });
});

app.use("/api/orders", orderRoutes);

module.exports = app;