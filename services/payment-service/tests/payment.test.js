const request = require("supertest");

jest.mock("../src/services/paymentService");

const paymentService = require("../src/services/paymentService");
const app = require("../src/app");

describe("Payment Service API Tests", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Health check
    test("GET /health should return healthy status", async () => {
        const response = await request(app).get("/health");

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe("healthy");
        expect(response.body.service).toBe("payment-service");
    });

    // Create payment
    test("POST /api/payments should create a payment", async () => {
        paymentService.createPayment.mockResolvedValue({
            id: 1,
            order_id: 10,
            user_id: 2,
            amount: "1500.00",
            currency: "INR",
            payment_method: "upi",
            status: "successful"
        });

        const response = await request(app)
            .post("/api/payments")
            .send({
                order_id: 10,
                user_id: 2,
                payment_method: "upi"
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe("successful");
    });

    // Validate required fields
    test("POST /api/payments should reject missing fields", async () => {
        const response = await request(app)
            .post("/api/payments")
            .send({
                order_id: 10
            });

        expect(response.statusCode).toBe(400);
    });

    // Get payment by ID
    test("GET /api/payments/:id should return payment", async () => {
        paymentService.getPaymentById.mockResolvedValue({
            id: 1,
            order_id: 10,
            amount: "1500.00",
            status: "successful"
        });

        const response = await request(app)
            .get("/api/payments/1");

        expect(response.statusCode).toBe(200);
        expect(response.body.data.id).toBe(1);
    });

    // Get payments by order ID
    test("GET /api/payments/order/:orderId should return payments", async () => {
        paymentService.getPaymentsByOrderId.mockResolvedValue([
            {
                id: 1,
                order_id: 10,
                amount: "1500.00",
                status: "successful"
            }
        ]);

        const response = await request(app)
            .get("/api/payments/order/10");

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveLength(1);
    });

    // Update payment status
    test("PUT /api/payments/:id/status should update payment status", async () => {
        paymentService.updatePaymentStatus.mockResolvedValue({
            id: 1,
            order_id: 10,
            status: "refunded"
        });

        const response = await request(app)
            .put("/api/payments/1/status")
            .send({
                status: "refunded"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.status).toBe("refunded");
    });

    // Invalid payment ID
    test("GET /api/payments/:id should reject invalid ID", async () => {
        const response = await request(app)
            .get("/api/payments/abc");

        expect(response.statusCode).toBe(400);
    });

    // Payment not found
    test("GET /api/payments/:id should return 404 when payment does not exist", async () => {
        paymentService.getPaymentById.mockRejectedValue({
            message: "Payment not found",
            statusCode: 404
        });

        const response = await request(app)
            .get("/api/payments/999");

        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe("Payment not found");
    });

});