//userController.js
const User = require('../models/userModel');
const Otp = require('../models/otpModel');
const bcrypt = require('bcrypt');
const otpgenerator = require('otp-generator');
const crypto = require('crypto');

const { validationResult } = require('express-validator');

const mailer = require('../helpers/mailer');
const { oneMinuteExpiry, threeMinuteExpiry } = require('../helpers/otpValidate');

//product feature
const { getNewArrivals, getNewCategoriesWithLatestProducts, getFeaturedProducts, getProductsWithMostDiscount, getMostSoldProducts } = require('../helpers/productFeatureHelper');

const { generateAccessToken } = require('../utils/generateAccessToken');

const jwt = require('jsonwebtoken');
const { token } = require('morgan');
const { log } = require('console');

// First we have to show the register page..async method
const loadAuth = async (req, res) => {
    try {
        const message = req.query.message || null;

        res.render('auth', { message });
    } catch (error) {
        console.log(error.message);
    }
}

const generateAndSendOTP = async (userData) => {

    const g_otp = otpgenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false,
        digits: true
    });

    await Otp.findOneAndUpdate(
        { user_id: userData.email },
        { otp: g_otp, timestamp: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('generateAndSendOTP 3');

    const msg = `<p>Hi ${userData.name}, please use the following OTP to verify your account: <b>${g_otp}</b></p>`;
    await mailer.sendMail(userData.email, 'OTP Verification', msg);


    return g_otp;
}

const pendingUsers = {};

const userRegister = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).render('auth', {
                registerErrors: errors.array(), // Registration errors
                loginErrors: [],                // No login errors
                success: false,
                msg: ''
            });
        }

        const { name, email, mobile, password } = req.body;

        const isExist = await User.findOne({ email });
        if (isExist) {
            return res.status(400).render('auth', {
                registerErrors: [{ msg: 'Email already exists' }],  // Custom error for login
                loginErrors: [],                                           // No registration errors
                success: false,
                msg: ''
            });
        }

        // user data temporarily
        pendingUsers[email] = { name, email, mobile, password }

        const userData = { name, email };

        await generateAndSendOTP(userData);

        return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (error) {
        console.log(`Registration error: ${error.message}`);
        return res.status(400).render('auth', {
            errors: [{ msg: error.message }],
            success: false,
            msg: ''
        });
    }
}

const sendOtp = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                msg: 'Errors',
                errors: errors.array()
            });
        }

        const { email } = req.body;
        const userData = await User.findOne({ email });
        if (!userData) {
            return res.status(400).json({
                success: false,
                msg: "Email doesn't exist!"
            });
        }

        const oldOtpData = await Otp.findOne({ user_id: userData._id });
        if (oldOtpData) {
            const sendNextOtp = await oneMinuteExpiry(oldOtpData.timestamp);
            if (!sendNextOtp) {
                return res.status(400).json({
                    success: false,
                    msg: 'Please try after sometime'
                });
            }
        }

        // Generate and send OTP
        await generateAndSendOTP(userData);

        return res.status(200).json({
            success: true,
            msg: 'OTP has been sent to your email',
        });
    } catch (error) {
        console.log(`Send OTP error: ${error.message}`);
        return res.status(400).json({
            success: false,
            msg: error.message
        });
    }
}

const verifyOtp = async (req, res) => {
    try {
        const { user_id, otp } = req.body;

        const otpData = await Otp.findOne({ user_id, otp });
        if (!otpData) {
            return res.status(400).json({ success: false, error: 'You have entered the wrong OTP' });
        }

        const isOtpExpired = await threeMinuteExpiry(otpData.timestamp);
        if (isOtpExpired) {
            return res.status(400).json({ success: false, error: 'Your OTP has expired' });
        }

        const { name, mobile, password } = pendingUsers[user_id];
        const hashPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email: user_id,
            mobile,
            password: hashPassword,
            is_verified: 1,
        });

        await user.save();
        delete pendingUsers[user_id];

        return res.status(200).json({ success: true, message: 'User registration successful' });
    } catch (error) {
        console.error('Verify OTP Error:', error.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};


// const verifyOtp = async (req, res) => {
//     try {
//         const errors = validationResult(req);

//         if (!errors.isEmpty()) {
//             return res.status(400).render('verify-otp', {
//                 user_id: req.body.user_id,
//                 errors: errors.array()
//             });
//         }

//         //user email is stored in the otp model as user_id
//         const { user_id, otp } = req.body;

//         const otpData = await Otp.findOne({
//             user_id,
//             otp
//         });

//         if (!otpData) {
//             return res.status(400).render('verify-otp', {
//                 user_id,
//                 errors: [{ msg: 'You have entered the wrong OTP' }]
//             });
//         }

//         const isOtpExpired = await threeMinuteExpiry(otpData.timestamp);
//         if (isOtpExpired) {
//             return res.status(400).render('verify-otp', {
//                 user_id,
//                 errors: [{ msg: 'Your OTP has expired' }]
//             });
//         }

//         const { name, mobile, password } = pendingUsers[user_id];

//         const hashPassword = await bcrypt.hash(password, 10);

//         const user = new User({
//             name,
//             email: user_id,
//             mobile,
//             password: hashPassword,
//             is_verified: 1
//         });

//         await user.save();
//         delete pendingUsers[user_id];

//         res.redirect('/auth?message=User registration successful');
//         // return res.status(200).json({
//         //     success: true,
//         //     msg: 'User verification successful'
//         // });

//     } catch (error) {
//         return res.status(400).render('verify-otp', {
//             user_id: req.body.user_id,
//             errors: [{ msg: error.message }]
//         });
//     }
// }


const resendOtp = async (req, res) => {
    try {
        const { user_id } = req.body;

        const pendingUser = pendingUsers[user_id];
        if (!pendingUser) {
            return res.status(400).json({ success: false, error: 'User not found or OTP already verified.' });
        }

        const oldOtpData = await Otp.findOne({ user_id });
        if (oldOtpData) {
            const canSendOtp = await oneMinuteExpiry(oldOtpData.timestamp);
            if (!canSendOtp) {
                return res.status(400).json({ success: false, error: 'Please try resending the OTP after some time.' });
            }
        }

        const userData = { email: user_id, name: pendingUser.name };
        await generateAndSendOTP(userData);

        return res.status(200).json({ success: true, message: 'A new OTP has been sent to your email.' });
    } catch (error) {
        console.error('Resend OTP Error:', error.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};


// const resendOtp = async (req, res) => {
//     try {
//         const { user_id } = req.body;

//         const pendingUser = pendingUsers[user_id];
//         if (!pendingUser) {
//             return res.status(400).render('verify-otp', {
//                 user_id,
//                 errors: [{ msg: "User not found or OTP already verified." }]
//             });
//         }

//         //timelimit for resend otp
//         const oldOtpData = await Otp.findOne({ user_id });
//         if (oldOtpData) {
//             const canSendOtp = await oneMinuteExpiry(oldOtpData.timestamp);
//             if (!canSendOtp) {
//                 return res.status(400).render('verify-otp', {
//                     user_id,
//                     errors: [{ msg: 'Please try resending the OTP after some time.' }]
//                 });
//             }
//         }

//         const userData = { email: user_id, name: pendingUser.name };
//         await generateAndSendOTP(userData);

//         return res.status(200).render('verify-otp', {
//             user_id,
//             errors: [{ msg: 'A new OTP has been sent to your email.' }]
//         });
//     } catch (error) {
//         console.log(`Resend OTP error: ${error.message}`);
//         return res.status(400).render('verify-otp', {
//             user_id: req.body.user_id,
//             errors: [{ msg: error.message }]
//         });
//     }
// };




const loginUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render('auth', {
                loginErrors: errors.array(),    // Login errors
                registerErrors: [],             // No registration errors
                success: false,
                msg: ''
            });
        }

        const { email, password } = req.body;
        console.log('Email:', email);

        const userData = await User.findOne({ email });
        if (!userData) {
            console.log('User not found');
            return res.status(401).render('auth', {
                loginErrors: [{ msg: 'User not found' }],  // Custom error for login
                registerErrors: [],                                           // No registration errors
                success: false,
                msg: ''
            });
        }

        if (userData.is_blocked === 1) {
            console.log('User is blocked');
            return res.status(401).render('auth', {
                loginErrors: [{ msg: 'User is blocked' }],  // Custom error for login
                registerErrors: [],                                           // No registration errors
                success: false,
                msg: ''
            });
        }

        if (!userData.password) {
            return res.status(401).render('auth', {
                loginErrors: [{ msg: 'Password is missing in the database. Contact support.' }],
                registerErrors: [],
                success: false,
                msg: ''
            });
        }


        const passwordMatch = userData.password && await bcrypt.compare(password, userData.password);

        if (!passwordMatch) {
            console.log('Password mismatch');
            return res.status(401).render('auth', {
                loginErrors: [{ msg: 'Email and Password are incorrect' }],  // Custom error for login
                registerErrors: [],                                           // No registration errors
                success: false,
                msg: ''
            });
        }

        const accessToken = generateAccessToken(userData._id); // Pass `userData._id`


        console.log('Generated token:', accessToken);

        res.cookie('jwt', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 2 * 60 * 60 * 1000, // 2 hours
        });

        console.log('Login successful:', email);
        return res.redirect('/home');

    } catch (error) {
        console.error('Login Error:', error.message);
        return res.status(400).json({
            success: false,
            msg: error.message
        });
    }
};







// const generateAccessToken = async (user) => {
//     const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
//     return token;
// }

const loadUserHome = async (req, res) => {
    try {
        const newArrivals = await getNewArrivals();
        const newCategoryProduct = await getNewCategoriesWithLatestProducts();
        const featuredProducts = await getFeaturedProducts();
        const mostDiscountProduct = await getProductsWithMostDiscount();
        const mostSoldProducts = await getMostSoldProducts();

        res.render('userHome', { newArrivals, newCategoryProduct, featuredProducts, mostDiscountProduct, mostDiscountProduct, mostSoldProducts });
    } catch (error) {
        console.log(error);

    }
}


const googleAuthCallback = (err, user, info, req, res, next) => {
    try {
        if (err) {
            return res.status(500).render('auth', {
                loginErrors: [{ msg: 'Internal server error. Please try again later.' }],
                registerErrors: [],
                success: false,
                msg: ''
            });
        }

        if (!user) {
            return res.status(401).render('auth', {
                loginErrors: [{ msg: info ? info.message : 'Login failed' }],
                registerErrors: [],
                success: false,
                msg: ''
            });
        }

        // If user is successfully authenticated, set the JWT token in the cookies
        const accessToken = user.token;
        res.cookie('jwt', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 2 * 60 * 60 * 1000 // 2 hours
        });

        // Redirect to the home page after successful authentication
        res.redirect('/home');
    } catch (error) {
        console.error('Google Auth Callback Error:', error);
        return res.status(500).render('auth', {
            loginErrors: [{ msg: 'Authentication error. Please try again later.' }],
            registerErrors: [],
            success: false,
            msg: ''
        });
    }
};


const logoutUser = async (req, res) => {
    try {
        // Clear the JWT cookie
        res.clearCookie('jwt', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        });

        res.redirect('/auth');
    } catch (error) {
        console.error('Logout Error:', error.message);
        return res.status(400).json({
            success: false,
            msg: error.message
        });
    }
}


const loadForgotPassword = async (req, res) => {
    try {
        res.render('forgotPassword');
    } catch (error) {
        console.error('Logout Error:', error.message);
        return res.status(400).json({
            success: false,
            msg: error.message
        });
    }
}

const forgotPasswordLink = async (req, res) => {
    try {
        const userEmail = req.body.email;
        console.log(userEmail);

        const user = await User.findOne({ email: userEmail });
        console.log(user);

        if (!user) {
            return res.status(404).render("forgotPassword", { userNotFound: true });
        }

        // random token
        const resetToken = crypto.randomBytes(32).toString("hex");
        console.log(resetToken);


        // Set token and expiration on the user's record
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
        await user.save();

        const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;
        console.log(resetLink);


        // email content
        const subject = "Password Reset Request";
        const content = `
          <p>Hello,</p>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetLink}">Reset Password</a>
          <p>This link is valid for 1 hour. If you did not request a password reset, please ignore this email.</p>
        `;

        // Send the email
        await mailer.sendMail(userEmail, subject, content);

        res.render("forgotPassword", { success: true });
    } catch (error) {
        res.render("forgotPassword", { error: true });
    }
}

const resetPassword = async (req, res) => {
    const token = req.query.token;
    console.log("reset:", token);
    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.render("reset-password", { token: null, invalidToken: true });
        }

        return res.render("reset-password", { token, invalidToken: false });
    } catch (error) {
        console.error("Error finding user by token:", error);
        res.status(500).send("Server error");
    }
};


const newPasswordUpdate = async (req, res) => {
    const { token } = req.body;  // changed to req.body for hidden input
    const { password } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.render("reset-password", { token, invalidToken: true });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return res.redirect('/auth');
    } catch (error) {
        console.error("Error resetting password:", error);
        return res.render("reset-password", { token, serverError: true });
    }
};

const load404 = async (req, res) => {
    try {
        res.render('404');
    } catch (error) {
        console.error("Error resetting password:", error);
        return res.render("reset-password", { token, serverError: true });
    }
}






module.exports = {
    loadAuth,
    userRegister,
    loginUser,
    sendOtp,
    verifyOtp,
    resendOtp,
    loadUserHome,
    logoutUser,
    googleAuthCallback,
    loadForgotPassword,
    forgotPasswordLink,
    resetPassword,
    newPasswordUpdate,
    load404
}
