import express from 'express';
import {db} from '../dist/src/prisma/db.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import verifyToken from '../Middleware/verifyToken.js'

const router = express.Router();


router.post('/addFoodItem', async (req, res) => {
    try {
        const name = req.body.name;
        const price = parseInt(req.body.price);
        const calories = parseInt(req.body.calories);
        
        if (!name) {
            return res.status(400).json({message : "Name is required"})
        };

        if (!price || isNaN(price)) {
            return res.status(400).json({message : "Price is required and must be a number"})
        };

        if (!calories || isNaN(calories)) {
            return res.status(400).json({message : "Calories is required and must be a number"})
        };

        await db.orm.public.FoodItem.create({
            name: name.trim(),
            price: price,
            calories: calories,
        });

        return res.status(201).json({message: `Food Item added successfully`});

    } catch (error) {
        return res.status(500).json({message : `Error in POST /addFoodItem: ${error.message}`});
    }
})
router.get('/getAll', verifyToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(403).json({message : `Please login to access the /getAll route`})
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({message : 'You need to be an admin to access this route'})
        }

        const allFoodItems = await db.orm.public.FoodItem
            .all()

        return res.status(200).json({message : "Retrived all Food Items succesfully", foodItems: allFoodItems})

    } catch (error) {
        return res.status(500).json({message : `Error in GET /getAll route: ${error.message}`})
    }
});

export default router;
