import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="w-64 bg-white shadow-md min-h-screen p-4">
      <h1 className="text-xl font-bold mb-6">Helpdesk Center</h1>

      <nav className="space-y-2">
        <Link
          to="/dashboard"
          className={`block p-2 rounded ${
            location.pathname === "/dashboard"
              ? "bg-orange-100 text-orange-600"
              : ""
          }`}
        >
          Dashboard
        </Link>

        {user?.role === "ADMIN" && (
          <Link
            to="/master-data"
            className={`block p-2 rounded ${
              location.pathname === "/master-data"
                ? "bg-orange-100 text-orange-600"
                : ""
            }`}
          >
            Master Data
          </Link>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;