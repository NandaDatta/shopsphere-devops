const authService = require("../services/authService");

const register = async (req, res) => {

    try {

        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters"
            });
        }

        const user = await authService.registerUser(
            username.trim(),
            email.trim().toLowerCase(),
            password
        );

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user
        });

    } catch (error) {

        if (
            error.code === "23505" ||
            error.message === "Email already registered"
        ) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


const login = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await authService.loginUser(
            email.trim().toLowerCase(),
            password
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: user
        });

    } catch (error) {

        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    register,
    login
};