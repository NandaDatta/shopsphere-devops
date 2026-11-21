const pool = require("../config/database");
const orderServiceClient = require("./orderServiceClient");
const crypto = require("crypto");

const createPayment = async (orderId, userId, paymentMethod) => {
    const allowedMethods = [
        "card",
        "upi",
        "netbanking",
        "wallet"
    ];

    if (!allowedMethods.includes(paymentMethod)) {
        const error = new Error("Invalid payment method");
        error.statusCode = 400;
        throw error;
    }

    // 1. Retrieve order from Order Service
    const order = await orderServiceClient.getOrderById(orderId);

    if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
    }

    // 2. Verify order ownership
    if (Number(order.user_id) !== Number(userId)) {
        const error = new Error("You are not authorized to pay for this order");
        error.statusCode = 403;
        throw error;
    }

    // 3. Verify order status
    if (order.status !== "pending") {
        const error = new Error("Order is not eligible for payment");
        error.statusCode = 400;
        throw error;
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 4. Prevent another successful payment for the same order
        const existingPayment = await client.query(
            `SELECT id FROM payments
             WHERE order_id = $1 AND status = 'successful'`,
            [orderId]
        );

        if (existingPayment.rows.length > 0) {
            const error = new Error("This order has already been paid");
            error.statusCode = 409;
            throw error;
        }

        // 5. Generate transaction reference
        const transactionReference =
            `PAY-${crypto.randomUUID()}`;

        // 6. Simulate successful payment
        const result = await client.query(
            `INSERT INTO payments
            (order_id, user_id, amount, currency,
             payment_method, status, transaction_reference)
            VALUES ($1, $2, $3, 'INR', $4, 'successful', $5)
            RETURNING *`,
            [
                orderId,
                userId,
                order.total_amount,
                paymentMethod,
                transactionReference
            ]
        );

        await client.query("COMMIT");

        return result.rows[0];

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
};

const getPaymentById = async (paymentId) => {
    const result = await pool.query(
        "SELECT * FROM payments WHERE id = $1",
        [paymentId]
    );

    if (result.rows.length === 0) {
        const error = new Error("Payment not found");
        error.statusCode = 404;
        throw error;
    }

    return result.rows[0];
};

const getPaymentsByOrderId = async (orderId) => {
    const result = await pool.query(
        `SELECT * FROM payments
         WHERE order_id = $1
         ORDER BY created_at DESC`,
        [orderId]
    );

    return result.rows;
};


const updatePaymentStatus = async (paymentId, status) => {
    const allowedStatuses = ["successful", "failed", "refunded"];

    if (!allowedStatuses.includes(status)) {
        const error = new Error("Invalid payment status");
        error.statusCode = 400;
        throw error;
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const paymentResult = await client.query(
            "SELECT * FROM payments WHERE id = $1 FOR UPDATE",
            [paymentId]
        );

        if (paymentResult.rows.length === 0) {
            const error = new Error("Payment not found");
            error.statusCode = 404;
            throw error;
        }

        const currentPayment = paymentResult.rows[0];

        // Only successful payments can be refunded.
        if (
            status === "refunded" &&
            currentPayment.status !== "successful"
        ) {
            const error = new Error(
                "Only successful payments can be refunded"
            );
            error.statusCode = 400;
            throw error;
        }

        // Prevent changing a refunded payment.
        if (currentPayment.status === "refunded") {
            const error = new Error(
                "Refunded payments cannot be modified"
            );
            error.statusCode = 400;
            throw error;
        }

        const result = await client.query(
            `UPDATE payments
             SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [status, paymentId]
        );

        await client.query("COMMIT");

        return result.rows[0];

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
};


module.exports = {
    createPayment,
    getPaymentById,
    getPaymentsByOrderId,
    updatePaymentStatus
};