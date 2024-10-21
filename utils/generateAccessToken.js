const jwt = require('jsonwebtoken');

function generateAccessToken(userId) {
    if (!process.env.ACCESS_TOKEN_SECRET) {
        throw new Error('ACCESS_TOKEN_SECRET is not defined');
    }
    // Ensure that `userId` is being included correctly as `{ id: userId }`
    return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
}

module.exports = { generateAccessToken };
