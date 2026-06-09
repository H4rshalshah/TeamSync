import mongoose from "mongoose";
import { config } from "./app.config";
import { enableLocalDemoMode } from "../utils/local-demo-mode";
import { ensureDefaultRoles } from "../utils/ensure-default-roles";

const connectDatabase = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    await ensureDefaultRoles();
    console.log("Connected to Mongo database");
  } catch (error) {
    console.log("Error connecting to Mongo database");
    if (config.NODE_ENV === "development" && config.LOCAL_DEMO_MODE) {
      enableLocalDemoMode();
      console.log(
        "MongoDB is unavailable. Running backend in local demo mode."
      );
      return;
    }

    if (config.NODE_ENV === "development") {
      console.log(
        "MongoDB is unavailable. Start MongoDB locally or set MONGO_URI to MongoDB Atlas for real user accounts."
      );
      return;
    }

    process.exit(1);
  }
};

export default connectDatabase;
