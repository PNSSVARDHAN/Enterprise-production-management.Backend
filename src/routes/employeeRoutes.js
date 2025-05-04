const express = require("express");
const Employee = require("../models/Employee");
const RegScan = require("../models/RegScan");
const bcrypt = require("bcryptjs");
const User = require("../models/User"); // Adjust the path to your actual User model file

const { Op } = require("sequelize"); // ✅ Import Sequelize Operators

const router = express.Router();




// ✅ Get All Employees
router.get("/", async (req, res) => {
    try {
        const employees = await Employee.findAll();
        res.status(200).json(employees);
    } catch (error) {
        res.status(500).json({ error: "Error fetching employees" });
    }
});

// new path -------------------------------------------------------------------------------------
router.post("/scan-rfid", async (req, res) => {
    try {
        const { rfid } = req.body;

        if (!rfid) {
            return res.status(400).json({ error: "RFID is required" });
        }

        // ✅ Insert into reg_scans table with timestamp
        await RegScan.create({ rfid });

        console.log(`✅ RFID ${rfid} scanned and saved.`);
        res.status(200).json({ message: "RFID scan recorded successfully" });
    } catch (error) {
        console.error("❌ Error saving RFID scan:", error);
        res.status(500).json({ error: "Error saving RFID scan" });
    }
});

router.get("/latest-scan", async (req, res) => {
    try {
        console.log("🔍 Fetching latest RFID scan...");

        // ✅ Fetch the most recent scan based on the highest ID
        const latestScan = await RegScan.findOne({
            order: [["id", "DESC"]] // ✅ Order by ID descending to get the latest scan
        });

        if (!latestScan) {
            return res.status(404).json({ message: "No recent RFID scan found." });
        }

        console.log("✅ Latest Scan Found:", latestScan);
        res.status(200).json({ rfid: latestScan.rfid, scanned_at: latestScan.scanned_at });

    } catch (error) {
        console.error("❌ Error fetching latest RFID:", error);
        res.status(500).json({ error: "Error fetching latest RFID" });
    }
});

router.post("/register", async (req, res) => {
    try {
        const name = req.body.name?.trim();
        const rfid = req.body.rfid?.trim();
        const mobile = req.body.mobile?.trim();

        if (!name || !rfid || !mobile) {
            return res.status(400).json({ error: "Name, RFID, and Mobile number are required" });
        }

        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(mobile)) {
            return res.status(400).json({ error: "Invalid mobile number format" });
        }

        const existingEmployee = await Employee.findOne({ where: { rfid } });
        if (existingEmployee) {
            return res.status(400).json({ error: "RFID already registered" });
        }

        const existingMobile = await Employee.findOne({ where: { mobile } });
        if (existingMobile) {
            return res.status(400).json({ error: "Mobile number already registered" });
        }

        await Employee.create({ name, rfid, mobile });
        console.log(`✅ Employee Registered: ${name} (RFID: ${rfid})`);

        res.status(201).json({ message: "Employee registered successfully" });
    } catch (error) {
        console.error("❌ Error registering employee:", error);
        res.status(500).json({ error: "Error registering employee" });
    }
});


// ✅ Delete Employee by ID
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // ✅ Check if employee exists
        const employee = await Employee.findByPk(id);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        // ✅ Delete employee
        // Delete all users referencing this employee
        await User.destroy({ where: { employee_id: id } });
        await employee.destroy();

        console.log(`✅ Employee Deleted: ${id}`);
        res.status(200).json({ message: "Employee deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting employee:", error);
        res.status(500).json({ error: "Error deleting employee" });
    }
});



const EmployeeTaskHistory = require("../models/EmployeeTaskHistory"); // Import your model

router.get("/history/:employeeId", async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (!employeeId) {
            return res.status(400).json({ error: "Employee ID is required" });
        }

        const historyRecords = await EmployeeTaskHistory.findAll({
            where: { employee_id: employeeId },
            attributes: ["id", "employee_id", "order_Number", "Step_Name", "machine_number", "target", "working_date"], // 🛠 Only these fields
            order: [["working_date", "DESC"]], // 📅 latest first
        });

        if (historyRecords.length === 0) {
            return res.status(404).json({ message: "No history records found for this employee." });
        }

        res.status(200).json({ history: historyRecords });

    } catch (error) {
        console.error("Error fetching task history:", error);
        res.status(500).json({ error: "Failed to fetch task history", details: error.message });
    }
});

router.put("/edit/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, rfid, mobile } = req.body;

        if (!name || !rfid || !mobile) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Find existing employee
        const employee = await Employee.findByPk(id);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        // Check for RFID conflict
        const rfidExists = await Employee.findOne({
            where: { rfid, id: { [Op.ne]: id } }, // exclude current employee
        });
        if (rfidExists) {
            return res.status(400).json({ error: "RFID already used by another employee" });
        }

        // Check for mobile conflict
        const mobileExists = await Employee.findOne({
            where: { mobile, id: { [Op.ne]: id } },
        });
        if (mobileExists) {
            return res.status(400).json({ error: "Mobile number already used by another employee" });
        }

        // Update employee
        await employee.update({ name, rfid, mobile });

        console.log(`✅ Employee updated: ID ${id}`);
        res.json({ message: "Employee updated successfully" });
    } catch (error) {
        console.error("❌ Error updating employee:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post('/create', async (req, res) => {
    try {
      const { name, email, password, employee_id } = req.body;
  
      if (!name || !email || !password || !employee_id) {
        return res.status(400).json({ error: "All fields are required" });
      }
  
      // Check if the employee exists
      const employee = await Employee.findByPk(employee_id);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
  
      // Check if the email is already used
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: "Email is already in use" });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create the user
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        employee_id,
        role: 'Null' // Default role as per your model
      });
  
      res.json({ message: "User created successfully", user });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


module.exports = router;

