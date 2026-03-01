import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProjectModal from "../components/modal/ProjectModal";
import DeleteConfirmModal from "../components/modal/DeleteConfirmModal";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../services/projectService";

export default function MasterDataAdmin() {
  const menu = [
    { label: "Dashboard", path: "/admin" },
    { label: "Data Ticket", path: "/admin/tickets" },
    { label: "Manajemen User", path: "/admin/users" },
    { label: "Master Data", path: "/admin/master" },
  ];

  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const tabs = ["Project"];
  const [activeTab, setActiveTab] = useState("Project");

  useEffect(() => {
    fetchProjects();
  }, [page, search]);

  const fetchProjects = async () => {
    const res = await getProjects(page, search);
    setProjects(res.data);
    setTotalPage(res.total_page);
  };

  const handleCreateOrUpdate = async (name) => {
    if (!name) return;

    if (selectedProject) {
      await updateProject(selectedProject.id, { name });
    } else {
      await createProject({ name });
    }

    setIsModalOpen(false);
    setSelectedProject(null);
    fetchProjects();
  };

  const handleDelete = async () => {
    await deleteProject(deleteId);
    setDeleteId(null);
    fetchProjects();
  };

  return (
    <DashboardLayout title="Master Data System" menu={menu}>
      <div className="bg-white p-6 rounded-xl shadow">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            Master Data
          </h2>


          <button
            onClick={() => {
              setSelectedProject(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            + Tambah Data
          </button>
        </div>

        <div className="flex gap-6 border-b mb-4">
        {tabs.map((tab) => (
            <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 ${
                activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
            >
            {tab}
            </button>
        ))}
        </div>

        <div className="flex justify-between items-center mb-6">
        <input
            type="text"
            placeholder="Cari nama project..."
            value={search}
            onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
            }}
            className="w-1/3 border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        </div>

        {activeTab === "Project" && (
        <>
            <div className="space-y-3">
            {projects.map((project) => (
                <div
                key={project.id}
                className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                >
                <span>{project.name}</span>

                <div className="flex gap-4 items-center">
                    <button
                    onClick={() => {
                        setSelectedProject(project);
                        setIsModalOpen(true);
                    }}
                    className="text-orange-600 hover:text-orange-800 transition"
                    title="Edit Project"
                    >
                    <FiEdit2 size={18} />
                    </button>

                    <button
                    onClick={() => setDeleteId(project.id)}
                    className="text-red-500 hover:text-red-700 transition"
                    title="Hapus Project"
                    >
                    <FiTrash2 size={18} />
                    </button>
                </div>
                </div>
            ))}
            </div>

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
        </>
        )}
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProject(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={selectedProject}
      />

      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}