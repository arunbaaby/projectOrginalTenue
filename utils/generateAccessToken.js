const env = require('dotenv').config();
const jwt = require('jsonwebtoken');

function generateAccessToken(userId) {
    if (!process.env.ACCESS_TOKEN_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
}

module.exports = { generateAccessToken };
