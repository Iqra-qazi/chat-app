import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not set. Add it to backend/.env or the project root .env file.");
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    family: 4
  });
  console.log("Connected to DB");
}
