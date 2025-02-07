const jwt = require('jsonwebtoken');
// const User = require('../models/userModel');

const isLoggedIn = async (req, res, next) => {
    try {
        const token = req.cookies.adminJwt || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.redirect('/admin/login?error=access-denied');
        }

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.redirect('/admin/login?error=session-expired');
                }
                return res.redirect('/admin/login?error=invalid-token');
            }

            if (!decoded.id) {

                return res.redirect('/admin/login?error=invalid-token');
            }

            req.user = decoded;
            next();
        });
    } catch (error) {
        return res.redirect('/admin/login?error=internal-error');
    }
};


// const blockeUser = await User.find({ is_blocked: 1 }); WHY THIS IS WRONG line no.30
//because this returns the array of all blocked users and not the specific log ined user 


const isLoggedOut = async (req, res, next) => {
    try {
        if (req.cookies.adminJwt) {
            
            if (req.path === "/admin/login") {
                return res.redirect("/admin/home");
            }
            res.redirect('/admin/home');
        }
        else {
            next();
        }

    } catch (error) {
        next(error);
    }
}

module.exports = {
    isLoggedIn,
    isLoggedOut
};