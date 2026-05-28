import axios from "axios";

const API = axios.create({
  // Use the live URL if it exists, otherwise use local
  baseURL: import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : "http://localhost:5000/api",
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