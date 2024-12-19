const jwt = require('jsonwebtoken');
// const User = require('../models/userModel');

const isLoggedIn = async (req, res, next) => {
    console.log("isLoggedInAdmin middleware triggered"); 
    try {
        const token = req.cookies.adminJwt || req.headers.authorization?.split(' ')[1];

        if (!token) {
            console.log("No token found, redirecting to login.");
            return res.status(401).render('adminLogin', {
                success: false,
                msg: 'Access denied. Please login first.',
            });
        }

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    console.log("Token expired");
                    return res.status(403).render('adminLogin', {
                        success: false,
                        msg: 'Session expired. Please login again.',
                    });
                }
                console.log("Invalid token");
                return res.status(403).render('adminLogin', {
                    success: false,
                    msg: 'Invalid token. Please login again.',
                });
            }

            console.log(`Decoded admin ID: ${decoded.id}`);  
            if (!decoded.id) {
                console.log("No user ID found in the decoded token.");
                return res.status(403).render('adminLogin', {
                    success: false,
                    msg: 'Invalid token. Please login again.',
                });
            }
            
            req.user = decoded;
            next();
        });
    } catch (error) {
        console.error('JWT Authentication Error:', error.message);
        return res.status(500).render('adminHome', {
            success: false,
            msg: 'An internal error occurred. Please try again later.',
        });
    }
};


// const blockeUser = await User.find({ is_blocked: 1 }); WHY THIS IS WRONG line no.30
//because this returns the array of all blocked users and not the specific log ined user 


const isLoggedOut = async (req, res, next) => {
    try {
        console.log('isLoggedOut Admin working');
        
        if (req.cookies.adminJwt) {
            console.log('isLoggedOut token');
            
            if (req.path === "/admin/login") {
                return res.redirect("/admin/home");
            }
            res.redirect('/admin/home');
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