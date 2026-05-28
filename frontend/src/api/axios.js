import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
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