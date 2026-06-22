import axios from "axios";

// Create a pre-configured HTTP client pointing to your FastAPI backend
const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

// INTERCEPTOR: runs before every request
// Automatically attaches the JWT token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
