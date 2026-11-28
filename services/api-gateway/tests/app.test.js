process.env.AUTH_SERVICE_URL = "http://127.0.0.1:5991";
process.env.PRODUCT_SERVICE_URL = "http://127.0.0.1:5992";
process.env.ORDER_SERVICE_URL = "http://127.0.0.1:5993";
process.env.PAYMENT_SERVICE_URL = "http://127.0.0.1:5994";

const request = require("supertest");
const app = require("../src/app");

describe("API Gateway", () => {
    describe("Health Check", () => {
        it("should return HTTP 200", async () => {
            const response = await request(app).get("/health");

            expect(response.status).toBe(200);
        });

        it("should return the correct health response", async () => {
            const response = await request(app).get("/health");

            expect(response.body).toEqual({
                success: true,
                service: "api-gateway",
                status: "healthy"
            });
        });
    });

    describe("Security Middleware", () => {
        it("should include Helmet security headers", async () => {
            const response = await request(app).get("/health");

            expect(response.headers).toHaveProperty("x-content-type-options");
            expect(response.headers).toHaveProperty("x-frame-options");
        });

        it("should enable CORS headers", async () => {
            const response = await request(app)
                .get("/health")
                .set("Origin", "http://localhost:3000");

            expect(response.headers["access-control-allow-origin"]).toBe("*");
        });
    });
});
