import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import ProjectModal from "../modal/ProjectModal";
import DeleteConfirmModal from "../modal/DeleteConfirmModal";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../../services/projectService";

export default function ProjectTab() {
  const [data, setData] = useState([]);
  const [selectedData, setSelectedData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const fetchData = async () => {
    const res = await getProjects(page, search);
    setData(res.data);
    setTotalPage(res.total_page);
  };

  useEffect(() => {
    fetchData();
  }, [page, search]);

  const handleSubmit = async (name) => {
    if (!name) return;

    if (selectedData) {
      await updateProject(selectedData.id, { name });
    } else {
      await createProject({ name });
    }

    setIsModalOpen(false);
    setSelectedData(null);
    fetchData();
  };

  const handleDelete = async () => {
    await deleteProject(deleteId);
    setDeleteId(null);
    fetchData();
  };

  return (
    <>
    {/* HEADER */}
    <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Data Projects</h2>

        <button
          onClick={() => {
            setSelectedData(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Add Project
        </button>
      </div>

      {/* SEARCH */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Cari nama project..."
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
            <span>{item.name}</span>

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
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedData(null);
        }}
        onSubmit={handleSubmit}
        initialData={selectedData}
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