import express from "express";
import cors from "cors";
import dotenv from "dotenv";

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
// CORS (SAFE + SIMPLE)
// ----------------------
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://servex-pos.vercel.app",
  "https://dineics.onrender.com"
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server / Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("❌ CORS blocked:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
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
// Server Start (NO HTTPS HERE)
// ----------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
