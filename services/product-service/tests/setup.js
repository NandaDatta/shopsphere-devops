const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "../.env.example"),
    override: true,
    quiet: true
});