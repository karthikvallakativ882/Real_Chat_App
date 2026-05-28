import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();


// middleware
app.use(cors());

app.use(express.json());


// database
connectDB();


// routes
app.use("/api/auth", authRoutes);


app.get("/", (req, res) => {
  res.send("API Running");
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Running On ${PORT}`);
});