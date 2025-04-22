const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(401).json({ message: "Invalid email or password" });

        // 🔥 Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

        // 🔥 Generate JWT token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ message: "Login successful", token, user });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ message: "Email already registered" });

        // 🔥 Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({ name, email, password: hashedPassword });

        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};


// // Login User - Compare password directly
// router.post("/login", async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         // Find user
//         const user = await User.findOne({ where: { email } });
//         if (!user) return res.status(401).json({ message: "Invalid email or password" });

//         // Compare plain text password
//         if (password !== user.password) {
//             return res.status(401).json({ message: "Invalid email or password" });
//         }

//         // If matched, generate token (if needed)
//         const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

//         res.json({ message: "Login successful", token });
//     } catch (error) {
//         console.error("Login Error:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// });

// // Register User - Save password directly
// router.post("/register", async (req, res) => {
//     try {
//         const { name, email, password } = req.body;

//         // Check if user already exists
//         const existingUser = await User.findOne({ where: { email } });
//         if (existingUser) return res.status(400).json({ message: "Email already exists!" });

//         // Save password directly (no hashing)
//         const newUser = await User.create({
//             name,
//             email,
//             password // saving plain text password
//         });

//         res.status(201).json({ message: "User registered successfully!" });
//     } catch (error) {
//         console.error("Error in registration:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// });

