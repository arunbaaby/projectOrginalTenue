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
const upload = require('../config/multerConfig'); // Ensure you have this line
admin_route.post('/add-product', upload.array('images', 3), productController.addProduct);
admin_route.get('/delete-product',productController.deleteProduct);
admin_route.get('/restore-product',productController.restoreCategory);

module.exports = admin_route;   