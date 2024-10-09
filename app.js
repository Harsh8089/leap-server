import cors from 'cors';
import express from 'express';

const app = express();

app.use(cors());
app.use(express.json());

import userRouter from './routes/user.route.js';
import stockRouter from './routes/stock.route.js';
import fdRouter from './routes/fd.route.js';

app.use("/api/v1/users", userRouter);
app.use("/api/v1/stocks", stockRouter);
app.use("/api/v1/fd", fdRouter);

export { app }