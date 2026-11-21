const request = require("supertest");
const app = require("../src/app");
const pool = require("../src/config/database");

describe("Product Service API Tests", () => {

    let productId;

    const testProduct = {
        name: "Test Gaming Mouse",
        description: "Gaming mouse for automated testing",
        price: 1999,
        stock_quantity: 20,
        category: "Electronics",
        sku: "TEST-MOUSE-001"
    };

    beforeAll(async () => {

        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                description TEXT,
                price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
                stock_quantity INTEGER NOT NULL DEFAULT 0
                    CHECK (stock_quantity >= 0),
                category VARCHAR(100) NOT NULL,
                sku VARCHAR(50) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

    });

    beforeEach(async () => {

        await pool.query(
            "TRUNCATE TABLE products RESTART IDENTITY CASCADE"
        );

    });

    afterAll(async () => {
        await pool.end();
    });


    // HEALTH CHECK
    test("GET /health should return healthy status", async () => {

        const response = await request(app).get("/health");

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe("healthy");

    });


    // CREATE PRODUCT
    test("POST /api/products should create a product", async () => {

        const response = await request(app)
            .post("/api/products")
            .send(testProduct);

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(testProduct.name);

        productId = response.body.data.id;

    });


    // VALIDATION
    test("POST /api/products should reject negative price", async () => {

        const response = await request(app)
            .post("/api/products")
            .send({
                ...testProduct,
                price: -100
            });

        expect(response.statusCode).toBe(400);

    });


    // DUPLICATE SKU
    test("POST /api/products should reject duplicate SKU", async () => {

        await request(app)
            .post("/api/products")
            .send(testProduct);

        const response = await request(app)
            .post("/api/products")
            .send(testProduct);

        expect(response.statusCode).toBe(409);

    });


    // GET ALL PRODUCTS
    test("GET /api/products should return all products", async () => {

        await request(app)
            .post("/api/products")
            .send(testProduct);

        const response = await request(app)
            .get("/api/products");

        expect(response.statusCode).toBe(200);
        expect(response.body.count).toBe(1);

    });


    // GET PRODUCT BY ID
    test("GET /api/products/:id should return a product", async () => {

        const created = await request(app)
            .post("/api/products")
            .send(testProduct);

        const id = created.body.data.id;

        const response = await request(app)
            .get(`/api/products/${id}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.data.sku).toBe(testProduct.sku);

    });


    // PRODUCT NOT FOUND
    test("GET /api/products/:id should return 404 for missing product", async () => {

        const response = await request(app)
            .get("/api/products/99999");

        expect(response.statusCode).toBe(404);

    });


    // UPDATE PRODUCT
    test("PUT /api/products/:id should update a product", async () => {

        const created = await request(app)
            .post("/api/products")
            .send(testProduct);

        const id = created.body.data.id;

        const updatedProduct = {
            ...testProduct,
            name: "Updated Gaming Mouse",
            price: 2499
        };

        const response = await request(app)
            .put(`/api/products/${id}`)
            .send(updatedProduct);

        expect(response.statusCode).toBe(200);
        expect(response.body.data.name).toBe("Updated Gaming Mouse");

    });


    // DELETE PRODUCT
    test("DELETE /api/products/:id should delete a product", async () => {

        const created = await request(app)
            .post("/api/products")
            .send(testProduct);

        const id = created.body.data.id;

        const response = await request(app)
            .delete(`/api/products/${id}`);

        expect(response.statusCode).toBe(200);

    });


    // INVALID ID
    test("GET /api/products/:id should reject invalid ID", async () => {

        const response = await request(app)
            .get("/api/products/abc");

        expect(response.statusCode).toBe(400);

    });

});