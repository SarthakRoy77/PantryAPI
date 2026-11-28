import express from 'express';
import {db} from '../dist/src/prisma/db.js';
import bcrypt from 'bcrypt';
import 'dotenv/config';
import verifyToken from '../Middleware/verifyToken.js'

const router = express.Router();

// Food Management Routes
router.post('/FoodItem', verifyToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({message : `Please login to access the /addFoodItem route`})
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({message : 'You need to be an admin to access this route'})
        }

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
});

router.get('/FoodItem', verifyToken, async (req, res) => {
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

router.get('/FoodItem/by-price/:price', verifyToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(403).json({message : `Please login to access the /getAll route`})
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({message : 'You need to be an admin to access this route'})
        }
        
        const price = parseInt(req.params.price);
        if (!price || isNaN(price)) {
            return res.status(400).json({message : "Price is required and must be a number"})
        }

        const allFoodItems = await db.orm.public.FoodItem
            .where({price: {lt: price}})
            .all()

        if (allFoodItems.length === 0) {
            return res.status(404).json({message : `No food items found with price less than ₹ ${price}`})
        }

        return res.status(200).json({message : "Retrived all Food Items succesfully", foodItems: allFoodItems})

    } catch (error) {
        return res.status(500).json({message : `Error in GET /get-by-price route: ${error.message}`})
    }
});

router.get('/FoodItem/by-calories/:calories', verifyToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(403).json({message : `Please login to access the /getAll route`})
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({message : 'You need to be an admin to access this route'})
        }
        
        const calories = parseInt(req.params.calories);
        if (Number.isNaN(calories)) {
            return res.status(400).json({message : "Calories is required and must be a number"})
        }

        const allFoodItems = await db.orm.public.FoodItem
            .where((item) => item.calories.lt(calories))
            .all()

        if (allFoodItems.length === 0) {
            return res.status(404).json({message : `No food items found with calories less than ${calories} calories`})
        }
        
        return res.status(200).json({message : "Retrived all Food Items succesfully", foodItems: allFoodItems})

    } catch (error) {
        return res.status(500).json({message : `Error in GET /get-by-calories route: ${error.message}`})
    }
});

router.patch('/FoodItem/:id', verifyToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(403).json({message : `Please login to access the /update/:id route`})
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({message : 'You need to be an admin to access this route'})
        }

        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({message : "Invalid food item ID"})
        }

        const { name, price, calories } = req.body;

        const updatedFoodItem = await db.orm.public.FoodItem
            .where({ id })
            .update({ name, price, calories });

        if (!updatedFoodItem) {
            return res.status(404).json({message : `Food item with ID ${id} not found`})
        }

        return res.status(200).json({message : "Food item updated successfully", foodItem: updatedFoodItem})

    } catch (error) {
        return res.status(500).json({message : `Error in PATCH /update/:id route: ${error.message}`})
    }
});

router.delete('/FoodItem/:id', verifyToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(403).json({message : `Please login to access the /delete/:id route`})
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({message : 'You need to be an admin to access this route'})
        }

        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({message : "Invalid food item ID"})
        }

        const deletedFoodItem = await db.orm.public.FoodItem
            .where({ id })
            .delete();

        if (!deletedFoodItem) {
            return res.status(404).json({message : `Food item with ID ${id} not found`})
        }

        return res.status(200).json({message : "Food item deleted successfully", foodItem: deletedFoodItem})

    } catch (error) {
        return res.status(500).json({message : `Error in DELETE /delete/:id route: ${error.message}`})
    }
});

// Employee Management Routes
router.post('/Employee', verifyToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(403).json({message : `Please login to access the /addEmployee route`})
        }
        if (req.user.role !== 'admin') {
            return res.status(403).json({message : 'You need to be an admin to access this route'})
        }

        const { name, password, wage, employeeType } = req.body;

        if (!name || !password || !wage || !employeeType || Number.isNaN(wage)) {
            return res.status(400).json({message : "Name, password, wage and employeeType are required"})
        }

        if (!['receptionist', 'chefs', 'manager'].includes(employeeType)) {
            return res.status(400).json({message : "Invalid employeeType. Must be one of: receptionist, chefs, manager"})
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newEmployee = await db.orm.public.Employee.create({
            name: name.trim(),
            password: hashedPassword,
            wage: parseInt(wage),
            EmployeeType: employeeType
        });

        return res.status(201).json({message : "Employee added successfully", employee: newEmployee})

    } catch (error) {
        return res.status(500).json({message : `Error in POST /Employee route: ${error.message}`})
    }
});

export default router;
