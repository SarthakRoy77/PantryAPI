import express from 'express';
import { db } from '../dist/src/prisma/db.js';
import bcrypt from 'bcrypt';
import 'dotenv/config';
import verifyToken from '../Middleware/verifyToken.js';
import requireAdmin from '../Middleware/requiresAdmin.js';

const router = express.Router();

const VALID_EMPLOYEE_TYPES = ['receptionist', 'chefs', 'manager'];

function sanitizeEmployee(employee) {
  if (!employee || typeof employee !== 'object') return employee;
  const { password, ...safeEmployee } = employee;
  return safeEmployee;
}

function parsePositiveInt(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

function parseNonNegativeInt(value) {
  const num = Number(value);
  return Number.isInteger(num) && num >= 0 ? num : null;
}

// FoodItem Routes
router.post('/FoodItem', verifyToken, requireAdmin, async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const price = parsePositiveInt(req.body.price);
    const calories = parseNonNegativeInt(req.body.calories);

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!price) {
      return res.status(400).json({ message: 'Price must be a positive integer' });
    }
    if (calories === null) {
      return res.status(400).json({ message: 'Calories must be a non-negative integer' });
    }

    const foodItem = await db.orm.public.FoodItem.create({
      name,
      price,
      calories,
    });

    return res.status(201).json({ message: 'Food item added successfully', foodItem });
  } catch (error) {
    return res.status(500).json({ message: `Error in POST /FoodItem: ${error.message}` });
  }
});

router.get('/FoodItem', verifyToken, requireAdmin, async (req, res) => {
  try {
    const foodItems = await db.orm.public.FoodItem.all();

    return res.status(200).json({
      message: 'Retrieved all food items successfully',
      foodItems,
    });
  } catch (error) {
    return res.status(500).json({ message: `Error in GET /FoodItem: ${error.message}` });
  }
});

router.get('/FoodItem/by-price/:price', verifyToken, requireAdmin, async (req, res) => {
  try {
    const price = parsePositiveInt(req.params.price);
    if (!price) {
      return res.status(400).json({ message: 'Price must be a positive integer' });
    }

    const foodItems = await db.orm.public.FoodItem
      .where({ price: { lt: price } })
      .all();

    if (foodItems.length === 0) {
      return res.status(404).json({ message: `No food items found with price less than ₹${price}` });
    }

    return res.status(200).json({
      message: 'Retrieved food items successfully',
      foodItems,
    });
  } catch (error) {
    return res.status(500).json({ message: `Error in GET /FoodItem/by-price/:price: ${error.message}` });
  }
});

router.get('/FoodItem/by-calories/:calories', verifyToken, requireAdmin, async (req, res) => {
  try {
    const calories = parseNonNegativeInt(req.params.calories);
    if (calories === null) {
      return res.status(400).json({ message: 'Calories must be a non-negative integer' });
    }

    const foodItems = await db.orm.public.FoodItem
      .where({ calories: { lt: calories } })
      .all();

    if (foodItems.length === 0) {
      return res.status(404).json({ message: `No food items found with calories less than ${calories}` });
    }

    return res.status(200).json({
      message: 'Retrieved food items successfully',
      foodItems,
    });
  } catch (error) {
    return res.status(500).json({ message: `Error in GET /FoodItem/by-calories/:calories: ${error.message}` });
  }
});

router.patch('/FoodItem/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'ID must be a positive integer' });
    }

    const updates = {};
    if (req.body.name !== undefined) {
      const trimmedName = typeof req.body.name === 'string' ? req.body.name.trim() : '';
      if (!trimmedName) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      updates.name = trimmedName;
    }
    if (req.body.price !== undefined) {
      const price = parsePositiveInt(req.body.price);
      if (!price) {
        return res.status(400).json({ message: 'Price must be a positive integer' });
      }
      updates.price = price;
    }
    if (req.body.calories !== undefined) {
      const calories = parseNonNegativeInt(req.body.calories);
      if (calories === null) {
        return res.status(400).json({ message: 'Calories must be a non-negative integer' });
      }
      updates.calories = calories;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'At least one field (name, price, calories) is required' });
    }

    const updatedFoodItem = await db.orm.public.FoodItem
      .where({ id })
      .update(updates);

    if (!updatedFoodItem) {
      return res.status(404).json({ message: `Food item with ID ${id} not found` });
    }

    return res.status(200).json({
      message: 'Food item updated successfully',
      foodItem: updatedFoodItem,
    });
  } catch (error) {
    return res.status(500).json({ message: `Error in PATCH /FoodItem/:id: ${error.message}` });
  }
});

router.delete('/FoodItem/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'ID must be a positive integer' });
    }

    const deletedFoodItem = await db.orm.public.FoodItem
      .where({ id })
      .delete();

    if (!deletedFoodItem) {
      return res.status(404).json({ message: `Food item with ID ${id} not found` });
    }

    return res.status(200).json({
      message: 'Food item deleted successfully',
      foodItem: deletedFoodItem,
    });
  } catch (error) {
    return res.status(500).json({ message: `Error in DELETE /FoodItem/:id: ${error.message}` });
  }
});

// Employee Routes
router.post('/Employee', verifyToken, requireAdmin, async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const { password, employeeType } = req.body;
    const wage = parsePositiveInt(req.body.wage);

    if (!name || !password || !wage || !employeeType) {
      return res.status(400).json({ message: 'Name, password, wage, and employeeType are required' });
    }

    if (!VALID_EMPLOYEE_TYPES.includes(employeeType)) {
      return res.status(400).json({
        message: `Invalid employeeType. Must be one of: ${VALID_EMPLOYEE_TYPES.join(', ')}`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newEmployee = await db.orm.public.Employee.create({
      name,
      password: hashedPassword,
      wage,
      EmployeeType: employeeType,
    });

    return res.status(201).json({
      message: 'Employee added successfully',
      employee: sanitizeEmployee(newEmployee),
    });
  } catch (error) {
    return res.status(500).json({ message: `Error in POST /Employee: ${error.message}` });
  }
});

router.get('/Employee', verifyToken, requireAdmin, async (req, res) => {
  try {
    const allEmployees = await db.orm.public.Employee.all();

    return res.status(200).json({
      message: 'Retrieved all employees successfully',
      employees: allEmployees.map(sanitizeEmployee),
    });
  } catch (error) {
    return res.status(500).json({ message: `Error in GET /Employee: ${error.message}` });
  }
});

router.get('/Employee/by-name/:name', verifyToken, requireAdmin, async (req, res) => {
  try {
    const trimmedName = typeof req.params.name === 'string' ? req.params.name.trim() : '';
    if (!trimmedName) {
      return res.status(400).json({ message: 'A non-empty name is required to search by name' });
    }

    const employees = await db.orm.public.Employee
      .where((e) => e.name.ilike(`%${trimmedName}%`))
      .all();

    return res.status(200).json({
      message: 'Retrieved employees successfully',
      employees: employees.map(sanitizeEmployee),
    });
  } catch (error) {
    return res.status(500).json({ message: `Error in GET /Employee/by-name/:name: ${error.message}` });
  }
});

router.patch('/Employee/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'ID must be a positive integer' });
    }

    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const { password, employeeType } = req.body;
    const wage = parsePositiveInt(req.body.wage);

    if (!name || !password || !wage || !employeeType) {
      return res.status(400).json({ message: 'Name, password, wage, and employeeType are required' });
    }

    if (!VALID_EMPLOYEE_TYPES.includes(employeeType)) {
      return res.status(400).json({
        message: `Invalid employeeType. Must be one of: ${VALID_EMPLOYEE_TYPES.join(', ')}`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await db.orm.public.Employee
      .where({ id })
      .update({
        name,
        password: hashedPassword,
        wage,
        EmployeeType: employeeType,
      });

    if (!employee) {
      return res.status(404).json({ message: `Employee with ID ${id} not found` });
    }

    return res.status(200).json({
      message: 'Employee updated successfully',
      employee: sanitizeEmployee(employee),
    });
  } catch (error) {
    return res.status(500).json({ message: `Error in PATCH /Employee/:id: ${error.message}` });
  }
});

export default router;