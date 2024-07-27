//index.js
const mongoose = require('mongoose');
//connect mongodb server and also give the name of the database
mongoose.connect('mongodb://127.0.0.1:27017/tenue');

// const logger = require('morgan');


require('dotenv').config();


const express = require('express');
const app = express();
const port = process.env.PORT;

// app.use(logger('dev'));

// //mount the userRoutes
const userRoute = require('./routes/userRoute');
app.use('/',userRoute);


app.listen(port,()=>{
    console.log("server listening on 3000");
});