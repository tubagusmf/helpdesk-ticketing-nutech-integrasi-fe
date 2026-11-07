import { useEffect, useMemo, useState } from "react";
import Select from "react-select";

export default function ProblemModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  parts = [],
  partsLoading = false,
}) {
  const [name, setName] = useState("");
  const [selectedPart, setSelectedPart] = useState(null);

  const partOptions = useMemo(() => {
    return parts.map((part) => ({
      value: Number(part.id),
      label: `${part.name} - ${
        part.project?.name || "Tanpa Project"
      }`,
    }));
  }, [parts]);

  useEffect(() => {
    if (!isOpen) return;

    setName(initialData?.name || "");

    if (!initialData) {
      setSelectedPart(null);
      return;
    }

    const initialPartID = Number(
      initialData.part_id ??
      initialData.PartID ??
      initialData.part?.id ??
      initialData.Part?.ID ??
      0
    );

    if (!initialPartID) {
      setSelectedPart(null);
      return;
    }

    const existingPart = parts.find(
      (part) => Number(part.id) === initialPartID
    );

    if (existingPart) {
      setSelectedPart({
        value: Number(existingPart.id),
        label: `${existingPart.name} - ${
          existingPart.project?.name || "Tanpa Project"
        }`,
      });
    } else {
      setSelectedPart({
        value: initialPartID,
        label:
          initialData.part?.name ||
          initialData.Part?.Name ||
          "Part tidak ditemukan",
      });
    }
  }, [isOpen, initialData, parts]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      alert("Nama permasalahan wajib diisi.");
      return;
    }

    if (!selectedPart?.value) {
      alert("Silakan pilih Part terlebih dahulu.");
      return;
    }

    onSubmit(
      trimmedName,
      selectedPart.value
    );
  };

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black bg-opacity-40
        p-4
      "
    >
      <div
        className="
          w-full max-w-md
          overflow-visible
          rounded-xl
          bg-white
          shadow-lg
        "
      >
        {/* HEADER */}
        <div className="rounded-t-xl border-b p-5">
          <h3 className="text-lg font-semibold text-gray-900">
            {initialData
              ? "Edit Permasalahan"
              : "Tambah Permasalahan"}
          </h3>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-5">

            {/* NAMA PERMASALAHAN */}
            <div>
              <label
                htmlFor="problem-name"
                className="
                  mb-2 block
                  text-sm font-semibold
                  text-gray-600
                "
              >
                NAMA PERMASALAHAN
              </label>

              <input
                id="problem-name"
                type="text"
                placeholder="Contoh: APLIKASI NOT RESPONDING"
                value={name}
                maxLength={255}
                onChange={(e) => setName(e.target.value)}
                className="
                  mt-1 w-full
                  rounded-lg
                  border border-gray-300
                  p-3
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
                autoFocus
              />
            </div>

            {/* PART */}
            <div>
              <label
                className="
                  mb-2 block
                  text-sm font-semibold
                  text-gray-600
                "
              >
                PART
                <span className="ml-1 text-red-500">*</span>
              </label>

              <Select
                options={partOptions}
                value={selectedPart}
                onChange={setSelectedPart}
                placeholder={
                  partsLoading
                    ? "Memuat data Part..."
                    : "Pilih atau ketik nama Part..."
                }
                isLoading={partsLoading}
                isDisabled={partsLoading}
                isSearchable
                isClearable
                noOptionsMessage={() =>
                  partsLoading
                    ? "Memuat data..."
                    : "Data Part tidak ditemukan"
                }
                loadingMessage={() => "Memuat data Part..."}

                menuPortalTarget={
                  typeof document !== "undefined"
                    ? document.body
                    : null
                }
                menuPosition="fixed"

                styles={{
                  menuPortal: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),

                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),

                  control: (base, state) => ({
                    ...base,
                    minHeight: "42px",
                    borderRadius: "8px",
                    borderColor: state.isFocused
                      ? "#3B82F6"
                      : "#D1D5DB",
                    boxShadow: state.isFocused
                      ? "0 0 0 1px #3B82F6"
                      : "none",
                    "&:hover": {
                      borderColor: "#3B82F6",
                    },
                  }),

                  option: (base, state) => ({
                    ...base,
                    cursor: "pointer",
                    backgroundColor: state.isSelected
                      ? "#2563EB"
                      : state.isFocused
                        ? "#EFF6FF"
                        : "#FFFFFF",
                    color: state.isSelected
                      ? "#FFFFFF"
                      : "#1F2937",
                  }),
                }}
              />
            </div>

          </div>

          {/* FOOTER */}
          <div
            className="
              flex justify-end gap-3
              rounded-b-xl
              border-t p-5
            "
          >
            <button
              type="button"
              onClick={onClose}
              className="
                rounded-lg
                border border-gray-300
                px-4 py-2
                hover:bg-gray-50
              "
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={
                !name.trim() ||
                !selectedPart?.value ||
                partsLoading
              }
              className="
                rounded-lg
                bg-blue-600
                px-5 py-2
                text-white
                hover:bg-blue-700
                disabled:cursor-not-allowed
                disabled:opacity-50
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