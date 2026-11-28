import express from 'express';
import bcrypt from 'bcrypt';
import { db } from '../dist/src/prisma/db.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import verifyToken from '../Middleware/verifyToken.js';
import requireAdmin from '../Middleware/requiresAdmin.js';

/** In this project, I am not using controllers - since the project
 * is not so complex, however I would use it in a real world project. **/

const router = express.Router();

const COOKIE_OPTIONS = {
  maxAge: 72 * 60 * 60 * 1000, // 3 days in milliseconds
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
};

function sanitizeUser(user) {
  if (!user || typeof user !== 'object') return user;
  const { password, ...safeUser } = user;
  return safeUser;
}

function parsePositiveInt(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

function issueAuthToken(res, user) {
  if (!process.env.JWT_SECRET_KEY) {
    throw new Error('JWT_SECRET_KEY environment variable is missing');
  }

  const payload = {
    id: user.id,
    role: user.userType,
    name: user.name,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '3d' });
  res.cookie('token', token, COOKIE_OPTIONS);
}

router.post('/register', async (req, res) => {
  try {
    const name = req.body?.name;
    const password = req.body?.password;
    const adminCode = req.body?.adminCode;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required (as a non-empty string)' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password is required (at least 6 characters)' });
    }

    let userType = 'user';

    if (adminCode !== undefined && adminCode !== '') {
      if (typeof adminCode !== 'string') {
        return res.status(400).json({ message: 'Admin code must be a string' });
      }
      if (!process.env.ADMIN_CODE) {
        console.error('ADMIN_CODE environment variable is missing');
        return res.status(500).json({ message: 'Server configuration error' });
      }
      if (adminCode !== process.env.ADMIN_CODE) {
        return res.status(403).json({ message: 'Invalid admin code' });
      }
      userType = 'admin';
    }

    const trimmedName = name.trim();

    const existingUser = await db.orm.public.User
      .where({ name: trimmedName })
      .first();

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.orm.public.User.create({
      name: trimmedName,
      password: hashedPassword,
      userType,
    });

    return res.status(201).json({
      message: `${userType === 'admin' ? 'Admin' : 'User'} registered successfully`,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: `Error in POST /register: ${error.message}` });
  }
});

router.post('/login/:id', async (req, res) => {
  try {
    if (req.cookies?.token) {
      return res.status(200).json({ message: 'User has already logged in' });
    }

    const id = parsePositiveInt(req.params.id);
    const password = req.body?.password;

    if (!id) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Password is required (as a string)' });
    }

    const user = await db.orm.public.User
      .where({ id })
      .first();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    issueAuthToken(res, user);

    return res.status(200).json({ message: `User with ID ${id} logged in successfully` });
  } catch (error) {
    return res.status(500).json({ message: `Error in POST /login/:id: ${error.message}` });
  }
});

router.post('/login', async (req, res) => {
  try {
    if (req.cookies?.token) {
      return res.status(200).json({ message: 'User has already logged in' });
    }

    const rawName = req.body?.name;
    const password = req.body?.password;

    if (!rawName || typeof rawName !== 'string' || !rawName.trim()) {
      return res.status(400).json({ message: 'Username is required' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Password is required (as a string)' });
    }

    const userName = rawName.trim();

    const user = await db.orm.public.User
      .where({ name: userName })
      .first();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    issueAuthToken(res, user);

    return res.status(200).json({ message: `User ${userName} logged in successfully` });
  } catch (error) {
    return res.status(500).json({ message: `Error in POST /login: ${error.message}` });
  }
});

router.delete('/logout', async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return res.status(200).json({ message: 'The user was logged out successfully' });
  } catch (error) {
    return res.status(500).json({ message: `Error in DELETE /logout: ${error.message}` });
  }
});

// Get All users route
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const allUsers = await db.orm.public.User.all();
    return res.status(200).json({ users: allUsers.map(sanitizeUser) });
  } catch (error) {
    return res.status(500).json({ message: `Error in GET /users: ${error.message}` });
  }
});

// Delete User route
router.delete('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const userId = parsePositiveInt(req.params.id);

    if (!userId) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const deletedUser = await db.orm.public.User
      .where({ id: userId })
      .delete();

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: `User with ID ${userId} was deleted successfully` });
  } catch (error) {
    return res.status(500).json({ message: `Error in DELETE /users/:id: ${error.message}` });
  }
});

export default router;