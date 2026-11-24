const express = require('express');
const userRoutes = require('./Routes/UserRoutes.js');
require('dotenv').config({quiet: true});

//Initialize Express API
const app = express();

// Middleware (for parsing requests)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/users', userRoutes);

//Listening to the server
app.listen(process.env.PORT, ()  => {
    console.log(`Server is running on port ${process.env.PORT}`);
})
