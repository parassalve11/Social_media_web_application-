import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL);
    console.log("Mongodb is connected on", conn.connection.host);
  } catch (error) {
    console.log("Error while connecting to Database", { error });
    process.exit(1);
  }
};
