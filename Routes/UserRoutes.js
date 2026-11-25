import express from 'express'
import bcrypt from 'bcrypt'
import { db } from '../dist/src/prisma/db.js';
import jwt from 'jsonwebtoken'
import 'dotenv/config'

/** In this project, I am not using controllers- since the project 
- is not so complex, however I would use it in a real world project. **/

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const name = req.body["name"];
        const password = req.body["password"];
        const adminCode = req.body["adminCode"];

        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ message: "Name is required (as a non-empty string)" });
        }

        if (!password || typeof password !== "string" || password.length < 6) {
            return res.status(400).json({ message: "Password is required (at least 6 characters)" });
        }

        let userType = "user";

        if (adminCode !== undefined && adminCode !== "") {
            if (typeof adminCode !== "string") {
                return res.status(400).json({ message: "Admin code must be a string" });
            }
            if (!process.env.ADMIN_CODE) {
                console.error("ADMIN_CODE environment variable is missing");
                return res.status(500).json({ message: "Server configuration error" });
            }
            if (adminCode !== process.env.ADMIN_CODE) {
                return res.status(403).json({ message: "Invalid admin code" });
            }
            userType = "admin";
        }

        const existingUser = await db.orm.public.User
            .where({ name: name.trim() })
            .first();

        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await db.orm.public.User.create({
                name: name.trim(),
                password: hashedPassword,
                userType,
        });

        return res.status(201).json({
            message: `${userType === "admin" ? "Admin" : "User"} registered successfully`,
            user: {
                id: user.id,
                name: user.name,
                userType: user.userType,
                dateCreatedAt: user.dateCreatedAt,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: `Error in POST /register: ${error.message}` });
    }
});

router.post('/login/:id', async (req, res) => {
    try {

        if (req.cookies.token) {
            return res.status(200).json({message : `User has already logged in `})
        }
        const { id } = req.params;
        const password = req.body["password"];

        if (!id || isNaN(id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        if (!password || typeof password !== "string") {
            return res.status(400).json({ message: "Password is required (as a string)" });
        }

        const user = await db.orm.public.User
            .where({ id: parseInt(id) })
            .first();

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const payload = {
            role : user.userType,
            name : user.name
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY)
        
        res.cookie('token', token, {
            secure : false,
            httpOnly : true
        })

        res.status(201).json({message: `User with the id ${id} was logged in succesfully`})

    } catch (error) {
        return res.status(500).json({ message: `Error in POST /login/:id: ${error.message}` });
    }
})

router.delete('/logout', async (req, res) => {
    try {
        res.clearCookie('token')
        res.status(200).json({message: `The user was logged out successfully`})
    } catch (error) {
        return res.status(500).json({message : `Error in DELETE /logout: ${error.message}`})
    }
})

export default router;