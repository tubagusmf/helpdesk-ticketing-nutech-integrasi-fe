import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import LocationModal from "../modal/LocationModal";
import DeleteConfirmModal from "../modal/DeleteConfirmModal";
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../../services/locationService";
import { getProjects } from "../../services/projectService";

export default function LocationTab() {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);

  const [selectedData, setSelectedData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const fetchData = async () => {
    const res = await getLocations(page, search);
    setData(res.data);
    setTotalPage(res.total_page);
  };

  const fetchProjects = async () => {
    const res = await getProjects(1, "");
    setProjects(res.data);
  };

  useEffect(() => {
    fetchData();
  }, [page, search]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSubmit = async (name, projectId) => {
    if (!name || !projectId) return;

    const payload = {
      name,
      project_id: Number(projectId),
    };

    if (selectedData) {
      await updateLocation(selectedData.id, payload);
    } else {
      await createLocation(payload);
    }

    setIsModalOpen(false);
    setSelectedData(null);
    fetchData();
  };

  const handleDelete = async () => {
    await deleteLocation(deleteId);
    setDeleteId(null);
    fetchData();
  };

  return (
    <>
      {/* SEARCH */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Cari nama lokasi atau project..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-1/2 lg:w-1/3 border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {data.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
          >
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-500">
                Project: {item.project?.name}
              </p>
            </div>

            <div className="flex gap-4 items-center">
              <button
                onClick={() => {
                  setSelectedData(item);
                  setIsModalOpen(true);
                }}
                className="text-orange-600 hover:text-orange-800"
              >
                <FiEdit2 size={18} />
              </button>

              <button
                onClick={() => setDeleteId(item.id)}
                className="text-red-500 hover:text-red-700"
              >
                <FiTrash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center mt-6 gap-2">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        <span className="px-3 py-1">
          Page {page} of {totalPage}
        </span>

        <button
          disabled={page === totalPage}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* MODAL */}
      <LocationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedData(null);
        }}
        onSubmit={handleSubmit}
        initialData={selectedData}
        projects={projects}
      />

      {/* DELETE CONFIRM */}
      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}