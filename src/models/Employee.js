const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Employee = sequelize.define("Employee", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    rfid: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    mobile:{
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    }
}, {
    timestamps: true,  // Automatically adds createdAt & updatedAt
});


module.exports = Employee;
