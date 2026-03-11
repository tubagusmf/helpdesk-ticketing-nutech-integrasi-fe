import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
  
    if (token) {
      try {
        const decoded = jwtDecode(token);
  
        const currentTime = Date.now() / 1000;
  
        if (decoded.exp < currentTime) {
          console.log("TOKEN EXPIRED");
          localStorage.removeItem("token");
          setUser(null);
        } else {
          setUser(decoded);
        }
      } catch (err) {
        console.log("TOKEN INVALID");
        localStorage.removeItem("token");
        setUser(null);
      }
    }
  
    setLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem("token", token);
    const decoded = jwtDecode(token);
    setUser(decoded);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}