const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware to check if user is logged in
const isLoggedIn = async (req, res, next) => {
    console.log("isLoggedIn middleware triggered"); // Check if middleware is called
    try {
        const token = req.cookies.jwt || req.headers.authorization?.split(' ')[1];

        if (!token) {
            console.log("No token found, redirecting to login.");
            return res.status(401).render('auth', {
                success: false,
                msg: 'Access denied. Please login first.',
            });
        }

        // Verify JWT
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    console.log("Token expired");
                    return res.status(403).render('auth', {
                        success: false,
                        msg: 'Session expired. Please login again.',
                    });
                }
                console.log("Invalid token");
                return res.status(403).render('auth', {
                    success: false,
                    msg: 'Invalid token. Please login again.',
                });
            }

            console.log(`Decoded user ID: ${decoded.id}`);
            if (!decoded.id) {
                console.log("No user ID found in the decoded token.");
                return res.status(403).render('auth', {
                    success: false,
                    msg: 'Invalid token. Please login again.',
                });
            }

            const blockedUser = await User.findOne({ _id: decoded.id, is_blocked: 1 });
            if (blockedUser) {
                console.log(`User with ID ${decoded.id} has been blocked. Logging out.`);
                res.clearCookie('jwt', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'Strict'
                });
                return res.redirect('/auth');
            }

            req.user = decoded;
            next();
        });
    } catch (error) {
        console.error('JWT Authentication Error:', error.message);
        return res.status(500).render('auth', {
            success: false,
            msg: 'An internal error occurred. Please try again later.',
        });
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


// const isLoggedOut = (req, res, next) => {
//     try {
//         // Check for token in cookies or authorization header
//         const token = req.cookies.jwt || req.headers.authorization?.split(' ')[1];
//         console.log('Token in isLoggedOut:', token);

//         if (token) {
//             jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
//                 console.log('Token verification result:', err, user);
//                 if (!err) {
//                     // Token is valid, user is logged in
//                     return res.status(403).render('auth', {
//                         success: false,
//                         msg: 'You are already logged in. Please logout first.',
//                     });
//                 }
//                 next();
//             });
//         } else {
//             next(); // No token, proceed to login
//         }
//     } catch (error) {
//         console.error('JWT Authentication Error:', error.message);
//         return res.status(500).render('auth', {
//             success: false,
//             msg: 'An internal error occurred. Please try again later.',
//         });
//     }
// };





// const authenticateToken = (req, res, next) => {
//     try {
//         const token = req.cookies.jwt; // Retrieve the token from the cookie

//         if (!token) {
//             return res.status(401).render('auth', {
//                 success: false,
//                 msg: 'Access denied. Please login first.',
//             });
//         }

//         jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
//             if (err) {
//                 //separate error when the token expires
//                 if (err.name === 'TokenExpiredError') {
//                     return res.status(403).render('auth', {
//                         success: false,
//                         msg: 'Session expired. Please login again.'
//                     });
//                 }
//                 return res.status(403).render('auth', {
//                     success: false,
//                     msg: 'Invalid token. Please login again.',
//                 });
//             }

//             req.user = user; // Store user information in request object
//             next();
//         });
//     } catch (error) {
//         // Catch and handle unexpected errors
//         console.error('JWT Authentication Error:', error.message);
//         return res.status(500).render('auth', {
//             success: false,
//             msg: 'An internal error occurred. Please try again later.'
//         });
//     }
// };

// const isLoggedIn = (req, res, next) => {
//     // Get the token from headers, cookies, or query
//     const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token || req.query?.token;

//     if (!token) {
//       return res.status(401).json({ message: 'Access denied, no token provided' });
//     }

//     // Verify token
//     const decoded = verifyToken(token);
//     if (!decoded) {
//       return res.status(401).json({ message: 'Invalid or expired token' });
//     }

//     // Attach user info to the request (req.user) and proceed
//     req.user = decoded;
//     next();
//   };






module.exports = {
    isLoggedIn,
    isLoggedOut
};