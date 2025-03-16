const express = require("express");
const EmployeeTask = require("../models/EmployeeTask");
const Employee = require("../models/Employee");
const MachineAllocation = require("../models/MachineAllocation");
const Order = require("../models/Order");

const router = express.Router();

router.get("/employee/:employeeId", async (req, res) => {
    try {
        const { employeeId } = req.params;
        console.log(`🔍 Fetching task for Employee ID: ${employeeId}`);

        const task = await EmployeeTask.findOne({
            where: { employee_id: employeeId, status: "Assigned" },
            include: [
                {
                    model: MachineAllocation,
                    include: [
                        {
                            model: Order,
                            attributes: ["id", "product"],
                        },
                    ],
                    attributes: ["id", "step", "machine_id"],
                },
                {
                    model: Employee,
                    attributes: ["id"], // ✅ Fetch employee_id instead of name
                },
            ],
        });

        if (!task) {
            console.log("⚠️ No active task found for this employee.");
            return res.json({ message: "No active tasks assigned" });
        }

        console.log("✅ Task Found:", task.toJSON());

        res.json({
            order_id: task.MachineAllocation?.Order?.id || "N/A",
            product: task.MachineAllocation?.Order?.product || "N/A",
            step: task.MachineAllocation?.step || "N/A",
            machine_id: task.MachineAllocation?.machine_id || "N/A",
            employee_id: task.Employee?.id || "N/A", // ✅ Send employee_id instead of name
            target: task.target || 0,
            completed: task.completed || 0,
        });
    } catch (error) {
        console.error("❌ Error fetching employee dashboard data:", error);
        res.status(500).json({ error: "Error fetching employee dashboard data" });
    }
});

module.exports = router;

