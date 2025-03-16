const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Order = require("./Order");
const Machine = require("./Machine");

const MachineAllocation = sequelize.define("MachineAllocation", {
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
    machine_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Machine,
            key: "id",
        },
    },
    step: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: "Assigned",
    },
}, {
    timestamps: true,
});

// ✅ Define Proper Relationships
Order.hasMany(MachineAllocation, { foreignKey: "order_id", onDelete: "CASCADE" });
MachineAllocation.belongsTo(Order, { foreignKey: "order_id" });

Machine.hasMany(MachineAllocation, { foreignKey: "machine_id", onDelete: "CASCADE" });
MachineAllocation.belongsTo(Machine, { foreignKey: "machine_id" });

module.exports = MachineAllocation;
