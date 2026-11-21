const express = require("express");

const { body } = require("express-validator");

const router = express.Router();

const authController = require("../controllers/authController");

const authenticateToken = require("../middleware/authMiddleware");

const validateRequest = require("../middleware/validationMiddleware");

const loginLimiter = require("express-rate-limit")({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Try again later."
    }
});

// Registration
router.post(
    "/register",
    [
        body("username")
            .trim()
            .isLength({ min: 3, max: 100 })
            .withMessage("Username must be between 3 and 100 characters"),

        body("email")
            .trim()
            .isEmail()
            .withMessage("Invalid email address"),

        body("password")
            .isLength({ min: 8 })
            .withMessage("Password must contain at least 8 characters"),

        validateRequest
    ],
    authController.register
);

// Login
router.post(
    "/login",
    loginLimiter,
    [
        body("email")
            .isEmail()
            .withMessage("Invalid email address"),

        body("password")
            .notEmpty()
            .withMessage("Password is required"),

        validateRequest
    ],
    authController.login
);

// Profile
router.get(
    "/me",
    authenticateToken,
    (req, res) => {
        res.status(200).json({
            success: true,
            user: req.user
        });
    }
);

module.exports = router;