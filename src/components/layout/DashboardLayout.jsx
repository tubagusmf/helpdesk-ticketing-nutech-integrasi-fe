import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiSearch } from "react-icons/fi";

export default function DashboardLayout({ title, children, menu }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-orange-600">
            Helpdesk Center
            </h2>

            <div className="mt-5 flex items-center gap-3">
            <div className="relative">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
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

        <nav className="p-4 space-y-2">
          {menu.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="w-full text-left px-4 py-2 rounded hover:bg-orange-50 hover:text-orange-600 transition"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">{title}</h1>

          <div className="flex items-center gap-4">
            <div className="relative">
              <FiSearch className="absolute top-3 left-3 text-gray-400" />
              <input
                type="text"
                placeholder="Global search..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
              />
            </div>

            <span className="px-3 py-1 bg-green-100 text-green-600 text-sm rounded-full">
              Online
            </span>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}