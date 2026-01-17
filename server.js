import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
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
// CORS (EXPRESS 5 SAFE)
// ----------------------
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://dineics.onrender.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman / server-to-server
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
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
    service: "Restaurant POS Backend",
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
// Server Start
// ----------------------
const startServer = () => {
  if (process.env.DEPLOY_ENV === "local") {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } else if (process.env.DEPLOY_ENV === "prod") {
    try {
      const options = {
        cert: fs.readFileSync(process.env.SSL_CRT_PATH),
        key: fs.readFileSync(process.env.SSL_KEY_PATH),
      };

      app.set("trust proxy", true);

      const httpsServer = https.createServer(options, app);
      httpsServer.listen(PORT, () => {
        console.log(`HTTPS Server running on port ${PORT}`);
      });
    } catch (error) {
      console.error("Failed to start HTTPS server", error);
    }
  }
};

startServer();

export default app;
