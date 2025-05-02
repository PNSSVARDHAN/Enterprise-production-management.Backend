const {DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    reset_token: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    role: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Null',   
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Employees',
            key: 'id'
        }
    }
});

module.exports = User;
