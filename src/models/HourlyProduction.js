const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Employee = require("./Employee"); // adjust path if needed

const HourlyProduction = sequelize.define("HourlyProduction", {
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
            key: "id"
        }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    "09_10": {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    "10_11": {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    "11_12": {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    "12_01": {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    "01_02": {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    "02_03": {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    "03_04": {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    "04_05": {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    total: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    }
}, {
    indexes: [
        {
            fields: ['employee_id', 'date'],
            unique: true
        }
    ],
    timestamps: true
});

// Optional: Add association
Employee.hasMany(HourlyProduction, { foreignKey: 'employee_id' });
HourlyProduction.belongsTo(Employee, { foreignKey: 'employee_id' });

module.exports = HourlyProduction;
