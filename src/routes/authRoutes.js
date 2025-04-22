const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const router = express.Router();


// Register Route
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ message: "Email already exists!" });

        // 2. Hash the password only ONCE
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 3. Save user
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        console.error("Error in registration:", error);
        res.status(500).json({ message: "Server error" });
    }
});



router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Received login request with email:", email); // Log email to verify

  try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
          console.log("No user found for email:", email); // Log no user found
          return res.status(401).json({ error: "Invalid email or password" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          console.log("Password mismatch for email:", email); // Log password mismatch
          return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
      console.log("Login successful for email:", email); // Log successful login
      res.json({ message: "Login successful", token });
  } catch (error) {
      console.error("❌ Login Error:", error);
      res.status(500).json({ error: "Server error" });
  }
});


// // Register User - Save password directly
// router.post("/register", async (req, res) => {
//   try {
//       const { name, email, password } = req.body;

//       // Check if user already exists
//       const existingUser = await User.findOne({ where: { email } });
//       if (existingUser) return res.status(400).json({ message: "Email already exists!" });

//       // Save password directly (no hashing)
//       const newUser = await User.create({
//           name,
//           email,
//           password // saving plain text password
//       });

//       res.status(201).json({ message: "User registered successfully!" });
//   } catch (error) {
//       console.error("Error in registration:", error);
//       res.status(500).json({ message: "Server error" });
//   }
// });

// // Login User - Compare password directly
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;

//   try {
//       // Find user
//       const user = await User.findOne({ where: { email } });
//       if (!user) return res.status(401).json({ message: "Invalid email or password" });

//       // Compare plain text password
//       if (password !== user.password) {
//           return res.status(401).json({ message: "Invalid email or password" });
//       }

//       // If matched, generate token (if needed)
//       const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

//       res.json({ message: "Login successful", token });
//   } catch (error) {
//       console.error("Login Error:", error);
//       res.status(500).json({ message: "Server error" });
//   }
// });


module.exports = router;


