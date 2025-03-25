const express = require("express");
const Sequelize = require("sequelize"); // ✅ Fix for "Op is not defined"
const Op = Sequelize.Op;
const Order = require("../models/Order");
const OrderStep = require("../models/OrderStep");  
const MachineAllocation = require("../models/MachineAllocation");
const EmployeeTask = require("../models/EmployeeTask");
const Employee = require("../models/Employee");

const router = express.Router();

// ✅ Fetch all orders
router.get("/", async (req, res) => {
    try {
        const orders = await Order.findAll();
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Error fetching orders" });
    }
});

// ✅ Fetch all steps for a specific order
router.get("/:orderId/steps", async (req, res) => {
    try {
        const { orderId } = req.params;
        const steps = await OrderStep.findAll({ where: { order_id: orderId } });

        if (!steps.length) {
            return res.status(404).json({ message: "No steps found for this order" });
        }

        res.status(200).json(steps);
    } catch (error) {
        console.error("❌ Error fetching steps:", error);
        res.status(500).json({ error: "Error fetching steps" });
    }
});

// ✅ Fetch Orders with Assigned Machines
router.get("/assigned-machines", async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                {
                    model: MachineAllocation,
                    attributes: ["id", "machine_id", "step"],
                    include: [
                        {
                            model: EmployeeTask,
                            attributes: ["id", "employee_id", "target", "completed", "status"],
                            include: [{ model: Employee, attributes: ["name"] }]
                        }
                    ]
                }
            ]
        });

        res.status(200).json(orders);
    } catch (error) {
        console.error("❌ Error fetching orders with machines:", error);
        res.status(500).json({ error: "Error fetching orders with assigned machines" });
    }
});


// create order 
// ✅ Create a new order and store steps
router.post("/add", async (req, res) => {
    try {
        const { order_number, product, quantity, steps } = req.body;

        // ✅ Create Order
        const order = await Order.create({ order_number, product, quantity });

        // ✅ Insert Steps into "order_steps" table
        if (steps && steps.length > 0) {
            const stepData = steps.map(step => ({ order_id: order.id, name: step.name }));
            await OrderStep.bulkCreate(stepData);
        }

        res.status(201).json({ message: "Order and steps added successfully!", order });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ error: "Error creating order" });
    }
});

// ✅ Fetch Orders with Steps, Machines, and Completed Counts
router.get("/progress", async (req, res) => {
    try {
        console.log("📡 Fetching Orders Progress...");

        // ✅ Fetch All Orders
        const orders = await Order.findAll({
            attributes: ["id", "order_number", "product", "quantity","status"],
            include: [
                {
                    model: OrderStep, // ✅ Fetch all steps for each order
                    attributes: ["name"], // Step Name
                },
                {
                    model: MachineAllocation, // ✅ Fetch allocated machines
                    attributes: ["id", "step", "machine_id"],
                },
            ],
        });

        // ✅ Process Each Order
        const ordersWithProgress = await Promise.all(
            orders.map(async (order) => {
                console.log(`🔍 Processing Order ID: ${order.id}`);

                // 🛠️ Create a mapping of assigned machines by step
                const machineMap = {};
                order.MachineAllocations.forEach(machine => {
                    machineMap[machine.step] = machine.id; // { "Step A": 1, "Step B": 2, ... }
                });

                // 🔥 **Fetch Completed Work for Each Step**
                const stepsWithProgress = await Promise.all(
                    order.OrderSteps.map(async (step) => {
                        // 🔍 Get machine allocation ID for this step (if assigned)
                        const machineId = machineMap[step.name] || null;

                        // ✅ Get the sum of completed work for this step
                        let completedCount = 0;
                        if (machineId) {
                            completedCount = await EmployeeTask.sum("completed", {
                                where: { machine_allocation_id: machineId },
                            }) || 0; // Default to 0 if no data found
                        }

                        return {
                            step: step.name,
                            machine_id: machineId,
                            completed: completedCount,
                        };
                    })
                );

                // 🔥 **Calculate Total Completed for Order**
                const totalCompleted = stepsWithProgress.reduce((sum, step) => sum + step.completed, 0);

                console.log(`✅ Total Completed for Order ${order.id}:`, totalCompleted);

                return {
                    id: order.id,
                    order_number: order.order_number,
                    status: order.status,
                    product: order.product,
                    quantity: order.quantity,
                    completed: totalCompleted, // Total completed across all steps
                    steps: stepsWithProgress, // Detailed step-wise completion
                };
            })
        );

        console.log("✅ Final API Response:", JSON.stringify(ordersWithProgress, null, 2));
        res.status(200).json(ordersWithProgress);
    } catch (error) {
        console.error("❌ Error fetching order progress:", error);
        res.status(500).json({ error: "Error fetching order progress" });
    }
});

// ✅ Delete Order by ID
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // ✅ Check if the order exists
        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // ✅ Delete related machine allocations and tasks
        await MachineAllocation.destroy({ where: { order_id: id } });
        await EmployeeTask.destroy({ where: { machine_allocation_id: null } });

        // ✅ Delete order
        await order.destroy();
        res.status(200).json({ message: "✅ Order deleted successfully" });

    } catch (error) {
        console.error("❌ Error deleting order:", error);
        res.status(500).json({ error: "Error deleting order" });
    }
});


router.put("/update/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;
        const { product, quantity } = req.body;

        console.log(`🛠 Updating Order ${orderId} with Product: ${product}, Quantity: ${quantity}`);

        if (!product || !quantity) {
            return res.status(400).json({ error: "Product and quantity are required" });
        }

        const updatedOrder = await Order.update(
            { product, quantity },
            { where: { id: orderId } }
        );

        if (updatedOrder[0] === 0) {
            return res.status(404).json({ error: "Order not found" });
        }

        console.log("✅ Order Updated:", updatedOrder);
        res.status(200).json({ message: "Order updated successfully" });

    } catch (error) {
        console.error("❌ Error updating order:", error);
        res.status(500).json({ error: "Error updating order" });
    }
});


module.exports = router;
