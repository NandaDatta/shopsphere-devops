require("dotenv").config();

const app = require("./app");
const pool = require("./config/database");

const PORT = process.env.PORT || 5004;

const startServer = async () => {
    try {
        await pool.query("SELECT NOW()");

        console.log("Payment Service database connected successfully");

        app.listen(PORT, () => {
            console.log(`Payment Service running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
};

startServer();