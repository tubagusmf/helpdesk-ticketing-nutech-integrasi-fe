import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { getUsers, deleteUser } from "../services/userService";
import UserTab from "../components/users/UserTab";
import UserModal from "../components/modal/UserModal";
import { getProjects } from "../services/projectService";
import { navigationMenu } from "../constants/navigation";

export default function UserManagement() {
  const menu = navigationMenu.administrator;
  const [users, setUsers] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);

  const loadProjects = async () => {
    const res = await getProjects();
    setProjects(res.data);
  };

  useEffect(() => {
    loadUsers();
    loadProjects();
  }, []);

  const loadUsers = async () => {
    const res = await getUsers(page, search, limit);

    setUsers(res.data || []);
    setTotalPage(res.total_page || 1);
  };

  useEffect(() => {
    loadUsers();
  }, [page, search, limit]);

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout title="Manajemen User" menu={menu}>
      <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <div>
            <h2 className="text-xl font-semibold">Manajemen User</h2>

            <p className="text-gray-500 text-sm">
              Kelola akun, password, dan hak akses (privilege)
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedUser(null);
              setOpenModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full sm:w-auto"
          >
            + Tambah User
          </button>
        </div>

        <UserTab
          users={users}
          page={page}
          limit={limit}
          totalPage={totalPage}
          search={search}
          setSearch={setSearch}
          setPage={setPage}
          setLimit={setLimit}
          onEdit={(user) => {
            setSelectedUser(user);
            setOpenModal(true);
          }}
          onDelete={handleDelete}
        />

        {openModal && (
          <UserModal
            user={selectedUser}
            projects={projects}
            onClose={() => setOpenModal(false)}
            reload={loadUsers}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
