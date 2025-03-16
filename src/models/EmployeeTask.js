const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Employee = require("./Employee");
const MachineAllocation = require("./MachineAllocation");

const EmployeeTask = sequelize.define("EmployeeTask", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Employee,
            key: "id",
        },
    },
    machine_allocation_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: MachineAllocation,
            key: "id",
        },
    },
    target: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    completed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    duration: {
        type: DataTypes.STRING,
        allowNull: false, // "One Day" or "Multiple Days"
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "Assigned", // Assigned, In Progress, Completed
    },
}, {
    timestamps: true,
});

// ✅ Fix associations
Employee.hasMany(EmployeeTask, { foreignKey: "employee_id" });
EmployeeTask.belongsTo(Employee, { foreignKey: "employee_id" });

MachineAllocation.hasMany(EmployeeTask, { foreignKey: "machine_allocation_id" });
EmployeeTask.belongsTo(MachineAllocation, { foreignKey: "machine_allocation_id" });

module.exports = EmployeeTask;
