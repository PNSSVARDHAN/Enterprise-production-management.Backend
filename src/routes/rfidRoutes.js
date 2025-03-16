const express = require("express");
const RFIDScan = require("../models/RFIDScan");
const EmployeeTask = require("../models/EmployeeTask");
const Employee = require("../models/Employee");
const MachineAllocation = require("../models/MachineAllocation");

const router = express.Router();

// ✅ Log RFID Scan & Increment Work Count
router.post("/scan", async (req, res) => {
    try {
        console.log("📡 Received RFID scan request:", req.body);

        const { rfid } = req.body;
        if (!rfid) {
            return res.status(400).json({ error: "Missing RFID tag" });
        }

        // ✅ Find Employee by RFID
        const employee = await Employee.findOne({ where: { rfid } });
        if (!employee) {
            console.error(`❌ No employee found for RFID: ${rfid}`);
            return res.status(404).json({ error: "Employee not found" });
        }

        // ✅ Get Unfinished Task for Employee (Oldest First)
        const tasks = await EmployeeTask.findAll({
            where: { employee_id: employee.id },
            order: [["createdAt", "ASC"]],
        });

        if (tasks.length === 0) {
            console.log(`✅ No tasks assigned to ${employee.name}`);
            return res.status(200).json({ message: `No tasks assigned to ${employee.name}` });
        }

        let taskToUpdate = null;
        for (let task of tasks) {
            if (task.completed < task.target) {
                taskToUpdate = task;
                break;
            }
        }

        if (!taskToUpdate) {
            console.log(`✅ All tasks completed for ${employee.name}`);
            return res.status(200).json({ message: `All tasks completed for ${employee.name}` });
        }

        // ✅ Increment Work Count
        const updatedCompleted = taskToUpdate.completed + 1;
        const status = updatedCompleted >= taskToUpdate.target ? "Completed" : "In Progress";

// ✅ Update Task Progress in `EmployeeTask`
await EmployeeTask.update(
    { completed: updatedCompleted, status },
    { where: { id: taskToUpdate.id } }
);

// ✅ Update Machine Allocation Status in `MachineAllocation` (Same Status)
await MachineAllocation.update(
    { status }, // ✅ Same status as EmployeeTask
    { where: { id: taskToUpdate.machine_allocation_id } }
);

        // ✅ Log the RFID scan
        await RFIDScan.create({ employee_id: employee.id, task_id: taskToUpdate.id });

        console.log(`✅ Updated Task: ${taskToUpdate.id}, Completed: ${updatedCompleted}/${taskToUpdate.target}`);

        res.status(200).json({
            message: "Scan recorded successfully",
            order_id: taskToUpdate.order_id,
            employee_name: employee.name,
            completed: updatedCompleted,
            target: taskToUpdate.target,
            status,
        });

    } catch (error) {
        console.error("❌ RFID Scan Error:", error);
        res.status(500).json({ error: "Error processing RFID scan", details: error.message });
    }
});

module.exports = router;
