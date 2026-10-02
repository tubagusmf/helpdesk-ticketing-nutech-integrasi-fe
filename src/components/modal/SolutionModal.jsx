import Select from "react-select";
import { useEffect, useState } from "react";
import { getCausesByProjectId } from "../../services/causeService";

export default function SolutionModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  projects,
}) {
  const [name, setName] = useState("");

  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCause, setSelectedCause] = useState(null);

  const [causes, setCauses] = useState([]);
  const [loadingCauses, setLoadingCauses] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);

      const projectId = initialData.cause?.part?.project_id;

      setSelectedProject(
        projectId
          ? {
              value: projectId,
              label: initialData.cause?.part?.project?.name || "-",
            }
          : null
      );

      setSelectedCause(
        initialData.cause_id
          ? {
              value: initialData.cause_id,
              label: initialData.cause?.name || "-",
            }
          : null
      );
    } else {
      setName("");
      setSelectedProject(null);
      setSelectedCause(null);
      setCauses([]);
    }
  }, [initialData]);
  
  useEffect(() => {
    const fetchCauses = async () => {
      if (!selectedProject?.value) {
        setCauses([]);
        setSelectedCause(null);
        return;
      }

      try {
        setLoadingCauses(true);

        const res = await getCausesByProjectId(
          selectedProject.value
        );

        setCauses(res.data || []);

        if (
          !initialData ||
          selectedProject.value !==
            initialData.cause?.part?.project_id
        ) {
          setSelectedCause(null);
        }
      } catch (error) {
        console.error("Failed to fetch causes:", error);
        setCauses([]);
        setSelectedCause(null);
      } finally {
        setLoadingCauses(false);
      }
    };

    fetchCauses();
  }, [selectedProject, initialData]);

  if (!isOpen) return null;

  const projectOptions =
    projects?.map((p) => ({
      value: p.id,
      label: p.name,
    })) || [];

  const causeOptions =
    causes?.map((c) => ({
      value: c.id,
      label: `${c.name} (${c.part?.name || "-"})`,
    })) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">
          {initialData ? "Edit Solusi" : "Tambah Solusi"}
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nama Solusi"
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

          <Select
            options={causeOptions}
            value={selectedCause}
            onChange={setSelectedCause}
            placeholder={
              selectedProject
                ? "Pilih atau ketik nama penyebab..."
                : "Pilih project terlebih dahulu..."
            }
            isSearchable
            isDisabled={!selectedProject || loadingCauses}
            isLoading={loadingCauses}
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
                  alert("Data wajib diisi");
                  return;
                }

                if (!selectedProject?.value) {
                  alert("Project wajib dipilih");
                  return;
                }

                if (!selectedCause?.value) {
                  alert("Cause wajib dipilih");
                  return;
                }

                onSubmit(name, selectedCause.value);
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