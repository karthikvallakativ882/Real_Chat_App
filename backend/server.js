import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";

import http from "http";

import { Server } from "socket.io";

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";

import messageRoutes from "./routes/messageRoutes.js";

import { socketConnection } from "./sockets/socket.js";

dotenv.config();

const app = express();


// middleware
app.use(cors());

app.use(express.json());


// database
connectDB();


// routes
app.use("/api/auth", authRoutes);

app.use("/api/messages", messageRoutes);

app.use("/api/users", userRoutes);


app.get("/", (req, res) => {
  res.send("API Running");
});


// create http server
const server = http.createServer(app);


// socket server
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL
  },
});


// socket connection
socketConnection(io);


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server Running On ${PORT}`);
});