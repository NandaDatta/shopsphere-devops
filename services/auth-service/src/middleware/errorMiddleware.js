const logger = require("../config/logger");

const notFound = (req, res, next) => {

    const error = new Error(`Route not found: ${req.originalUrl}`);

    error.statusCode = 404;

    next(error);
};


const errorHandler = (err, req, res, next) => {

    logger.error(err.message, {
        path: req.originalUrl,
        method: req.method,
        statusCode: err.statusCode || 500
    });

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message: statusCode === 500
            ? "Internal server error"
            : err.message
    });
};

module.exports = {
    notFound,
    errorHandler
};