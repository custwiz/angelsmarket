import mongoose from "mongoose";

let connectionPromise: Promise<typeof mongoose> | null = null;

export const ensureMongoConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!connectionPromise) {
    const uri = "mongodb+srv://connect_db_user:bl2JT2Wc3Bacj5Lb@cluster0.6pjokiu.mongodb.net/";

    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    mongoose.connection.on("connected", () => {
      console.log("Connected to MongoDB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error", err);
    });
  }

  return connectionPromise;
};
