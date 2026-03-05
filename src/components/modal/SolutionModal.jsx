import Select from "react-select";
import { useEffect, useState } from "react";

export default function SolutionModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  causes,
}) {
  const [name, setName] = useState("");
  const [selectedCause, setSelectedCause] = useState(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSelectedCause({
        value: initialData.cause_id,
        label: initialData.cause?.name,
      });
    } else {
      setName("");
      setSelectedCause(null);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const causeOptions = causes.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">
          {initialData ? "Edit Solution" : "Tambah Solution"}
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nama Solution"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg"
          />

          <Select
            options={causeOptions}
            value={selectedCause}
            onChange={setSelectedCause}
            placeholder="Pilih atau ketik nama penyebab..."
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
                onSubmit(name, selectedCause?.value)
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