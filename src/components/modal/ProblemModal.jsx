
import { useEffect, useState } from "react";

export default function ProblemModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
    } else {
      setName("");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      alert("Nama permasalahan wajib diisi");
      return;
    }

    onSubmit(trimmedName);
  };

  return (
    <div
      className="
        fixed inset-0
        bg-black bg-opacity-40
        flex items-center justify-center
        z-50
        p-4
      "
    >
      <div
        className="
          bg-white
          w-full max-w-md
          rounded-xl shadow-lg
          overflow-hidden
        "
      >
        {/* HEADER */}
        <div className="p-5 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {initialData
              ? "Edit Permasalahan"
              : "Tambah Permasalahan"}
          </h3>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="p-5">
            <label className="text-sm font-semibold text-gray-600">
              NAMA PERMASALAHAN
            </label>

            <input
              type="text"
              placeholder="Contoh: APLIKASI NOT RESPONDING"
              value={name}
              maxLength={255}
              onChange={(e) => setName(e.target.value)}
              className="
                w-full mt-2
                border border-gray-300
                p-3 rounded-lg
                focus:outline-none
                focus:ring-2 focus:ring-blue-500
              "
              autoFocus
            />

            <p className="text-xs text-gray-400 mt-2">
              Maksimal 255 karakter.
            </p>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 p-5 border-t">
            <button
              type="button"
              onClick={onClose}
              className="
                px-4 py-2
                border border-gray-300
                rounded-lg
                hover:bg-gray-50
              "
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={!name.trim()}
              className="
                bg-blue-600 text-white
                px-5 py-2 rounded-lg
                hover:bg-blue-700
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
