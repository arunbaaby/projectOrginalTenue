const express = require('express');
const admin_route = express();
const path = require('path');

// View engine
admin_route.set('view engine', 'ejs');
admin_route.set('views', path.join(__dirname, '../views/admin'));

// To parse the data in the POST request body
const bodyParser = require('body-parser');
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
admin_route.use(express.static(path.join(__dirname, '../public/admin')));

const adminController = require('../controllers/adminController');

// Route to get admin login
admin_route.get('/login', adminController.loadLogin);

// Route to handle admin login POST request
admin_route.post('/login', adminController.adminLogin);

module.exports = admin_route;
