const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: "postgres",
  port: process.env.DB_PORT,
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // For Railway PostgreSQL
    },
  },
  pool: {
    max: 10,          // max number of connections in pool
    min: 0,           // min number of connections in pool
    acquire: 30000,   // max time (ms) to try getting connection before throwing error
    idle: 10000,      // max time (ms) a connection can be idle before being released
    evict: 10000,     // time interval for evicting idle connections
  },
});

// Test database connection and reconnect logic
async function connectWithRetry() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database Connected Successfully");
  } catch (err) {
    console.error("❌ Database Connection Failed:", err);
    // Retry after 5 seconds
    setTimeout(connectWithRetry, 5000);
  }
}
connectWithRetry();
module.exports = sequelize;
