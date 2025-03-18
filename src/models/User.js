const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcryptjs");

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
    }
});

User.beforeCreate((user) => {
    user.password = bcrypt.hashSync(user.password, 10);
});

module.exports = User;
