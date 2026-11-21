const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");

router.post("/", paymentController.createPayment);
router.get("/order/:orderId", paymentController.getPaymentsByOrderId);
router.get("/:id", paymentController.getPaymentById);
router.put("/:id/status", paymentController.updatePaymentStatus);

module.exports = router;