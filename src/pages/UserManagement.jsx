import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { getUsers, deleteUser } from "../services/userService";
import UserTab from "../components/users/UserTab";
import UserModal from "../components/modal/UserModal";
import { getProjects } from "../services/projectService";

export default function UserManagement() {
  const menu = [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Data Ticket", path: "/admin/tickets" },
    { label: "Manajemen User", path: "/admin/users" },
    { label: "Master Data", path: "/admin/master" },
  ];

  const [users, setUsers] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [search, setSearch] = useState("");

  const loadProjects = async () => {
    const res = await getProjects()
    setProjects(res.data)
  }
  
  useEffect(()=>{
    loadUsers()
    loadProjects()
  },[])

  const loadUsers = async () => {
    const res = await getUsers(page, search);
  
    setUsers(res.data);
    setTotalPage(res.total_page);
  };

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout title="Manajemen Pengguna" menu={menu}>
      <div className="bg-white p-6 rounded-xl shadow">

        <div className="flex justify-between items-center mb-4">
            <div>
                <h2 className="text-xl font-semibold">
                Manajemen Pengguna
                </h2>

                <p className="text-gray-500 text-sm">
                Kelola akun, password, dan hak akses (privilege)
                </p>
            </div>

            <button
                onClick={() => {
                setSelectedUser(null);
                setOpenModal(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
                + Tambah User
            </button>
        </div>

        <UserTab
          users={users}
          page={page}
          totalPage={totalPage}
          search={search}
          setSearch={setSearch}
          setPage={setPage}
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