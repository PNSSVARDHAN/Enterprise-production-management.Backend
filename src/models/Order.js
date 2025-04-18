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
    
    current_stage: {
        type: DataTypes.ENUM(
          "Cutting",
          "Cutting Started",
          "Cutting Completed",
          "Sewing is in progress",
          "Sewing Completed",
          "Quality Check in progress",
          "Quality Check Completed",
          "Packing is in progress",
          "Packing Completed",
          "Ready for Dispatch",
          "Dispatched",
        ),
        defaultValue: "Cutting",
      },    

}, {
    timestamps: true,  // Adds createdAt & updatedAt fields
});

module.exports = Order;
