import Select from "react-select";
import { useEffect, useState } from "react";

export default function PartModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  projects,
}) {
  const [name, setName] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSelectedProject({
        value: initialData.project_id,
        label: initialData.project?.name,
      });
    } else {
      setName("");
      setSelectedProject(null);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">
          {initialData ? "Edit Part" : "Tambah Part"}
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nama Part"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg"
          />

          <Select
            options={projectOptions}
            value={selectedProject}
            onChange={setSelectedProject}
            placeholder="Pilih atau ketik nama project..."
            isSearchable
          />

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Batal
            </button>

            <button
              onClick={() =>
                onSubmit(name, selectedProject?.value)
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}