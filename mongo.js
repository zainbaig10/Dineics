import mongoose from "mongoose";

mongoose.set("strictQuery", true);

// Connection Events
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.once("open", () => {
  console.log("MongoDB connected successfully");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Closing MongoDB connection...");
  await mongoose.connection.close();
  process.exit(0);
});

const mongooseConnection = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: false,
      maxPoolSize: 10, // for multi-client support
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB Connected to: ${connection.connection.name}`);
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

export default mongooseConnection;
