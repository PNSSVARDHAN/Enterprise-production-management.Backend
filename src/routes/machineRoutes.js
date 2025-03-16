const express = require("express");
const Machine = require("../models/Machine");
const EmployeeTask = require("../models/EmployeeTask");
const MachineAllocation = require("../models/MachineAllocation");

const router = express.Router();

// ✅ Add New Machine
router.post("/add", async (req, res) => {
    try {
        const { machine_number } = req.body;
        const newMachine = await Machine.create({ machine_number });
        res.status(201).json(newMachine);
    } catch (error) {
        res.status(500).json({ error: "Error adding machine" });
    }
});

// ✅ Get All Machines
router.get("/", async (req, res) => {
    try {
        const machines = await Machine.findAll();
        res.status(200).json(machines);
    } catch (error) {
        res.status(500).json({ error: "Error fetching machines" });
    }
});

module.exports = router;