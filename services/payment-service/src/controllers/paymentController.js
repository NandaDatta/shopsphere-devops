const paymentService = require("../services/paymentService");

const createPayment = async (req, res) => {
    try {
        const { order_id, user_id, payment_method } = req.body;

        // Validate required fields
        if (!order_id || !user_id || !payment_method) {
            return res.status(400).json({
                success: false,
                message: "order_id, user_id and payment_method are required"
            });
        }

        if (
            !Number.isInteger(Number(order_id)) ||
            Number(order_id) <= 0 ||
            !Number.isInteger(Number(user_id)) ||
            Number(user_id) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid order_id or user_id"
            });
        }

        const payment = await paymentService.createPayment(
            Number(order_id),
            Number(user_id),
            payment_method
        );

        return res.status(201).json({
            success: true,
            message: "Payment processed successfully",
            data: payment
        });

    } catch (error) {
        console.error("Payment creation error:", error.message);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

const getPaymentById = async (req, res) => {
    try {
        const paymentId = Number(req.params.id);

        if (!Number.isInteger(paymentId) || paymentId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment ID"
            });
        }

        const payment = await paymentService.getPaymentById(paymentId);

        return res.status(200).json({
            success: true,
            data: payment
        });

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

const getPaymentsByOrderId = async (req, res) => {
    try {
        const orderId = Number(req.params.orderId);

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        const payments = await paymentService.getPaymentsByOrderId(orderId);

        return res.status(200).json({
            success: true,
            data: payments
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const updatePaymentStatus = async (req, res) => {
    try {
        const paymentId = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isInteger(paymentId) || paymentId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment ID"
            });
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Payment status is required"
            });
        }

        const payment = await paymentService.updatePaymentStatus(
            paymentId,
            status
        );

        return res.status(200).json({
            success: true,
            message: "Payment status updated successfully",
            data: payment
        });

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createPayment,
    getPaymentById,
    getPaymentsByOrderId,
    updatePaymentStatus
};