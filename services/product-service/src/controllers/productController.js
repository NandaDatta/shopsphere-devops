const productService = require("../services/productService");

// CREATE PRODUCT
const createProduct = async (req, res) => {

    try {

        const product = await productService.createProduct(req.body);

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });

    } catch (error) {

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Product SKU already exists"
            });
        }

        console.error("Create product error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// GET ALL PRODUCTS
const getAllProducts = async (req, res) => {

    try {

        const products = await productService.getAllProducts();

        return res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });

    } catch (error) {

        console.error("Get products error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// GET PRODUCT BY ID
const getProductById = async (req, res) => {

    try {

        const { id } = req.params;

        const product = await productService.getProductById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: product
        });

    } catch (error) {

        console.error("Get product error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// UPDATE PRODUCT
const updateProduct = async (req, res) => {

    try {

        const { id } = req.params;

        const product = await productService.updateProduct(
            id,
            req.body
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product
        });

    } catch (error) {

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Product SKU already exists"
            });
        }

        console.error("Update product error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// DELETE PRODUCT
const deleteProduct = async (req, res) => {

    try {

        const { id } = req.params;

        const product = await productService.deleteProduct(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            data: product
        });

    } catch (error) {

        console.error("Delete product error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
};