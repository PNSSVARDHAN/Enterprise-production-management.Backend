require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { createServer } = require("http");
const { Server } = require("ws");
const sequelize = require("./config/database");

// Import Routes
const employeeRoutes = require("./routes/employeeRoutes");
const orderRoutes = require("./routes/orderRoutes");
const machineRoutes = require("./routes/machineRoutes");
const employeeTaskRoutes = require("./routes/employeeTaskRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const machineAllocationRoutes = require("./routes/machineAllocationRoutes");
const employeeDashboardRoutes = require("./routes/employeeDashboardRoutes");
const rfidRoutes = require("./routes/rfidRoutes");
const authRoutes = require("./routes/authRoutes");

const RegScan = require("./models/RegScan");  
const Order = require("./models/Order");
const OrderStep = require("./models/OrderStep");
const EmployeeTaskHistory = require("./models/EmployeeTaskHistory");
const EmployeeTask = require("./models/EmployeeTask");
const Machine = require("./models/Machine");
const Employee = require("./models/Employee");  
const MachineAllocation = require("./models/MachineAllocation");
const User = require("./models/User"); // Import User model
const HourlyProduction = require("./models/HourlyProduction");


// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
    origin: [
        "https://cutmap-smo.vercel.app",
        "https://cutmapsmo.vercel.app",
        "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
    //comment
};

app.use(cors(corsOptions)); 
app.use(bodyParser.json());
app.use(express.json()); 

// ✅ Routes
app.use("/api/employees", employeeRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/employee-tasks", employeeTaskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/machine-allocations", machineAllocationRoutes);
app.use("/api/employee-dashboard", employeeDashboardRoutes); 
app.use("/api/rfid", rfidRoutes);
app.use("/api/auth", authRoutes);

// New route
app.get("/api/dashboard/office", (req, res) => {
    res.json({ message: "CORS is working!" });
});

// Create HTTP & WebSocket Server
const server = createServer(app);
const wss = new Server({ server });

// Store connected clients
const clients = new Set();

wss.on("connection", (ws) => {
    console.log("✅ Client connected");
    clients.add(ws);

    ws.on("close", () => {
        console.log("❌ Client disconnected");
        clients.delete(ws);
    });
});

// Function to send real-time updates
const sendLiveUpdate = async () => {
    try {
        const totalTasks = await sequelize.models.EmployeeTask.count();
        const completedTasks = await sequelize.models.EmployeeTask.count({ where: { status: "Completed" } });
        const activeOrders = await sequelize.models.Order.count({ where: { status: "In Progress" } });
        const availableMachines = await sequelize.models.Machine.count({ where: { status: "Available" } });
        const inUseMachines = await sequelize.models.Machine.count({ where: { status: "In Use" } });

        const updateData = { totalTasks, completedTasks, activeOrders, availableMachines, inUseMachines };

        clients.forEach((client) => {
            if (client.readyState === 1) {
                client.send(JSON.stringify(updateData));
            }
        });
    } catch (error) {
        console.error("Error in WebSocket update:", error);
    }
};

// Send updates every 5 seconds
setInterval(sendLiveUpdate, 3000);

// Start Server
sequelize.sync({ alter: true })
    .then(() => {
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => console.error("Database Sync Failed:", err));
