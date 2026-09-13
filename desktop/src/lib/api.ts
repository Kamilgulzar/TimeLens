import axios from "axios";
import type { User } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authToken = null;
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────

export async function loginWithCredentials(
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  const response = await api.post("/auth/extension-login", {
    email,
    password,
    source: "desktop",
  });
  return response.data;
}

export async function registerWithCredentials(
  firstName: string,
  lastName: string,
  email: string,
  password: string
): Promise<{ message: string; email: string; maskedEmail: string }> {
  const response = await api.post("/auth/desktop-register", {
    firstName,
    lastName,
    email,
    password,
  });
  return response.data;
}

export async function verifyEmail(
  email: string,
  code: string
): Promise<{ token: string; user: User }> {
  const response = await api.post("/auth/desktop-verify-email", {
    email,
    code,
  });
  return response.data;
}

export async function resendVerificationCode(
  email: string
): Promise<{ maskedEmail: string }> {
  const response = await api.post("/auth/desktop-resend-code", { email });
  return response.data;
}

export async function forgotPassword(
  email: string
): Promise<{ ok: boolean }> {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
}

export async function resetPassword(
  email: string,
  code: string,
  password: string
): Promise<{ ok: boolean }> {
  const response = await api.post("/auth/reset-password", {
    email,
    code,
    password,
  });
  return response.data;
}

export async function oauthLogin(
  provider: "google" | "github",
  email: string,
  firstName?: string,
  lastName?: string,
  avatar?: string
): Promise<{ token: string; user: User }> {
  const response = await api.post("/auth/extension-oauth", {
    provider,
    email,
    firstName,
    lastName,
    avatar,
  });
  return response.data;
}

// ── User ─────────────────────────────────────────────────────────

export async function getCurrentUser(token: string): Promise<{ user: User }> {
  const response = await api.get("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export default api;
