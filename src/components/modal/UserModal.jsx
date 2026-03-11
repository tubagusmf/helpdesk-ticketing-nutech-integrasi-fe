import { useEffect, useState } from "react";
import { createUser, updateUser } from "../../services/userService";
import { Eye, EyeOff } from "lucide-react";

export default function UserModal({ user, onClose, reload, projects = [] }) {

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role_id: user?.role_id || 1,
    projects: user?.projects?.map(p => ({ id: p.id })) || []
  });

  const roleInfo = {
    1: {
      title: "Administrator",
      code: "ADMIN",
      desc: "Akses penuh ke seluruh sistem.",
      permissions: [
        "Manajemen User (Tambah/Edit/Hapus)",
        "Hapus Tiket & Master Data",
        "Melihat & Mengelola Semua Tiket",
        "Akses Penuh Laporan & Export",
        "Chat & Diskusi"
      ]
    },
    2: {
      title: "Staff / Teknisi",
      code: "STAFF",
      desc: "Fokus pada penyelesaian tiket.",
      permissions: [
        "Melihat & Mengelola Tiket (Sesuai Project)",
        "Mengubah Status & Input Solusi",
        "Manajemen Master Data",
        "Export Laporan Dasar",
        "Chat & Diskusi"
      ]
    },
    3: {
      title: "User / Pelapor",
      code: "USER",
      desc: "Membuat dan memonitor tiket.",
      permissions: [
        "Membuat Tiket",
        "Melihat Status Tiket Sendiri",
        "Memberikan Komentar",
        "Upload Lampiran"
      ]
    }
  };
  

  const toggleProject = (projectId) => {

    const exists = form.projects.some(p => p.id === projectId);

    if (exists) {
      setForm({
        ...form,
        projects: form.projects.filter(p => p.id !== projectId)
      });
    } else {
      setForm({
        ...form,
        projects: [...form.projects, { id: projectId }]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (user) {
        await updateUser(user.id, form);
      } else {
        await createUser(form);
      }

      reload();
      onClose();

    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan user");
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roleInfo[form.role_id];

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white w-[720px] rounded-xl shadow-xl max-h-[90vh] flex flex-col">

        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            {user ? "Edit User" : "Tambah User Baru"}
          </h2>

          <button onClick={onClose} className="text-gray-500 text-xl">
            ×
          </button>
        </div>

        {/* BODY */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto px-6 py-5 space-y-6"
        >

          {/* ACCOUNT INFO */}
          <div>

            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              INFORMASI AKUN
            </h3>

            <div className="space-y-3">

              <input
                placeholder="Nama Lengkap"
                className="w-full border rounded-lg px-3 py-2"
                value={form.name}
                onChange={(e)=>setForm({...form,name:e.target.value})}
              />

              <input
                placeholder="Email"
                className="w-full border rounded-lg px-3 py-2"
                value={form.email}
                onChange={(e)=>setForm({...form,email:e.target.value})}
              />

              <div className="relative">

              <input
                type={showPassword ? "text" : "password"}
                placeholder={user ? "Kosongkan jika tidak ingin mengubah password" : "Masukkan password"}
                className="w-full border rounded-lg px-3 py-2 pr-10"
                onChange={(e)=>setForm({...form,password:e.target.value})}
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

          </div>


          {/* ROLE */}
          <div>

            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              PENGATURAN PRIVILEGE (HAK AKSES)
            </h3>

            <div className="grid grid-cols-3 gap-3">

              {Object.entries(roleInfo).map(([id, role]) => (

                <button
                  type="button"
                  key={id}
                  onClick={()=>setForm({...form,role_id:Number(id)})}
                  className={`border rounded-lg p-3 text-center transition
                    ${form.role_id===Number(id)
                      ? "border-blue-500 bg-blue-50"
                      : "hover:bg-gray-50"}
                  `}
                >

                  <div className="font-semibold text-sm">
                    {role.title}
                  </div>

                  <div className="text-xs text-gray-500">
                    {role.code}
                  </div>

                </button>

              ))}

            </div>

          </div>


          {/* PROJECT ACCESS */}
          {(form.role_id === 2 || form.role_id === 3) && (

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">

            <div className="font-semibold mb-3">
                Project Access
            </div>

            <div className="grid grid-cols-2 gap-3">

                {projects.map((project) => {

                const checked = form.projects.some(p => p.id === project.id)

                return (
                    <label
                    key={project.id}
                    className="flex items-center gap-2 text-sm"
                    >

                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleProject(project.id)}
                    />

                    {project.name}

                    </label>
                )

                })}

            </div>

            <p className="text-xs text-gray-500 mt-2">
                Pilih project yang dapat diakses oleh user ini.
            </p>

            </div>

            )}


            {/* PRIVILEGE INFO */}
            {form.role_id === 1 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">

                <div className="font-semibold mb-2">
                    Project Access
                </div>

                <div className="text-sm text-gray-700">
                    Administrator memiliki akses ke <b>semua project</b>.
                    Tidak perlu memilih project secara manual.
                </div>

            </div>
            )}

            {form.role_id === 2 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                Staff dapat mengelola tiket pada project yang dipilih.
            </div>
            )}

            {form.role_id === 3 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm">
                User dapat membuat dan melihat tiket pada project yang dipilih.
            </div>
            )}

        </form>


        {/* FOOTER */}
        <div className="border-t p-4">

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            {loading ? "Menyimpan..." : "Simpan Konfigurasi"}
          </button>

        </div>

      </div>

    </div>

  );
}
