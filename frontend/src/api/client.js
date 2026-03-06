import axios from "axios";

const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:5000/api")
  .trim()
  .replace(/\/$/, "");

export const api = axios.create({
  baseURL: API_BASE,
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }
  delete api.defaults.headers.common.Authorization;
}
