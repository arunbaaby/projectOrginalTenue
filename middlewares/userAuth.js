const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const isLoggedIn = async (req, res, next) => {
    console.log("isLoggedIn middleware triggered");
    try {
        const token = req.cookies.jwt || req.headers.authorization?.split(' ')[1];

        if (!token) {
            console.log("No token found, redirecting to login.");
            return res.redirect('/auth?error=access-denied');
        }

        // Verify JWT; second argument is the Token 
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    console.log("Token expired");
                    return res.redirect('/auth?error=session-expired');
                }
                console.log("Invalid token");
                return res.redirect('/auth?error=invalid-token');
            }

            console.log(`Decoded user ID: ${decoded.id}`);
            if (!decoded.id) {
                console.log("No user ID found in the decoded token.");
                return res.redirect('/auth?error=invalid-token');
            }

            // Check if the user is blocked
            const blockedUser = await User.findOne({ _id: decoded.id, is_blocked: true });
            if (blockedUser) {
                console.log(`User with ID ${decoded.id} has been blocked. Logging out.`);
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
        console.error('JWT Authentication Error:', error.message);
        return res.redirect('/auth?error=internal-error');
    }
};

// const blockeUser = await User.find({ is_blocked: 1 }); WHY THIS IS WRONG line no.30
//because this returns the array of all blocked users and not the specific log ined user 

const isLoggedOut = async (req, res, next) => {
    try {
        console.log('isLoggedOut working');
        
        if (req.cookies.jwt) {
            console.log('isLoggedOut token');
            
            if (req.path === "/auth") {
                return res.redirect("/home");
            }
            res.redirect('/home');
        }
        else {
            next();
        }

    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    isLoggedIn,
    isLoggedOut
};