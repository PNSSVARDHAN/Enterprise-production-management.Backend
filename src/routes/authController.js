const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(401).json({ message: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

        // 🔥 Generate JWT token
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ message: "Login successful", token, role: user.role });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};



exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;  // Include role in the request body

    try {
        // 1. Check if the user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ message: "Email already registered" });

        // 2. Validate the role (optional, but a good practice)
        const allowedRoles = ['admin', 'manager', 'employee','Cutting','Sewing','Quality control','Packing'];  // Define allowed roles
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role. Allowed roles are: admin, manager, employee." });
        }

        // 3. Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Create a new user with the role
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role  // Save the role
        });

        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

