const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/authRoutes");

const {
    notFound,
    errorHandler
} = require("./middleware/errorMiddleware");

const app = express();

app.use(helmet());

app.use(cors());

app.use(express.json());

app.get("/health", (req, res) => {

    res.status(200).json({
        success: true,
        service: "auth-service",
        status: "healthy"
    });

});

app.use("/api/auth", authRoutes);

// Error handling
app.use(notFound);

app.use(errorHandler);

module.exports = app;