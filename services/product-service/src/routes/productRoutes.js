const express = require("express");

const {
    body,
    param,
    validationResult
} = require("express-validator");

const productController = require("../controllers/productController");

const router = express.Router();


// VALIDATE PRODUCT ID
const validateId = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("Product ID must be a positive integer")
];


// VALIDATE PRODUCT DATA
const validateProduct = [

    body("name")
        .trim()
        .notEmpty()
        .withMessage("Product name is required"),

    body("description")
        .optional()
        .isString()
        .withMessage("Description must be a string"),

    body("price")
        .notEmpty()
        .withMessage("Price is required")
        .isFloat({ min: 0 })
        .withMessage("Price must be a non-negative number"),

    body("stock_quantity")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Stock quantity must be a non-negative integer"),

    body("category")
        .trim()
        .notEmpty()
        .withMessage("Category is required"),

    body("sku")
        .trim()
        .notEmpty()
        .withMessage("SKU is required")
];


// VALIDATION ERROR HANDLER
const checkValidation = (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    next();
};


// CREATE PRODUCT
router.post(
    "/",
    validateProduct,
    checkValidation,
    productController.createProduct
);


// GET ALL PRODUCTS
router.get(
    "/",
    productController.getAllProducts
);


// GET PRODUCT BY ID
router.get(
    "/:id",
    validateId,
    checkValidation,
    productController.getProductById
);


// UPDATE PRODUCT
router.put(
    "/:id",
    validateId,
    validateProduct,
    checkValidation,
    productController.updateProduct
);


// DELETE PRODUCT
router.delete(
    "/:id",
    validateId,
    checkValidation,
    productController.deleteProduct
);


module.exports = router;