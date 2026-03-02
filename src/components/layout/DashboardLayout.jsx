import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiSearch, FiMenu, FiX } from "react-icons/fi";

export default function DashboardLayout({ title, children, menu }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">

      {/* ================= OVERLAY (Mobile & Tablet) ================= */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`
          fixed lg:static
          top-0 left-0 z-50
          h-full w-64 bg-white shadow-md
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-orange-600">
            Helpdesk Center
          </h2>

          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX size={22} />
          </button>
        </div>

        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>

            <div>
              <p className="font-semibold text-gray-800">
                {user?.name || "User Name"}
              </p>
              <p className="text-xs text-gray-500 uppercase">
                {user?.role || "Role"}
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto">
          {menu.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded hover:bg-orange-50 hover:text-orange-600 transition"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <header className="bg-white shadow px-4 md:px-6 py-4 flex justify-between items-center">

          <div className="flex items-center gap-3">

            {/* Hamburger (hidden on laptop/pc) */}
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <FiMenu size={22} />
            </button>

            <h1 className="text-lg md:text-xl font-semibold">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <FiSearch className="absolute top-3 left-3 text-gray-400" />
              <input
                type="text"
                placeholder="Global search..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
              />
            </div>

            <span className="hidden md:inline px-3 py-1 bg-green-100 text-green-600 text-sm rounded-full">
              Online
            </span>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              <FiLogOut />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="p-4 md:p-6 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}