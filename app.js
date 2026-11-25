import express from 'express';
import userRoutes from './Routes/UserRoutes.js'
import 'dotenv/config'

//Initialize Express API
const app = express();

// Middleware (for parsing requests)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1', userRoutes);

//Listening to the server
app.listen(process.env.PORT, ()  => {
    console.log(`Server is running on port ${process.env.PORT}`);
})
