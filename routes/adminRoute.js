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
const authenticateToken = require('../middlewares/adminAuth');

const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController');
const salesReportController = require('../controllers/salesReportController');
const offerController = require('../controllers/offerController');

// Route to get admin login
admin_route.get('/login', adminController.loadLogin);

// Route to handle admin login POST request
admin_route.post('/login', adminController.adminLogin);

admin_route.get('/home',authenticateToken,adminController.loadHome);


// customer management
admin_route.get('/customers',adminController.userList);
admin_route.post('/block-user/:user_id', adminController.blockUser);
admin_route.post('/unblock-user/:user_id', adminController.unblockUser);


// category management
admin_route.get('/category',adminController.loadCategory);
admin_route.post('/category',categoryController.createCategory);
admin_route.get('/edit-category',categoryController.editCategoryLoad);
admin_route.post('/edit-category',categoryController.updateCategory);
admin_route.get('/delete-category',categoryController.deleteCategory);
admin_route.get('/restore-category',categoryController.restoreCategory);

//product management
admin_route.get('/product',productController.productLoad);
admin_route.get('/add-product',productController.addProductsLoad);
const upload = require('../config/multerConfig');
admin_route.post('/add-product', upload.array('images', 3), productController.addProduct);
admin_route.get('/delete-product',productController.deleteProduct);
admin_route.get('/restore-product',productController.restoreProduct);
admin_route.get('/edit-product',productController.editProductLoad);
admin_route.post('/edit-product', upload.array('images', 3), productController.updateProduct);
admin_route.delete('/delete-product-img',productController.deleteProductImage);

//order
admin_route.get('/order',adminController.loadOrderAdmin);
admin_route.get('/order-details',adminController.loadAdminOrderDetails);
admin_route.post('/change-order-status/:id',orderController.changeOrderStatus);

//coupon management
admin_route.get('/coupon',couponController.loadCouponList);
admin_route.get('/create-coupon',couponController.loadCreateCoupon);
admin_route.post('/create-coupon',couponController.createCoupon);
admin_route.post('/deactivate-coupon/:id',couponController.deactivateCoupon);
admin_route.post('/activate-coupon/:id',couponController.activateCoupon);

//sales report
admin_route.get('/sales-report',salesReportController.loadSalesReport);
admin_route.post('/sales-date-filter',salesReportController.customDateFilter);
admin_route.post('/sales-report-filter',salesReportController.filterSalesReport);

//product offer
admin_route.get('/product-offer',offerController.loadProductOffer);
admin_route.get('/add-product-offer',offerController.loadAddProductOffer);
admin_route.post('/add-product-offer',offerController.addProductOffer);
admin_route.post('/delete-product-offer',offerController.deleteProductOffer);
admin_route.post('/restore-product-offer',offerController.restoreProductOffer);
admin_route.get('/edit-product-offer',offerController.loadEditProductOffer);
admin_route.post('/edit-product-offer',offerController.editProductOffer);

//category offers
admin_route.get('/category-offer',offerController.loadCategoryOffer);
admin_route.get('/add-category-offer',offerController.loadAddCategoryOffer);
admin_route.post('/add-category-offer',offerController.addCategoryOffer);
admin_route.post('/delete-category-offer',offerController.deleteCategoryOffer);
admin_route.post('/restore-category-offer',offerController.restoreCategoryOffer);
admin_route.get('/edit-category-offer',offerController.loadEditCategoryOffer);
admin_route.post('/edit-category-offer',offerController.editCategoryOffer);



module.exports = admin_route;   