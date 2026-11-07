
import Select from "react-select";
import { useEffect, useState } from "react";
import { getPartsByProjectId } from "../../services/partService";

export default function AssetIDModal({isOpen, onClose, onSubmit, initialData, projects}) {
  const [name, setName] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [parts, setParts] = useState([]);
  const [loadingParts, setLoadingParts] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setName(initialData.name || "");

      const part = initialData.part || {};

      const projectId =
        part.project_id ??
        part.ProjectID ??
        part.project?.id ??
        part.Project?.ID;

      const projectName =
        part.project?.name ||
        part.Project?.Name ||
        projects.find(
          (project) =>
            Number(project.id) === Number(projectId)
        )?.name ||
        "-";

      setSelectedProject(
        projectId
          ? {
              value: Number(projectId),
              label: projectName,
            }
          : null
      );

      const partId =
        initialData.part_id ??
        initialData.PartID ??
        part.id ??
        part.ID;

      setSelectedPart(
        partId
          ? {
              value: Number(partId),
              label:
                part.name ||
                part.Name ||
                "-",
            }
          : null
      );

      setParts([]);
    } else {
      setName("");
      setSelectedProject(null);
      setSelectedPart(null);
      setParts([]);
    }
  }, [isOpen, initialData]);

  const selectedProjectId = selectedProject?.value
    ? Number(selectedProject.value)
    : null;

  useEffect(() => {
    let isActive = true;

    if (!isOpen || !selectedProjectId) {
      setParts([]);
      setLoadingParts(false);
      return;
    }

    const fetchParts = async () => {
      try {
        setLoadingParts(true);

        const res = await getPartsByProjectId(
          selectedProjectId
        );

        if (!isActive) return;

        const fetchedParts = Array.isArray(res?.data)
          ? res.data
          : [];

        setParts(fetchedParts);

        setSelectedPart((current) => {
          if (!current?.value) return current;

          const matchedPart = fetchedParts.find(
            (part) =>
              Number(part.id) === Number(current.value)
          );

          if (!matchedPart) {
            return current;
          }

          return {
            value: Number(matchedPart.id),
            label: matchedPart.name,
          };
        });
      } catch (error) {
        if (!isActive) return;

        console.error(
          "Gagal mengambil data Part:",
          error
        );

        setParts([]);
      } finally {
        if (isActive) {
          setLoadingParts(false);
        }
      }
    };

    fetchParts();

    return () => {
      isActive = false;
    };
  }, [isOpen, selectedProjectId]);

  const handleProjectChange = (selected) => {
    setSelectedProject(selected);
    setSelectedPart(null);
    setParts([]);
  };

  const handleSubmit = () => {
    const assetName = name.trim();

    if (!assetName) {
      alert("Nama Part ID wajib diisi.");
      return;
    }

    if (!selectedProject?.value) {
      alert("Project wajib dipilih.");
      return;
    }

    if (!selectedPart?.value) {
      alert("Part wajib dipilih.");
      return;
    }

    onSubmit(
      assetName,
      selectedPart.value
    );
  };

  if (!isOpen) return null;

  const projectOptions = (projects || []).map(
    (project) => ({
      value: Number(project.id),
      label: project.name,
    })
  );

  const partOptions = (parts || []).map(
    (part) => ({
      value: Number(part.id),
      label: part.name,
    })
  );

  return (
    <div className="
      fixed inset-0 z-50
      flex items-center justify-center
      bg-black bg-opacity-40 px-4
    ">
      <div className="
        w-full max-w-md
        rounded-xl bg-white p-6 shadow-lg
      ">

        {/* HEADER */}

        <h2 className="mb-5 text-lg font-semibold">
          {initialData
            ? "Edit Part ID"
            : "Tambah Part ID"}
        </h2>

        <div className="space-y-4">

          {/* PART ID */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Part ID
            </label>

            <input
              type="text"
              placeholder="Contoh: GATE-01"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              className="
                w-full rounded-lg
                border border-gray-300
                px-3 py-2
                focus:outline-none
                focus:ring-2 focus:ring-blue-500
              "
            />
          </div>

          {/* PROJECT */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Project
            </label>

            <Select
              options={projectOptions}
              value={selectedProject}
              onChange={handleProjectChange}
              placeholder="Pilih atau ketik nama project..."
              isSearchable
              isClearable
              noOptionsMessage={() =>
                "Project tidak ditemukan"
              }
              className="text-sm"
              classNamePrefix="select"
            />
          </div>

          {/* PART */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Part
            </label>

            <Select
              options={partOptions}
              value={selectedPart}
              onChange={setSelectedPart}
              placeholder={
                !selectedProject
                  ? "Pilih project terlebih dahulu..."
                  : loadingParts
                    ? "Memuat data Part..."
                    : "Pilih atau ketik Part..."
              }
              isSearchable
              isClearable
              isDisabled={
                !selectedProject ||
                loadingParts
              }
              isLoading={loadingParts}
              noOptionsMessage={() =>
                "Data Part tidak ditemukan pada Project ini"
              }
              loadingMessage={() =>
                "Memuat data Part..."
              }
              className="text-sm"
              classNamePrefix="select"
            />
          </div>

          {/* BUTTON */}

          <div className="flex justify-end gap-3 pt-1">

            <button
              type="button"
              onClick={onClose}
              className="
                rounded-lg border border-gray-300
                px-4 py-2
                hover:bg-gray-50
              "
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loadingParts}
              className="
                rounded-lg bg-blue-600
                px-4 py-2 text-white
                hover:bg-blue-700
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Simpan
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}
