const { check } = require('express-validator');

exports.registerValidator = [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Valid email is required').isEmail().normalizeEmail({
        gmail_remove_dots: true
    }),
    check('mobile', 'Valid mobile number is required')
    .isLength({ min: 10, max: 10 }),
    // .isMobilePhone('any', { strictMode: true }),

    check('password', 'Password must be at least 6 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character')
    .isStrongPassword({
        minLength: 6,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    })

];

exports.loginValidator = [
    check('email', 'Valid email is required').isEmail().normalizeEmail({
        gmail_remove_dots: true
    }),
    check('password', 'Password is required').not().isEmpty(),
]

exports.otpMailValidator = [
    check('email', 'Valid email is required').isEmail().normalizeEmail({
        gmail_remove_dots: true
    }),
]

exports.verifyOtpValidator = [
    check('user_id', 'user_id is required').not().isEmpty(),
    check('otp', 'OTP is required').not().isEmpty(),
]