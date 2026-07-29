import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { getProfile, updateProfile } from "../services/userService";
import { navigationMenu } from "../constants/navigation";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const menu =
  user?.role?.toLowerCase() === "administrator"
    ? navigationMenu.administrator
    : user?.role?.toLowerCase() === "staff"
    ? navigationMenu.staff
    : navigationMenu.user;

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const res = await getProfile();

      const user = res.data;

      setForm((prev) => ({
        ...prev,
        name: user.name,
        email: user.email,
        role: user.role?.name || "",
      }));
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengambil profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      form.new_password &&
      form.new_password !== form.confirm_password
    ) {
      toast.error("Konfirmasi password tidak sama");
      return;
    }

    const payload = {
      name: form.name,
    };

    if (form.new_password) {
      payload.current_password = form.current_password;
      payload.new_password = form.new_password;
    }

    try {
      setSaving(true);

      const res = await updateProfile(payload);

      if (res.message) {
        toast.success(res.message);
      }

      setForm((prev) => ({
        ...prev,
        current_password: "",
        new_password: "",
        confirm_password: "",
      }));
    } catch (err) {
      console.error(err);
      toast.error("Gagal update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="My Profile" menu={menu}>
        <div className="text-center py-20">
          Loading...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Profile" menu={menu}>
      <div className="max-w-3xl mx-auto">

        <div className="bg-white rounded-xl shadow border">

          <div className="border-b px-6 py-4">
            <h2 className="text-xl font-semibold">
              Informasi Profil
            </h2>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-5"
          >

            <div>
              <label className="block mb-2 text-sm font-medium">
                Nama
              </label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">
                Email
              </label>

              <input
                value={form.email}
                readOnly
                className="w-full border rounded-lg px-3 py-2 bg-gray-100"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">
                Role
              </label>

              <input
                value={form.role}
                readOnly
                className="w-full border rounded-lg px-3 py-2 bg-gray-100"
              />
            </div>

            <hr />

            <h3 className="font-semibold">
              Ubah Password
            </h3>

            <div>
                <label className="block mb-2 text-sm font-medium">
                    Password Lama
                </label>

                <div className="relative">

                    <input
                    type={showPassword.current ? "text" : "password"}
                    name="current_password"
                    value={form.current_password}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 pr-10"
                    />

                    <button
                    type="button"
                    onClick={() =>
                        setShowPassword(prev => ({
                          ...prev,
                          current: !prev.current,
                        }))
                      }
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                    >
                    {showPassword ? (
                        <EyeOff size={18} />
                    ) : (
                        <Eye size={18} />
                    )}
                    </button>

                </div>
            </div>

            <div>
                <label className="block mb-2 text-sm font-medium">
                    Password Baru
                </label>

                <div className="relative">

                    <input
                    type={showPassword.new ? "text" : "password"}
                    name="new_password"
                    value={form.new_password}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 pr-10"
                    />

                    <button
                    type="button"
                    onClick={() =>
                        setShowPassword(prev => ({
                          ...prev,
                          new: !prev.new,
                        }))
                      }
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                    >
                    {showPassword ? (
                        <EyeOff size={18} />
                    ) : (
                        <Eye size={18} />
                    )}
                    </button>

                </div>
            </div>

            <div>
                <label className="block mb-2 text-sm font-medium">
                    Konfirmasi Password Baru
                </label>

                <div className="relative">

                    <input
                    type={showPassword.confirm ? "text" : "password"}
                    name="confirm_password"
                    value={form.confirm_password}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 pr-10"
                    />

                    <button
                    type="button"
                    onClick={() =>
                        setShowPassword(prev => ({
                          ...prev,
                          confirm: !prev.confirm,
                        }))
                      }
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                    >
                    {showPassword ? (
                        <EyeOff size={18} />
                    ) : (
                        <Eye size={18} />
                    )}
                    </button>

                </div>
            </div>

            <div className="pt-2">
              <button
                disabled={saving}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg"
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>

          </form>

        </div>

      </div>
    </DashboardLayout>
  );
}