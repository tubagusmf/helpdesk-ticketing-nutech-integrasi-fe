import { useState, useEffect } from "react";

export default function ProjectModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
    } else {
      setName("");
    }
  }, [initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white w-96 rounded-xl shadow-lg">

        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-lg font-semibold">
            {initialData ? "Edit Project" : "Tambah Project"}
          </h3>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="p-5">
          <label className="text-sm font-semibold text-gray-600">
            NAMA DATA
          </label>
          <input
            type="text"
            placeholder="Contoh: Project Baru..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-2 border p-2 rounded-lg"
          />
        </div>

        <div className="flex justify-end gap-3 p-5 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600"
          >
            Batal
          </button>

          <button
            onClick={() => onSubmit(name)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Simpan Data
          </button>
        </div>
      </div>
    </div>
  );
}