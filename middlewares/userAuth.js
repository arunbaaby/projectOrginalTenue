const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    try {
        const token = req.cookies.jwt; // Retrieve the token from the cookie

        if (!token) {
            return res.status(401).render('auth', {
                success: false,
                msg: 'Access denied. Please login first.',
            });
        }

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                //separate error when the token expires
                if (err.name === 'TokenExpiredError') {
                    return res.status(403).render('auth', {
                        success: false,
                        msg: 'Session expired. Please login again.'
                    });
                }
                return res.status(403).render('auth', {
                    success: false,
                    msg: 'Invalid token. Please login again.',
                });
            }

            req.user = user; // Store user information in request object
            next();
        });
    } catch (error) {
        // Catch and handle unexpected errors
        console.error('JWT Authentication Error:', error.message);
        return res.status(500).render('auth', {
            success: false,
            msg: 'An internal error occurred. Please try again later.'
        });
    }
};


module.exports = authenticateToken;