const express = require("express");
const RFIDScan = require("../models/RFIDScan");
const EmployeeTask = require("../models/EmployeeTask");
const Employee = require("../models/Employee");
const MachineAllocation = require("../models/MachineAllocation");
const OrderStep = require("../models/OrderStep");
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
            console.error(`No employee found for RFID: ${rfid}`);
            return res.status(404).json({ error: "Employee not found" });
        }

        // ✅ Find the Oldest Unfinished Task
        const tasks = await EmployeeTask.findAll({
            where: { employee_id: employee.id },
            order: [["createdAt", "ASC"]],
        });

        if (tasks.length === 0) {
            console.log(` No tasks assigned to ${employee.name}`);
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
            console.log(`All tasks completed for ${employee.name}`);
            return res.status(200).json({ message: `All tasks completed for ${employee.name}` });
        }

        // ✅ Find Machine Allocation
        const machineAllocation = await MachineAllocation.findOne({
            where: { id: taskToUpdate.machine_allocation_id }
        });

        if (!machineAllocation) {
            console.error(` Machine Allocation not found for ID: ${taskToUpdate.machine_allocation_id}`);
            return res.status(404).json({ error: "Machine Allocation not found" });
        }

        // ✅ Find Order Step (Matching Order ID and Step Name)
        const orderStep = await OrderStep.findOne({
            where: {
                order_id: machineAllocation.order_id,
                name: machineAllocation.step
            }
        });

        if (!orderStep) {
            console.error(` Order Step not found for Order ID: ${machineAllocation.order_id}, Step: ${machineAllocation.step}`);
            return res.status(404).json({ error: "Order Step not found" });
        }

        // ✅ Increment Completed Count in OrderStep
        await orderStep.increment("completed", { by: 1 });

        // ✅ Increment EmployeeTask Completed
        const updatedCompleted = taskToUpdate.completed + 1;
        const status = updatedCompleted >= taskToUpdate.target ? "Completed" : "In Progress";

        await EmployeeTask.update(
            { completed: updatedCompleted, status },
            { where: { id: taskToUpdate.id } }
        );

        // ✅ Update MachineAllocation Status (optional, if you want)
        await MachineAllocation.update(
            { status },
            { where: { id: machineAllocation.id } }
        );

        // ✅ Log the RFID Scan
        await RFIDScan.create({ employee_id: employee.id, task_id: taskToUpdate.id });

        console.log(` Scan Success: Employee ${employee.name} ➡️ Step ${machineAllocation.step} ➡️ OrderStep Updated`);

        res.status(200).json({
            message: "Scan recorded successfully!",
            employee_name: employee.name,
            step_name: machineAllocation.step,
            updated_completed: updatedCompleted,
            task_status: status
        });

    } catch (error) {
        console.error("RFID Scan Error:", error);
        res.status(500).json({ error: "Error processing RFID scan", details: error.message });
    }
});

module.exports = router;
