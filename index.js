require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const port = process.env.PORT;

// monogo connect and retry with timeout increase
const connectWithRetry = () => {
    mongoose.connect(process.env.MONGO_ATLAS_URI, {
        serverSelectionTimeoutMS: 60000, 
        socketTimeoutMS: 60000,
    })
    .then(() => console.log("mongo connected"))
    .catch(err => {
        console.error("mongo connection error:", err);
        console.log("retrying connection in 5 seconds");
        setTimeout(connectWithRetry, 5000);
    });
};

mongoose.connection.on('connected', () => {
    console.log("mongo connec ready to make query");
});

connectWithRetry();

const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');

// mount admin and user routes
app.use('/', userRoute);
app.use('/admin', adminRoute);

app.listen(port, () => {
    console.log(`server listening on port ${port}`);
});
