const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "../.env.example"),
    override: false,
    quiet: true
});