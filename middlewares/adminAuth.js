const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.cookies.jwt; // Retrieve the token from the cookie

    if (!token) {
        return res.status(401).render('adminLogin', {
            success: false,
            msg: 'Access denied. Please login first.',
        });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(403).render('adminLogin', {
                success: false,
                msg: 'Invalid token. Please login again.',
            });
        }
        
        req.user = user; // Store user information in request object
        next();
    });
};

module.exports = authenticateToken;