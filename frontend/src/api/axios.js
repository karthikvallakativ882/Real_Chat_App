import axios from "axios";

// --- NEW LOGIC ADDED: Dynamic URL switching ---
const backendURL = import.meta.env.DEV 
  ? "http://localhost:5000/api" 
  : "https://real-chat-app-nzkj.onrender.com/api"; // <-- Put your actual Render URL here
// ----------------------------------------------

const API = axios.create({
  baseURL: backendURL,
  withCredentials: true,
});

// Add a request interceptor to attach the token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.authorization = token;
  }
  return req;
});

export default API;