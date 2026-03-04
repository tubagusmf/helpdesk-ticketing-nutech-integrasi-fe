import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import PartModal from "../modal/PartModal";
import DeleteConfirmModal from "../modal/DeleteConfirmModal";
import {
  getParts,
  createPart,
  updatePart,
  deletePart,
} from "../../services/partService";
import { getProjects } from "../../services/projectService";

export default function PartTab() {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);

  const [selectedData, setSelectedData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const fetchData = async () => {
    const res = await getParts(page, search);
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
      await updatePart(selectedData.id, payload);
    } else {
      await createPart(payload);
    }

    setIsModalOpen(false);
    setSelectedData(null);
    fetchData();
  };

  const handleDelete = async () => {
    await deletePart(deleteId);
    setDeleteId(null);
    fetchData();
  };

  return (
    <>
    {/* HEADER */}
    <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Data Parts</h2>

        <button
          onClick={() => {
            setSelectedData(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Add Part
        </button>
      </div>

      {/* SEARCH */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Cari nama parts atau project..."
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
      <PartModal
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