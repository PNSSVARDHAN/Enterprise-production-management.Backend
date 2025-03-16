const express = require("express");
const Order = require("../models/Order");
const Employee = require("../models/Employee");
const Machine = require("../models/Machine");
const EmployeeTask = require("../models/EmployeeTask");
const MachineAllocation = require("../models/MachineAllocation");

const router = express.Router();

router.get("/office", async (req, res) => {
    try {
        const totalOrders = await Order.count();
        const activeOrders = await Order.count({ where: { status: "In Progress" } });
        const completedOrders = await Order.count({ where: { status: "Completed" } });

        const totalEmployees = await Employee.count();
        const employeesWorking = await EmployeeTask.count({ where: { status: ["Assigned", "In Progress"] } });

        const availableMachines = await MachineAllocation.count({ where: { status: "Available" } });
        const inUseMachines = await MachineAllocation.count({ where: { status: "Assigned" } });

        // ✅ Fetch both "Assigned" and "In Progress" tasks
        const tasks = await EmployeeTask.findAll({
            where: { status: ["Assigned", "In Progress"] }, // ✅ Show both statuses
            include: [
                { model: Employee, attributes: ["name"] },
                { 
                    model: MachineAllocation, 
                    attributes: ["step"], 
                    include: { model: Order, attributes: ["id"] }  
                }
            ]
        });

        res.status(200).json({
            totalOrders,
            activeOrders,
            completedOrders,
            totalEmployees,
            employeesWorking,
            availableMachines,
            inUseMachines,
            tasks: tasks.map(task => ({
                employee_name: task.Employee.name,
                order_id: task.MachineAllocation.Order.id,
                step_name: task.MachineAllocation.step,
                completed: task.completed,
                target: task.target,
                status: task.status  // ✅ Include status in API response
            }))
        });

    } catch (error) {
        console.error("❌ Error fetching office dashboard data:", error);
        res.status(500).json({ error: "Error fetching office dashboard data" });
    }
});


// ✅ Employee Dashboard Data
router.get("/employee/:employee_id", async (req, res) => {
    try {
        const { employee_id } = req.params;

        const task = await EmployeeTask.findOne({
            where: { employee_id, status: "Assigned" },
            include: [{ model: MachineAllocation, attributes: ["machine_id", "order_id", "step"] }]
        });

        if (!task) {
            return res.status(404).json({ message: "No active tasks assigned" });
        }

        res.status(200).json({
            task_id: task.id,
            order_id: task.MachineAllocation.order_id,
            step: task.MachineAllocation.step,
            machine_id: task.MachineAllocation.machine_id,
            target: task.target,
            completed: task.completed,
        });
    } catch (error) {
        console.error("❌ Error fetching employee dashboard data:", error);
        res.status(500).json({ error: "Error fetching employee dashboard data" });
    }
});

module.exports = router;
