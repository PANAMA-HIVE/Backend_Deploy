import express from "express";
import dotenv from 'dotenv';
import cors from 'cors';
//importing clerk
import { clerkMiddleware , clerkClient } from '@clerk/express'
import mongoose from "mongoose";
import groupRoutes from './routes/groupRoutes.js';
import ragRoutes from "./routes/ragRoutes.js";

//load environmental variables
dotenv.config();

const PORT = process.env.PORT || 5000;

//connect to database
mongoose.connect(process.env.MONGO_DB_URI).then(()=>{
  console.log('Connected to MongoDB');  
}).catch((err)=>{
    console.log(err.message);
});

//express app
const app = express();

app.use(clerkMiddleware());

//middlewares
app.use(express.json());
app.use(cors({ origin: [process.env.CLIENT_URL, process.env.CLIENT_URL_OTHER],   credentials: true }));  //[process.env.CLIENT_URL, process.env.CLIENT_URL_OTHER],

//build routes here
app.get("/", (req, res) => {
    res.status(200).json({ sucess: 'true', message: 'hello from backend' });
})

app.use("/api/groups", groupRoutes);
app.use("/api/rag", ragRoutes);

//this is a health check route for debugging and monitoring
app.get("/api/health", (req, res) => {
    console.log("Health check route accessed");
    res.status(200).json({ sucess: 'true', status: 'UP', message: 'API is healthy' });
})

app.post("/", (req, res) => {
    res.status(200).json({ sucess: 'true', message: 'POST request received' });
})


//Setting up the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})

export default app;