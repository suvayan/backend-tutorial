import mongoose from "mongoose";
import { DB_NAME, DB_PORT } from "../constant.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}:${DB_PORT}/${DB_NAME}`
        );
        console.error(
            `\n MongoDB Connected !! DB_HOST: ${connectionInstance.connection.host}`
        );
    } catch (err) {
        console.error("MongoDB connection faild: ", err);
        process.exit(1);
    }
};

export default connectDB;
