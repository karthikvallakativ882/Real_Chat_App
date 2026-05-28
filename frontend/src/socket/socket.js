import { io } from "socket.io-client";

// Use the environment variable, but fallback to port 5000 if it fails to load
const URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const socket = io(URL, {
  transports: ["websocket"],
});