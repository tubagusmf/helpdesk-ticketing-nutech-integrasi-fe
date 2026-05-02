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
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (decoded.exp < currentTime) {
      localStorage.removeItem("token");
      return false;
    }

    return true;
  } catch (err) {
    localStorage.removeItem("token");
    return false;
  }
}

export function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}

export function isTokenExpired() {
  const token = getToken();
  if (!token) return true;

  try {
    const decoded = jwtDecode(token);
    return decoded.exp < Date.now() / 1000;
  } catch {
    return true;
  }
}