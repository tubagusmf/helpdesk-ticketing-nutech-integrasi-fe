import Select from "react-select";
import { useEffect, useState } from "react";
export default function PartCategoryModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  parts,
}) {
  const [name, setName] = useState("");
  const [selectedPart, setSelectedPart] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    setName(initialData?.name || "");
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;

    if (!initialData) {
      setSelectedPart(null);
      return;
    }

    const selected = parts.find(
      (part) => Number(part.id) === Number(initialData.part_id)
    );

    if (selected) {
      setSelectedPart({
        value: selected.id,
        label: `${selected.name} - ${selected.project?.name || "Tanpa Project"}`,
      });
    } else {
      setSelectedPart({
        value: initialData.part_id,
        label: initialData.part?.name || "Part tidak ditemukan",
      });
    }
  }, [isOpen, initialData, parts]);

  if (!isOpen) return null;

  const partOptions = parts.map((part) => ({
    value: part.id,
    label: `${part.name} - ${part.project?.name || "Tanpa Project"}`,
  }));

  const handleSubmit = () => {
    if (!name.trim() || !selectedPart?.value) return;

    onSubmit(name.trim(), selectedPart.value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-5">
          {initialData ? "Edit Kategori Part" : "Tambah Kategori Part"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Kategori Part
            </label>

            <input
              type="text"
              placeholder="Masukkan nama kategori part..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Part
            </label>

            <Select
              options={partOptions}
              value={selectedPart}
              onChange={setSelectedPart}
              placeholder="Pilih atau ketik nama Part..."
              isSearchable
              noOptionsMessage={() => "Data Part tidak ditemukan"}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!name.trim() || !selectedPart?.value}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}