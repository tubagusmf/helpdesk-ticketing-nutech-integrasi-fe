import Select from "react-select";
import { useEffect, useState } from "react";
import { getPartsByProjectId } from "../../services/partService";

export default function CauseModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  projects,
}) {
  const [name, setName] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [parts, setParts] = useState([]);
  const [loadingParts, setLoadingParts] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);

      const projectId = initialData.part?.project_id;

      setSelectedProject(
        projectId
          ? {
              value: projectId,
              label: initialData.part?.project?.name || "-",
            }
          : null
      );

      setSelectedPart(
        initialData.part_id
          ? {
              value: initialData.part_id,
              label: `${initialData.part?.name || "-"} (${
                initialData.part?.project?.name || "-"
              })`,
            }
          : null
      );
    } else {
      setName("");
      setSelectedProject(null);
      setSelectedPart(null);
      setParts([]);
    }
  }, [initialData]);

  useEffect(() => {
    const fetchParts = async () => {
      if (!selectedProject?.value) {
        setParts([]);
        setSelectedPart(null);
        return;
      }

      try {
        setLoadingParts(true);

        const res = await getPartsByProjectId(selectedProject.value);

        setParts(res.data || []);

        if (
          !initialData ||
          selectedProject.value !== initialData.part?.project_id
        ) {
          setSelectedPart(null);
        }
      } catch (error) {
        console.error("Failed to fetch parts:", error);
        setParts([]);
        setSelectedPart(null);
      } finally {
        setLoadingParts(false);
      }
    };

    fetchParts();
  }, [selectedProject, initialData]);

  if (!isOpen) return null;

  const projectOptions =
    projects?.map((p) => ({
      value: p.id,
      label: p.name,
    })) || [];

  const partOptions =
    parts?.map((p) => ({
      value: p.id,
      label: p.name,
    })) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">
          {initialData ? "Edit Penyebab" : "Tambah Penyebab"}
        </h2>

        <div className="space-y-4">
          {/* NAMA CAUSE */}
          <input
            type="text"
            placeholder="Contoh: APLIKASI NOT RESPONDING"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg"
          />

          {/* PROJECT */}
          <Select
            options={projectOptions}
            value={selectedProject}
            onChange={setSelectedProject}
            placeholder="Pilih atau ketik nama project..."
            isSearchable
          />

          {/* PART */}
          <Select
            options={partOptions}
            value={selectedPart}
            onChange={setSelectedPart}
            placeholder={
              selectedProject
                ? "Pilih atau ketik Part..."
                : "Pilih project terlebih dahulu..."
            }
            isSearchable
            isDisabled={!selectedProject || loadingParts}
            isLoading={loadingParts}
          />

          {/* BUTTON */}
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
                  alert("Data wajib diisi");
                  return;
                }

                if (!selectedProject?.value) {
                  alert("Project wajib dipilih");
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