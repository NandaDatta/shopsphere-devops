const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        service: "payment-service",
        status: "healthy"
    });
});

app.use("/api/payments", paymentRoutes);

module.exports = app;