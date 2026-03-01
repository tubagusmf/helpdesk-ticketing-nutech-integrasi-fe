import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000/v1",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/users/login");

    if (error.response?.status === 401 && !isLoginRequest) {
      console.log("Unauthorized request:", error.config.url);

      localStorage.removeItem("token");
    }

    return Promise.reject(error);
  }
);

export default API;
