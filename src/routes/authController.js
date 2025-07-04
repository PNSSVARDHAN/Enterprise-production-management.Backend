const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if JWT_SECRET is loaded properly
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is missing!');
            return res.status(500).json({ message: "Server error, JWT secret not found." });
        }

        console.log('JWT_SECRET:', process.env.JWT_SECRET);  // Debugging line to verify secret

        // Retrieve user from the database by email
        const user = await User.findOne({ where: { email } });

        // If user is not found
        if (!user) {
            console.log('Invalid email or password');
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Compare the entered password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password);

        // If password doesn't match
        if (!isMatch) {
            console.log('Invalid email or password');
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 🔥 Generate JWT token with 1 day expiry (adjust as needed)
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, employee_id: user.employee_id },  // Include employee_id in the token payload
            process.env.JWT_SECRET,
            { expiresIn: "1d" }  // Set expiry time to 1 day
        );

        // Respond with the token and user role
        res.json({ message: "Login successful", token, role: user.role });
    } catch (error) {
        // Log the error to debug any unexpected issues
        console.error('Login error:', error);

        // Send response with specific error message
        res.status(500).json({ message: "Server error", error: error.message });
    }
};



exports.register = async (req, res) => {
    const { name, email, password, role , employee_id } = req.body;  // Include role in the request body

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
            role,
            employee_id  // Save the role
        });

        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

