const express = require('express');
const user_route = express();
const path = require('path');
const cookieParser = require('cookie-parser');

const authenticateToken = require('../middlewares/userAuth');

// View engine
user_route.set('view engine', 'ejs');
user_route.set('views', path.join(__dirname, '../views/users'));


// To parse the data in the POST request body
const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

user_route.use(cookieParser());

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

//user reg and login
user_route.post('/register', registerValidator, userController.userRegister);
user_route.post('/send-otp', otpMailValidator, userController.sendOtp);
user_route.post('/verify-otp', verifyOtpValidator, userController.verifyOtp);
user_route.post('/login', loginValidator, userController.loginUser);

user_route.get('/home',authenticateToken,userController.loadUserHome);

//shop-fullwide all products
user_route.get('/allProducts',authenticateToken,productController.allProductsLoad);
user_route.get('/product-details',authenticateToken,productController.productDetailsLoad);

module.exports = user_route;