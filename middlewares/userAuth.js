const jwt = require('jsonwebtoken');

const isLoggedIn = (req, res, next) => {
    try {
        const token = req.cookies.jwt || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).render('auth', {
                success: false,
                msg: 'Access denied. Please login first.',
            });
        }

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(403).render('auth', {
                        success: false,
                        msg: 'Session expired. Please login again.',
                    });
                }
                return res.status(403).render('auth', {
                    success: false,
                    msg: 'Invalid token. Please login again.',
                });
            }

            req.user = user; // Attach user info to the request
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

const isLoggedOut= async(req,res,next)=>{
    try{
        if(req.cookies.token ){
            res.redirect('/home')
        }
       else{ next()
       }

    }catch(error){
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