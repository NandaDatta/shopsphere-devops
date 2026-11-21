const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL;

const getOrderById = async (orderId) => {
    try {
        const response = await fetch(
            `${ORDER_SERVICE_URL}/api/orders/${orderId}`
        );

        const result = await response.json();

        if (!response.ok) {
            const error = new Error(
                result.message || "Unable to retrieve order"
            );

            error.statusCode = response.status;
            throw error;
        }

        return result.data;

    } catch (error) {
        if (error.statusCode) {
            throw error;
        }

        const serviceError = new Error(
            "Order Service is currently unavailable"
        );

        serviceError.statusCode = 503;
        throw serviceError;
    }
};

module.exports = {
    getOrderById
};