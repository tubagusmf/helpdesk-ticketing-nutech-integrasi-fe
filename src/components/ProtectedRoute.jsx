import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" />;
  }

  if (role && user.role_id !== role) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}