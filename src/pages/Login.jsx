import { useState } from "react";
import API from "../services/api";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useEffect } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role_id === 1) navigate("/admin");
      else if (user.role_id === 2) navigate("/staff");
      else if (user.role_id === 3) navigate("/user");
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
  
    try {
      const res = await API.post("/users/login", {
        email,
        password,
      });
  
      const token = res.data.token;
  
      login(token);
  
      const decoded = jwtDecode(token);
      const roleID = decoded.role_id;
  
      if (roleID === 1) navigate("/admin");
      else if (roleID === 2) navigate("/staff");
      else if (roleID === 3) navigate("/user");
      else navigate("/unauthorized");
  
    } catch (err) {
      setError(
        err.response?.data?.message || "Login gagal, periksa email/password"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="bg-white w-[420px] rounded-xl shadow-lg p-8">
  
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-orange-600">CCIT</span>
          </div>
        </div>
  
        <h1 className="text-center text-xl font-semibold text-gray-800">
          Helpdesk Center
        </h1>
        <p className="text-center text-sm text-gray-500 italic mb-6">
          Professional Ticketing System
        </p>
  
        {error && (
          <div className="bg-red-100 text-red-600 p-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}
  
        <form onSubmit={handleLogin}>
  
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-gray-500 mb-1 cursor-pointer"
          >
            EMAIL
          </label>
          <input
            id="email"
            type="email"
            className="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
  
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-gray-500 mb-1 cursor-pointer"
            >
              PASSWORD
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full border border-gray-300 rounded-lg p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
  
          <button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-lg transition duration-200 shadow-md"
          >
            LOGIN
          </button>
        </form>
  
        <div className="border-t my-6"></div>
  
        <p className="text-center text-xs text-gray-400 font-semibold mb-2">
          BELUM PUNYA AKUN?
        </p>
        <p className="text-center text-xs text-gray-500 leading-relaxed mt-4">
          Silahkan Hubungi <b>Admin</b> ke nomor kontak Whatsapp berikut:
        </p>

        <a
          href="https://wa.me/628123456789"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 mt-2 text-green-600 font-semibold hover:text-green-700 transition"
        >
          <FaWhatsapp size={18} />
          08123456789
        </a>
      </div>
    </div>
  );
}