const express = require('express');
const user_route = express();
const path = require('path');

// View engine
user_route.set('view engine', 'ejs');
user_route.set('views', path.join(__dirname, '../views/users'));


// To parse the data in the POST request body
const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
user_route.use(express.static(path.join(__dirname, '../public/user')));

// Use controller
const userController = require('../controllers/userController');
const { registerValidator, loginValidator, otpMailValidator, verifyOtpValidator } = require('../helpers/validation');
const productController = require('../controllers/productController');
// Route for rendering combined login/register page
user_route.get('/auth', userController.loadAuth);

// Load the OTP verification page
user_route.get('/verify-otp', (req, res) => {
    const { email } = req.query;
    res.render('verify-otp', { user_id: email, errors: [] });
});



// // Route for rendering OTP verification page
// user_route.get('/verify-otp', (req, res) => {
//     const { user_id } = req.query;
//     res.render('verify-otp', { user_id, errors: [] });
// });

// Routes for form submissions
user_route.post('/register', registerValidator, userController.userRegister);

// Route to login
user_route.post('/login', loginValidator, userController.loginUser);

// Route to send OTP
user_route.post('/send-otp', otpMailValidator, userController.sendOtp);

// Route to verify OTP
user_route.post('/verify-otp', verifyOtpValidator, userController.verifyOtp);

user_route.get('/home',userController.loadUserHome);

//shop-fullwide all products
user_route.get('/allProducts',productController.allProductsLoad);

module.exports = user_route;