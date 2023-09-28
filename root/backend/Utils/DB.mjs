import mongoose from "mongoose";

/**
 * @description This function connects mongoose client to mongodb database
 */
export async function ConnectToMongoDB() {
  try {
    console.log("Tryig to connect to mongodb .....");
    await mongoose.connect(process.env.MONGODB_CONNECTION_URI);
    console.log("MongoDB connection successful........");
    return;
  } catch (error) {
    throw error;
  }
}
