// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import fs from "fs";
// import https from "https";

// import connectDB from "./mongo.js";
// import routes from "./routes/index.js";
// import { errorHandler } from "./middleware/errorHandler.js";

// // Load environment variables
// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 4035;

// // ----------------------
// // Core Middlewares
// // ----------------------
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // CORS Configuration
// const allowedOrigins =
//   process.env.ALLOWED_ORIGINS === "*"
//     ? "*"
//     : process.env.ALLOWED_ORIGINS?.split(",");

// app.use(
//   cors({
//     origin: allowedOrigins,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//     credentials: true,
//   })
// );

// // ----------------------
// // Database Connection
// // ----------------------
// connectDB();

// // ----------------------
// // Health Check
// // ----------------------
// app.get("/health", (req, res) => {
//   return res.status(200).json({
//     status: "OK",
//     service: "Restaurant POS Backend",
//     time: new Date().toISOString(),
//   });
// });

// // ----------------------
// // API Routes
// // ----------------------
// app.use("/api", routes);

// // ----------------------
// // Global Error Handler
// // ----------------------
// app.use(errorHandler);

// // ----------------------
// // Server Start Function
// // ----------------------
// const startServer = () => {
//   if (process.env.DEPLOY_ENV === "local") {
//     app.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//     });
//   } else if (process.env.DEPLOY_ENV === "prod") {
//     try {
//       const options = {
//         cert: fs.readFileSync(process.env.SSL_CRT_PATH),
//         key: fs.readFileSync(process.env.SSL_KEY_PATH),
//       };

//       const httpsServer = https.createServer(options, app);
//       app.set("trust proxy", true);

//       httpsServer.listen(PORT, () => {
//         console.log(`HTTPS Server running on port ${PORT}`);
//       });
//     } catch (error) {
//       console.error("Failed to start HTTPS server", error);
//     }
//   }
// };

// // Start the server
// startServer();

// export default app;
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import https from "https";
import helmet from "helmet";

import connectDB from "./mongo.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

// ----------------------
// Load Environment Variables
// ----------------------
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4035;

// ----------------------
// Core Middlewares
// ----------------------
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------
// CORS Configuration
// ----------------------
const allowedOrigins =
  process.env.ALLOWED_ORIGINS === "*"
    ? "*"
    : process.env.ALLOWED_ORIGINS?.split(",");

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin || // allow mobile apps / curl / postman
        allowedOrigins === "*" ||
        allowedOrigins?.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

// ----------------------
// Health Check
// ----------------------
app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "OK",
    service: "Restaurant POS Backend",
    environment: process.env.DEPLOY_ENV,
    timestamp: new Date().toISOString(),
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
// Server Startup
// ----------------------
const startServer = async () => {
  try {
    // Connect Database
    await connectDB();
    console.log("✅ Database connected");

    if (process.env.DEPLOY_ENV === "local") {
      app.listen(PORT, () => {
        console.log(`🚀 HTTP Server running on port ${PORT}`);
      });
    } else if (process.env.DEPLOY_ENV === "prod") {
      const sslOptions = {
        cert: fs.readFileSync(process.env.SSL_CRT_PATH),
        key: fs.readFileSync(process.env.SSL_KEY_PATH),
      };

      const httpsServer = https.createServer(sslOptions, app);
      app.set("trust proxy", true);

      httpsServer.listen(PORT, () => {
        console.log(`🔐 HTTPS Server running on port ${PORT}`);
      });
    } else {
      throw new Error("Invalid DEPLOY_ENV value");
    }
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

// ----------------------
// Graceful Shutdown
// ----------------------
process.on("SIGINT", () => {
  console.log("🛑 SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

// ----------------------
// Start Server
// ----------------------
startServer();

export default app;
