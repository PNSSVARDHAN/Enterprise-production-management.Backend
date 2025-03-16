const express = require("express");
const RegScan = require("../models/RegScan");
const Employee = require("../models/Employee");
const { Op } = require("sequelize");

const router = express.Router();

// ✅ Store scanned RFID
router.post("/scan-rfid", async (req, res) => {
    try {
        const { rfid } = req.body;

        if (!rfid) return res.status(400).json({ error: "Missing RFID tag" });

        // ✅ Store scan in reg_scans table
        await RegScan.create({ rfid });

        console.log(`📡 RFID Scanned & Stored: ${rfid}`);
        res.status(201).json({ message: "RFID scan recorded successfully" });

    } catch (error) {
        console.error("❌ Error scanning RFID:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Fetch latest scanned RFID (Less than 3 min old)
router.get("/latest-scan", async (req, res) => {
    try {
        const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

        // ✅ Get the latest scanned RFID within 3 minutes
        const latestScan = await RegScan.findOne({
            where: { scanned_at: { [Op.gte]: threeMinutesAgo } },
            order: [["scanned_at", "DESC"]]
        });

        if (!latestScan) {
            return res.status(404).json({ error: "No recent scans found" });
        }

        res.status(200).json({ rfid: latestScan.rfid });

    } catch (error) {
        console.error("❌ Error fetching latest scan:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Register employee from latest scan
router.post("/register", async (req, res) => {
    try {
        const { name, rfid } = req.body;

        if (!name || !rfid) return res.status(400).json({ error: "Name and RFID are required" });

        // ✅ Check if the employee already exists
        const existingEmployee = await Employee.findOne({ where: { rfid } });
        if (existingEmployee) {
            return res.status(400).json({ error: "Employee already registered" });
        }

        // ✅ Store in employees table
        await Employee.create({ name, rfid });

        console.log(`✅ Employee Registered: ${name} (RFID: ${rfid})`);
        res.status(201).json({ message: "Employee registered successfully" });

    } catch (error) {
        console.error("❌ Error registering employee:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



module.exports = router;
