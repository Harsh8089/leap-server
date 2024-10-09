import dotenv from "dotenv"
import db from './db/db.js';
import { app } from './app.js'

dotenv.config({
    path: './.env'
})

db()
.then(() => {
    app.listen(5555, () => {
        console.log(`Server is running at port : 5555`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})