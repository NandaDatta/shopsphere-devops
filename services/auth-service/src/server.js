require("dotenv").config();

const app = require("./app");

const pool = require("./config/database");

const logger = require("./config/logger");

const PORT = process.env.PORT || 5001;

const startServer = async () => {

    try {

        await pool.query("SELECT NOW()");

        logger.info("PostgreSQL connected successfully");

        app.listen(PORT, () => {

            logger.info(`Auth Service running on port ${PORT}`);

        });

    } catch (error) {

        logger.error("Database connection failed", {
            error: error.message
        });

        process.exit(1);

    }

};

startServer();