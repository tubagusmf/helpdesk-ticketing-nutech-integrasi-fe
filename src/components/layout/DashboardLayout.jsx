import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  FiBell,
  FiChevronDown,
  FiLogOut,
  FiMenu,
  FiUser,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import {
  getCurrentUser,
  updateOnlineStatus,
} from "../../services/userService";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  deleteNotification,
} from "../../services/notificationService";
import { isTokenExpired } from "../../utils/auth";
import useTicketSocket from "../../hooks/useTicketSocket";

const NOTIFICATION_POLL_INTERVAL = 10_000;
const NOTIFICATION_STORAGE_PREFIX =
  "helpdesk_notification_popup_";
const NOTIFICATION_HISTORY_LIMIT = 100;
const TOAST_DURATION = 5_000;

const getUserId = (user) => {
  return (
    user?.id ??
    user?.user_id ??
    user?.userId ??
    user?.sub ??
    null
  );
};

const getNotificationStorageKey = (userId) => {
  return `${NOTIFICATION_STORAGE_PREFIX}${userId}`;
};

const normalizeNotificationId = (id) => {
  if (id === null || id === undefined || id === "") {
    return "";
  }

  return String(id);
};

const getNotificationKey = (notif) => {
  const notificationId = normalizeNotificationId(notif?.id);

  if (notificationId) {
    return `id:${notificationId}`;
  }

  return [
    notif?.type ?? "",
    notif?.ticket_id ?? "",
    notif?.title ?? "",
    notif?.message ?? "",
    notif?.created_at ?? "",
  ].join("|");
};

const getShownNotificationKeys = (userId) => {
  if (!userId) {
    return new Set();
  }

  try {
    const stored = sessionStorage.getItem(
      getNotificationStorageKey(userId),
    );

    if (!stored) {
      return new Set();
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(parsed.map(String));
  } catch (error) {
    console.error(
      "Failed to read notification popup history:",
      error,
    );

    return new Set();
  }
};

const saveShownNotificationKeys = (userId, keys) => {
  if (!userId) {
    return;
  }

  try {
    const limitedKeys = Array.from(keys)
      .map(String)
      .slice(-NOTIFICATION_HISTORY_LIMIT);

    sessionStorage.setItem(
      getNotificationStorageKey(userId),
      JSON.stringify(limitedKeys),
    );
  } catch (error) {
    console.error(
      "Failed to save notification popup history:",
      error,
    );
  }
};

function SidebarMenuItem({
  item,
  setSidebarOpen,
}) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const hasChildren =
    Array.isArray(item.children) &&
    item.children.length > 0;

  const isParentActive =
    Boolean(item.path) &&
    (location.pathname === item.path ||
      location.pathname.startsWith(`${item.path}/`));

  useEffect(() => {
    if (hasChildren && isParentActive) {
      setIsOpen(true);
    }
  }, [hasChildren, isParentActive]);

  const Icon = item.icon;

  const handleMenuClick = () => {
    setSidebarOpen(false);
  };

  if (!hasChildren) {
    return (
      <NavLink
        to={item.path}
        onClick={handleMenuClick}
        className={({ isActive }) =>
          `
            w-full
            flex
            items-center
            gap-3
            px-4
            py-3
            rounded-lg
            transition-all
            duration-200
            text-sm
            ${
              isActive
                ? "bg-orange-100 text-orange-600 font-medium"
                : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
            }
          `
        }
      >
        {Icon && <Icon size={18} className="shrink-0" />}

        <span className="truncate">{item.label}</span>
      </NavLink>
    );
  }

  return (
    <div className="space-y-1">
      <div
        className={`
          flex
          items-center
          rounded-lg
          transition-all
          duration-200
          ${
            isParentActive
              ? "bg-orange-50 text-orange-600"
              : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
          }
        `}
      >
        <NavLink
          to={item.path}
          onClick={handleMenuClick}
          className="
            flex-1
            min-w-0
            flex
            items-center
            gap-3
            px-4
            py-3
            text-sm
          "
        >
          {Icon && <Icon size={18} className="shrink-0" />}

          <span className="truncate">{item.label}</span>
        </NavLink>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="
            p-3
            shrink-0
            hover:bg-orange-100
            rounded-r-lg
            transition
          "
          aria-label={`Toggle ${item.label}`}
          aria-expanded={isOpen}
        >
          <FiChevronDown
            size={17}
            className={`
              transition-transform
              duration-200
              ${isOpen ? "rotate-180" : ""}
            `}
          />
        </button>
      </div>

      {isOpen && (
        <div className="ml-7 pl-3 border-l border-gray-200 space-y-1">
          {item.children.map((child) => (
            <NavLink
              key={child.path}
              to={child.path}
              end
              onClick={handleMenuClick}
              className={({ isActive }) =>
                `
                  block
                  px-3
                  py-2.5
                  rounded-lg
                  text-sm
                  transition-all
                  duration-200
                  ${
                    isActive
                      ? "bg-orange-100 text-orange-600 font-medium"
                      : "text-gray-500 hover:bg-orange-50 hover:text-orange-600"
                  }
                `
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({
  title,
  children,
  menu,
}) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const userId = getUserId(user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(null);
  const [openNotif, setOpenNotif] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const audioRef = useRef(null);
  const fetchingNotifRef = useRef(false);
  const notificationKeysRef = useRef(new Set());
  
  const handleLogout = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (token) {
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
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      toast.dismiss();
      await logout();
      navigate("/");
    }
  }, [logout, navigate]);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    let mounted = true;

    const fetchStatus = async () => {
      try {
        const userData = await getCurrentUser();

        if (!mounted) {
          return;
        }

        setIsOnline(userData?.is_online ?? false);
      } catch (error) {
        console.error("Gagal fetch status:", error);
      }
    };

    fetchStatus();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const handleToggleOnline = useCallback(async () => {
    const newStatus = !isOnline;

    setIsOnline(newStatus);

    try {
      await updateOnlineStatus(newStatus);
    } catch (error) {
      console.error(error);
      setIsOnline(!newStatus);
    }
  }, [isOnline]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setOpenNotif(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setOpenProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    const interval = setInterval(() => {
      if (isTokenExpired()) {
        toast.dismiss();
        logout();
        navigate("/");
      }
    }, 10_000);

    return () => clearInterval(interval);
  }, [userId, logout, navigate]);

  useEffect(() => {
    const audio = new Audio("/sounds/bell.wav");
    audio.preload = "auto";
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  const playNotificationSound = useCallback(async () => {
    try {
      if (!audioRef.current) {
        return;
      }

      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      console.log("Audio blocked:", error);
    }
  }, []);

  const showBrowserNotification = useCallback((notif) => {
    if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(notif.title || "Notifikasi Baru", {
        body:
          notif.message ||
          "Anda memiliki notifikasi baru.",
        icon: "/vite.svg",
      });
    }
  }, []);

  useEffect(() => {
    const requestPermission = async () => {
      if (
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        try {
          const permission =
            await Notification.requestPermission();

          console.log(
            "Notification permission:",
            permission,
          );
        } catch (error) {
          console.error(
            "Notification permission error:",
            error,
          );
        }
      }
    };

    requestPermission();
  }, []);

  const showNotificationPopup = useCallback(
    (notif) => {
      if (!userId || !notif) {
        console.warn(
          "[NOTIFICATION] Missing user or notification:",
          {
            userId,
            notif,
          },
        );
        return false;
      }

      const notificationKey = getNotificationKey(notif);

      if (!notificationKey) {
        console.warn(
          "[NOTIFICATION] Missing notification key:",
          notif,
        );
        return false;
      }

      const shownKeys = getShownNotificationKeys(userId);

      if (shownKeys.has(notificationKey)) {
        return false;
      }

      shownKeys.add(notificationKey);
      saveShownNotificationKeys(userId, shownKeys);

      playNotificationSound();
      showBrowserNotification(notif);

      toast.custom(
        (t) => (
          <div
            className={`
              w-[calc(100vw-2rem)]
              max-w-sm
              bg-white
              shadow-lg
              rounded-xl
              border
              p-4
              flex
              items-start
              gap-3
              ${
                t.visible
                  ? "animate-enter"
                  : "animate-leave"
              }
            `}
          >
            <div className="mt-1 text-green-500 shrink-0 text-lg">
              ✅
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 break-words">
                {notif.title || "Notifikasi Baru"}
              </p>

              <p className="text-sm text-gray-600 mt-1 break-words">
                {notif.message ||
                  "Anda memiliki notifikasi baru."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="text-gray-400 hover:text-red-500 transition shrink-0"
              aria-label="Tutup notifikasi"
            >
              <FiX size={18} />
            </button>
          </div>
        ),
        {
          id: `notification-${notificationKey}`,
          duration: TOAST_DURATION,
        },
      );

      return true;
    },
    [
      userId,
      playNotificationSound,
      showBrowserNotification,
    ],
  );

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      console.warn(
        "[NOTIFICATION] User ID tidak ditemukan:",
        user,
      );
      return;
    }

    if (fetchingNotifRef.current) {
      return;
    }

    try {
      fetchingNotifRef.current = true;
      setLoadingNotif(true);

      const [notifData, unreadData] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);

      const safeNotifications = Array.isArray(notifData)
        ? notifData
        : [];

      const unread = Number(unreadData) || 0;

      notificationKeysRef.current = new Set(
        safeNotifications
          .map(getNotificationKey)
          .filter(Boolean),
      );

      setNotifications(safeNotifications);
      setUnreadCount(unread);

      const latestUnread = safeNotifications.find(
        (notif) => !notif.is_read,
      );

      if (latestUnread) {
        showNotificationPopup(latestUnread);
      }
    } catch (error) {
      console.error(
        "[NOTIFICATION] Failed fetch notification:",
        error,
      );
    } finally {
      fetchingNotifRef.current = false;
      setLoadingNotif(false);
    }
  }, [userId, user, showNotificationPopup]);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    fetchNotifications();

    const interval = setInterval(
      fetchNotifications,
      NOTIFICATION_POLL_INTERVAL,
    );

    return () => {
      clearInterval(interval);
    };
  }, [userId, fetchNotifications]);

  const handleSocketNotification = useCallback(
    (notif) => {
      if (!notif) {
        return;
      }

      const notificationKey = getNotificationKey(notif);

      if (!notificationKey) {
        return;
      }

      showNotificationPopup(notif);

      if (notificationKeysRef.current.has(notificationKey)) {
        return;
      }

      notificationKeysRef.current.add(notificationKey);

      setNotifications((prev) => {
        const exists = prev.some(
          (item) => getNotificationKey(item) === notificationKey,
        );

        if (exists) {
          return prev;
        }

        return [notif, ...prev];
      });

      if (!notif.is_read) {
        setUnreadCount((prev) => prev + 1);
      }
    },
    [showNotificationPopup],
  );

  useTicketSocket({
    onNotification: handleSocketNotification,
  });

  const handleReadNotification = useCallback(
    async (id) => {
      try {
        const notificationId = normalizeNotificationId(id);

        const target = notifications.find(
          (item) =>
            normalizeNotificationId(item.id) ===
            notificationId,
        );

        await markNotificationRead(id);

        setNotifications((prev) =>
          prev.map((item) =>
            normalizeNotificationId(item.id) ===
            notificationId
              ? {
                  ...item,
                  is_read: true,
                }
              : item,
          ),
        );

        if (target && !target.is_read) {
          setUnreadCount((prev) =>
            Math.max(prev - 1, 0),
          );
        }
      } catch (error) {
        console.error(
          "Failed to mark notification as read:",
          error,
        );
      }
    },
    [notifications],
  );

  const handleDeleteNotification = useCallback(
    async (id) => {
      try {
        const notificationId = normalizeNotificationId(id);

        const target = notifications.find(
          (item) =>
            normalizeNotificationId(item.id) ===
            notificationId,
        );

        await deleteNotification(id);

        setNotifications((prev) =>
          prev.filter(
            (item) =>
              normalizeNotificationId(item.id) !==
              notificationId,
          ),
        );

        notificationKeysRef.current.delete(
          getNotificationKey(target),
        );

        if (target && !target.is_read) {
          setUnreadCount((prev) =>
            Math.max(prev - 1, 0),
          );
        }
      } catch (error) {
        console.error(
          "Failed to delete notification:",
          error,
        );
      }
    },
    [notifications],
  );

  const handleNotificationClick = useCallback(
    async (notif) => {
      try {
        if (!notif.is_read) {
          await handleReadNotification(notif.id);
        }

        setOpenNotif(false);

        if (notif.ticket_id) {
          navigate(`/tickets/${notif.ticket_id}`);
        }
      } catch (error) {
        console.error(
          "Failed to handle notification:",
          error,
        );
      }
    },
    [handleReadNotification, navigate],
  );
  
  return (
    <div
      className="
        min-h-screen
        h-screen
        flex
        bg-gray-100
        overflow-hidden
        w-full
        min-w-0
      "
    >
      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div
          className="
            fixed
            inset-0
            bg-black/40
            z-40
            lg:hidden
          "
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed
          lg:static
          top-0
          left-0
          z-50
          h-full
          w-64
          shrink-0
          bg-white
          shadow-md
          transform
          transition-transform
          duration-300
          flex
          flex-col
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
          lg:translate-x-0
        `}
      >
        <div
          className="
            p-4
            sm:p-6
            border-b
            flex
            justify-between
            items-center
            shrink-0
          "
        >
          <h2 className="text-lg sm:text-xl font-bold text-orange-600">
            Helpdesk Center
          </h2>

          <button
            type="button"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup menu"
          >
            <FiX size={22} />
          </button>
        </div>

        <div className="p-4 sm:p-6 border-b shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div
                className="
                  w-10
                  h-10
                  rounded-full
                  bg-orange-500
                  flex
                  items-center
                  justify-center
                  text-white
                  font-semibold
                "
              >
                {user?.name
                  ?.charAt(0)
                  ?.toUpperCase()}
              </div>

              <span
                className={`
                  absolute
                  bottom-0
                  right-0
                  w-3
                  h-3
                  border-2
                  border-white
                  rounded-full
                  ${
                    isOnline
                      ? "bg-green-500"
                      : "bg-gray-400"
                  }
                `}
              />
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-gray-800 truncate">
                {user?.name}
              </p>

              <p className="text-xs text-gray-500 uppercase truncate">
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        <nav
          className="
            flex-1
            p-3
            sm:p-4
            space-y-2
            overflow-y-auto
          "
        >
          {menu?.map((item) => (
            <SidebarMenuItem
              key={item.path}
              item={item}
              setSidebarOpen={setSidebarOpen}
            />
          ))}
        </nav>

        <div className="p-3 sm:p-4 border-t shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="
              w-full
              flex
              items-center
              gap-3
              px-4
              py-3
              rounded-lg
              text-red-500
              hover:bg-red-50
              transition-all
              duration-200
              text-sm
            "
          >
            <FiLogOut
              size={18}
              className="shrink-0"
            />

            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div
        className="
          flex-1
          min-w-0
          flex
          flex-col
          h-full
        "
      >
        {/* HEADER */}
        <header
          className="
            bg-white
            shadow
            px-3
            sm:px-4
            md:px-6
            py-3
            sm:py-4
            flex
            justify-between
            items-center
            gap-3
            shrink-0
            min-w-0
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
              sm:gap-3
              min-w-0
            "
          >
            <button
              type="button"
              className="
                lg:hidden
                shrink-0
                p-1
              "
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
            >
              <FiMenu size={22} />
            </button>

            <h1
              className="
                text-base
                sm:text-lg
                md:text-xl
                font-semibold
                truncate
              "
            >
              {title}
            </h1>
          </div>

          <div
            className="
              flex
              items-center
              gap-1
              sm:gap-2
              md:gap-4
              shrink-0
            "
          >
            {/* ONLINE STATUS */}
            <button
              type="button"
              onClick={handleToggleOnline}
              title={
                isOnline
                  ? "Klik untuk offline"
                  : "Klik untuk online"
              }
              className={`
                flex
                items-center
                gap-2
                px-2
                sm:px-3
                py-1
                text-xs
                sm:text-sm
                rounded-full
                shrink-0
                ${
                  isOnline
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-200 text-gray-600"
                }
              `}
            >
              <span
                className={`
                  w-2
                  h-2
                  rounded-full
                  shrink-0
                  ${
                    isOnline
                      ? "bg-green-500"
                      : "bg-gray-500"
                  }
                `}
              />

              <span className="hidden sm:inline">
                {isOnline ? "Online" : "Offline"}
              </span>
            </button>

            {/* NOTIFICATION */}
            <div
              className="relative shrink-0"
              ref={notifRef}
            >
              <button
                type="button"
                onClick={() => {
                  setOpenNotif((prev) => !prev);
                  setOpenProfile(false);
                }}
                className="
                  p-2
                  rounded-full
                  hover:bg-gray-100
                  relative
                "
                aria-label="Notifikasi"
                aria-expanded={openNotif}
              >
                <FiBell size={20} />

                {unreadCount > 0 && (
                  <span
                    className="
                      absolute
                      -top-1
                      -right-1
                      min-w-[18px]
                      h-[18px]
                      px-1
                      flex
                      items-center
                      justify-center
                      text-[10px]
                      rounded-full
                      bg-red-500
                      text-white
                      font-semibold
                    "
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {openNotif && (
                <div
                  className="
                    fixed
                    sm:absolute
                    right-2
                    sm:right-0
                    top-[60px]
                    sm:top-auto
                    sm:mt-3
                    w-[calc(100vw-1rem)]
                    sm:w-96
                    max-w-sm
                    bg-white
                    shadow-lg
                    rounded-xl
                    border
                    z-50
                    overflow-hidden
                  "
                >
                  <div
                    className="
                      p-3
                      sm:p-4
                      border-b
                      font-semibold
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >
                    <span>Notifikasi</span>

                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {unreadCount} Belum dibaca
                    </span>
                  </div>

                  <div
                    className="
                      max-h-[70vh]
                      sm:max-h-[400px]
                      overflow-y-auto
                    "
                  >
                    {loadingNotif ? (
                      <div className="p-6 text-center text-gray-400 text-sm">
                        Loading...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">
                        <FiBell
                          size={28}
                          className="mx-auto mb-2"
                        />
                        Tidak ada notifikasi.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={getNotificationKey(notif)}
                          className={`
                            w-full
                            text-left
                            p-3
                            sm:p-4
                            border-b
                            hover:bg-gray-50
                            transition
                            ${
                              !notif.is_read
                                ? "bg-orange-50"
                                : ""
                            }
                          `}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-800 break-words">
                                {notif.title}
                              </p>

                              <p className="text-sm text-gray-600 mt-1 break-words">
                                {notif.message}
                              </p>

                              {notif.ticket_id &&
                                notif.ticket_code && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleNotificationClick(
                                        notif,
                                      )
                                    }
                                    className="
                                      text-sm
                                      text-orange-600
                                      hover:text-orange-800
                                      font-medium
                                      mt-2
                                    "
                                  >
                                    Buka Tiket
                                  </button>
                                )}

                              <p className="text-xs text-gray-400 mt-2 break-words">
                                {new Date(
                                  notif.created_at,
                                ).toLocaleString("id-ID")}
                              </p>
                            </div>

                            <div className="flex items-start gap-2 shrink-0">
                              {!notif.is_read && (
                                <span
                                  className="
                                    w-2
                                    h-2
                                    rounded-full
                                    bg-orange-500
                                    mt-2
                                  "
                                />
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteNotification(
                                    notif.id,
                                  )
                                }
                                className="
                                  text-gray-400
                                  hover:text-red-500
                                  transition
                                "
                                aria-label="Hapus notifikasi"
                              >
                                <FiX size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PROFILE */}
            <div
              className="relative shrink-0"
              ref={profileRef}
            >
              <button
                type="button"
                onClick={() => {
                  setOpenProfile((prev) => !prev);
                  setOpenNotif(false);
                }}
                aria-label="Profil"
                aria-expanded={openProfile}
              >
                <div
                  className="
                    w-8
                    h-8
                    rounded-full
                    bg-orange-500
                    text-white
                    flex
                    items-center
                    justify-center
                    text-sm
                    font-semibold
                  "
                >
                  {user?.name
                    ?.charAt(0)
                    ?.toUpperCase()}
                </div>
              </button>

              {openProfile && (
                <div
                  className="
                    absolute
                    right-0
                    mt-2
                    w-40
                    bg-white
                    border
                    rounded-lg
                    shadow
                    z-50
                    overflow-hidden
                  "
                >
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/profile");
                      setOpenProfile(false);
                    }}
                    className="
                      w-full
                      text-left
                      px-4
                      py-2
                      text-sm
                      hover:bg-orange-50
                      hover:text-orange-600
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <FiUser size={16} />
                    Profil
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="
                      w-full
                      text-left
                      px-4
                      py-2
                      text-sm
                      hover:bg-red-50
                      hover:text-red-600
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <FiLogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main
          className="
            flex-1
            min-h-0
            min-w-0
            overflow-y-auto
            overflow-x-hidden
            p-3
            sm:p-4
            md:p-6
          "
        >
          {children}
        </main>

        {/* FOOTER */}
        <footer
          className="
            bg-white
            border-t
            px-3
            sm:px-6
            py-3
            sm:py-4
            text-xs
            sm:text-sm
            text-gray-500
            flex
            flex-col
            md:flex-row
            items-center
            justify-between
            gap-1
            text-center
            shrink-0
          "
        >
          <p className="break-words">
            © 2026 Helpdesk CCIT Nutech Integrasi
          </p>

          <p>Version 1.0.0</p>
        </footer>
      </div>
    </div>
  );
}
