const express = require("express");
const Employee = require("../models/Employee");
const RegScan = require("../models/RegScan");

const { Op } = require("sequelize"); // ✅ Import Sequelize Operators

const router = express.Router();

// ✅ Add New Employee
router.post("/scan", async (req, res) => {
    try {
        const { rfid } = req.body;

        if (!rfid) {
            return res.status(400).json({ error: "Missing RFID tag" });
        }

        console.log(`📡 Saving latest RFID: ${rfid}`);

        // ✅ Store latest RFID (delete previous entry)
        await RFIDScan.destroy({ where: {} }); // Clears old scans
        await RFIDScan.create({ employee_id: null, task_id: null, rfid });

        console.log("✅ RFID saved successfully!");
        res.status(200).json({ message: "RFID scan recorded", rfid });

    } catch (error) {
        console.error("❌ Error processing RFID scan:", error);
        res.status(500).json({ error: "Error processing RFID scan" });
    }
});



// ✅ Get All Employees
router.get("/", async (req, res) => {
    try {
        const employees = await Employee.findAll();
        res.status(200).json(employees);
    } catch (error) {
        res.status(500).json({ error: "Error fetching employees" });
    }
});

// ✅ Get Employee by RFID
router.post("/scan", async (req, res) => {
    try {
        const { rfid } = req.body;
        if (!rfid) {
            return res.status(400).json({ error: "Missing RFID tag" });
        }

        console.log(`📡 Saving latest RFID: ${rfid}`);

        // ✅ Store latest RFID (overwrite previous scan)
        await RFIDScan.destroy({ where: {} }); // Delete previous scan
        await RFIDScan.create({ employee_id: null, task_id: null, rfid });

        res.status(200).json({ message: "RFID scan recorded", rfid });
    } catch (error) {
        console.error("❌ Error processing RFID scan:", error);
        res.status(500).json({ error: "Error processing RFID scan" });
    }
});

// ✅ Get Latest RFID
router.get("/latest", async (req, res) => {
    try {
        const latestScan = await RFIDScan.findOne({ order: [["scan_time", "DESC"]] });

        if (!latestScan || !latestScan.rfid) {
            return res.status(200).json({ rfid: null });
        }

        console.log(`📡 Sending latest RFID to frontend: ${latestScan.rfid}`);
        res.status(200).json({ rfid: latestScan.rfid });
    } catch (error) {
        console.error("❌ Error fetching latest RFID:", error);
        res.status(500).json({ error: "Error fetching latest RFID" });
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

module.exports = router;
