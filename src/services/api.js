import axios from "axios";
import { forceOffline } from "../services/userService";
import { jwtDecode } from "jwt-decode";

const API = axios.create({
  baseURL: "http://localhost:3000/v1",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (
    token &&
    !config.url.includes("/users/login") &&
    !config.url.includes("/users/register")
  ) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isLoginRequest = error.config?.url?.includes("/users/login");

    if (error.response?.status === 401 && !isLoginRequest) {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const decoded = jwtDecode(token);

          await forceOffline(decoded.user_id);
        } catch (err) {
          console.error("Force offline gagal:", err);
        }
      }

      localStorage.removeItem("token");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default API;
