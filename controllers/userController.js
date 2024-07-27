const User = require('../models/userModel');
const Otp = require('../models/otpModel');
const bcrypt = require('bcrypt');
const otpgenerator = require('otp-generator');

const { validationResult } = require('express-validator');

const mailer = require('../helpers/mailer');
const {oneMinuteExpiry, threeMinuteExpiry} = require('../helpers/otpValidate');

const jwt = require('jsonwebtoken');

//first we have to show the register page..async method
const loadAuth = async (req, res) => {
    try {
        res.render('auth');
    } catch (error) {
        console.log(error.message);
    }
}

const generateAndSendOTP = async (userData) => {
    // Generate OTP
    const g_otp = otpgenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false,
        digits: true
    });

    // Update or insert OTP in database
    await Otp.findOneAndUpdate(
        { user_id: userData._id },
        { otp: g_otp, timestamp: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send OTP to user's email
    const msg = `<p>Hi ${userData.name}, please use the following OTP to verify your account: <b>${g_otp}</b></p>`;
    await mailer.sendMail(userData.email, 'OTP Verification', msg);

    return g_otp;
}

const userRegister = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).render('auth', {
                errors: errors.array(), // Pass validation errors to the view
                success: false,
                msg: ''
            });
        }

        const { name, email, mobile, password } = req.body;

        // Does the user email already exist
        const isExist = await User.findOne({ email });
        if (isExist) {
            return res.status(400).render('auth', {
                errors: [{ msg: 'Email already exists' }],
                success: false,
                msg: ''
            });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            mobile,
            password: hashPassword,
            is_verified: 0 // Set verified status to false initially
        });
        const userData = await user.save();

        // Generate and send OTP
        await generateAndSendOTP(userData);

        // Redirect to OTP verification page
        return res.redirect(`/verify-otp?user_id=${userData._id}`);
    } catch (error) {
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

        await User.findByIdAndUpdate({ _id: user_id }, {
            $set: { is_verified: 1 }
        });

        return res.status(200).json({
            success: true,
            msg: 'Your account is verified'
        });
    } catch (error) {
        return res.status(400).render('verify-otp', {
            user_id: req.body.user_id,
            errors: [{ msg: error.message }]
        });
    }
}

const loginUser = async (req, res) => {
    try {
        // Validate the request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation Errors:', errors.array()); // Log validation errors
            return res.status(400).json({
                success: false,
                msg: 'Errors',
                errors: errors.array()
            });
        }

        // Extract email and password from request body
        const { email, password } = req.body;
        console.log('Email:', email); // Log the email input
        console.log('Password:', password); // Log the password input (careful with logging sensitive data)

        // Find user by email
        const userData = await User.findOne({ email });
        if (!userData) {
            return res.status(401).json({
                success: false,
                msg: 'Email and Password are incorrect'
            });
        }

        // Compare provided password with stored hashed password
        const passwordMatch = await bcrypt.compare(password, userData.password);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                msg: 'Email and Password are incorrect'
            });
        }

        // Generate JWT token
        const accessToken = await generateAccessToken({ user: userData });
        return res.status(200).json({
            success: true,
            msg: 'Login successful',
            user: userData,
            accessToken: accessToken,
            tokenType: 'Bearer'
        });

    } catch (error) {
        console.error('Login Error:', error.message); // Log any errors
        return res.status(400).json({
            success: false,
            msg: error.message
        });
    }
}

const generateAccessToken = async (user) => {
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
    return token;
}

module.exports = {
    loadAuth,
    userRegister,
    loginUser,
    sendOtp,
    verifyOtp
}

