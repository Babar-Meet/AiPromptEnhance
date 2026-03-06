import mongoose from "mongoose";

export async function connectDb() {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/AiPromptEnhance";
  const dbName = process.env.MONGO_DB_NAME || "AiPromptEnhance";
  await mongoose.connect(mongoUri, {
    dbName,
  });
  console.log("Connected to MongoDB");
}
