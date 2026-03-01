import { Navigate } from "react-router-dom";
import { getRoleID } from "../utils/auth";

export default function RoleRoute({ children, allowedRoles }) {
  const roleID = getRoleID();

  if (!allowedRoles.includes(roleID)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}