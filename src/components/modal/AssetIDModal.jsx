import Select from "react-select";
import { useEffect, useState } from "react";

export default function AssetIDModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  parts,
}) {
  const [name, setName] = useState("");
  const [selectedPart, setSelectedPart] = useState(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSelectedPart({
        value: initialData.part_id,
        label: initialData.part?.name,
        project: initialData.part?.project?.name,
      });
    } else {
      setName("");
      setSelectedPart(null);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const partOptions = parts?.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.project?.name || "-"})`,
    name: p.name,
    project: p.project?.name,
  })) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">
          {initialData ? "Edit Asset ID" : "Tambah Asset ID"}
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Contoh: GATE-01"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg"
          />

          <Select
            options={partOptions}
            value={selectedPart}
            onChange={setSelectedPart}
            placeholder="Pilih atau ketik Part..."
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
            onClick={() => {
              if (!name) {
                alert("Nama Asset wajib diisi");
                return;
              }

              if (!selectedPart?.value) {
                alert("Part wajib dipilih");
                return;
              }

              onSubmit(name, selectedPart.value);
            }}
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