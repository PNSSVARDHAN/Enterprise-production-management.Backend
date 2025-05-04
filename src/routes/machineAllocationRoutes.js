const express = require("express");
const MachineAllocation = require("../models/MachineAllocation");
const EmployeeTask = require("../models/EmployeeTask");
const Machine = require("../models/Machine");
const Order = require("../models/Order");

const router = express.Router();

// ✅ Fetch Assigned Machines with Order ID and Step Name
router.get("/", async (req, res) => {
    try {
        const allocations = await MachineAllocation.findAll({
            attributes: ["order_id", "step", "machine_id", "status"]
        });

        // ✅ Remove machines that have completed their tasks
        const activeAllocations = allocations.filter(machine => machine.status !== "Available");

        res.status(200).json(activeAllocations);
    } catch (error) {
        console.error("❌ Error fetching machine allocations:", error);
        res.status(500).json({ error: "Error fetching machine allocations" });
    }
});

// Get all machine allocations grouped by order_id
router.get("/by-order", async (req, res) => {
    try {
        const allocations = await MachineAllocation.findAll({
            include: [
                {
                    model: Order,
                    attributes: ['order_number', 'product']
                },
                {
                    model: Machine,
                    attributes: ['machine_number']
                }
            ],
            order: [['order_id', 'ASC']]
        });

        // Group allocations by order_id
        const groupedAllocations = allocations.reduce((acc, allocation) => {
            const orderId = allocation.order_id;
            if (!acc[orderId]) {
                acc[orderId] = {
                    order_id: orderId,
                    order_number: allocation.Order?.order_number,
                    product: allocation.Order?.product,
                    allocations: []
                };
            }
            acc[orderId].allocations.push({
                id: allocation.id,
                machine_number: allocation.Machine?.machine_number,
                step: allocation.step,
                status: allocation.status,
                createdAt: allocation.createdAt
            });
            return acc;
        }, {});

        res.status(200).json(Object.values(groupedAllocations));
    } catch (error) {
        console.error("❌ Error fetching grouped machine allocations:", error);
        res.status(500).json({ error: "Error fetching machine allocations" });
    }
});

// ✅ Update Machine Status (Check Latest Task & Set to Available if Completed)
router.post("/update-machine-status", async (req, res) => {
    try {
        const { machine_id } = req.body;

        console.log("📡 Received machine status update request for Machine:", machine_id);

        if (!machine_id) {
            console.log("❌ Missing machine_id in request");
            return res.status(400).json({ error: "Missing machine_id" });
        }

        // ✅ Find the latest task assigned to this machine
        const latestTask = await EmployeeTask.findOne({
            include: [{ model: MachineAllocation, where: { machine_id } }],
            order: [["createdAt", "DESC"]],
        });
        

        if (!latestTask) {
            console.log(`✅ No active task found for Machine ${machine_id}, marking as Available`);
            await Machine.update({ status: "Available" }, { where: { id: machine_id } });
            await MachineAllocation.update({ status: "Available" }, { where: { machine_id } });
            return res.status(200).json({ message: `✅ Machine ${machine_id} is now available.` });
        }

        console.log(`🔍 Checking task status for Machine ${machine_id}`);
        console.log(`   Task ID: ${latestTask.id}, Completed: ${latestTask.completed}, Target: ${latestTask.target}`);

        // ✅ Check if the task is completed
        if (latestTask.completed >= latestTask.target) {
            console.log(`✅ Task completed for Machine ${machine_id}, updating status to Available`);
            await Machine.update({ status: "Available" }, { where: { id: machine_id } });
            await MachineAllocation.destroy({ where: { machine_id } }); // ❌ Remove allocation

            return res.status(200).json({ message: `✅ Machine ${machine_id} is now available.` });
        }

        console.log(`🔴 Machine ${machine_id} still has pending tasks`);
        return res.status(400).json({ error: `Machine ${machine_id} still has active tasks.` });

    } catch (error) {
        console.error("❌ Error updating machine status:", error);
        return res.status(500).json({ error: "Error updating machine status", details: error.message });
    }
});

// ✅ Assign Machine to Step (Ensuring One Machine Per Step)
router.post("/assign", async (req, res) => {
    try {
        const { order_id, step, machine_id } = req.body;

        console.log(`🔍 Checking machine availability for Order ${order_id}, Step: ${step}, Machine: ${machine_id}`);

        if (!order_id || !step || !machine_id) {
            return res.status(400).json({ error: "Missing order_id, step, or machine_id" });
        }

        // ✅ Check if the machine is already assigned to another step
        const existingMachineAssignment = await MachineAllocation.findOne({ where: { machine_id } });
        if (existingMachineAssignment) {
            return res.status(400).json({ error: `Machine ${machine_id} is already assigned to Order` });
        }

        // ✅ Assign the machine to the step
        const allocation = await MachineAllocation.create({ order_id, step, machine_id, status: "Assigned" });
        await Machine.update(
            { status: "Busy" }, // fields you want to update
            { where: { id: machine_id } } // which machine to update
          );

        console.log("✅ Machine assigned successfully:", allocation);
        res.status(201).json({ message: "✅ Machine assigned successfully!", allocation });
    } catch (error) {
        console.error("❌ Error assigning machine:", error);
        res.status(500).json({ error: "Error assigning machine" });
    }
});

// ✅ Free up the machine when employee completes target
router.post("/free-machine", async (req, res) => {
    try {
        const { machine_id } = req.body;

        console.log("🔍 Checking if machine can be freed:", { machine_id });

        if (!machine_id) {
            return res.status(400).json({ error: "Missing machine_id" });
        }

        // 🛑 Check if any incomplete tasks exist for the machine
        const pendingTasks = await EmployeeTask.findOne({ 
            where: { machine_id: machine_id, status: { [Op.ne]: "Completed" } }
        });

        if (pendingTasks) {
            return res.status(400).json({ error: `Machine ${machine_id} still has pending tasks` });
        }

        // ✅ Free the machine by updating status
        await MachineAllocation.update({ status: "Available" }, { where: { machine_id } });
        await Machine.update({ status: "Available" },{ where: { machine_id } } );
        console.log("✅ Machine is now free:", machine_id);
        res.status(200).json({ message: `✅ Machine ${machine_id} is now free and ready to use.` });
    } catch (error) {
        console.error("❌ Error freeing machine:", error);
        res.status(500).json({ error: "Error freeing machine" });
    }
});

// Delete a machine allocation by ID
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Find the allocation first to get the machine_id
        const allocation = await MachineAllocation.findByPk(id);
        if (!allocation) {
            return res.status(404).json({ error: "Machine allocation not found" });
        }

        // Delete any associated employee tasks
        await EmployeeTask.destroy({
            where: { machine_allocation_id: id }
        });

        // Delete the machine allocation
        await allocation.destroy();

        // Update machine status to Available
        await Machine.update(
            { status: "Available" },
            { where: { id: allocation.machine_id } }
        );

        res.status(200).json({ 
            message: "Machine allocation deleted successfully",
            details: "Associated tasks deleted and machine status updated to Available"
        });
    } catch (error) {
        console.error("❌ Error deleting machine allocation:", error);
        res.status(500).json({ error: "Error deleting machine allocation" });
    }
});

module.exports = router;
