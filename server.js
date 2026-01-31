import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import http from "http";
import https from "https";

import connectDB from "./mongo.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4035;

// ----------------------
// Core Middlewares
// ----------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------
// CORS (ALLOW ALL)
// ----------------------
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ----------------------
// Database Connection
// ----------------------
connectDB();

// ----------------------
// Health Check
// ----------------------
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "Dineics POS Backend",
    time: new Date().toISOString(),
  });
});

// ----------------------
// API Routes
// ----------------------
app.use("/api", routes);

// ----------------------
// Global Error Handler
// ----------------------
app.use(errorHandler);

// ----------------------
// Server Start (HTTP / HTTPS)
// ----------------------
const sslKeyPath = process.env.SSL_KEY_PATH;
const sslCertPath = process.env.SSL_CERT_PATH;

if (sslKeyPath && sslCertPath) {
  const sslOptions = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath),
  };

  https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`🔐 HTTPS Server running on port ${PORT}`);
  });
} else {
  http.createServer(app).listen(PORT, () => {
    console.log(`🚀 HTTP Server running on port ${PORT}`);
  });
}

export default app;
