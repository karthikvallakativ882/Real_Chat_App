import axios from "axios";

const API = axios.create({
  // This tells the app to use the live URL in production, or localhost during development
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api",
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