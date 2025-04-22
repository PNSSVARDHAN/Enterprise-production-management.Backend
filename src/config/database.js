
const { Sequelize } = require("sequelize");
require("dotenv").config();

// Create a new Sequelize instance
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: process.env.DB_PORT,
    logging: false,  // Disable SQL query logging for cleaner output
});

// Test database connection
sequelize.authenticate()
    .then(() => console.log("✅ Database Connected Successfully"))
    .catch((err) => console.error("❌ Database Connection Failed:", err));

module.exports = sequelize; 



// const { Sequelize } = require("sequelize");
// require("dotenv").config();

// const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
//     host: process.env.DB_HOST,
//     dialect: "postgres",
//     port: process.env.DB_PORT,
//     logging: false,  // Disable SQL query logging for cleaner output
//     dialectOptions: {
//         ssl: {
//             require: true,
//             rejectUnauthorized: false,  // Required for Railway PostgreSQL
//         },
//     },
// });

// // Test database connection
// sequelize.authenticate()
//     .then(() => console.log("✅ Database Connected Successfully"))
//     .catch((err) => console.error("❌ Database Connection Failed:", err));

// module.exports = sequelize; 

