//adminRoute.js
const express = require('express');
const admin_route = express();
const path = require('path');
const cookieParser = require('cookie-parser');
//jwt is passed as cookie ..so we need to parse it

// View engine
admin_route.set('view engine', 'ejs');
admin_route.set('views', path.join(__dirname, '../views/admin'));

// To parse the data in the POST request body
const bodyParser = require('body-parser');
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));

admin_route.use(cookieParser());

// Serve static files from the 'public' directory
admin_route.use(express.static(path.join(__dirname, '../public/admin')));

const adminController = require('../controllers/adminController');
const {isLoggedIn,isLoggedOut} = require('../middlewares/adminAuth');

const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController');
const salesReportController = require('../controllers/salesReportController');
const offerController = require('../controllers/offerController');

// Route to get admin login
admin_route.get('/login',isLoggedOut, adminController.loadLogin);

// Route to handle admin login POST request
admin_route.post('/login',isLoggedOut, adminController.adminLogin);

//admin logout
admin_route.get('/logout',isLoggedIn,adminController.adminLogout);

admin_route.get('/home',isLoggedIn,adminController.loadHome);
admin_route.get('/best-selling',isLoggedIn,adminController.loadBestSelling);

// customer management
admin_route.get('/customers',isLoggedIn,adminController.userList);
admin_route.post('/block-user/:user_id',isLoggedIn, adminController.blockUser);
admin_route.post('/unblock-user/:user_id',isLoggedIn, adminController.unblockUser);


// category management
admin_route.get('/category',isLoggedIn,adminController.loadCategory);
// admin_route.post('/category',isLoggedIn,categoryController.createCategory);
admin_route.get('/edit-category',isLoggedIn,categoryController.editCategoryLoad);
admin_route.post('/edit-category',isLoggedIn,categoryController.updateCategory);
admin_route.get('/delete-category',isLoggedIn,categoryController.deleteCategory);
admin_route.get('/restore-category',isLoggedIn,categoryController.restoreCategory);
admin_route.get('/add-category',isLoggedIn,categoryController.loadAddCategory);
admin_route.post('/add-category',isLoggedIn,categoryController.createCategory);

//product management
admin_route.get('/product',isLoggedIn,productController.productLoad);
admin_route.get('/add-product',isLoggedIn,productController.addProductsLoad);
const upload = require('../config/multerConfig');
admin_route.post('/add-product',isLoggedIn, upload.array('images', 3), productController.addProduct);
admin_route.get('/delete-product',isLoggedIn,productController.deleteProduct);
admin_route.get('/restore-product',isLoggedIn,productController.restoreProduct);
admin_route.get('/edit-product',isLoggedIn,productController.editProductLoad);
admin_route.post('/edit-product',isLoggedIn, upload.array('images', 3), productController.updateProduct);
admin_route.delete('/delete-product-img',isLoggedIn,productController.deleteProductImage);

//order
admin_route.get('/order',isLoggedIn,adminController.loadOrderAdmin);
admin_route.get('/order-details',isLoggedIn,adminController.loadAdminOrderDetails);
admin_route.post('/change-order-status/:id',isLoggedIn,orderController.changeOrderStatus);
//order return
admin_route.post('/accept-return',isLoggedIn,orderController.acceptReturnRequest);
admin_route.post('/reject-return',isLoggedIn,orderController.rejectReturnRequest);

//coupon management
admin_route.get('/coupon',isLoggedIn,couponController.loadCouponList);
admin_route.get('/create-coupon',isLoggedIn,couponController.loadCreateCoupon);
admin_route.post('/create-coupon',isLoggedIn,couponController.createCoupon);
admin_route.post('/deactivate-coupon/:id',isLoggedIn,couponController.deactivateCoupon);
admin_route.post('/activate-coupon/:id',isLoggedIn,couponController.activateCoupon);
admin_route.get('/edit-coupon/:id',isLoggedIn,couponController.loadEditCoupon);

//sales report
admin_route.get('/sales-report', isLoggedIn,salesReportController.loadSalesReport);
admin_route.post('/sales-date-filter',isLoggedIn,salesReportController.customDateFilter);
admin_route.post('/sales-report-filter',isLoggedIn,salesReportController.filterSalesReport);

//product offer
admin_route.get('/product-offer',isLoggedIn,offerController.loadProductOffer);
admin_route.get('/add-product-offer',isLoggedIn,offerController.loadAddProductOffer);
admin_route.post('/add-product-offer',isLoggedIn,offerController.addProductOffer);
admin_route.post('/delete-product-offer',isLoggedIn,offerController.deleteProductOffer);
admin_route.post('/restore-product-offer',isLoggedIn,offerController.restoreProductOffer);
admin_route.get('/edit-product-offer',isLoggedIn,offerController.loadEditProductOffer);
admin_route.post('/edit-product-offer',isLoggedIn,offerController.editProductOffer);

//category offers
admin_route.get('/category-offer',isLoggedIn,offerController.loadCategoryOffer);
admin_route.get('/add-category-offer',isLoggedIn,offerController.loadAddCategoryOffer);
admin_route.post('/add-category-offer',isLoggedIn,offerController.addCategoryOffer);
admin_route.post('/delete-category-offer',isLoggedIn,offerController.deleteCategoryOffer);
admin_route.post('/restore-category-offer',isLoggedIn,offerController.restoreCategoryOffer);
admin_route.get('/edit-category-offer',isLoggedIn,offerController.loadEditCategoryOffer);
admin_route.post('/edit-category-offer',isLoggedIn,offerController.editCategoryOffer);



module.exports = admin_route;   