require('dotenv').config();
//index.js
const mongoose = require('mongoose');
//connect mongodb server and also give the name of the database
mongoose.connect(process.env.MONGO_ATLAS_URI);

mongoose.connection.on('error', err => {
    console.error('MongoDB Connection Error:', err);
});

// mongoose.connect('mongodb://127.0.0.1:27017/tenue');

// const logger = require('morgan');


// require('dotenv').config();


const express = require('express');
const app = express();
const port = process.env.PORT;

// app.use(logger('dev'));

// //mount the userRoutes
const userRoute = require('./routes/userRoute');
app.use('/',userRoute);

//mount the adminRoutes
const adminRoute = require('./routes/adminRoute');
app.use('/admin',adminRoute);

app.listen(port,()=>{
    console.log(`server listening on ${port}`);
});