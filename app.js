import express from 'express';
import LoginRoutes from './Routes/LoginRoutes.js'
import AdminRoutes from './Routes/AdminRoutes.js'
import 'dotenv/config'
import cookies from 'cookie-parser'

//Initialize Express API
const app = express();

// Middleware (for parsing requests)
app.use(cookies());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1', LoginRoutes);
app.use('/api/v1', AdminRoutes);

//Listening to the server
app.listen(process.env.PORT, ()  => {
    console.log(`Server is running on port ${process.env.PORT}`);
})
