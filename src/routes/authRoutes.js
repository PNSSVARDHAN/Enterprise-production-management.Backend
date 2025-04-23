const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const router = express.Router();


// Register Route
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body; // Adding role to the request body

        // 1. Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ message: "Email already exists!" });

        // 2. Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 3. Validate role (optional, can add a list of allowed roles)
        const allowedRoles = ['admin', 'manager', 'employee','Cutting','Sewing','Quality control','Packing'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role. Allowed roles are: admin, manager, employee." });
        }

        // 4. Save the user with the role
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role // Save the role in the database
        });

        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        console.error("Error in registration:", error);
        res.status(500).json({ message: "Server error" });
    }
});



router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    console.log("Received login request with email:", email);
  
    try {
        const user = await User.findOne({ where: { email } });
  
        if (!user) {
            console.log("No user found for email:", email);
            return res.status(401).json({ error: "Invalid email or password" });
        }
  
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("Password mismatch for email:", email);
            return res.status(401).json({ error: "Invalid email or password" });
        }
  
        // ✅ Add role into the JWT payload
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );
  
        console.log("Login successful for email:", email);
  
        // ✅ Send role along with other user info
        res.json({
          message: "Login successful",
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        });
  
    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ error: "Server error" });
    }
  });


module.exports = router;


