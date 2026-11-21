const express = require("express");

const orderController = require("../controllers/orderController");

const router = express.Router();

router.post("/", orderController.createOrder);

router.get("/", orderController.getAllOrders);

router.get("/user/:userId", orderController.getOrdersByUserId);

router.get("/:id", orderController.getOrderById);

router.put("/:id/status", orderController.updateOrderStatus);

module.exports = router;