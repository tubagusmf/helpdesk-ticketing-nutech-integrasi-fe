import { useCallback, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useAppSettings } from "../context/AppSettingsContext";
import { getAppAssetURL } from "../services/appSettingsService";
import { updateOnlineStatus } from "../services/userService";

const DEFAULT_SETTINGS = {
  app_name: "Helpdesk Center",
  login_title: "Helpdesk Center",
  tagline: "Professional Ticketing System",

  login_icon_url: "",
  logo_url: "",

  whatsapp_number: "6281119521124",
  whatsapp_display_number: "081119521124",

  whatsapp_message: `Halo Admin,

Mohon untuk mendaftar akun Helpdesk dengan mengisi data berikut:

Nama Lengkap:
Email:
Project:

Terima kasih.`,

  primary_color: "#EA580C",
};

const LOGIN_HELP_HEADING = "BELUM PUNYA AKUN?";

const LOGIN_HELP_TEXT = "Silahkan Hubungi Admin ke nomor kontak Whatsapp berikut:";

function getDashboardPath(roleID) {
  const paths = {
    1: "/admin/dashboard",
    2: "/staff/dashboard",
    3: "/user/dashboard",
    4: "/executive/dashboard",
    5: "/engineer/dashboard",
  };

  return paths[Number(roleID)] || null;
}

function getValidPrimaryColor(color) {
  return /^#[0-9A-Fa-f]{6}$/.test(
    String(color || ""),
  )
    ? color
    : DEFAULT_SETTINGS.primary_color;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [captchaId, setCaptchaId] = useState("");
  const [captchaImage, setCaptchaImage] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaLoadError, setCaptchaLoadError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const { login, user } = useAuth();
  const { settings } = useAppSettings();
  const navigate = useNavigate();

  const currentSettings = {
    ...DEFAULT_SETTINGS,
    ...(settings || {}),
  };

  const iconPath =
    currentSettings.login_icon_url ||
    currentSettings.logo_url ||
    "";

  const iconURL = getAppAssetURL(iconPath);
  const primaryColor = getValidPrimaryColor(currentSettings.primary_color,);
  const loginTitle =
    String(currentSettings.login_title || "").trim() ||
    String(currentSettings.app_name || "").trim() ||
    DEFAULT_SETTINGS.login_title;

  const tagline =
    String(currentSettings.tagline || "").trim() ||
    DEFAULT_SETTINGS.tagline;

  const whatsappNumber = String(
    currentSettings.whatsapp_number || "",
  )
    .trim()
    .replace(/\D/g, "") ||
    DEFAULT_SETTINGS.whatsapp_number;

  const whatsappDisplayNumber =
    String(
      currentSettings.whatsapp_display_number || "",
    ).trim() ||
    DEFAULT_SETTINGS.whatsapp_display_number;

  const whatsappMessage =
    String(
      currentSettings.whatsapp_message || "",
    ).trim() ||
    DEFAULT_SETTINGS.whatsapp_message;

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [iconURL]);

  const loadCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    setCaptchaLoadError("");

    try {
      const response = await API.get("/users/captcha");
      const result = response?.data?.data ?? response?.data ?? {};
      const nextCaptchaId = result.captcha_id ?? result.captchaId ?? "";

      const rawImage =
        result.captcha_image ?? result.captchaImage ?? "";

      if (!nextCaptchaId || !rawImage) {
        throw new Error("Respons CAPTCHA tidak lengkap.");
      }

      const nextCaptchaImage = rawImage.startsWith("data:")
        ? rawImage
        : `data:image/png;base64,${rawImage}`;

      setCaptchaId(nextCaptchaId);
      setCaptchaImage(nextCaptchaImage);
      setCaptchaCode("");
    } catch (err) {
      console.error("Gagal memuat CAPTCHA:", err);

      setCaptchaId("");
      setCaptchaImage("");
      setCaptchaLoadError(
        "CAPTCHA gagal dimuat. Silakan tekan tombol refresh.",
      );
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCaptcha();
  }, [loadCaptcha]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const dashboardPath = getDashboardPath(
      user.role_id ??
        user.roleId ??
        user.role_id,
    );

    if (dashboardPath) {
      navigate(dashboardPath, {
        replace: true,
      });
    }
  }, [user, navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!captchaId) {
      setError("CAPTCHA belum tersedia. Silakan muat ulang gambar.");
      return;
    }

    if (!captchaCode.trim()) {
      setError("Silakan masukkan kode CAPTCHA.");
      return;
    }

    if (isSubmitting) {
      return;
    }

    setError("");
    void loadCaptcha();
    setIsSubmitting(true);

    try {
      const response = await API.post("/users/login", {
        email: email.trim(),
        password,
        captcha_id: captchaId,
        captcha_code: captchaCode,
      });

      const token = response?.data?.token;

      if (!token) {
        throw new Error(
          "Token login tidak ditemukan dari server.",
        );
      }

      const decoded = jwtDecode(token);
      const roleID = Number(decoded.role_id);

      const dashboardPath =
        getDashboardPath(roleID);

      if (!dashboardPath) {
        throw new Error(
          "Role pengguna tidak dikenali.",
        );
      }

      login(token);

      try {
        await updateOnlineStatus(true);
      } catch (statusError) {
        console.warn(
          "Login berhasil, tetapi status online gagal diperbarui:",
          statusError,
        );
      }

      navigate(dashboardPath, {
        replace: true,
      });
    } catch (loginError) {
      console.error(
        "Login gagal:",
        loginError,
      );

      setError(
        loginError?.response?.data?.message ||
          loginError?.message ||
          "Gagal melakukan login. Silakan coba kembali.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappURL =
    `https://wa.me/${whatsappNumber}` +
    `?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div
      className="
        flex min-h-screen items-center
        justify-center bg-gray-200
        px-4 py-8
      "
    >
      <div
        className="
          w-full max-w-[420px]
          rounded-xl bg-white
          p-6 shadow-lg sm:p-8
        "
      >

        <div className="mb-5 flex justify-center">
          {iconURL && !logoLoadFailed ? (
            <img
              src={iconURL}
              alt={`${loginTitle} logo`}
              className="
                h-24 w-48 object-contain
                sm:h-28 sm:w-56
              "
              onError={() =>
                setLogoLoadFailed(true)
              }
            />
          ) : (
            <div className="flex h-24 items-center justify-center sm:h-28">
              <span
                className="text-3xl font-bold"
                style={{
                  color: primaryColor,
                }}
              >
                CCIT
              </span>
            </div>
          )}
        </div>

        <h1 className="text-center text-xl font-semibold text-gray-800">
          {loginTitle}
        </h1>

        <p className="mb-6 text-center text-sm italic text-gray-500">
          {tagline}
        </p>

        {error && (
          <div
            role="alert"
            className="
              mb-4 rounded-lg border
              border-red-200 bg-red-50
              p-3 text-sm text-red-600
            "
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <label
            htmlFor="email"
            className="
              mb-1 block cursor-pointer
              text-xs font-semibold text-gray-500
            "
          >
            EMAIL
          </label>

          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
            disabled={isSubmitting}
            className="
              mb-4 w-full rounded-lg
              border border-gray-300 p-2.5
              text-sm outline-none
              focus:border-orange-400
              focus:ring-2 focus:ring-orange-100
              disabled:cursor-not-allowed
              disabled:bg-gray-50
            "
          />

          <div className="mb-6">
            <label
              htmlFor="password"
              className="
                mb-1 block cursor-pointer
                text-xs font-semibold text-gray-500
              "
            >
              PASSWORD
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                disabled={isSubmitting}
                className="
                  w-full rounded-lg
                  border border-gray-300
                  p-2.5 pr-10 text-sm
                  outline-none
                  focus:border-orange-400
                  focus:ring-2 focus:ring-orange-100
                  disabled:cursor-not-allowed
                  disabled:bg-gray-50
                "
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                className="
                  absolute inset-y-0 right-3
                  flex items-center
                  text-gray-500 hover:text-gray-700
                "
                aria-label={
                  showPassword
                    ? "Sembunyikan password"
                    : "Tampilkan password"
                }
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <div className="mb-5">
            <label
              htmlFor="captcha"
              className="mb-1 block text-xs font-semibold text-gray-500"
            >
              KODE CAPTCHA
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                id="captcha"
                name="captcha_code"
                type="text"
                value={captchaCode}
                onChange={(event) =>
                  setCaptchaCode(
                    event.target.value
                      .replace(/[^a-z0-9]/gi, "")
                      .slice(0, 5)
                      .toLowerCase(),
                  )
                }
                autoComplete="off"
                autoCapitalize="none"
                maxLength={5}
                required
                disabled={isSubmitting || captchaLoading}
                className="
                  min-w-0 flex-1 rounded-lg border border-gray-300
                  p-2.5 text-sm uppercase outline-none
                  focus:border-orange-400 focus:ring-2
                  focus:ring-orange-100
                  disabled:bg-gray-50
                "
              />

              <div className="flex items-center gap-2">
                <div className="
                  flex h-12 w-[180px] shrink-0 items-center
                  justify-center overflow-hidden rounded-md
                  border border-gray-200 bg-gray-100
                ">
                  {captchaImage ? (
                    <img
                      src={captchaImage}
                      alt="Kode CAPTCHA"
                      className="h-12 w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-gray-500">
                      {captchaLoading ? "Memuat..." : "CAPTCHA tidak tersedia"}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void loadCaptcha()}
                  disabled={captchaLoading || isSubmitting}
                  aria-label="Muat ulang CAPTCHA"
                  title="Muat ulang CAPTCHA"
                  className="
                    flex h-11 w-11 shrink-0 items-center
                    justify-center rounded-lg border border-gray-300
                    text-gray-600 transition hover:bg-gray-100
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                >
                  <RefreshCw
                    size={18}
                    className={captchaLoading ? "animate-spin" : ""}
                  />
                </button>
              </div>
            </div>

            {captchaLoadError && (
              <p className="mt-2 text-xs text-red-600" role="alert">
                {captchaLoadError}
              </p>
            )}

            <p className="mt-2 text-xs text-gray-400">
              Masukkan 5 karakter yang terlihat pada gambar.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || captchaLoading || !captchaId}
            className="
              w-full rounded-lg
              py-2.5 font-semibold text-white
              shadow-md transition duration-200
              hover:brightness-95
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
            style={{
              backgroundColor: primaryColor,
            }}
          >
            {isSubmitting
              ? "MEMPROSES..."
              : "LOGIN"}
          </button>
        </form>

        <div className="my-6 border-t border-gray-200" />

        <p className="mb-2 text-center text-xs font-semibold text-gray-400">
          {LOGIN_HELP_HEADING}
        </p>

        <p className="mt-4 text-center text-xs leading-relaxed text-gray-500">
          {LOGIN_HELP_TEXT}
        </p>

        {whatsappNumber && (
          <a
            href={whatsappURL}
            target="_blank"
            rel="noopener noreferrer"
            className="
              mt-3 flex items-center
              justify-center gap-2
              break-words font-semibold
              text-green-600 transition
              hover:text-green-700
            "
            aria-label="Hubungi Administrator melalui WhatsApp"
          >
            <FaWhatsapp
              size={19}
              className="shrink-0"
            />

            <span>
              {whatsappDisplayNumber}
            </span>
          </a>
        )}
      </div>
    </div>
  );
}