const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Machine = sequelize.define("Machine", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    machine_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "Available",  // Available, In Use
    },
}, {
    timestamps: true,
});

module.exports = Machine;
