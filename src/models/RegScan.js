const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RegScan = sequelize.define("RegScan", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    rfid: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    scanned_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW, // Automatically store timestamp
    }
}, {
    timestamps: false, // We only need scanned_at
});

module.exports = RegScan;
