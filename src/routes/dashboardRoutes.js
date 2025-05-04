const express = require("express");
const Order = require("../models/Order");
const Employee = require("../models/Employee");
const Machine = require("../models/Machine");
const EmployeeTask = require("../models/EmployeeTask");
const MachineAllocation = require("../models/MachineAllocation");
const OrderStep = require("../models/OrderStep");  
const { Op } = require("sequelize");
const { Sequelize } = require("sequelize");
const router = express.Router();

const sequelize = require("../config/database"); 


router.get("/office", async (req, res) => {
    try {
        const totalOrders = await Order.count();
        const activeOrders = await Order.count({ 
            where: { 
            current_stage: {
                [Op.in]: [
                "Cutting Started",
                "Cutting Completed",
                "Sewing is in progress",
                "Sewing Completed",
                "Quality Check in progress",
                "Quality Check Completed",
                "Packing is in progress"
                ]
            }
            } 
        });
        const completedOrders = await Order.count({ where: { current_stage: "Packing Completed" } });

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



router.get("/orderstatus/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;

        console.log(`📡 Checking status for Order ID: ${orderId}`);

        // 1️⃣ Fetch Order Details (Quantity)
        const order = await Order.findByPk(orderId, {
            attributes: ["id", "quantity", "status"],
        });

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // 2️⃣ Fetch Steps for the Order
        const steps = await OrderStep.findAll({
            where: { order_id: orderId },
            attributes: ["name"], // Fetch only step names
        });

        if (steps.length === 0) {
            return res.status(400).json({ error: "No steps found for this order" });
        }

        console.log(`🔎 Found ${steps.length} steps for Order ${orderId}`);

        // 3️⃣ Fetch Machine Allocations for the Steps
        const stepNames = steps.map(step => step.name); // Extract step names
        const allocatedMachines = await MachineAllocation.findAll({
            where: {
                order_id: orderId,
                step: { [Op.in]: stepNames },
            },
            attributes: ["id", "step"],
        });

        console.log(`🛠 Machines assigned: ${allocatedMachines.length}`);

        // 4️⃣ Fetch Completed Counts from EmployeeTasks
        let totalCompleted = 0;
        for (const machine of allocatedMachines) {
            const completedCount = await EmployeeTask.sum("completed", {
                where: { machine_allocation_id: machine.id },
            });
            totalCompleted += completedCount || 0;
        }

        console.log(`✅ Total Completed Work for Order ${orderId}: ${totalCompleted} / ${order.quantity}`);

        // 5️⃣ Update Order Status Based on Completion
        let newStatus = "Pending";
        if (totalCompleted === order.quantity) {
            newStatus = "Completed";
        } else if (totalCompleted > 0) {
            newStatus = "In Progress";
        }

        // 6️⃣ Update Order Status in DB
        await Order.update({ status: newStatus }, { where: { id: orderId } });

        console.log(`🚀 Order ${orderId} status updated to: ${newStatus}`);

        res.status(200).json({ message: `Order ${orderId} status updated`, status: newStatus });

    } catch (error) {
        console.error("❌ Error updating order status:", error);
        res.status(500).json({ error: error.message || "Error updating order status" });
    }
});

//// testing the graphs 

router.get("/orders-productivity", async (req, res) => {
    try {
        const orders = await Order.findAll({
            attributes: [
                "id",
                "order_number",
                "product",
                "quantity",
                "status",
                "createdAt",
                "updatedAt"
            ],
            include: [
                {
                    model: MachineAllocation,
                    attributes: [
                        "id",
                        "order_id",
                        "machine_id",
                        "step",
                        "status",
                        "createdAt",
                        "updatedAt"
                    ],
                    include: [
                        {
                            model: EmployeeTask,
                            attributes: [
                                "id",
                                "employee_id",
                                [sequelize.fn("SUM", sequelize.col("completed")), "total_completed"]
                            ],
                            group: ["employee_id", "id"]
                        },
                    ],
                },
            ],
            group: [
                "Order.id",
                "MachineAllocations.id",
                "MachineAllocations->EmployeeTasks.id",
                "MachineAllocations->EmployeeTasks.employee_id"
            ]
        });

        // 🔁 For each order, calculate hourly productivity trend
        for (const order of orders) {
            // Query for hourly productivity for each order
            const hourlyTrend = await sequelize.query(
                `
                SELECT 
                    et.employee_id,
                    DATE_TRUNC('hour', et."updatedAt") AS hour_slot,
                    COUNT(et.employee_id) AS hourly_completed
                FROM "EmployeeTasks" et
                INNER JOIN "MachineAllocations" ma ON et.machine_allocation_id = ma.id
                WHERE ma.order_id = :orderId
                GROUP BY et.employee_id, hour_slot
                ORDER BY hour_slot ASC
                `,
                {
                    replacements: { orderId: order.id },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            // Assign the hourly trend data to the order object
            order.dataValues.hourlyTrend = hourlyTrend;
        }

        res.json(orders);
    } catch (error) {
        console.error("❌ Error fetching orders productivity:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


router.get("/time-per-piece", async (req, res) => {
    try {
        const data = await EmployeeTask.findAll({
            attributes: [
                "employee_id",
                "updatedAt",
                [Sequelize.literal(`
                    EXTRACT(EPOCH FROM ("updatedAt" - LAG("updatedAt") 
                    OVER (PARTITION BY employee_id ORDER BY "updatedAt" NULLS LAST))) / 60
                `), "time_per_piece"]
            ],
            order: [["employee_id", "ASC"], ["updatedAt", "ASC"]]
        });

        // Filter out null values manually in JS
        const filteredData = data
            .map((entry) => entry.toJSON())
            .filter((entry) => entry.time_per_piece !== null);

        res.json(filteredData);
    } catch (error) {
        console.error("❌ Error fetching time per piece:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


/** ✅ 2️⃣ Total Pieces Completed (Bar Chart) */
router.get("/total-pieces", async (req, res) => {
    try {
        const data = await EmployeeTask.findAll({
            attributes: [
                "employee_id",
                [Sequelize.fn("SUM", Sequelize.col("completed")), "total_completed"]
            ],
            group: ["employee_id"]
        });

        res.json(data);
    } catch (error) {
        console.error("❌ Error fetching total pieces:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/** ✅ 3️⃣ Hourly Productivity Trend (Line Chart) */
router.get("/hourly-productivity", async (req, res) => {
    try {
        const data = await EmployeeTask.findAll({
            attributes: [
                "employee_id",
                [Sequelize.literal(`DATE_TRUNC('hour', "EmployeeTask"."updatedAt")`), "hour_slot"],
                [Sequelize.fn("COUNT", Sequelize.col("employee_id")), "hourly_completed"] // Count tasks per hour
            ],
            group: ["employee_id", Sequelize.literal(`DATE_TRUNC('hour', "EmployeeTask"."updatedAt")`)],
            order: [[Sequelize.literal("hour_slot"), "ASC"]]
        });

        res.json(data);
    } catch (error) {
        console.error("❌ Error fetching hourly productivity:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


/** ✅ 4️⃣ Employee Performance Comparison (Radar Chart) */
router.get("/employee-performance", async (req, res) => {
    try {
        const data = await sequelize.query(`
            WITH time_data AS (
                SELECT 
                    employee_id,
                    completed,
                    "updatedAt",  -- ✅ Enclosed in double quotes
                    LAG("updatedAt") OVER (PARTITION BY employee_id ORDER BY "updatedAt") AS prev_time
                FROM "EmployeeTasks"
            )
            SELECT 
                employee_id,
                SUM(completed) AS total_completed,
                AVG(EXTRACT(EPOCH FROM ("updatedAt" - prev_time)) / 60) AS avg_time_per_piece
            FROM time_data
            WHERE prev_time IS NOT NULL
            GROUP BY employee_id;
        `, { type: sequelize.QueryTypes.SELECT });

        res.json(data);
    } catch (error) {
        console.error("❌ Error fetching employee performance:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});




module.exports = router;
