const Employee = require("../models/Employee");
const EmployeeTask = require("../models/EmployeeTask");
const RFIDScan = require("../models/RFIDScan");
const MachineAllocation = require("../models/MachineAllocation");

exports.processRFIDScan = async (req, res) => {
    try {
        const { rfid } = req.body; // Get RFID from ESP32

        if (!rfid) {
            return res.status(400).json({ message: "RFID tag is required." });
        }

        // ✅ 1. Find Employee by RFID
        const employee = await Employee.findOne({ where: { rfid } });
        if (!employee) {
            return res.status(404).json({ message: "Employee not found." });
        }

        // ✅ 2. Get the Assigned Task for this Employee
        const task = await EmployeeTask.findOne({
            where: { employee_id: employee.id },
            include: [{ model: MachineAllocation }],
        });

        if (!task) {
            return res.status(404).json({ message: "No active task found for this employee." });
        }

        // ✅ 3. Save the Scan Record in `RFIDScans` Table
        await RFIDScan.create({
            employee_id: employee.id,
            task_id: task.id,
            scan_time: new Date(),
        });

        // ✅ 4. Increment Work Count for Task
        task.completed += 1;
        await task.save();

        // ✅ 5. Return Employee Details & Task Info
        return res.json({
            employee_name: employee.name,
            order_id: task.MachineAllocation.order_id,
            target: task.target,
            completed: task.completed,
            message: "Scan recorded successfully.",
        });

    } catch (error) {
        console.error("❌ Error processing RFID scan:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
