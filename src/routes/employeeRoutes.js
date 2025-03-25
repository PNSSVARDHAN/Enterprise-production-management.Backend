const express = require("express");
const Employee = require("../models/Employee");
const RegScan = require("../models/RegScan");

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

// ✅ Register Employee with Latest RFID
router.post("/register", async (req, res) => {
    try {
        const { name, rfid } = req.body;

        if (!name || !rfid) {
            return res.status(400).json({ error: "Name and RFID are required" });
        }

        // ✅ Check if RFID is already registered
        const existingEmployee = await Employee.findOne({ where: { rfid } });

        if (existingEmployee) {
            return res.status(400).json({ error: "RFID already registered" });
        }

        // ✅ Insert new employee
        await Employee.create({ name, rfid });

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
        await employee.destroy();

        console.log(`✅ Employee Deleted: ${id}`);
        res.status(200).json({ message: "Employee deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting employee:", error);
        res.status(500).json({ error: "Error deleting employee" });
    }
});

module.exports = router;
