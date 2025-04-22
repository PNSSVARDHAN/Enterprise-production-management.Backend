const express = require("express");
const EmployeeTask = require("../models/EmployeeTask");
const MachineAllocation = require("../models/MachineAllocation");
const Employee = require("../models/Employee");
const Order = require("../models/Order");
const router = express.Router();
const  EmployeeTaskHistory = require("../models/EmployeeTaskHistory"); // Import both models

router.post("/assign", async (req, res) => {
    try {
        const { employee_id, machine_allocation_id, target, duration } = req.body;

        if (!employee_id || !machine_allocation_id || !target || !duration) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        let task = await EmployeeTask.findOne({ where: { machine_allocation_id } });

        if (task) {

            // ✅ Update existing task
            await task.update({ employee_id, target, duration });

            return res.status(200).json({ message: "Task updated successfully", updatedTask: task });
        } else {
            // ✅ Create new task if none exists
            const newTask = await EmployeeTask.create({ employee_id, machine_allocation_id, target, duration });
            return res.status(201).json({ message: "Task assigned successfully", newTask });
        }
    } catch (error) {
        console.error("❌ Error assigning employee:", error);
        res.status(500).json({ error: "Error assigning employee" });
    }
});


// ✅ Fetch All Employee Tasks
router.get("/", async (req, res) => {
    try {
        const tasks = await EmployeeTask.findAll({
            include: [
                { model: Employee, attributes: ["id", "name"] },
                { model: MachineAllocation, attributes: ["id", "machine_id", "order_id", "step"] }
            ]
        });
        res.status(200).json(tasks);
    } catch (error) {
        console.error("❌ Error fetching employee tasks:", error);
        res.status(500).json({ error: "Error fetching employee tasks" });
    }
});

// ✅ Mark Task as Completed and Free Machine
router.post("/complete", async (req, res) => {
    try {
        const { task_id } = req.body;

        console.log("🔍 Completing Task:", { task_id });

        if (!task_id) {
            return res.status(400).json({ error: "Missing task_id" });
        }

        const task = await EmployeeTask.findByPk(task_id);
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        // ✅ Update Task Status
        task.status = "Completed";
        await task.save();

        // ✅ Check if all tasks for this machine are completed
        const pendingTasks = await EmployeeTask.findOne({
            where: { machine_allocation_id: task.machine_allocation_id, status: { $ne: "Completed" } }
            
        });

        if (!pendingTasks) {
            // ✅ If no pending tasks, mark machine as Available
            await Machine.update({ status: "Available" }, { where: { id: task.machine_allocation_id } });

            console.log(`✅ Machine ${task.machine_allocation_id} is now available.`);
            
        } else {
            console.log(`🔴 Machine ${task.machine_allocation_id} still has active tasks.`);
        }

        res.status(200).json({ message: "✅ Task completed, machine status updated" });

    } catch (error) {
        console.error("❌ Error completing task:", error);
        res.status(500).json({ error: "Error completing task" });
    }
});



// ✅ Work Tracking: Fetch All Assigned Tasks
router.get("/assigned", async (req, res) => {
    try {
        const tasks = await EmployeeTask.findAll({
            include: [
                { model: Employee, attributes: ["id", "name", "rfid"] },
                { model: MachineAllocation, attributes: ["id", "step", "machine_id"] }
            ],
            order: [["createdAt", "ASC"]]
        });

        res.status(200).json(tasks);
    } catch (error) {
        console.error("❌ Error fetching tasks:", error);
        res.status(500).json({ error: "Error fetching tasks" });
    }
});

// ✅ Update Task
router.post("/update/:task_id", async (req, res) => {
    try {
        const { task_id } = req.params;
        const { employee_id, target, duration } = req.body;

        if (!task_id) return res.status(400).json({ error: "Missing task_id" });

        const task = await EmployeeTask.findByPk(task_id);
        if (!task) return res.status(404).json({ error: "Task not found" });

        await task.update({ employee_id, target, duration });

        res.status(200).json({ message: "✅ Task updated successfully!" });
    } catch (error) {
        console.error("❌ Error updating task:", error);
        res.status(500).json({ error: "Error updating task" });
    }
});



module.exports = router;
