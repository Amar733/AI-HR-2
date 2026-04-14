const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("🔌 MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        console.log("📤 MongoDB connection closed through app termination");
        process.exit(0);
      } catch (err) {
        console.error("❌ Error during MongoDB shutdown:", err);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);

    // Log specific connection errors
    if (error.name === "MongoNetworkError") {
      console.error("Network error - check your MongoDB connection string");
    } else if (error.name === "MongooseServerSelectionError") {
      console.error("Server selection error - MongoDB server may be down");
    } else if (error.name === "MongoParseError") {
      console.error("Connection string parse error - check your MONGODB_URI");
    }

    process.exit(1);
  }
};

module.exports = connectDB;
