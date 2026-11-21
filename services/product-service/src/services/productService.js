const pool = require("../config/database");

// CREATE PRODUCT
const createProduct = async (productData) => {
    const {
        name,
        description,
        price,
        stock_quantity,
        category,
        sku
    } = productData;

    const result = await pool.query(
        `INSERT INTO products
        (name, description, price, stock_quantity, category, sku)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
            name,
            description || null,
            price,
            stock_quantity ?? 0,
            category,
            sku
        ]
    );

    return result.rows[0];
};


// GET ALL PRODUCTS
const getAllProducts = async () => {

    const result = await pool.query(
        "SELECT * FROM products ORDER BY id ASC"
    );

    return result.rows;
};


// GET PRODUCT BY ID
const getProductById = async (id) => {

    const result = await pool.query(
        "SELECT * FROM products WHERE id = $1",
        [id]
    );

    return result.rows[0];
};


// UPDATE PRODUCT
const updateProduct = async (id, productData) => {

    const {
        name,
        description,
        price,
        stock_quantity,
        category,
        sku
    } = productData;

    const result = await pool.query(
        `UPDATE products
         SET name = $1,
             description = $2,
             price = $3,
             stock_quantity = $4,
             category = $5,
             sku = $6,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [
            name,
            description || null,
            price,
            stock_quantity ?? 0,
            category,
            sku,
            id
        ]
    );

    return result.rows[0];
};


// DELETE PRODUCT
const deleteProduct = async (id) => {

    const result = await pool.query(
        "DELETE FROM products WHERE id = $1 RETURNING *",
        [id]
    );

    return result.rows[0];
};


module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
};