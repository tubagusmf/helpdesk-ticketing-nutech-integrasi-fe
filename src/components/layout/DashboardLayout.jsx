import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiBell, FiMenu, FiX } from "react-icons/fi";
import { updateOnlineStatus, getOnlineStatus } from "../../services/userService";

export default function DashboardLayout({ title, children, menu }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(null);
  const [openNotif, setOpenNotif] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const handleLogout = async () => {
    try {
      await updateOnlineStatus(false);
    } catch (err) {
      console.error(err);
    }
  
    logout();
    navigate("/");
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await getOnlineStatus();
        setIsOnline(status);
      } catch (err) {
        console.error("Gagal fetch status:", err);
      }
    };
  
    fetchStatus();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      updateOnlineStatus(true);
    }, 30000);
  
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setOpenNotif(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setOpenProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">

      {/* OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed lg:static top-0 left-0 z-50 h-full w-64 bg-white shadow-md transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>

        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-orange-600">Helpdesk Center</h2>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <FiX size={22} />
          </button>
        </div>

        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full
                  ${isOnline ? "bg-green-500" : "bg-gray-400"}`}
              />
            </div>

            <div>
              <p className="font-semibold text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500 uppercase">{user?.role}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menu.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded hover:bg-orange-50 hover:text-orange-600"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <header className="bg-white shadow px-4 md:px-6 py-4 flex justify-between items-center">

          {/* LEFT */}
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <FiMenu size={22} />
            </button>
            <h1 className="text-lg md:text-xl font-semibold">{title}</h1>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">

            {/* ONLINE STATUS */}
            <button
              onClick={async () => {
                const newStatus = !isOnline;
                setIsOnline(newStatus);
              
                try {
                  await updateOnlineStatus(newStatus);
                } catch (err) {
                  console.error(err);
                }
              }}
              title={isOnline ? "Klik untuk offline" : "Klik untuk online"}
              className={`flex items-center gap-2 px-3 py-1 text-sm rounded-full
                ${isOnline ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-600"}`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-500"}`} />
              {isOnline ? "Online" : "Offline"}
            </button>

            {/* NOTIF */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setOpenNotif(!openNotif);
                  setOpenProfile(false);
                }}
                className="p-2 rounded-full hover:bg-gray-100 relative"
              >
                <FiBell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {openNotif && (
                <div className="absolute right-0 mt-3 w-80 bg-white shadow-lg rounded-xl border z-50">
                  <div className="p-4 border-b font-semibold">Notifikasi</div>
                  <div className="p-6 text-center text-gray-400 text-sm">
                    <FiBell size={28} className="mx-auto mb-2" />
                    Tidak ada notifikasi baru.
                  </div>
                </div>
              )}
            </div>

            {/* PROFILE */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setOpenProfile(!openProfile);
                  setOpenNotif(false);
                }}
              >
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center">
                  {user?.name?.charAt(0)}
                </div>
              </button>

              {openProfile && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                  >
                    <FiLogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        <main className="p-4 md:p-6 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}