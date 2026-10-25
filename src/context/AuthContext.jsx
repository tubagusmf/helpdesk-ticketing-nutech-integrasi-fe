import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { sendHeartbeat, updateOnlineStatus } from "../services/userService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const userId = user?.user_id ?? user?.userId ?? user?.sub ?? null;
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

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    let active = true;
    let requestInProgress = false;
    let needsOnlineSync = true;

    const sendPulse = async () => {
      if (!active || requestInProgress) {
        return;
      }

      requestInProgress = true;

      try {
        if (needsOnlineSync) {
          await updateOnlineStatus(true);
          needsOnlineSync = false;
        } else {
          await sendHeartbeat();
        }
      } catch (error) {
        console.error(
          "Gagal memperbarui status online / heartbeat:",
          error
        );
      } finally {
        requestInProgress = false;
      }
    };

    void sendPulse();

    const interval = window.setInterval(() => {
      void sendPulse();
    }, 20_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [userId]);

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
