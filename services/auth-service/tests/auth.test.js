const request = require("supertest");

const app = require("../src/app");

const pool = require("../src/config/database");

describe("Auth Service API Tests", () => {

    let token;

    const testUser = {
        username: "testuser1",
        email: "test1@example.com",
        password: "Password123"
    };

    beforeAll(async () => {

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

    });

    beforeEach(async () => {

        await pool.query("DELETE FROM users");

    });

    afterAll(async () => {

        await pool.end();

    });

    // Health check
    test("GET /health should return healthy status", async () => {

        const response = await request(app)
            .get("/health");

        expect(response.statusCode).toBe(200);

        expect(response.body.status).toBe("healthy");

    });

    // Registration
    test("POST /register should create a user", async () => {

        const response = await request(app)
            .post("/api/auth/register")
            .send(testUser);

        expect(response.statusCode).toBe(201);

        expect(response.body.success).toBe(true);

        expect(response.body.data.email)
            .toBe(testUser.email);

    });

    // Duplicate email
    test("POST /register should reject duplicate email", async () => {

        await request(app)
            .post("/api/auth/register")
            .send(testUser);

        const response = await request(app)
            .post("/api/auth/register")
            .send(testUser);

        expect(response.statusCode).toBe(409);

    });

    // Login
    test("POST /login should authenticate user", async () => {

        await request(app)
            .post("/api/auth/register")
            .send(testUser);

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(response.statusCode).toBe(200);

        expect(response.body.data.token).toBeDefined();

        token = response.body.data.token;

    });

    // Invalid login
    test("POST /login should reject incorrect password", async () => {

        await request(app)
            .post("/api/auth/register")
            .send(testUser);

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: testUser.email,
                password: "WrongPassword123"
            });

        expect(response.statusCode).toBe(401);

    });

    // Protected route
    test("GET /me should reject missing token", async () => {

        const response = await request(app)
            .get("/api/auth/me");

        expect(response.statusCode).toBe(401);

    });

    // Authenticated profile
    test("GET /me should return authenticated user", async () => {

        await request(app)
            .post("/api/auth/register")
            .send(testUser);

        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email: testUser.email,
                password: testUser.password
            });

        token = loginResponse.body.data.token;

        const response = await request(app)
            .get("/api/auth/me")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);

        expect(response.body.user.email)
            .toBe(testUser.email);

    });

});