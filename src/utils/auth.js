import { jwtDecode } from "jwt-decode";

export function getToken() {
  return localStorage.getItem("token");
}

export function getUserFromToken() {
  const token = getToken();
  if (!token) return null;

  try {
    return jwtDecode(token);
  } catch (err) {
    return null;
  }
}

export function getRoleID() {
  const user = getUserFromToken();
  return user?.role_id || null;
}

export function isAuthenticated() {
  return !!getToken();
}

export function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}