import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp && decoded.exp < currentTime) {
        fetch(
          `${import.meta.env.VITE_API_URL}/v1/users/logout`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          },
        ).catch((error) => {
          console.error("Logout expired token error:", error);
        });

        localStorage.removeItem("token");
        setUser(null);
      } else {
        setUser(decoded);
      }
    } catch (error) {
      console.error("TOKEN INVALID", error);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (token) => {
    localStorage.setItem("token", token);

    const decoded = jwtDecode(token);
    setUser(decoded);
  };

  const logout = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        await fetch(
          `${import.meta.env.VITE_API_URL}/v1/users/logout`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          },
        );
      } catch (error) {
        console.error("Logout API error:", error);
      }
    }

    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
