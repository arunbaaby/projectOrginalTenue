const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const isLoggedIn = async (req, res, next) => {
    try {
        const token = req.cookies.jwt || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.redirect('/auth?error=access-denied');
        }

        // Verify JWT; second argument is the Token 
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.redirect('/auth?error=session-expired');
                }
                return res.redirect('/auth?error=invalid-token');
            }

            if (!decoded.id) {
                return res.redirect('/auth?error=invalid-token');
            }

            // Check if the user is blocked
            const blockedUser = await User.findOne({ _id: decoded.id, is_blocked: true });
            if (blockedUser) {
                res.clearCookie('jwt', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'Strict'
                });
                return res.redirect('/auth?error=user-blocked');
            }

            // Attach the user data to the request object
            req.user = decoded;
            next();
        });
    } catch (error) {
        return res.redirect('/auth?error=internal-error');
    }
};

// const blockeUser = await User.find({ is_blocked: 1 }); WHY THIS IS WRONG line no.30
//because this returns the array of all blocked users and not the specific log ined user 

const isLoggedOut = async (req, res, next) => {
    try {
        if (req.cookies.jwt) {
            return res.redirect('/home');
        }
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    isLoggedIn,
    isLoggedOut
};