const pool = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (username, email, password) => {

    const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
    );

    if (existingUser.rows.length > 0) {
        throw new Error("Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
        `INSERT INTO users (username, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, username, email, created_at`,
        [username, email, passwordHash]
    );

    return result.rows[0];
};


const loginUser = async (email, password) => {

    const result = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
    );

    if (result.rows.length === 0) {
        throw new Error("Invalid email or password");
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1d"
        }
    );

    return {
        id: user.id,
        username: user.username,
        email: user.email,
        token
    };
};


module.exports = {
    registerUser,
    loginUser
};