//userController.js
const User = require('../models/userModel');
const Otp = require('../models/otpModel');
const bcrypt = require('bcrypt');
const otpgenerator = require('otp-generator');

const { validationResult } = require('express-validator');

const mailer = require('../helpers/mailer');
const { oneMinuteExpiry, threeMinuteExpiry } = require('../helpers/otpValidate');

const { generateAccessToken } = require('../utils/generateAccessToken');

const jwt = require('jsonwebtoken');
const { token } = require('morgan');

// First we have to show the register page..async method
const loadAuth = async (req, res) => {
    try {

        res.render('auth');
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
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).render('verify-otp', {
                user_id: req.body.user_id,
                errors: errors.array()
            });
        }

        const { user_id, otp } = req.body;

        const otpData = await Otp.findOne({
            user_id,
            otp
        });

        if (!otpData) {
            return res.status(400).render('verify-otp', {
                user_id,
                errors: [{ msg: 'You have entered the wrong OTP' }]
            });
        }

        const isOtpExpired = await threeMinuteExpiry(otpData.timestamp);
        if (isOtpExpired) {
            return res.status(400).render('verify-otp', {
                user_id,
                errors: [{ msg: 'Your OTP has expired' }]
            });
        }

        const { name, mobile, password } = pendingUsers[user_id];

        const hashPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email: user_id,
            mobile,
            password: hashPassword,
            is_verified: 1
        });

        const userData = await user.save();
        delete pendingUsers[user_id];

        res.redirect('/auth');
        // return res.status(200).json({
        //     success: true,
        //     msg: 'User verification successful'
        // });

    } catch (error) {
        return res.status(400).render('verify-otp', {
            user_id: req.body.user_id,
            errors: [{ msg: error.message }]
        });
    }
}


const resendOtp = async (req, res) => {
    try {
        const { user_id } = req.body;

        const pendingUser = pendingUsers[user_id];
        if (!pendingUser) {
            return res.status(400).render('verify-otp', {
                user_id,
                errors: [{ msg: "User not found or OTP already verified." }]
            });
        }

        //timelimit for resend otp
        const oldOtpData = await Otp.findOne({ user_id });
        if (oldOtpData) {
            const canSendOtp = await oneMinuteExpiry(oldOtpData.timestamp);
            if (!canSendOtp) {
                return res.status(400).render('verify-otp', {
                    user_id,
                    errors: [{ msg: 'Please try resending the OTP after some time.' }]
                });
            }
        }

        const userData = { email: user_id, name: pendingUser.name };
        await generateAndSendOTP(userData);

        return res.status(200).render('verify-otp', {
            user_id,
            errors: [{ msg: 'A new OTP has been sent to your email.' }]
        });
    } catch (error) {
        console.log(`Resend OTP error: ${error.message}`);
        return res.status(400).render('verify-otp', {
            user_id: req.body.user_id,
            errors: [{ msg: error.message }]
        });
    }
};




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

        const passwordMatch = await bcrypt.compare(password, userData.password);
        if (!passwordMatch) {
            console.log('Password mismatch');
            return res.status(401).render('auth', {
                loginErrors: [{ msg: 'Email and Password are incorrect' }],  // Custom error for login
                registerErrors: [],                                           // No registration errors
                success: false,
                msg: ''
            });
        }

        const accessToken = await generateAccessToken({ id: userData._id });
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
        res.render('userHome');
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


const logoutUser = async (req,res)=>{
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

module.exports = {
    loadAuth,
    userRegister,
    loginUser,
    sendOtp,
    verifyOtp,
    resendOtp,
    loadUserHome,
    logoutUser,
    googleAuthCallback
}
