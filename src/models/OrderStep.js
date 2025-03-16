const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Order = require("./Order");

const OrderStep = sequelize.define("OrderStep", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Order,
            key: "id",
        },
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    timestamps: false
});

// Define relationship
Order.hasMany(OrderStep, { foreignKey: "order_id" });
OrderStep.belongsTo(Order, { foreignKey: "order_id" });

module.exports = OrderStep;
