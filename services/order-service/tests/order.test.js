jest.mock("../src/services/productServiceClient", () => ({
    getProductById: jest.fn()
}));

const request = require("supertest");
const app = require("../src/app");
const pool = require("../src/config/database");
const { getProductById } = require("../src/services/productServiceClient");

describe("Order Service API Tests", () => {

    let orderId;

    const mockProduct = {
        id: 1,
        name: "Logitech G502 Mouse",
        price: "3999.00",
        stock_quantity: 25
    };

    const testOrder = {
        user_id: 1,
        items: [
            {
                product_id: 1,
                quantity: 2
            }
        ]
    };

    beforeAll(async () => {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
                status VARCHAR(30) NOT NULL DEFAULT 'pending'
                    CHECK (status IN (
                        'pending', 'confirmed', 'processing',
                        'shipped', 'delivered', 'cancelled'
                    )),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER NOT NULL
                    REFERENCES orders(id) ON DELETE CASCADE,
                product_id INTEGER NOT NULL,
                product_name VARCHAR(150) NOT NULL,
                quantity INTEGER NOT NULL CHECK (quantity > 0),
                unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
                subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    });

    beforeEach(async () => {
        await pool.query("TRUNCATE TABLE orders RESTART IDENTITY CASCADE");

        getProductById.mockReset();
        getProductById.mockResolvedValue(mockProduct);
    });

    afterAll(async () => {
        await pool.end();
    });

    test("GET /health should return healthy status", async () => {
        const response = await request(app).get("/health");

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe("healthy");
    });

    test("POST /api/orders should create an order", async () => {
        const response = await request(app)
            .post("/api/orders")
            .send(testOrder);

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.total_amount).toBe("7998.00");

        orderId = response.body.data.id;
    });

    test("POST /api/orders should reject invalid user ID", async () => {
        const response = await request(app)
            .post("/api/orders")
            .send({
                ...testOrder,
                user_id: -1
            });

        expect(response.statusCode).toBe(400);
    });

    test("POST /api/orders should reject empty items", async () => {
        const response = await request(app)
            .post("/api/orders")
            .send({
                user_id: 1,
                items: []
            });

        expect(response.statusCode).toBe(400);
    });

    test("GET /api/orders should return all orders", async () => {
        await request(app).post("/api/orders").send(testOrder);

        const response = await request(app).get("/api/orders");

        expect(response.statusCode).toBe(200);
        expect(response.body.count).toBe(1);
    });

    test("GET /api/orders/:id should return an order", async () => {
        const created = await request(app)
            .post("/api/orders")
            .send(testOrder);

        const id = created.body.data.id;

        const response = await request(app)
            .get(`/api/orders/${id}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.data.user_id).toBe(1);
    });

    test("GET /api/orders/:id should return 404 for missing order", async () => {
        const response = await request(app)
            .get("/api/orders/99999");

        expect(response.statusCode).toBe(404);
    });

    test("GET /api/orders/user/:userId should return customer orders", async () => {
        await request(app).post("/api/orders").send(testOrder);

        const response = await request(app)
            .get("/api/orders/user/1");

        expect(response.statusCode).toBe(200);
        expect(response.body.count).toBe(1);
    });

    test("PUT /api/orders/:id/status should update order status", async () => {
        const created = await request(app)
            .post("/api/orders")
            .send(testOrder);

        const id = created.body.data.id;

        const response = await request(app)
            .put(`/api/orders/${id}/status`)
            .send({
                status: "confirmed"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.status).toBe("confirmed");
    });

    test("PUT /api/orders/:id/status should reject invalid status", async () => {
        const response = await request(app)
            .put("/api/orders/1/status")
            .send({
                status: "unknown"
            });

        expect(response.statusCode).toBe(400);
    });

});