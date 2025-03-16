const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Employee = require("./Employee");
const EmployeeTask = require("./EmployeeTask");

const RFIDScan = sequelize.define("RFIDScan", {
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
    task_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: EmployeeTask,
            key: "id",
        },
    },
    scan_time: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: false,
});

Employee.hasMany(RFIDScan, { foreignKey: "employee_id" });
EmployeeTask.hasMany(RFIDScan, { foreignKey: "task_id" });

module.exports = RFIDScan;
