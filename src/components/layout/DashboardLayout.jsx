import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiBell, FiMenu, FiX } from "react-icons/fi";
import { updateOnlineStatus, getCurrentUser } from "../../services/userService";
import { isTokenExpired } from "../../utils/auth";
import { getNotifications, getUnreadCount, markNotificationRead, deleteNotification } from "../../services/notificationService";
import toast from "react-hot-toast";

export default function DashboardLayout({ title, children, menu }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(null);
  const [openNotif, setOpenNotif] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const prevUnreadRef = useRef(0);
  const audioRef = useRef(null);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
  
      await fetch("http://localhost:3000/v1/users/logout", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
    } catch (err) {}
  
    logout(); 
    navigate("/"); 
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const userData = await getCurrentUser();
        setIsOnline(userData.is_online);
      } catch (err) {
        console.error("Gagal fetch status:", err);
      }
    };
  
    fetchStatus();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${BASE_URL}/heartbeat`, {
        method: "PUT",
        headers: getHeaders(),
      });
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

  useEffect(() => {
    const handleUnload = () => {
      const token = localStorage.getItem("token");
  
      if (!token) return;
  
      navigator.sendBeacon(
        `${BASE_URL}/logout`,
        JSON.stringify({ 
          token: localStorage.getItem("token"),
         })
      );
    };
  
    window.addEventListener("beforeunload", handleUnload);
  
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isTokenExpired()) {
        logout();
      }
    }, 10000);
  
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchNotifications();
  
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);
  
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const requestPermission = async () => {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
  
        console.log("Notification permission:", permission);
      }
    };
  
    requestPermission();
  }, []);

  useEffect(() => {
    audioRef.current = new Audio("/sounds/bell.wav");
  
    audioRef.current.preload = "auto";
  }, []);

  const showBrowserNotification = (notif) => {
    if (Notification.permission === "granted") {
      new Notification(notif.title, {
        body: notif.message,
        icon: "/vite.svg",
      });
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotif(true);
  
      const [notifData, unreadData] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);
  
      const unread = unreadData || 0;
      const safeNotif = notifData || [];
  
      if (unread > prevUnreadRef.current) {
        const latestNotif = safeNotif[0];
  
        if (latestNotif) {
          playNotificationSound();
  
          showBrowserNotification(latestNotif);
  
          toast.dismiss();

          toast.custom((t) => (
            <div
              className={`
                max-w-sm w-full bg-white shadow-lg rounded-xl border p-4
                flex items-start gap-3
                ${t.visible ? "animate-enter" : "animate-leave"}
              `}
            >
              {/* ICON */}
              <div className="mt-1 text-green-500">
                ✅
              </div>
          
              {/* CONTENT */}
              <div className="flex-1">
                <p className="font-semibold text-gray-800">
                  {latestNotif.title}
                </p>
          
                <p className="text-sm text-gray-600 mt-1">
                  {latestNotif.message}
                </p>
              </div>
          
              {/* CLOSE BUTTON */}
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-gray-400 hover:text-red-500 transition"
              >
                ✕
              </button>
            </div>
          ), {
            duration: 5000,
          });
        }
      }
  
      prevUnreadRef.current = unread;
  
      setNotifications(safeNotif);
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed fetch notification:", err);
    } finally {
      setLoadingNotif(false);
    }
  };

  const handleReadNotification = async (id) => {
    try {
      await markNotificationRead(id);
  
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, is_read: true }
            : item
        )
      );
  
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);
  
      setNotifications((prev) =>
        prev.filter((item) => item.id !== id)
      );
  
      setUnreadCount((prev) =>
        Math.max(prev - 1, 0)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const playNotificationSound = async () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
  
        await audioRef.current.play();
      }
    } catch (err) {
      console.log("Audio blocked:", err);
    }
  };

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
      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-full w-64 bg-white shadow-md
        transform transition-transform duration-300 flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >

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

        <nav className="flex-1 p-4 space-y-2">
          {menu.map((item, i) => {
            const Icon = item.icon;

            return (
              <button
                key={i}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                hover:bg-orange-50 hover:text-orange-600 transition-all duration-200"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
            text-red-500 hover:bg-red-50 transition-all duration-200"
          >
            <FiLogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
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
                {unreadCount > 0 && (
                  <span
                    className="
                      absolute -top-1 -right-1
                      min-w-[18px] h-[18px]
                      px-1
                      flex items-center justify-center
                      text-[10px]
                      rounded-full
                      bg-red-500 text-white font-semibold
                    "
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {openNotif && (
                <div className="absolute right-0 mt-3 w-96 bg-white shadow-lg rounded-xl border z-50 overflow-hidden">
                  
                  <div className="p-4 border-b font-semibold flex items-center justify-between">
                    <span>Notifikasi</span>

                    <span className="text-xs text-gray-500">
                      {unreadCount} Belum dibaca
                    </span>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto">
                    {loadingNotif ? (
                      <div className="p-6 text-center text-gray-400 text-sm">
                        Loading...
                      </div>
                    ) : notifications?.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">
                        <FiBell size={28} className="mx-auto mb-2" />
                        Tidak ada notifikasi.
                      </div>
                    ) : (
                      notifications?.map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => handleReadNotification(notif.id)}
                          className={`
                            w-full text-left p-4 border-b hover:bg-gray-50 transition
                            ${!notif.is_read ? "bg-orange-50" : ""}
                          `}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-gray-800">
                                {notif.title}
                              </p>

                              <p className="text-sm text-gray-600 mt-1">
                                {notif.message}
                              </p>

                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notif.created_at).toLocaleString()}
                              </p>
                            </div>

                            <div className="flex items-start gap-2">

                              {!notif.is_read && (
                                <span className="w-2 h-2 rounded-full bg-orange-500 mt-2"></span>
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotification(notif.id);
                                }}
                                className="
                                  text-gray-400
                                  hover:text-red-500
                                  transition
                                "
                              >
                                <FiX size={14} />
                              </button>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
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

        <footer className="bg-white border-t px-6 py-4 text-sm text-gray-500 flex flex-col md:flex-row items-center justify-between">
          <p>
            © 2026 Helpdesk CCIT Nutech Integrasi
          </p>

          <p className="mt-2 md:mt-0">
            Version 1.0.0
          </p>
        </footer>
      </div>
    </div>
  );
}