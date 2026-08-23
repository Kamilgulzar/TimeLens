import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/verify-email", "/"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !AUTH_PATHS.some((path) => window.location.pathname.startsWith(path))
    ) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
