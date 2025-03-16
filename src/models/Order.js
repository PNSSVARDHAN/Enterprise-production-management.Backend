const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Order = sequelize.define("Order", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    order_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    product: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "Pending",  // Pending, In Progress, Completed
    },
}, {
    timestamps: true,  // Adds createdAt & updatedAt fields
});

module.exports = Order;
