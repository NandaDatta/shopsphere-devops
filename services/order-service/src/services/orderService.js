const pool = require("../config/database");
const { getProductById } = require("./productServiceClient");

const createOrder = async (userId, items) => {
    const orderItems = [];
    let totalAmount = 0;

    // Retrieve product details from Product Service
    for (const item of items) {
        const product = await getProductById(item.product_id);

        if (!product) {
            const error = new Error("Product not found");
            error.statusCode = 404;
            throw error;
        }

        if (product.stock_quantity < item.quantity) {
            const error = new Error(
                `Insufficient stock for ${product.name}`
            );

            error.statusCode = 400;
            throw error;
        }

        const unitPrice = Number(product.price);
        const subtotal = unitPrice * item.quantity;

        orderItems.push({
            product_id: product.id,
            product_name: product.name,
            quantity: item.quantity,
            unit_price: unitPrice,
            subtotal
        });

        totalAmount += subtotal;
    }

    // Save order and order items in a database transaction
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const orderResult = await client.query(
            `INSERT INTO orders (user_id, total_amount)
             VALUES ($1, $2)
             RETURNING *`,
            [userId, totalAmount]
        );

        const order = orderResult.rows[0];

        for (const item of orderItems) {
            await client.query(
                `INSERT INTO order_items
                (order_id, product_id, product_name, quantity,
                 unit_price, subtotal)
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    order.id,
                    item.product_id,
                    item.product_name,
                    item.quantity,
                    item.unit_price,
                    item.subtotal
                ]
            );
        }

        await client.query("COMMIT");

        return {
            ...order,
            items: orderItems
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
};

const getAllOrders = async () => {
    const result = await pool.query(`
        SELECT
            o.*,
            COALESCE(
                json_agg(
                    json_build_object(
                        'product_id', oi.product_id,
                        'product_name', oi.product_name,
                        'quantity', oi.quantity,
                        'unit_price', oi.unit_price,
                        'subtotal', oi.subtotal
                    )
                ) FILTER (WHERE oi.id IS NOT NULL),
                '[]'
            ) AS items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `);

    return result.rows;
};

const getOrderById = async (id) => {
    const orderResult = await pool.query(
        "SELECT * FROM orders WHERE id = $1",
        [id]
    );

    if (orderResult.rows.length === 0) {
        return null;
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
        "SELECT * FROM order_items WHERE order_id = $1",
        [id]
    );

    return {
        ...order,
        items: itemsResult.rows
    };
};

const getOrdersByUserId = async (userId) => {
    const result = await pool.query(
        `SELECT
            o.*,
            COALESCE(
                json_agg(
                    json_build_object(
                        'product_id', oi.product_id,
                        'product_name', oi.product_name,
                        'quantity', oi.quantity,
                        'unit_price', oi.unit_price,
                        'subtotal', oi.subtotal
                    )
                ) FILTER (WHERE oi.id IS NOT NULL),
                '[]'
            ) AS items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC`,
        [userId]
    );

    return result.rows;
};

const updateOrderStatus = async (id, status) => {
    const result = await pool.query(
        `UPDATE orders
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [status, id]
    );

    return result.rows[0] || null;
};

module.exports = {
    createOrder,
    getAllOrders,
    getOrderById,
    getOrdersByUserId,
    updateOrderStatus
};