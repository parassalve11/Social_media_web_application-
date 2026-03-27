import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/user.model.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);

    await User.updateMany(
      { emailVerified: { $exists: false } },
      { $set: { emailVerified: false } }
    );
    await User.updateMany(
      { failedLoginAttempts: { $exists: false } },
      { $set: { failedLoginAttempts: 0 } }
    );
    await User.updateMany(
      { lockoutUntil: { $exists: false } },
      { $set: { lockoutUntil: null } }
    );

    console.log("Auth fields migration complete");
  } catch (error) {
    console.error("Migration failed", error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
