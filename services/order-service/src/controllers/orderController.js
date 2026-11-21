const orderService = require("../services/orderService");

const createOrder = async (req, res) => {
    try {
        const { user_id, items } = req.body;

        if (!user_id || !Number.isInteger(user_id) || user_id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid user_id is required"
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one order item is required"
            });
        }

        for (const item of items) {
            if (
                !Number.isInteger(item.product_id) ||
                item.product_id <= 0 ||
                !Number.isInteger(item.quantity) ||
                item.quantity <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Each item requires a valid product_id and quantity"
                });
            }
        }

        const order = await orderService.createOrder(user_id, items);

        return res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: order
        });

    } catch (error) {
        console.error("Create order error:", error.message);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : "Internal server error"
        });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const orders = await orderService.getAllOrders();

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error("Get orders error:", error.message);

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        const order = await orderService.getOrderById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error("Get order error:", error.message);

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const getOrdersByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!/^[1-9]\d*$/.test(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        const orders = await orderService.getOrdersByUserId(userId);

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error("Get customer orders error:", error.message);

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled"
        ];

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }

        const order = await orderService.updateOrderStatus(id, status);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: order
        });
    } catch (error) {
        console.error("Update order status error:", error.message);

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    createOrder,
    getAllOrders,
    getOrderById,
    getOrdersByUserId,
    updateOrderStatus
};