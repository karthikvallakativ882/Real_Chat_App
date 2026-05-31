import { io } from "socket.io-client";

// --- NEW LOGIC ADDED: Dynamic URL switching ---
const URL = import.meta.env.DEV 
  ? "http://localhost:5000" 
  : "https://real-chat-app-nzkj.onrender.com"; // 
// ----------------------------------------------

export const socket = io(URL, {
  autoConnect: true,
  withCredentials: true,
  transports: ["websocket"],
});