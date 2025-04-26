const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Employee = require("../models/Employee");
const EmployeeTask = require("../models/EmployeeTask");
const MachineAllocation = require("../models/MachineAllocation");
const EmployeeTaskHistory = require("../models/EmployeeTaskHistory");

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


// Fetch all users
router.get("/users", async (req, res) => {
    try {
        const users = await User.findAll();  // Fetch all users from the database
        if (!users) {
            return res.status(404).json({ message: "No users found" });
        }
        res.status(200).json(users);  // Send the users data as a response
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Edit User Route
router.put("/edit/:id", async (req, res) => {
    try {
        const { name, email, role } = req.body;
        const { id } = req.params;  // Get the user ID from the URL parameter

        // 1. Find user by ID
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // 2. Check if the new email is already taken by another user
        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ where: { email } });
            if (existingEmail) return res.status(400).json({ message: "Email already exists" });
        }

        // 3. Update user details
        user.name = name || user.name;
        user.email = email || user.email;
        user.role = role || user.role;

        await user.save();  // Save updated user data

        res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// Delete User Route
router.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;  // Get the user ID from the URL parameter

        // 1. Find user by ID
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // 2. Delete user
        await user.destroy();

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// Update password route
router.put('/update-password/:id', async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
  
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }
  
    try {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      // Find the user by ID and update the password
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Save the new password in the database
      user.password = hashedPassword;
      await user.save();
  
      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  });
  


// app login routes

router.post("/app-login", async (req, res) => {
    const { username, password } = req.body;  // Changed to username
    console.log("Received login request for app with username:", username);

    try {
        // Find user by username (number)
        const user = await User.findOne({ where: { email: username } });

        if (!user) {
            console.log("No user found for username:", username);
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Compare password hash with stored password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("Password mismatch for username:", username);
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Fetch the employee details based on the employee_id in the User model
        const employee = await Employee.findOne({ where: { id: user.employee_id } });

        if (!employee) {
            console.log("No employee found with id:", user.employee_id);
            return res.status(404).json({ error: "Employee data not found" });
        }

        // Generate JWT token for app login
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, employeeId: user.employee_id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        console.log("App Login successful for username:", username);

        // Send the response with user and employee data
        res.json({
            message: "App login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,  // Username instead of email
                role: user.role,
            },
            employee: {
                id: employee.id,
                name: employee.name,
                rfid: employee.rfid,
            }
        });

    } catch (error) {
        console.error("❌ App Login Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});


router.get("/app/employee/tasks/:employeeId", async (req, res) => {
    const { employeeId } = req.params;

    try {
        // Fetch all tasks for the employee with related machine allocation info
        const tasks = await EmployeeTask.findAll({
            where: { employee_id: employeeId },
            include: [
                {
                    model: MachineAllocation,
                    attributes: ["machine_id", "step"]
                }
            ]
        });

        // Fetch previous task history for the employee
        const taskHistory = await EmployeeTaskHistory.findAll({
            where: { employee_id: employeeId },
            order: [["working_date", "DESC"]],  // Sort by most recent tasks
        });

        res.json({
            message: "Tasks and history fetched successfully",
            tasks: tasks,
            taskHistory: taskHistory,
        });

    } catch (error) {
        console.error("❌ Error fetching tasks and history:", error);
        res.status(500).json({ error: "Server error" });
    }
});
module.exports = router;


