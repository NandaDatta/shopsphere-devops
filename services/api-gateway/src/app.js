const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

app.use(helmet());
app.use(cors());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});

app.use("/api", limiter);

// Gateway health check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        service: "api-gateway",
        status: "healthy"
    });
});

// Auth Service
app.use(
    createProxyMiddleware({
        pathFilter: "/api/auth",
        target: process.env.AUTH_SERVICE_URL,
        changeOrigin: true
    })
);

// Product Service
app.use(
    createProxyMiddleware({
        pathFilter: "/api/products",
        target: process.env.PRODUCT_SERVICE_URL,
        changeOrigin: true
    })
);

// Order Service
app.use(
    createProxyMiddleware({
        pathFilter: "/api/orders",
        target: process.env.ORDER_SERVICE_URL,
        changeOrigin: true
    })
);

// Payment Service
app.use(
    createProxyMiddleware({
        pathFilter: "/api/payments",
        target: process.env.PAYMENT_SERVICE_URL,
        changeOrigin: true
    })
);

// Parse JSON only after proxy routes
app.use(express.json());

module.exports = app;