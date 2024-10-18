//userRoute.js
const express = require('express');
const user_route = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const nocache = require('nocache');
const passport = require('../config/passport');

const {isLoggedIn,isLoggedOut} = require('../middlewares/userAuth');

// View engine
user_route.set('view engine', 'ejs');
user_route.set('views', path.join(__dirname, '../views/users'));


// To parse the data in the POST request body
const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

user_route.use(cookieParser());

user_route.use(nocache());


// Serve static files from the 'public' directory
user_route.use(express.static(path.join(__dirname, '../public/user')));

// Initialize Passport.js
user_route.use(passport.initialize());

// Use controller
const userController = require('../controllers/userController');
const { registerValidator, loginValidator, otpMailValidator, verifyOtpValidator } = require('../helpers/validation');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/cartController');
const { log } = require('console');
// Route for rendering combined login/register page
user_route.get('/auth',isLoggedOut,userController.loadAuth);

// Load the OTP verification page
user_route.get('/verify-otp',isLoggedOut, (req, res) => {
    const { email } = req.query;
    res.render('verify-otp', { user_id: email, errors: [] });
});

//user reg and login
user_route.post('/register',isLoggedOut, registerValidator, userController.userRegister);
user_route.post('/send-otp',isLoggedOut, otpMailValidator, userController.sendOtp);
user_route.post('/verify-otp',isLoggedOut, verifyOtpValidator, userController.verifyOtp);
user_route.post('/login',isLoggedOut, loginValidator, userController.loginUser);

user_route.get('/logout',isLoggedIn,userController.logoutUser);

user_route.get('/home',isLoggedIn,userController.loadUserHome);

//shop-fullwide all products
user_route.get('/allProducts',isLoggedIn,productController.allProductsLoad);
user_route.get('/product-details',isLoggedIn,productController.productDetailsLoad);

user_route.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'  // Forces account selection prompt
}));

user_route.get('/auth/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
        userController.googleAuthCallback(err, user, info, req, res, next);
    })(req, res, next);
});



module.exports = user_route;