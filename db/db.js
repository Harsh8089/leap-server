import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({
    path: './.env'
})

const db = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.URI, {
            dbName: process.env.DB_NAME
        })
        console.log(`\nMongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
         
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}

export default db;