const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const EmployeeTaskHistory = sequelize.define("EmployeeTaskHistory", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    order_Number: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    Step_Name:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    machine_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    target: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    working_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    tableName: "employee_task_histories",  // 🧠 Table name
    timestamps: false,  // Since we already have action_time
});

module.exports = EmployeeTaskHistory;
