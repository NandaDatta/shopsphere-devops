const PRODUCT_SERVICE_URL =
    process.env.PRODUCT_SERVICE_URL || "http://localhost:5002";

const getProductById = async (productId) => {
    try {
        const response = await fetch(
            `${PRODUCT_SERVICE_URL}/api/products/${productId}`
        );

        const result = await response.json();

        if (!response.ok) {
            const error = new Error(
                result.message || "Unable to retrieve product"
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
            "Product Service is currently unavailable"
        );

        serviceError.statusCode = 503;
        throw serviceError;
    }
};

module.exports = { getProductById };