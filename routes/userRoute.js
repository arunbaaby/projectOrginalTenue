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
user_route.set('views', path.join(__dirname, '../views/users'));//include in index.js


// To parse the data in the POST request body
const bodyParser = require('body-parser');//make it express.json
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
const cartController = require('../controllers/cartController');
const myAccountController = require('../controllers/myAccountController');
const orderController = require('../controllers/orderController');
const wishlistController = require('../controllers/wishlistController');
const couponController = require('../controllers/couponController');
const offerController = require('../controllers/offerController');

const { log } = require('console');
// Route for rendering home page
user_route.get('/', userController.loadUserHome);

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
user_route.post('/resend-otp',isLoggedOut, userController.resendOtp);
user_route.post('/login',isLoggedOut, loginValidator, userController.loginUser);

user_route.get('/auth/google',isLoggedOut, passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'  // Forces account selection prompt
}));

user_route.get('/auth/google/callback',isLoggedOut, (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
        userController.googleAuthCallback(err, user, info, req, res, next);
    })(req, res, next);
});

user_route.get('/logout',isLoggedIn,userController.logoutUser);

//userAccount
user_route.get('/my-account',isLoggedIn,myAccountController.myAccountLoad);
user_route.post('/add-address',isLoggedIn,myAccountController.addAddress);
user_route.post('/delete-address/:id',isLoggedIn,myAccountController.deleteAddress);
user_route.post('/edit-address/:id',isLoggedIn,myAccountController.editAddress);
user_route.post('/edit-user-profile',isLoggedIn,myAccountController.editUserProfile);

//forgot Password
user_route.get('/forgot-password',userController.loadForgotPassword);
user_route.post('/forgot-password-link',userController.forgotPasswordLink);
user_route.get('/reset-password',userController.resetPassword);
user_route.post('/new-password',userController.newPasswordUpdate);


user_route.get('/home',isLoggedIn,userController.loadUserHome);

//shop-fullwide all products
user_route.get('/allProducts',isLoggedIn,productController.allProductsLoad);
user_route.get('/product-details',isLoggedIn,productController.productDetailsLoad);

//cart
user_route.post('/add-to-cart',isLoggedIn,cartController.addToCart);
user_route.get('/cart',isLoggedIn,cartController.loadCart);
user_route.get('/delete-cart-item/:itemId',isLoggedIn,cartController.deleteCartItem);
user_route.post('/update-cart-item',isLoggedIn,cartController.updateCartQuantity);

//wishlist
user_route.get('/wishlist',isLoggedIn,wishlistController.loadWishlist);
user_route.post('/add-to-wishlist',isLoggedIn,wishlistController.addToWishlist);
user_route.post('/remove-from-wishlist',isLoggedIn,wishlistController.removeFromWishlist);


//order(checkout)
user_route.get('/order',isLoggedIn,orderController.loadCheckout);
user_route.post('/place-order',isLoggedIn,orderController.placeOrder);
user_route.get('/order-confirmation',isLoggedIn,orderController.loadOrderConfirmation);
user_route.get('/my-orders',isLoggedIn,orderController.loadMyOrders);
user_route.get('/view-order',isLoggedIn,orderController.loadViewOrder);
user_route.post('/cancel-order-item',isLoggedIn,orderController.cancelOrderItem);
// user_route.post('/return-order-item',isLoggedIn,orderController.returnOrderItem);
user_route.post('/submit-return-request',isLoggedIn,orderController.returnOrderRequest);

user_route.get('/retry-payment/:orderId',isLoggedIn,orderController.retryPayment);

//verify payment
user_route.post('/verify-payment',isLoggedIn,orderController.verifyPayment);

//notify payment failure to update payment status
user_route.post('/notify-payment-failure',isLoggedIn,orderController.notifyPaymentFailure);

//apply coupon
user_route.post('/apply-coupon',isLoggedIn,couponController.applyCoupon);
user_route.post('/remove-coupon',isLoggedIn,couponController.removeCoupon);

//referral code
user_route.post('/apply-referral-code',isLoggedIn,offerController.applyReferralCode);

//404
user_route.get('/404',isLoggedIn,userController.load404);
user_route.get('/unlisted-product',isLoggedIn,userController.loadUnlistedProduct);
user_route.get('/prompt-login',userController.loadPromtLogin);





module.exports = user_route;