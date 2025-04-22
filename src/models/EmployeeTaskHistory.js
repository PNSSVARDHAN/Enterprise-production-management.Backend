// models/EmployeeTaskHistory.js

module.exports = (sequelize, DataTypes) => {
    const EmployeeTaskHistory = sequelize.define('EmployeeTaskHistory', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        employee_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        machine_allocation_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        target: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        action_type: {         // 👈 NEW: To know what happened (Reassign, etc.)
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'UPDATE'
        },
        action_time: {         // 👈 NEW: When it was changed
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'employee_task_histories', // 🔵 your table name
        timestamps: false
    });

    return EmployeeTaskHistory;
};
