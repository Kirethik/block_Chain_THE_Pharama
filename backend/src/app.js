const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { sequelize, syncModels } = require("./models");
require("dotenv").config();

const txRoutes = require("./routes/transactions");
const productRoutes = require("./routes/products");
const entityRoutes = require("./routes/entities");
const healthRoutes = require("./routes/health");

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/transactions", txRoutes);
app.use("/api/products", productRoutes);
app.use("/api/entities", entityRoutes);
app.use("/api/health", healthRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "Pharmaceutical Supply Chain Backend",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api/health",
      transactions: "/api/transactions",
      products: "/api/products",
      entities: "/api/entities"
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Database initialization
async function initDb() {
  try {
    await sequelize.authenticate();
    console.log("✓ Database connection established");
    
    await syncModels();
    console.log("✓ Database models synchronized");
    
  } catch (err) {
    console.error("✗ Database initialization failed:", err);
    process.exit(1);
  }
}

// Only initialize if not in test mode
if (process.env.NODE_ENV !== 'test') {
  initDb();
}

module.exports = app;